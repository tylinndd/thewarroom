"""Gemini LLM client for the AI Chat feature."""

from google import genai
from config import GEMINI_API_KEY

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


SYSTEM_PROMPT_TEMPLATE = """You are an elite NBA front-office AI assistant embedded in "The War Room" — \
a decision-support platform for NBA executives.

You are currently advising the executive of the **{team_name}**.

Here is the current roster context:
{roster_context}

Team record: {record}

Guidelines:
- Be concise, data-driven, and analytical.
- When the user says "my team" or "our roster", they mean the {team_name}.
- Provide specific player names and stats when relevant.
- If asked about trades, salary cap, or projections, give concrete numbers.
- Keep responses under 300 words unless the user asks for a deep dive.
"""


async def chat(
    message: str,
    team_name: str,
    roster_summary: str = "",
    record: str = "",
    history: list[dict] | None = None,
) -> str:
    """Send a message to Gemini with team context and return the response."""
    client = _get_client()

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        team_name=team_name,
        roster_context=roster_summary or "No roster data loaded.",
        record=record or "N/A",
    )

    contents = []

    if history:
        for msg in history:
            role = msg.get("role", "user")
            gemini_role = "user" if role == "user" else "model"
            contents.append(
                genai.types.Content(
                    role=gemini_role,
                    parts=[genai.types.Part(text=msg.get("content", ""))],
                )
            )

    contents.append(
        genai.types.Content(
            role="user",
            parts=[genai.types.Part(text=message)],
        )
    )

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=contents,
        config=genai.types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7,
            max_output_tokens=1024,
        ),
    )

    return response.text or "I couldn't generate a response. Please try again."
