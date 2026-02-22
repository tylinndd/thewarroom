"""Wrapper around nba_api with in-memory TTL caching."""

import time
from functools import wraps
from typing import Any

import pandas as pd
from nba_api.stats.static import teams as static_teams, players as static_players
from nba_api.stats.endpoints import (
    CommonTeamRoster,
    TeamDashboardByGeneralSplits,
    PlayerCareerStats,
    ShotChartDetail,
    PlayerGameLog,
    LeagueDashTeamStats,
)
from config import CURRENT_SEASON

_cache: dict[str, tuple[float, Any]] = {}
CACHE_TTL = 3600  # 1 hour


def _cached(key_prefix: str, ttl: int = CACHE_TTL):
    """Decorator that caches the return value by a generated cache key."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}:{args}:{kwargs}"
            now = time.time()
            if cache_key in _cache:
                ts, val = _cache[cache_key]
                if now - ts < ttl:
                    return val
            result = fn(*args, **kwargs)
            _cache[cache_key] = (now, result)
            return result
        return wrapper
    return decorator


def get_all_teams() -> list[dict]:
    """Return all 30 NBA teams from nba_api static data."""
    return static_teams.get_teams()


def get_team_info(team_id: int) -> dict | None:
    teams = static_teams.get_teams()
    for t in teams:
        if t["id"] == team_id:
            return t
    return None


def get_team_defensive_rating(team_id: int, season: str = CURRENT_SEASON) -> float:
    """Return defensive rating for a team. Uses league average (~112) if unavailable."""
    stats = get_team_stats(team_id, season)
    return float(stats.get("def_rating", 112.0))


def get_team_id_by_abbr(abbr: str) -> int | None:
    """Return team_id for a 3-letter abbreviation (e.g. 'LAL', 'BOS')."""
    abbr_upper = (abbr or "").strip().upper()
    if not abbr_upper or len(abbr_upper) != 3:
        return None
    for t in static_teams.get_teams():
        if (t.get("abbreviation") or "").upper() == abbr_upper:
            return t["id"]
    return None


def _parse_opponent_abbr_from_matchup(matchup: str) -> str | None:
    """Extract opponent abbreviation from matchup string (e.g. 'LAL vs. BOS' -> 'BOS')."""
    if not matchup:
        return None
    parts = matchup.replace("vs.", "@").split("@")
    if len(parts) != 2:
        return None
    opponent_part = parts[1].strip()
    tokens = opponent_part.split()
    if not tokens:
        return None
    return tokens[0].strip() if tokens else None


@_cached("roster")
def get_team_roster(team_id: int, season: str = CURRENT_SEASON) -> list[dict]:
    roster = CommonTeamRoster(team_id=team_id, season=season)
    df: pd.DataFrame = roster.common_team_roster.get_data_frame()
    players = []
    for _, row in df.iterrows():
        players.append({
            "player_id": int(row["PLAYER_ID"]),
            "name": row["PLAYER"],
            "number": str(row.get("NUM", "")),
            "position": row.get("POSITION", ""),
            "age": int(row["AGE"]) if pd.notna(row.get("AGE")) else 0,
            "height": row.get("HEIGHT", ""),
            "weight": str(row.get("WEIGHT", "")),
            "experience": str(row.get("EXP", "")),
        })
    return players


@_cached("team_stats")
def get_team_stats(team_id: int, season: str = CURRENT_SEASON) -> dict:
    base = LeagueDashTeamStats(season=season, per_mode_detailed="PerGame")
    base_df = base.league_dash_team_stats.get_data_frame()
    base_row = base_df[base_df["TEAM_ID"] == team_id]
    if base_row.empty:
        return {}
    b = base_row.iloc[0]
    wins = int(b["W"])
    losses = int(b["L"])

    off_rtg, def_rtg, net_rtg, pace = 0.0, 0.0, 0.0, 0.0
    try:
        adv = LeagueDashTeamStats(
            season=season,
            measure_type_detailed_defense="Advanced",
        )
        adv_df = adv.league_dash_team_stats.get_data_frame()
        adv_row = adv_df[adv_df["TEAM_ID"] == team_id]
        if not adv_row.empty:
            a = adv_row.iloc[0]
            off_rtg = float(a.get("OFF_RATING", 0))
            def_rtg = float(a.get("DEF_RATING", 0))
            net_rtg = float(a.get("NET_RATING", 0))
            pace = float(a.get("PACE", 0))
    except Exception:
        pass

    return {
        "record": {"wins": wins, "losses": losses},
        "off_rating": round(off_rtg, 1),
        "def_rating": round(def_rtg, 1),
        "net_rating": round(net_rtg, 1),
        "pace": round(pace, 1),
    }


@_cached("player_career")
def get_player_stats(player_id: int) -> dict:
    career = PlayerCareerStats(player_id=player_id, per_mode36="PerGame")
    df = career.season_totals_regular_season.get_data_frame()
    if df.empty:
        return {}
    latest = df.iloc[-1]

    name = _player_name(player_id)
    mpg = round(float(latest["MIN"]), 1)
    fga = float(latest.get("FGA", 0))
    fta = float(latest.get("FTA", 0))
    tov = float(latest.get("TOV", 0))
    ppg = round(float(latest["PTS"]), 1)
    gp = int(latest["GP"])

    usage_rate = round((fga + 0.44 * fta + tov) * 0.48 / max(mpg, 1), 3) if mpg > 0 else 0.20
    usage_rate = max(0.10, min(0.40, usage_rate))
    win_shares = round((ppg * gp) / 1200, 1)

    return {
        "player_id": int(latest["PLAYER_ID"]),
        "name": name,
        "season": latest.get("SEASON_ID", ""),
        "team_id": int(latest["TEAM_ID"]) if pd.notna(latest.get("TEAM_ID")) else None,
        "position": "",
        "age": int(latest["PLAYER_AGE"]) if pd.notna(latest.get("PLAYER_AGE")) else 0,
        "gp": int(latest["GP"]),
        "mpg": mpg,
        "ppg": ppg,
        "rpg": round(float(latest["REB"]), 1),
        "apg": round(float(latest["AST"]), 1),
        "fg_pct": round(float(latest["FG_PCT"]), 3),
        "three_pct": round(float(latest["FG3_PCT"]), 3),
        "stl": round(float(latest.get("STL", 0)), 1),
        "blk": round(float(latest.get("BLK", 0)), 1),
        "usage_rate": usage_rate,
        "win_shares": win_shares,
    }


@_cached("shot_chart")
def get_shot_chart(player_id: int, team_id: int = 0, season: str = CURRENT_SEASON) -> dict:
    """Fetch shot chart detail and bucket into 4 zones."""
    chart = ShotChartDetail(
        player_id=player_id,
        team_id=team_id,
        season_nullable=season,
        context_measure_simple="FGA",
    )
    df = chart.shot_chart_detail.get_data_frame()
    if df.empty:
        return _empty_zones()

    zones = {
        "paint": {"made": 0, "total": 0, "pts": 0},
        "midrange": {"made": 0, "total": 0, "pts": 0},
        "corner3": {"made": 0, "total": 0, "pts": 0},
        "arc3": {"made": 0, "total": 0, "pts": 0},
    }

    for _, row in df.iterrows():
        x, y = abs(int(row["LOC_X"])), int(row["LOC_Y"])
        made = int(row["SHOT_MADE_FLAG"])
        shot_type = str(row.get("SHOT_TYPE", ""))
        is_three = "3PT" in shot_type
        pts_value = 3 if is_three else 2

        if is_three:
            zone_key = "corner3" if y <= 92 and x >= 220 else "arc3"
        elif x <= 80 and y <= 80:
            zone_key = "paint"
        else:
            zone_key = "midrange"

        zones[zone_key]["total"] += 1
        zones[zone_key]["made"] += made
        zones[zone_key]["pts"] += made * pts_value

    result = {}
    for zone, data in zones.items():
        total = data["total"]
        result[zone] = {
            "pps": round(data["pts"] / total, 2) if total else 0.0,
            "fg": round(data["made"] / total, 3) if total else 0.0,
        }
    return result


def _empty_zones() -> dict:
    return {z: {"pps": 0.0, "fg": 0.0} for z in ["paint", "midrange", "corner3", "arc3"]}


@_cached("game_log")
def get_game_log(player_id: int, season: str = CURRENT_SEASON, last_n: int = 20) -> list[dict]:
    log = PlayerGameLog(player_id=player_id, season=season)
    df = log.player_game_log.get_data_frame()
    df = df.head(last_n)
    entries = []
    for _, row in df.iterrows():
        entries.append({
            "game_date": row["GAME_DATE"],
            "matchup": row["MATCHUP"],
            "result": row["WL"],
            "minutes": round(float(row["MIN"]), 1) if pd.notna(row.get("MIN")) else 0,
            "pts": int(row["PTS"]),
            "reb": int(row["REB"]),
            "ast": int(row["AST"]),
            "fg_pct": round(float(row["FG_PCT"]), 3) if pd.notna(row.get("FG_PCT")) else 0,
            "fg3_pct": round(float(row["FG3_PCT"]), 3) if pd.notna(row.get("FG3_PCT")) else 0,
            "plus_minus": float(row.get("PLUS_MINUS", 0)),
        })
    return entries


def enrich_game_log_with_opponent_def_rating(game_log: list[dict]) -> list[dict]:
    """Add opponent_def_rating to each game by parsing matchup and fetching opponent stats."""
    result = []
    league_avg_dr = 112.0
    for g in game_log:
        enriched = {**g}
        matchup = g.get("matchup", "")
        opp_abbr = _parse_opponent_abbr_from_matchup(matchup)
        if opp_abbr:
            tid = get_team_id_by_abbr(opp_abbr)
            enriched["opponent_def_rating"] = get_team_defensive_rating(tid) if tid else league_avg_dr
        else:
            enriched["opponent_def_rating"] = league_avg_dr
        result.append(enriched)
    return result


def _player_name(player_id: int) -> str:
    """Resolve player name from static data."""
    for p in static_players.get_players():
        if p["id"] == player_id:
            return p["full_name"]
    return f"Player {player_id}"


def get_all_players() -> list[dict]:
    """Return all known NBA players from static data."""
    return static_players.get_players()


def find_player_by_name(name: str) -> dict | None:
    all_p = static_players.get_players()
    name_lower = name.lower()
    for p in all_p:
        if name_lower in p["full_name"].lower():
            return p
    return None
