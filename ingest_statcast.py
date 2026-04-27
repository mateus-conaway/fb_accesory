import sqlite3
import time
import pandas as pd
from datetime import date, datetime
from pybaseball import statcast, playerid_lookup, playerid_reverse_lookup, statcast_batter, statcast_pitcher
from pathlib import Path

DB_PATH = Path(__file__).parent / "fantasy_baseball.db"

PITCH_COLS = [
    "game_pk",
    "game_date",
    "game_year",
    "batter",
    "pitcher",
    "home_team",
    "away_team",
    "stand",
    "p_throws",
    "pitch_type",
    "pitch_name",
    "events",
    "description",
    "type",
    "release_speed",
    "launch_speed",
    "at_bat_number",
    "pitch_number",
    "inning",
    "inning_topbot",
    "outs_when_up",
    "bat_score",
    "fld_score",
    "post_bat_score",
    "post_fld_score"
]

GAME_COLS = [
    "game_pk",
    "game_date",
    "batter",
    "pitcher",
    "home_team",
    "away_team"
]

PITCH_TYPES = {
    'FF': 1,
    'FC': 2,
    'FS': 3,
    'SI': 4,
    'ST': 5,
    'EP': 6,
    'SL': 7,
    'KC': 8,
    'CU': 9,
    'CH': 10,
    'SV': 11,
    'FA': 12
}

def get_db_connection (conn: sqlite3.Connection) -> sqlite3.Connection:
    return sqlite3.connect(conn)

def check_schema (conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    try:
        test = cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='player'").fetchone()
    except Exception as e:
        raise RuntimeError(f"Error: {e}")

def clean_player_name(player: list) -> list:
    player = player[0].split(",")

    player[0] = player[0].lower() # last name
    player[1] = player[1].lower().strip() # first name

    return player

def series_to_sql(player_info: pd.DataFrame) -> list:
    player_id = int(player_info["key_mlbam"].iat[0])
    first_name = str(player_info["name_first"].iat[0])
    last_name = str(player_info["name_last"].iat[0])
    mlb_played_first = str(player_info["mlb_played_first"].iat[0])
    mlb_played_last = str(player_info["mlb_played_last"].iat[0])

    return [player_id, last_name, first_name, mlb_played_first, mlb_played_last]

def player_sql(conn: sqlite3.Connection, player_info: list) -> None:
    try:
        conn.execute("INSERT OR REPLACE INTO players (player_id, name_last, name_first, mlb_played_first, mlb_played_last) VALUES (?,?,?,?,?)", (batter_vals[0], batter_vals[1], batter_vals[2], batter_vals[3], batter_vals[4]))
        print("success!")
    except Exception as e:
        print(f"Error: {e}")

def execute_player_sql(conn: sqlite3.Connection, player_info: list, position: str) -> None:
    try:
        conn.execute("INSERT OR REPLACE INTO players (player_id, name_last, name_first, name_full, position, mlb_played_first, mlb_played_last) VALUES (?,?,?,?,?,?,?)", (player_info[0], player_info[1], player_info[2], f"{player_info[2]} {player_info[1]}", position, player_info[3], player_info[4]))
        print("success!")
    except Exception as e:
        print(f"Error: {e}")

def upsert_players(conn: sqlite3.Connection, date_string: str) -> None:
    try:
        date_df = statcast(start_dt=date_string)
        batter_ids = list(set(date_df.get("batter").dropna()))
        pitcher_ids = list(set(date_df.get("pitcher").dropna()))
        batter_ids = [int(batter) for batter in batter_ids]
        pitcher_ids = [int(pitcher) for pitcher in pitcher_ids]
    except Exception as e:
        print(f"Error: {e}.")

    for i in range(len(batter_ids)):
        batter_df = statcast_batter(start_dt=date_string, end_dt=date_string, player_id=batter_ids[i])
        batter_info = playerid_reverse_lookup([batter_ids[i]], key_type="mlbam")
        batter_vals = series_to_sql(batter_info)
        execute_player_sql(conn, batter_vals, "Hitter")

    for i in range(len(pitcher_ids)):
        pitcher_df = statcast_pitcher(start_dt=date_string, end_dt=date_string, player_id=pitcher_ids[i])
        pitcher_info = playerid_reverse_lookup([pitcher_ids[i]], key_type="mlbam")
        pitcher_vals = series_to_sql(pitcher_info)
        execute_player_sql(conn, pitcher_vals, "Pitcher")

    conn.commit()

def ingest_statcast(date_string: str) -> None:
    conn = get_db_connection(DB_PATH)
    df = statcast(start_dt = date_string)

        # INSERT PITCHES
    available_cols = [col for col in PITCH_COLS]
    pitches_df = df[available_cols]
    pitches_df = pitches_df.where(~pd.isnull(pitches_df), 0)

    launch_speeds = pd.Series(pitches_df["launch_speed"]).tolist()

    for i in range(len(pitches_df)):
        if launch_speeds[i] != 0:
            launch_speeds[i] = float(launch_speeds[i])
        else:
            launch_speeds[i] = None

        game_pk = int(pitches_df["game_pk"].iat[i])
        game_date = str(pitches_df["game_date"].iat[i])
        game_year = int(pitches_df["game_year"].iat[i])
        batter = int(pitches_df["batter"].iat[i])
        pitcher = int(pitches_df["pitcher"].iat[i])
        home_team = str(pitches_df["home_team"].iat[i])
        away_team = str(pitches_df["away_team"].iat[i])
        stand = str(pitches_df["stand"].iat[i])
        p_throws = str(pitches_df["p_throws"].iat[i])
        pitch_type = PITCH_TYPES.get(str(pitches_df["pitch_type"].iat[i]))
        events = str(pitches_df["events"].iat[i])
        description = str(pitches_df["description"].iat[i])
        result_type = str(pitches_df["type"].iat[i])
        release_speed = float(pitches_df["release_speed"].iat[i])
        at_bat_number = int(pitches_df["at_bat_number"].iat[i])
        pitch_number = int(pitches_df["pitch_number"].iat[i])
        inning = int(pitches_df["inning"].iat[i])
        inning_topbot = str(pitches_df["inning_topbot"].iat[i])
        outs_when_up = int(pitches_df["outs_when_up"].iat[i])
        bat_score = int(pitches_df["bat_score"].iat[i])
        fld_score = int(pitches_df["fld_score"].iat[i])
        post_bat_score = int(pitches_df["post_bat_score"].iat[i])
        post_fld_score = int(pitches_df["post_fld_score"].iat[i])

        # skip if pitch clock violation occurs and does not result in strikeout or walk
        if pitch_type == 0 and events == 0:
            continue
        elif (description == "automatic_ball" or description == "automatic_strike") and (events == 0):
            continue
        else:
            try:
                conn.execute("INSERT OR REPLACE INTO pitches (game_pk, game_date, game_year, batter, pitcher, home_team, away_team, stand, p_throws, pitch_type, events, description, result_type, release_speed, launch_speed, at_bat_number, pitch_number, inning, inning_topbot, outs_when_up, bat_score, fld_score, post_bat_score, post_fld_score) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (game_pk, game_date, game_year, batter, pitcher, home_team, away_team, stand, p_throws, pitch_type, events, description, result_type, release_speed, launch_speeds[i], at_bat_number, pitch_number, inning, inning_topbot, outs_when_up, bat_score, fld_score, post_bat_score, post_fld_score))
            except Exception as e:
                print(f"Error: {e}")

    # INGEST GAMES AND PLAYERS
    for col in GAME_COLS:
        if col in df.columns:
            df = df[df[col].notna()]

    games_df = df[["game_pk", "game_date", "game_year", "home_team", "away_team"]].drop_duplicates()
    games_df.to_csv("games_df.csv", index=True)

    players_list = upsert_players(conn, date_string)

    for i in range(len(games_df)):
        try:
            conn.execute("INSERT OR REPLACE INTO games (game_pk, game_date, game_year, home_team, away_team) VALUES (?,?,?,?,?)", (int(games_df["game_pk"].iat[i]), str(games_df["game_date"].iat[i]), int(games_df["game_year"].iat[i]), str(games_df["home_team"].iat[i]), str(games_df["away_team"].iat[i])))
        except Exception as e:
            print(f"Error: {e}")
# combined probabilities for hitters vs a teams pitching staff
# machine learning 
# vpn / vm's digital ocean
# duck db (db geared for analytical processes), persistant db
# multiple processes/ job queues for doing multiple days at once (parallelism/concurrency)
    conn.commit()
    conn.close()
    print("Data ingested.")
    print("------------------------------------------------------------")


def main():
    conn = get_db_connection(DB_PATH)
    with open(Path(__file__).parent / "schema.sql") as f:
        conn.executescript(f.read())
    conn.close()
    
    # for i in range(0, 15):
    #     if i < 9:
    #         date_string = f"2025-06-0{i+1}"
    #     else:
    #         date_string = f"2025-06-{i+1}"
    #     ingest_statcast(conn, date_string) 
    ingest_statcast("2025-10-13")
    
    # conn.close()

if __name__ == "__main__":
     main()
