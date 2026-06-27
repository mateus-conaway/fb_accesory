<<<<<<< HEAD
from fastapi import APIRouter, Query

from api.services.stats_service import (
=======
from typing import Literal

from fastapi import APIRouter, HTTPException

from api.services.batter_stats_service import (
>>>>>>> pitcher_stats
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

<<<<<<< HEAD
router = APIRouter()

@router.get("/pitcher/{pitcher_id}")
def get_pitcher_stats(
    pitcher_id: int,
    ballpark: str,
    hand: str,
    pitch_type: str,
=======
from api.services.pitcher_stats_service import (
    calculate_era,
    get_starting_lineup,
)

router = APIRouter()


@router.get("/lineup")
def get_lineup(
    game_pk: int,
    side: Literal["home", "away"],
):
    starters = get_starting_lineup(game_pk, side)
    if len(starters) < 9:
        raise HTTPException(
            status_code=422,
            detail=f"Lineup not available yet ({len(starters)} starters found)",
        )
    return {"starters": starters}


@router.get("/pitcher/{pitcher_id}")
def get_pitcher_stats(
    pitcher_id: int,
>>>>>>> pitcher_stats
    hitter_one: int,
    hitter_two: int,
    hitter_three: int,
    hitter_four: int,
    hitter_five: int,
    hitter_six: int,
    hitter_seven: int,
    hitter_eight: int,
<<<<<<< HEAD
    hitter_nine: int
):
    return {
=======
    hitter_nine: int,
    game_pk: int,
):
    return {
        "era": calculate_era(pitcher_id, game_pk),
>>>>>>> pitcher_stats
        "career_vs_hitter_one": calculate_stats(
            career_vs_pitcher(hitter_one, pitcher_id)
        ),
        "career_vs_hitter_two": calculate_stats(
            career_vs_pitcher(hitter_two, pitcher_id)
        ),
        "career_vs_hitter_three": calculate_stats(
            career_vs_pitcher(hitter_three, pitcher_id)
        ),
        "career_vs_hitter_four": calculate_stats(
            career_vs_pitcher(hitter_four, pitcher_id)
        ),
        "career_vs_hitter_five": calculate_stats(
            career_vs_pitcher(hitter_five, pitcher_id)
        ),
        "career_vs_hitter_six": calculate_stats(
            career_vs_pitcher(hitter_six, pitcher_id)
        ),
        "career_vs_hitter_seven": calculate_stats(
            career_vs_pitcher(hitter_seven, pitcher_id)
        ),
        "career_vs_hitter_eight": calculate_stats(
            career_vs_pitcher(hitter_eight, pitcher_id)
        ),
        "career_vs_hitter_nine": calculate_stats(
            career_vs_pitcher(hitter_nine, pitcher_id)
        ),
    }

<<<<<<< HEAD
=======

>>>>>>> pitcher_stats
@router.get("/hitter/{batter_id}")
def get_batter_stats(
    batter_id: int,
    pitcher_id: int,
    hand: str,
    pitch_type: str,
<<<<<<< HEAD
    ballpark: str
=======
    ballpark: str,
>>>>>>> pitcher_stats
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
<<<<<<< HEAD


=======
>>>>>>> pitcher_stats
