<<<<<<< HEAD
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import players, games, stats

app = FastAPI()
=======
import logging
from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import players, schedule, stats
from api.services.schedule_service import refresh_schedule

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    refresh_schedule(date.today())
    yield


app = FastAPI(lifespan=lifespan)
>>>>>>> pitcher_stats

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
<<<<<<< HEAD
    allow_methods=["GET"],
=======
    allow_methods=["GET", "POST"],
>>>>>>> pitcher_stats
    allow_headers=["*"],
)

app.include_router(players.router, prefix="/players", tags=["players"])
<<<<<<< HEAD
# app.include_router(games.router, prefix="/games", tags=["games"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
=======
app.include_router(schedule.router, prefix="/schedule", tags=["schedule"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
>>>>>>> pitcher_stats
