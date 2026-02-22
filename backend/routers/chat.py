from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse
from services.llm_service import chat as llm_chat
from services import nba_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message to the AI assistant with team context."""
    try:
        roster_summary = ""
        record = ""

        if req.team_id:
            try:
                roster = nba_service.get_team_roster(req.team_id)
                if roster:
                    lines = []
                    for p in roster[:12]:
                        lines.append(f"- {p['name']} ({p['position']}, age {p['age']})")
                    roster_summary = "\n".join(lines)
            except Exception:
                roster_summary = "Roster data unavailable."

            try:
                stats = nba_service.get_team_stats(req.team_id)
                if stats and "record" in stats:
                    r = stats["record"]
                    record = f"{r['wins']}-{r['losses']} | ORtg {stats.get('off_rating', 'N/A')} | DRtg {stats.get('def_rating', 'N/A')}"
            except Exception:
                record = "Stats unavailable."

        reply = await llm_chat(
            message=req.message,
            team_name=req.team_name or "Unknown Team",
            roster_summary=roster_summary,
            record=record,
            history=req.history,
        )

        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")
