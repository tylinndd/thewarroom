"""ML models: Performance Predictor, Fragility Score, Contract Valuator."""

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from config import SALARY_CAP, LEAGUE_AVG_WIN_SHARES


# ── Performance Predictor ──────────────────────────────────────────

def predict_performance(
    game_log: list[dict],
    next_opponent_def_rating: float | None = None,
) -> dict:
    """Train a Random Forest on recent game logs and predict next game stats.

    Features per game: minutes, fg_pct, fg3_pct, plus_minus, opponent_def_rating.
    Targets: pts, reb, ast.
    Uses next_opponent_def_rating for the prediction vector when provided.
    """
    if len(game_log) < 5:
        avg = _average_stats(game_log)
        return {
            "predicted_ppg": avg["ppg"],
            "predicted_rpg": avg["rpg"],
            "predicted_apg": avg["apg"],
            "confidence": 0.3,
            "recent_avg": avg,
        }

    features = []
    targets_pts, targets_reb, targets_ast = [], [], []

    for g in game_log:
        opp_dr = g.get("opponent_def_rating", 112.0)
        features.append([
            g.get("minutes", 0),
            g.get("fg_pct", 0),
            g.get("fg3_pct", 0),
            g.get("plus_minus", 0),
            opp_dr,
        ])
        targets_pts.append(g["pts"])
        targets_reb.append(g["reb"])
        targets_ast.append(g["ast"])

    X = np.array(features)
    y_pts = np.array(targets_pts)
    y_reb = np.array(targets_reb)
    y_ast = np.array(targets_ast)

    n_estimators = min(50, max(10, len(game_log)))

    rf_pts = RandomForestRegressor(n_estimators=n_estimators, random_state=42)
    rf_reb = RandomForestRegressor(n_estimators=n_estimators, random_state=42)
    rf_ast = RandomForestRegressor(n_estimators=n_estimators, random_state=42)

    rf_pts.fit(X, y_pts)
    rf_reb.fit(X, y_reb)
    rf_ast.fit(X, y_ast)

    # Use next opponent DR for prediction vector when provided
    last_game_features = list(X[-1])
    if next_opponent_def_rating is not None:
        last_game_features[-1] = next_opponent_def_rating
    last_game = np.array([last_game_features]).reshape(1, -1)
    pred_pts = float(rf_pts.predict(last_game)[0])
    pred_reb = float(rf_reb.predict(last_game)[0])
    pred_ast = float(rf_ast.predict(last_game)[0])

    avg_score = np.mean([
        rf_pts.score(X, y_pts),
        rf_reb.score(X, y_reb),
        rf_ast.score(X, y_ast),
    ])
    confidence = max(0.0, min(1.0, float(avg_score)))

    avg = _average_stats(game_log)

    return {
        "predicted_ppg": round(pred_pts, 1),
        "predicted_rpg": round(pred_reb, 1),
        "predicted_apg": round(pred_ast, 1),
        "confidence": round(confidence, 2),
        "recent_avg": avg,
    }


def _average_stats(game_log: list[dict]) -> dict:
    if not game_log:
        return {"ppg": 0, "rpg": 0, "apg": 0, "mpg": 0}
    n = len(game_log)
    return {
        "ppg": round(sum(g["pts"] for g in game_log) / n, 1),
        "rpg": round(sum(g["reb"] for g in game_log) / n, 1),
        "apg": round(sum(g["ast"] for g in game_log) / n, 1),
        "mpg": round(sum(g.get("minutes", 0) for g in game_log) / n, 1),
    }


# ── Fragility Score ────────────────────────────────────────────────

def compute_fragility(
    age: int,
    mpg: float,
    usage_rate: float,
    back_to_backs: int,
    games_played: int = 82,
) -> dict:
    """Compute injury risk score (0-100) from age, minutes, usage, and B2B frequency.

    Weights: age 25%, MPG 30%, usage 25%, B2B 20%.
    """
    age_factor = _normalize(age, low=20, high=38) * 100
    mpg_factor = _normalize(mpg, low=15, high=38) * 100
    usage_factor = _normalize(usage_rate, low=0.10, high=0.35) * 100
    b2b_factor = _normalize(back_to_backs, low=0, high=20) * 100

    score = (
        0.25 * age_factor
        + 0.30 * mpg_factor
        + 0.25 * usage_factor
        + 0.20 * b2b_factor
    )
    score = round(min(100, max(0, score)), 1)

    if score < 35:
        label = "Low"
    elif score < 65:
        label = "Medium"
    else:
        label = "High"

    return {
        "score": score,
        "label": label,
        "factors": {
            "age": round(age_factor, 1),
            "mpg": round(mpg_factor, 1),
            "usage_rate": round(usage_factor, 1),
            "back_to_backs": round(b2b_factor, 1),
        },
    }


def _normalize(value: float, low: float, high: float) -> float:
    return max(0.0, min(1.0, (value - low) / (high - low)))


# ── Contract Valuator ──────────────────────────────────────────────

def compute_contract_value(
    win_shares: float,
    current_salary: int,
    salary_cap: int = SALARY_CAP,
    league_avg_ws: float = LEAGUE_AVG_WIN_SHARES,
) -> dict:
    """Fair market value based on win shares relative to salary cap."""
    if league_avg_ws <= 0:
        fair_value = 0
    else:
        fair_value = int((win_shares / league_avg_ws) * (salary_cap / 15))

    difference = fair_value - current_salary

    if abs(difference) < current_salary * 0.10:
        verdict = "Fair"
    elif difference > 0:
        verdict = "Underpaid"
    else:
        verdict = "Overpaid"

    return {
        "fair_value": fair_value,
        "difference": difference,
        "verdict": verdict,
    }
