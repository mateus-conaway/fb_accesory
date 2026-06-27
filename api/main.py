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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(players.router, prefix="/players", tags=["players"])
app.include_router(schedule.router, prefix="/schedule", tags=["schedule"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
