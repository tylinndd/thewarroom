from fastapi import APIRouter, HTTPException
from services import nba_service
from services.monte_carlo import project_team_value

router = APIRouter(prefix="/api/team-value", tags=["team-value"])


@router.get("/{team_id}")
def team_value_projection(team_id: int):
    """Run Monte Carlo simulation for 5-year team value projection."""
    try:
        stats = nba_service.get_team_stats(team_id)
        if not stats:
            raise HTTPException(status_code=404, detail="Team stats not found")

        roster_raw = nba_service.get_team_roster(team_id)

        roster_for_mc = []
        for p in roster_raw:
            pid = p["player_id"]
            try:
                ps = nba_service.get_player_stats(pid)
            except Exception:
                ps = {}

            ppg = ps.get("ppg", 8) if ps else 8
            gp = ps.get("gp", 60) if ps else 60
            ws_est = round((ppg * gp) / 1200, 1)

            roster_for_mc.append({
                "age": p.get("age", 25),
                "salary": 10_000_000,
                "win_shares": ws_est,
                "years_left": 2,
            })

        result = project_team_value(
            roster=roster_for_mc,
            current_record=stats.get("record", {"wins": 41, "losses": 41}),
        )
        result["team_id"] = team_id
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Projection failed: {e}")
