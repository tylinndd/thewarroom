from fastapi import APIRouter, HTTPException
from services import nba_service

router = APIRouter(prefix="/api/players", tags=["players"])


@router.get("/{player_id}")
def get_player(player_id: int):
    try:
        stats = nba_service.get_player_stats(player_id)
        if not stats:
            raise HTTPException(status_code=404, detail="Player not found")
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch player: {e}")


@router.get("/{player_id}/shot-zones")
def shot_zones(player_id: int, team_id: int = 0):
    try:
        zones = nba_service.get_shot_chart(player_id, team_id=team_id)
        return {"player_id": player_id, "zones": zones}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch shot chart: {e}")


@router.get("/{player_id}/game-log")
def game_log(player_id: int, last_n: int = 20):
    try:
        log = nba_service.get_game_log(player_id, last_n=last_n)
        return {"player_id": player_id, "games": log}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch game log: {e}")
