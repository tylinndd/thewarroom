from pydantic import BaseModel
from typing import Optional


# ── Teams ──────────────────────────────────────────────────────────

class NBATeam(BaseModel):
    id: int
    name: str
    city: str
    abbr: str
    color: str
    secondary: str


class RosterPlayer(BaseModel):
    player_id: int
    name: str
    number: str
    position: str
    age: int
    height: str
    weight: str
    experience: str
    salary: Optional[int] = None


class TeamStats(BaseModel):
    team_id: int
    record: dict  # {"wins": int, "losses": int}
    off_rating: float
    def_rating: float
    net_rating: float
    pace: float
    total_salary: int
    salary_cap: int
    cap_space: int


# ── Players ────────────────────────────────────────────────────────

class ShotZone(BaseModel):
    pps: float  # points per shot
    fg: float   # field goal %


class ShotZones(BaseModel):
    paint: ShotZone
    midrange: ShotZone
    corner3: ShotZone
    arc3: ShotZone


class PlayerStats(BaseModel):
    player_id: int
    name: str
    team_id: Optional[int] = None
    position: str
    age: int
    ppg: float
    rpg: float
    apg: float
    mpg: float
    fg_pct: float
    three_pct: float
    usage_rate: float
    win_shares: float


class GameLogEntry(BaseModel):
    game_date: str
    matchup: str
    result: str
    minutes: float
    pts: int
    reb: int
    ast: int
    fg_pct: float
    fg3_pct: float
    plus_minus: float


# ── Analytics ──────────────────────────────────────────────────────

class PerformancePrediction(BaseModel):
    player_id: int
    name: str
    predicted_ppg: float
    predicted_rpg: float
    predicted_apg: float
    confidence: float
    recent_avg: dict


class FragilityResult(BaseModel):
    player_id: int
    name: str
    score: float
    label: str  # Low / Medium / High
    factors: dict


class ContractValuation(BaseModel):
    player_id: int
    name: str
    current_salary: int
    fair_value: int
    difference: int
    win_shares: float
    verdict: str  # Underpaid / Overpaid / Fair


# ── Team Fit ───────────────────────────────────────────────────────

class TeamIdentityWeights(BaseModel):
    pace: float = 1.0
    three_point: float = 1.0
    defense: float = 1.0
    rebounding: float = 1.0
    playmaking: float = 1.0


class TeamFitSearchRequest(BaseModel):
    team_identity: TeamIdentityWeights
    exclude_team_id: Optional[int] = None
    top_n: int = 10


class TeamFitPlayer(BaseModel):
    player_id: int
    player_name: str
    team_id: Optional[int] = None
    similarity: float
    stats: dict


# ── Team Value ─────────────────────────────────────────────────────

class YearProjection(BaseModel):
    year: int
    wins_mean: float
    wins_p10: float
    wins_p90: float
    valuation_mean: float
    total_salary: float


class TeamValueProjection(BaseModel):
    team_id: int
    projections: list[YearProjection]
    current_valuation: float


# ── Trade Simulator ────────────────────────────────────────────────

class TradePlayer(BaseModel):
    player_id: int
    name: str
    salary: int


class TradeRequest(BaseModel):
    team_a_players: list[TradePlayer]
    team_b_players: list[TradePlayer]
    team_a_id: int
    team_b_id: int


class TradeResult(BaseModel):
    is_legal: bool
    reason: str
    team_a_outgoing_salary: int
    team_b_outgoing_salary: int
    team_a_cap_after: int
    team_b_cap_after: int


# ── AI Chat ────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    team_id: Optional[int] = None
    team_name: Optional[str] = None
    history: list[dict] = []


class ChatResponse(BaseModel):
    reply: str
