from fastapi import APIRouter, Query

from api.services.stats_service import (
    calculate_stats,
    season_stats,
    career_at_ballpark,
    career_vs_hand,
    career_vs_pitcher,
    season_at_ballpark,
    season_vs_hand,
    season_vs_offspeed,
    season_vs_pitcher,
)

router = APIRouter()


@router.get("/{batter_id}")
def get_batter_stats(
    batter_id: int,
    pitcher_id: int,
    hand: str,
    pitch_type: str,
    ballpark: str
):
    """Return eight stat lines (each from calculate_stats) for one batter."""
    return {
        "season_stats": calculate_stats(
            season_stats(batter_id)
        ),
        "career_vs_pitcher": calculate_stats(
            career_vs_pitcher(batter_id, pitcher_id)
        ),
        "season_vs_pitcher": calculate_stats(
            season_vs_pitcher(batter_id, pitcher_id)
        ),
        "career_vs_hand": calculate_stats(career_vs_hand(batter_id, hand)),
        "season_vs_hand": calculate_stats(season_vs_hand(batter_id, hand)),
        "season_vs_offspeed": calculate_stats(
            season_vs_offspeed(batter_id, pitch_type)
        ),
        "career_at_ballpark": calculate_stats(
            career_at_ballpark(batter_id, ballpark)
        ),
        "season_at_ballpark": calculate_stats(
            season_at_ballpark(batter_id, ballpark)
        ),
    }
