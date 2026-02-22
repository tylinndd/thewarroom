from fastapi import APIRouter, HTTPException
from services import nba_service
from services.ml_models import predict_performance, compute_fragility, compute_contract_value
from config import SALARY_CAP

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/performance/{player_id}")
def performance_predictor(player_id: int, opponent_team_id: int | None = None):
    """Predict next-game performance using Random Forest on last 20 games + opponent Defensive Rating.

    Pass opponent_team_id for the next opponent to use their defensive rating in the prediction.
    """
    try:
        game_log = nba_service.get_game_log(player_id)
        if not game_log:
            raise HTTPException(status_code=404, detail="No game log data available")

        game_log = nba_service.enrich_game_log_with_opponent_def_rating(game_log)

        next_opponent_def_rating = None
        if opponent_team_id:
            next_opponent_def_rating = nba_service.get_team_defensive_rating(opponent_team_id)

        player_stats = nba_service.get_player_stats(player_id)
        name = player_stats.get("name", f"Player {player_id}") if player_stats else f"Player {player_id}"

        prediction = predict_performance(
            game_log,
            next_opponent_def_rating=next_opponent_def_rating,
        )
        prediction["player_id"] = player_id
        prediction["name"] = name
        return prediction
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@router.get("/fragility/{player_id}")
def fragility_score(player_id: int):
    """Compute injury-risk fragility score for a player."""
    try:
        stats = nba_service.get_player_stats(player_id)
        if not stats:
            raise HTTPException(status_code=404, detail="Player not found")

        game_log = nba_service.get_game_log(player_id)

        b2b_count = _estimate_back_to_backs(game_log)

        result = compute_fragility(
            age=stats.get("age", 25),
            mpg=stats.get("mpg", 25),
            usage_rate=stats.get("usage_rate", 0.20) if "usage_rate" in stats else 0.20,
            back_to_backs=b2b_count,
            games_played=stats.get("gp", 82),
        )
        result["player_id"] = player_id
        result["name"] = stats.get("name", f"Player {player_id}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fragility calculation failed: {e}")


@router.get("/contract/{player_id}")
def contract_valuator(player_id: int, salary: int = 0, win_shares: float = 0):
    """Compute fair market value for a player's contract.

    Query params salary and win_shares can be provided if known;
    otherwise we estimate from available stats.
    """
    try:
        stats = nba_service.get_player_stats(player_id)
        if not stats:
            raise HTTPException(status_code=404, detail="Player not found")

        name = stats.get("name", f"Player {player_id}")

        if win_shares <= 0:
            ppg = stats.get("ppg", 0)
            gp = stats.get("gp", 0)
            win_shares = _estimate_win_shares(ppg, gp)

        result = compute_contract_value(
            win_shares=win_shares,
            current_salary=salary,
            salary_cap=SALARY_CAP,
        )
        result["player_id"] = player_id
        result["name"] = name
        result["win_shares"] = round(win_shares, 1)
        result["current_salary"] = salary
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Contract valuation failed: {e}")


def _estimate_back_to_backs(game_log: list[dict]) -> int:
    """Rough estimate of back-to-back games from game dates."""
    if len(game_log) < 2:
        return 0
    from datetime import datetime
    b2b = 0
    dates = []
    for g in game_log:
        try:
            d = datetime.strptime(g["game_date"][:10], "%Y-%m-%d") if "-" in g["game_date"] else datetime.strptime(g["game_date"], "%b %d, %Y")
            dates.append(d)
        except (ValueError, KeyError):
            continue
    dates.sort()
    for i in range(1, len(dates)):
        if (dates[i] - dates[i - 1]).days == 1:
            b2b += 1
    return b2b


def _estimate_win_shares(ppg: float, gp: int) -> float:
    """Very rough win share estimate when actual data isn't available."""
    if gp == 0:
        return 0.0
    return round((ppg * gp) / 1200, 1)
