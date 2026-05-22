
import sqlite3
from pathlib import Path

SINGLE_EVENT = {"single"}
DOUBLE_EVENT = {"double"}
TRIPLE_EVENT = {"triple"}
HOME_RUN_EVENT = {"home_run"}
BB_EVENTS = {"walk", "intent_walk"}
HBP_EVENT = {"hit_by_pitch"}
K_EVENTS = {"strikeout", "strikeout_double_play"}
SINGLE_OUT_EVENTS = {"fielders_choice_out", "strikeout", "force_out", "field_out"}
DOUBLE_OUT_EVENTS = {"strikeout_double_play", "grounded_into_double_play", "double_play"}
TRIPLE_OUT_EVENTS = {"grounded_into_triple_play", "triple_play"} 
AB_EVENTS = {
    "single",
    "double",
    "triple",
    "home_run",
    "fielders_choice",
    "fielders_choice_out",
    "strikeout",
    "strikeout_double_play",
    "force_out",
    "grounded_into_double_play",
    "grounded_into_triple_play",
    "double_play",
    "triple_play",
    "field_out",
}
PA_EVENTS = {
    "single",
    "double",
    "triple",
    "home_run",
    "fielders_choice",
    "fielders_choice_out",
    "walk",
    "hit_by_pitch",
    "strikeout",
    "strikeout_double_play",
    "force_out",
    "grounded_into_double_play",
    "grounded_into_triple_play",
    "sac_fly",
    "sac_fly_double_play",
    "double_play",
    "triple_play",
    "intent_walk",
    "field_out",
}


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(Path(__file__).parent.parent.parent / "fantasy_baseball.db")
    conn.row_factory = sqlite3.Row # access columns by name
    return conn

def calculate_innings_pitched(plate_apps: list) -> str:
    outs = 0
    for plate_app in plate_apps:
        outs += 1 if plate_app["events"] in SINGLE_OUT_EVENTS else 0
        outs += 2 if plate_app["events"] in DOUBLE_OUT_EVENTS else 0
        outs += 3 if plate_app["events"] in TRIPLE_OUT_EVENTS else 0
    
    remainder_innings = outs % 3
    full_innings = int((outs - remainder_innings) / 3)

    innings_str = f"{full_innings}.{remainder_innings} ({outs} outs)"
    return innings_str

def main():
    conn = get_db()
    rows = conn.execute(
        """
            select * from pitches where pitcher = 657277 and game_date = '2026-04-30';
        """
    )

    result = calculate_innings_pitched(rows)
    print(result)

if __name__ == "__main__":
    main()