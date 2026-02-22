import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

CURRENT_SEASON = "2024-25"
SALARY_CAP = 140_588_000  # 2024-25 NBA salary cap
LEAGUE_AVG_WIN_SHARES = 4.5
