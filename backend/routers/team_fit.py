from fastapi import APIRouter, HTTPException
from models.schemas import TeamFitSearchRequest
from services import nba_service
from services.embedding_service import (
    upsert_player_embedding,
    search_similar_players,
    get_player_embedding,
    search_similar_by_embedding,
    build_embedding,
)
from config import CURRENT_SEASON

router = APIRouter(prefix="/api/team-fit", tags=["team-fit"])


@router.post("/embed-players")
def embed_players(team_id: int | None = None):
    """Build and store embeddings for all players on a team (or all teams if no team_id)."""
    try:
        if team_id:
            roster = nba_service.get_team_roster(team_id)
            teams_to_process = [(team_id, roster)]
        else:
            all_teams = nba_service.get_all_teams()
            teams_to_process = []
            for t in all_teams:
                tid = t["id"]
                try:
                    r = nba_service.get_team_roster(tid)
                    teams_to_process.append((tid, r))
                except Exception:
                    continue

        count = 0
        for tid, roster in teams_to_process:
            for player in roster:
                pid = player["player_id"]
                try:
                    stats = nba_service.get_player_stats(pid)
                    if not stats:
                        continue
                    embed_stats = {
                        "ppg": stats.get("ppg", 0),
                        "rpg": stats.get("rpg", 0),
                        "apg": stats.get("apg", 0),
                        "fg_pct": stats.get("fg_pct", 0),
                        "three_pct": stats.get("three_pct", 0),
                        "usage_rate": stats.get("usage_rate", 0.20),
                        "mpg": stats.get("mpg", 0),
                        "pace": 100,
                    }
                    upsert_player_embedding(
                        player_id=pid,
                        player_name=player["name"],
                        team_id=tid,
                        season=CURRENT_SEASON,
                        stats=embed_stats,
                    )
                    count += 1
                except Exception:
                    continue

        return {"embedded": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")


@router.get("/similar-to/{player_id}")
def similar_to_player(
    player_id: int,
    top_n: int = 10,
    exclude_team_id: int | None = None,
):
    """Find players similar to a specific player using cosine similarity on their stat profile."""
    try:
        embedding = get_player_embedding(player_id)
        if embedding is None:
            stats = nba_service.get_player_stats(player_id)
            if not stats:
                raise HTTPException(status_code=404, detail="Player not found")
            embed_stats = {
                "ppg": stats.get("ppg", 0),
                "rpg": stats.get("rpg", 0),
                "apg": stats.get("apg", 0),
                "fg_pct": stats.get("fg_pct", 0),
                "three_pct": stats.get("three_pct", 0),
                "usage_rate": stats.get("usage_rate", 0.20),
                "mpg": stats.get("mpg", 0),
                "pace": 100,
            }
            embedding = build_embedding(embed_stats)
            upsert_player_embedding(
                player_id=player_id,
                player_name=stats.get("name", f"Player {player_id}"),
                team_id=stats.get("team_id"),
                season=CURRENT_SEASON,
                stats=embed_stats,
            )

        results = search_similar_by_embedding(
            query_embedding=embedding,
            exclude_player_id=player_id,
            exclude_team_id=exclude_team_id,
            top_n=top_n,
        )
        return {"matches": results, "query_player_id": player_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similar players search failed: {e}")


@router.post("/search")
def search_team_fit(req: TeamFitSearchRequest):
    """Find players matching a team identity using cosine similarity."""
    try:
        identity = req.team_identity.model_dump()
        results = search_similar_players(
            identity_weights=identity,
            exclude_team_id=req.exclude_team_id,
            top_n=req.top_n,
        )
        return {"matches": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")
