"""5-year Monte Carlo team value projection."""

import numpy as np
from config import SALARY_CAP


BASE_FRANCHISE_VALUE = 3_500_000_000  # ~$3.5B average NBA franchise
CAP_GROWTH_RATE = 0.07  # ~7% annual salary cap growth
VALUE_WIN_MULTIPLIER = 40_000_000  # each win adds ~$40M franchise value


def age_decay(age: int, year_offset: int) -> float:
    """Model how a player's production decays with age.

    Peak years are ~25-28. Before peak, slight improvement. After, decline.
    """
    future_age = age + year_offset
    if future_age <= 27:
        return 1.0 + 0.02 * max(0, 27 - future_age)
    decline_per_year = 0.03 + 0.01 * max(0, future_age - 30)
    return max(0.2, 1.0 - decline_per_year * (future_age - 27))


def project_team_value(
    roster: list[dict],
    current_record: dict,
    iterations: int = 1000,
) -> dict:
    """Run Monte Carlo simulation for 5-year team projection.

    Args:
        roster: List of player dicts with keys: age, salary, win_shares.
        current_record: {"wins": int, "losses": int}
        iterations: Number of simulation runs.

    Returns:
        Dict with year-by-year projections (wins, valuation, salary).
    """
    current_wins = current_record.get("wins", 41)
    total_ws = sum(p.get("win_shares", 0) for p in roster)
    if total_ws <= 0:
        total_ws = 1.0

    projections = []

    for year in range(1, 6):
        wins_samples = []
        val_samples = []
        cap_this_year = SALARY_CAP * (1 + CAP_GROWTH_RATE) ** year

        for _ in range(iterations):
            projected_ws = 0.0
            total_salary = 0
            for p in roster:
                p_age = p.get("age", 27)
                p_ws = p.get("win_shares", 0)
                p_salary = p.get("salary", 0)

                decay = age_decay(p_age, year)
                noise = np.random.normal(1.0, 0.12)
                projected_ws += p_ws * decay * noise

                salary_growth = 1.05 ** min(year, p.get("years_left", year))
                total_salary += int(p_salary * salary_growth)

            ws_ratio = projected_ws / total_ws if total_ws > 0 else 1.0
            season_wins = current_wins * ws_ratio
            season_wins += np.random.normal(0, 4)
            season_wins = max(10, min(72, season_wins))

            franchise_val = (
                BASE_FRANCHISE_VALUE
                + season_wins * VALUE_WIN_MULTIPLIER
                + np.random.normal(0, 200_000_000)
            )
            franchise_val *= (1 + 0.05) ** year

            wins_samples.append(season_wins)
            val_samples.append(franchise_val)

        wins_arr = np.array(wins_samples)
        val_arr = np.array(val_samples)
        avg_salary = int(np.mean([
            sum(
                p.get("salary", 0) * (1.05 ** min(year, p.get("years_left", year)))
                for p in roster
            )
            for _ in range(1)
        ]))

        projections.append({
            "year": year,
            "wins_mean": round(float(np.mean(wins_arr)), 1),
            "wins_p10": round(float(np.percentile(wins_arr, 10)), 1),
            "wins_p90": round(float(np.percentile(wins_arr, 90)), 1),
            "valuation_mean": int(np.mean(val_arr)),
            "total_salary": avg_salary,
        })

    current_val = BASE_FRANCHISE_VALUE + current_wins * VALUE_WIN_MULTIPLIER

    return {
        "projections": projections,
        "current_valuation": int(current_val),
    }
