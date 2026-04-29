from pathlib import Path
import sqlite3
import pandas as pd
import numpy as np

DB_PATH = Path(__file__).parent / "fantasy_baseball.db"

# Events that count as AB (at-bat)
AB_EVENTS = {
    "single", "double", "triple", "home_run", "strikeout",
    "field_out", "force_out", "grounded_into_double_play", "double_play",
    "fielders_choice_out", "fielders_choice", "triple_play", "other_out",
    "sac_fly", "sac_bunt", "sac_fly_double_play", "strikeout_double_play",
    "catcher_interf", "field_error",
}

# Events for hits
H_EVENTS = {"single", "double", "triple", "home_run"}
DOUBLE_EVENTS = {"double"}
TRIPLE_EVENTS = {"triple"}
HR_EVENTS = {"home_run"}
BB_EVENTS = {"walk"}
HBP_EVENTS = {"hit_by_pitch"}
SO_EVENTS = {"strikeout", "strikeout_double_play"}

def get_pa_outcome(conn: sqlite3.Connection) -> pd.DataFrame:
    # Get last pitch for each at bat that results in an event
    query = """
        SELECT p.game_pk, p.game_date, p.game_year, p.batter, p.pitcher, p.stand, p.p_throws, p.pitch_number, p.pitch_type, p.events, p.result_type 
        FROM pitches p
        INNER JOIN (
            SELECT game_pk, batter, pitcher, at_bat_number, MAX(pitch_number) as max_pitch
            FROM pitches
        ) last ON p.game_pk = last.game_pk AND p.batter = last.batter AND p.pitcher = last.pitcher AND p.at_bat_number = last.at_bat_number AND p.pitch_number = last.max_pitch
        WHERE p.events IS NOT NULL AND p.events != ''; 
    """
    return pd.read_sql(query, conn)

def compute_splits