import sqlite3
from pathlib import Path
import statsapi

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

def get_year() -> int | None:
    conn = get_db()
    row = conn.execute(
        """
        SELECT game_year FROM pitches
        ORDER BY game_date DESC
        LIMIT 1
        """
    ).fetchone()
    conn.close()
    return row["game_year"] if row else None

def calculate_outs(pitcher: int, game_date: str) -> str:
    conn = get_db()
    year = get_year()

    first_ab = conn.execute(
        """
        select game_pk, at_bat_number, events, inning, outs_when_up from pitches where pitcher = ? and game_date = ? and events != 0 and game_year = ?
        order by at_bat_number
        limit 1;
        """, (pitcher, game_date, year),
    ).fetchall()
    last_ab = conn.execute(
        """
        select game_pk, at_bat_number, events, inning, outs_when_up from pitches where pitcher = ? and game_date = ? and events != 0 and game_year = ?
        order by at_bat_number desc
        limit 1;
        """, (pitcher, game_date, year),
    ).fetchall()

    last_ab = [dict(row) for row in last_ab][0]
    first_ab = [dict(row) for row in first_ab][0]

    next_ab = conn.execute(
        """
        select game_pk, at_bat_number, events, inning, outs_when_up from pitches where at_bat_number = ? and game_date = ? and events != 0 and game_year = ?
        order by at_bat_number desc
        limit 1;
        """, (last_ab["at_bat_number"] + 1, game_date, year),
    ).fetchall()

    next_ab = [dict(row) for row in next_ab][0]

    inning = last_ab["inning"] - first_ab["inning"]
    outs = last_ab["outs_when_up"] - first_ab["outs_when_up"]

    outs += 1 if last_ab["events"] in SINGLE_OUT_EVENTS else 0
    outs += 2 if last_ab["events"] in DOUBLE_OUT_EVENTS else 0
    outs += 3 if last_ab["events"] in TRIPLE_OUT_EVENTS else 0

    if last_ab["outs_when_up"] != next_ab["outs_when_up"] and (last_ab["game_pk"] == next_ab["game_pk"]):
        if next_ab["outs_when_up"] == 0:
            outs += (3 - last_ab["outs_when_up"])
        else:
            outs += (next_ab["outs_when_up"] - last_ab["outs_when_up"])
    if outs == 3:
        inning += 1
        outs = 0
    if outs < 0:
        inning -= 1
        outs = 3 + outs

    total_outs = (inning * 3) + outs
    return total_outs

def calculate_innings_pitched(pitcher):
    conn = get_db()
    outs = 0
    rows = conn.execute(
        """
        select distinct game_date from pitches where pitcher = ?
        order by game_date
        """, (pitcher,)
    ).fetchall()
    conn.close()

    rows = [dict(row) for row in rows]        

    for row in rows: 
        outs += calculate_outs(pitcher, row["game_date"])
    return f"{int(outs/3)}.{(outs % 3)}"

def get_earned_runs(pitcher: int, game_pk: int) -> int:
    conn = get_db()
    inning_half = conn.execute(
        """
            select distinct inning_topbot from pitches where game_pk = ? and pitcher = ?
            limit 1;
        """, (game_pk, pitcher)
    ).fetchone()
    if inning_half is None:
        return None
    side = 'home' if inning_half['inning_topbot'] == 'Top' else 'away'

    er = statsapi.get("game", {"gamePk": game_pk})["liveData"]["boxscore"]["teams"][f"{side}"]['players'][f"ID{str(pitcher)}"]["stats"]["pitching"]["earnedRuns"]

    return er

def calculate_era(pitcher: int, game_pk: int) -> float:
    er = get_earned_runs(pitcher, game_pk)
    innings = calculate_innings_pitched(pitcher)
    return (er * 9)/ innings

def main():
    
    
    # result = calculate_outs(657277, '2026-03-25')
    # print(result)

    # result2 = calculate_innings_pitched(608331)
    # print(result2)
    print(get_earned_runs(657277, 823244))

if __name__ == "__main__":
    main()