from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import players, games, stats

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(players.router, prefix="/players", tags=["players"])
# app.include_router(games.router, prefix="/games", tags=["games"])
# app.include_router(stats.router, prefix="/stats", tags=["stats"])