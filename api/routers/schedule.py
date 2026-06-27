from fastapi import APIRouter

from api.services.schedule_service import get_cached_schedule, refresh_schedule

router = APIRouter()


@router.get("")
def get_schedule():
    schedule_date, games = get_cached_schedule()
    return {
        "date": schedule_date.isoformat() if schedule_date else None,
        "games": games,
    }


@router.post("/refresh")
def post_refresh_schedule():
    refresh_schedule()
    schedule_date, games = get_cached_schedule()
    return {
        "date": schedule_date.isoformat() if schedule_date else None,
        "games": games,
    }
