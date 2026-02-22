from fastapi import APIRouter, HTTPException
from models.schemas import TradeRequest
from config import SALARY_CAP

router = APIRouter(prefix="/api/trades", tags=["trades"])

TAX_APRON = 178_132_000  # 2024-25 second apron


@router.post("/simulate")
def simulate_trade(req: TradeRequest):
    """Validate a trade under CBA salary-matching rules and return cap impact."""
    try:
        team_a_out = sum(p.salary for p in req.team_a_players)
        team_b_out = sum(p.salary for p in req.team_b_players)

        is_legal, reason = _check_salary_matching(team_a_out, team_b_out)

        team_a_cap_after = SALARY_CAP - team_b_out + team_a_out
        team_b_cap_after = SALARY_CAP - team_a_out + team_b_out

        return {
            "is_legal": is_legal,
            "reason": reason,
            "team_a_outgoing_salary": team_a_out,
            "team_b_outgoing_salary": team_b_out,
            "team_a_incoming_salary": team_b_out,
            "team_b_incoming_salary": team_a_out,
            "team_a_cap_after": max(0, team_a_cap_after),
            "team_b_cap_after": max(0, team_b_cap_after),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trade simulation failed: {e}")


def _check_salary_matching(team_a_out: int, team_b_out: int) -> tuple[bool, str]:
    """Apply CBA salary-matching rules (simplified 125% + $250K rule).

    Teams over the cap can receive up to 125% + $250,000 of what they send out.
    Teams under the cap can absorb salary into their cap space.
    """
    if team_a_out == 0 and team_b_out == 0:
        return False, "No salaries in the trade."

    a_can_receive = int(team_a_out * 1.25 + 250_000)
    b_can_receive = int(team_b_out * 1.25 + 250_000)

    a_ok = team_b_out <= a_can_receive
    b_ok = team_a_out <= b_can_receive

    if a_ok and b_ok:
        return True, "Trade is legal under the 125% + $250K salary-matching rule."

    violations = []
    if not a_ok:
        violations.append(
            f"Team A sends ${team_a_out:,} but would receive ${team_b_out:,} "
            f"(max allowed: ${a_can_receive:,})"
        )
    if not b_ok:
        violations.append(
            f"Team B sends ${team_b_out:,} but would receive ${team_a_out:,} "
            f"(max allowed: ${b_can_receive:,})"
        )

    return False, "Trade violates salary-matching rules. " + "; ".join(violations)
