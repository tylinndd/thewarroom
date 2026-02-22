"""Player stat vectorization and pgvector similarity search via Supabase."""

import numpy as np
from services.supabase_client import get_supabase

EMBEDDING_DIM = 8

STAT_KEYS = ["ppg", "rpg", "apg", "fg_pct", "three_pct", "usage_rate", "mpg", "pace"]

STAT_RANGES = {
    "ppg": (0, 35),
    "rpg": (0, 15),
    "apg": (0, 12),
    "fg_pct": (0.30, 0.65),
    "three_pct": (0.0, 0.50),
    "usage_rate": (0.10, 0.35),
    "mpg": (10, 38),
    "pace": (90, 110),
}


def build_embedding(stats: dict) -> list[float]:
    """Normalize player stats into a fixed-length vector."""
    vec = []
    for key in STAT_KEYS:
        val = float(stats.get(key, 0))
        lo, hi = STAT_RANGES[key]
        normed = (val - lo) / (hi - lo) if hi != lo else 0.0
        vec.append(max(0.0, min(1.0, normed)))
    return vec


def upsert_player_embedding(
    player_id: int,
    player_name: str,
    team_id: int | None,
    season: str,
    stats: dict,
) -> None:
    """Build embedding from stats and upsert into Supabase player_embeddings table."""
    embedding = build_embedding(stats)
    sb = get_supabase()

    existing = (
        sb.table("player_embeddings")
        .select("id")
        .eq("player_id", player_id)
        .execute()
    )

    row = {
        "player_id": player_id,
        "player_name": player_name,
        "team_id": team_id,
        "season": season,
        "stats": stats,
        "embedding": embedding,
    }

    if existing.data:
        sb.table("player_embeddings").update(row).eq("player_id", player_id).execute()
    else:
        sb.table("player_embeddings").insert(row).execute()


def get_player_embedding(player_id: int) -> list[float] | None:
    """Fetch a player's embedding from Supabase. Returns None if not found."""
    sb = get_supabase()
    result = (
        sb.table("player_embeddings")
        .select("embedding")
        .eq("player_id", player_id)
        .limit(1)
        .execute()
    )
    if not result.data or len(result.data) == 0:
        return None
    return result.data[0].get("embedding")


def search_similar_by_embedding(
    query_embedding: list[float],
    exclude_player_id: int | None = None,
    exclude_team_id: int | None = None,
    top_n: int = 10,
) -> list[dict]:
    """Search for players similar to a given embedding vector (e.g. from a specific player)."""
    vec_str = "[" + ",".join(str(float(v)) for v in query_embedding) + "]"
    sb = get_supabase()

    query = sb.rpc(
        "match_players",
        {
            "query_embedding": vec_str,
            "match_count": top_n + 20,
        },
    ).execute()

    results = []
    for row in query.data or []:
        if exclude_player_id and row.get("player_id") == exclude_player_id:
            continue
        if exclude_team_id and row.get("team_id") == exclude_team_id:
            continue
        results.append({
            "player_id": row["player_id"],
            "player_name": row["player_name"],
            "team_id": row.get("team_id"),
            "similarity": round(1 - row.get("distance", 1), 3),
            "stats": row.get("stats", {}),
        })
        if len(results) >= top_n:
            break

    return results


def search_similar_players(
    identity_weights: dict,
    exclude_team_id: int | None = None,
    top_n: int = 10,
) -> list[dict]:
    """Search for players matching a team identity using cosine similarity.

    identity_weights maps identity traits to emphasis multipliers:
      pace, three_point, defense, rebounding, playmaking
    We translate these into a query vector in the same stat space.
    """
    query_profile = {
        "ppg": 20 * identity_weights.get("pace", 1.0),
        "rpg": 8 * identity_weights.get("rebounding", 1.0),
        "apg": 6 * identity_weights.get("playmaking", 1.0),
        "fg_pct": 0.48,
        "three_pct": 0.38 * identity_weights.get("three_point", 1.0),
        "usage_rate": 0.22,
        "mpg": 30,
        "pace": 102 * identity_weights.get("pace", 1.0),
    }
    query_vec = build_embedding(query_profile)
    vec_str = "[" + ",".join(str(v) for v in query_vec) + "]"

    sb = get_supabase()

    query = sb.rpc(
        "match_players",
        {
            "query_embedding": vec_str,
            "match_count": top_n + (10 if exclude_team_id else 0),
        },
    ).execute()

    results = []
    for row in query.data or []:
        if exclude_team_id and row.get("team_id") == exclude_team_id:
            continue
        results.append({
            "player_id": row["player_id"],
            "player_name": row["player_name"],
            "team_id": row.get("team_id"),
            "similarity": round(1 - row.get("distance", 1), 3),
            "stats": row.get("stats", {}),
        })
        if len(results) >= top_n:
            break

    return results
