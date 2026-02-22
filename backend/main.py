from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import teams, players, analytics, team_fit, team_value, trades, chat

app = FastAPI(
    title="The War Room API",
    description="NBA Executive AI Suite — Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teams.router)
app.include_router(players.router)
app.include_router(analytics.router)
app.include_router(team_fit.router)
app.include_router(team_value.router)
app.include_router(trades.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {"status": "ok", "app": "The War Room API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
