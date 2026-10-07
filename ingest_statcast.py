import argparse
import sqlite3
import time
import pandas as pd
from datetime import date, datetime, timedelta
import statsapi
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
    "zone",
    "release_spin_rate",
    "pfx_x",
    "pfx_z",
    "hit_distance_sc",
    "launch_angle",
    "balls",
    "strikes",
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

# def player_sql(conn: sqlite3.Connection, player_info: list) -> None:
#     try:
#         conn.execute("INSERT OR REPLACE INTO players (player_id, name_last, name_first, mlb_played_first, mlb_played_last) VALUES (?,?,?,?,?)", (batter_vals[0], batter_vals[1], batter_vals[2], batter_vals[3], batter_vals[4]))
#         print("success!")
#     except Exception as e:
#         print(f"Error: {e}")

def execute_player_sql(conn: sqlite3.Connection, player_info: list, position: str) -> None:
    try:
        conn.execute("INSERT OR IGNORE INTO players (player_id, name_last, name_first, name_full, position, mlb_played_first, mlb_played_last) VALUES (?,?,?,?,?,?,?)", (player_info[0], player_info[1], player_info[2], f"{player_info[2]} {player_info[1]}", position, player_info[3], player_info[4]))
    except Exception as e:
        print(f"Error: {e}")

def upsert_players(conn: sqlite3.Connection, date_string: str) -> None:
    try:
        date_df = statcast(start_dt=date_string)
        batter_ids = list(set(date_df.get("batter").dropna()))
        pitcher_ids = list(set(date_df.get("pitcher").dropna()))
        batter_ids = [int(batter) for batter in batter_ids]
        pitcher_ids = [int(pitcher) for pitcher in pitcher_ids]
        game_pks = list(set(date_df.get("game_pk").dropna()))
        game_pks = [int(game_pk) for game_pk in game_pks]
        
    except Exception as e:
        print(f"Error: {e}.")

    for batter_id in batter_ids:
        # batter_df = statcast_batter(start_dt=date_string, end_dt=date_string, player_id=batter_id)
        batter_info = playerid_reverse_lookup([batter_id], key_type="mlbam")
        if batter_info.empty:
            continue
        else:
            batter_vals = series_to_sql(batter_info)
            execute_player_sql(conn, batter_vals, "Batter")

    for pitcher_id in pitcher_ids:
        # pitcher_df = statcast_pitcher(start_dt=date_string, end_dt=date_string, player_id=pitcher_id)
        pitcher_info = playerid_reverse_lookup([pitcher_id], key_type="mlbam")
        if pitcher_info.empty:
            continue
        else:
            pitcher_vals = series_to_sql(pitcher_info)
            execute_player_sql(conn, pitcher_vals, "Pitcher")
    
    conn.commit()

def rbi_run_lookup_for_games(game_pks: list[int]) -> list[dict[int, dict[int, int]], dict[int, [int, int, int, int]]]:
    lookup_rbi: dict[int, dict[int, int]] = {}
    lookup_runner: dict[int, [int, int, int, int]] = {}
    for game_pk in game_pks:
        try:
            plays = statsapi.get("game", {"gamePk": game_pk})["liveData"]["plays"]["allPlays"]
        except Exception as e:
            print(f"RBI feed failed for {game_pk}: {e}")
            lookup_rbi[game_pk] = {}
            lookup_runner[game_pk] = {}
            continue

        by_at_bat: dict[int, int] = {}
        by_runner: list[int, int, int, int] = []
        for play in plays:
            # Statcast at_bat_number is 1-based; the feed index is 0-based.

            at_bat_number = play["about"]["atBatIndex"] + 1
            if play["result"].get("rbi") == 0:
                continue
            by_at_bat[at_bat_number] = play["result"].get("rbi")
            for runner in play["runners"]:
                if runner["details"]["responsiblePitcher"] is None or runner["details"]["isScoringEvent"] is False:
                    continue
                # print(runner)
                # print("--------------------------------")
                earned = 1 if runner["details"]["earned"] else 0
                # by_runner[runner["details"]["runner"]["id"]] = [at_bat_number, runner["details"]["responsiblePitcher"]["id"], earned]
                by_runner.append([at_bat_number, runner["details"]["runner"]["id"], earned, runner["details"]["responsiblePitcher"]["id"]])
        

        lookup_rbi[game_pk] = by_at_bat
        lookup_runner[game_pk] = by_runner
        print(lookup_runner)
    return [lookup_rbi, lookup_runner]

def ingest_statcast(date_string: str) -> None:
    conn = get_db_connection(DB_PATH)
    df = statcast(start_dt = date_string)

        # INSERT PITCHES
    available_cols = [col for col in PITCH_COLS]
    pitches_df = df[available_cols]
    pitches_df = pitches_df.where(~pd.isnull(pitches_df), 0)

    launch_speeds = pd.Series(pitches_df["launch_speed"]).tolist()
    game_pks = [int(pk) for pk in pitches_df["game_pk"].dropna().unique()]

    if len(game_pks) == 0:
        print(f"No games found for {date_string}")
        return

    rbi_lookup = rbi_run_lookup_for_games(game_pks)[0]
    runner_lookup = rbi_run_lookup_for_games(game_pks)[1]

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
        zone = int(pitches_df["zone"].iat[i])
        release_speed = float(pitches_df["release_speed"].iat[i])
        release_spin = float(pitches_df["release_spin_rate"].iat[i])
        pfx_x = float(pitches_df["pfx_x"].iat[i]) * 12 # convert inches to feet
        pfx_z = float(pitches_df["pfx_z"].iat[i]) * 12 # convert inches to feet
        hit_distance = float(pitches_df["hit_distance_sc"].iat[i])
        launch_angle = float(pitches_df["launch_angle"].iat[i])
        balls = int(pitches_df["balls"].iat[i])
        strikes = int(pitches_df["strikes"].iat[i])
        at_bat_number = int(pitches_df["at_bat_number"].iat[i])
        pitch_number = int(pitches_df["pitch_number"].iat[i])
        inning = int(pitches_df["inning"].iat[i])
        inning_topbot = str(pitches_df["inning_topbot"].iat[i])
        outs_when_up = int(pitches_df["outs_when_up"].iat[i])
        bat_score = int(pitches_df["bat_score"].iat[i])
        fld_score = int(pitches_df["fld_score"].iat[i])
        post_bat_score = int(pitches_df["post_bat_score"].iat[i])
        post_fld_score = int(pitches_df["post_fld_score"].iat[i])
        # rbi = rbi_lookup.get(game_pk).get(at_bat_number, 0)

        # skip if pitch clock violation occurs and does not result in strikeout or walk
        if pitch_type == 0 and events == 0:
            continue
        elif (description == "automatic_ball" or description == "automatic_strike") and (events == 0):
            continue
        else:
            try:
                conn.execute("INSERT OR REPLACE INTO pitches (game_pk, game_date, game_year, batter, pitcher, home_team, away_team, stand, p_throws, pitch_type, events, description, result_type, zone, release_spin, pfx_x, pfx_z, hit_distance, launch_angle, balls, strikes, release_speed, launch_speed, at_bat_number, pitch_number, inning, inning_topbot, outs_when_up, bat_score, fld_score, post_bat_score, post_fld_score) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (game_pk, game_date, game_year, batter, pitcher, home_team, away_team, stand, p_throws, pitch_type, events, description, result_type, zone, release_spin, pfx_x, pfx_z, hit_distance, launch_angle, balls, strikes, release_speed, launch_speeds[i], at_bat_number, pitch_number, inning, inning_topbot, outs_when_up, bat_score, fld_score, post_bat_score, post_fld_score))
                # conn.execute("INSERT OR REPLACE INTO rbi_events (game_pk, at_bat_number, rbi) VALUES (?,?,?)", (game_pk, at_bat_number, rbi_lookup.get(game_pk).get(at_bat_number, 0)))
                # conn.execute("INSERT OR REPLACE INTO run_events (game_pk, at_bat_number, responsible_pitcher_id, earned, runner_id) VALUES (?,?,?,?,?)", (game_pk, at_bat_number, pitcher, earned, runner_id))
            except Exception as e:
                print(f"Error: {e}")

    #INGEST RBI AND RUN EVENTS

    for at_bat_number in rbi_lookup.get(game_pk).keys():
        rbi = rbi_lookup.get(game_pk).get(at_bat_number)
        conn.execute("INSERT OR REPLACE INTO rbi_events (game_pk, at_bat_number, rbi) VALUES (?,?,?)", (game_pk, at_bat_number, rbi))
    for runner in runner_lookup.get(game_pk):
        runner_id = runner[1]
        earned = runner[2]
        responsible_pitcher_id = runner[3]
        conn.execute("INSERT OR REPLACE INTO run_events (game_pk, at_bat_number, responsible_pitcher_id, earned, runner_id) VALUES (?,?,?,?,?)", (game_pk, at_bat_number, responsible_pitcher_id, earned, runner_id))

    # INGEST GAMES AND PLAYERS
    for col in GAME_COLS:
        if col in df.columns:
            df = df[df[col].notna()]

    games_df = df[["game_pk", "game_date", "game_year", "home_team", "away_team"]].drop_duplicates()

    upsert_players(conn, date_string)
    assign_teams(conn, games_df)

    for i in range(len(games_df)):
        try:
            conn.execute("INSERT OR REPLACE INTO games (game_pk, game_date, game_year, home_team, away_team) VALUES (?,?,?,?,?)", (int(games_df["game_pk"].iat[i]), str(games_df["game_date"].iat[i]), int(games_df["game_year"].iat[i]), str(games_df["home_team"].iat[i]), str(games_df["away_team"].iat[i])))
        except Exception as e:
            print(f"Error: {e}")

# combined probabilities for Batters vs a teams pitching staff
# machine learning 
# vpn / vm's digital ocean
# duck db (db geared for analytical processes), persistant db
# multiple processes/ job queues for doing multiple days at once (parallelism/concurrency)
    conn.commit()
    conn.close()
    print("Data ingested.")
    print("------------------------------------------------------------")
    time.sleep(5)

def assign_teams(conn: sqlite3.Connection, games_list: pd.DataFrame) -> None:
    topbot = ['Top', 'Bot']
    for game in games_list.itertuples(index=False):
        game_pk = int(game.game_pk)
        away_batters = conn.execute(
            """
                SELECT DISTINCT pitches.batter, pitches.away_team from pitches
                JOIN players on pitches.batter = players.player_id
                WHERE pitches.game_pk = ? and pitches.inning_topbot = ?
            """, (game_pk, topbot[0])
        ).fetchall()
        home_batters = conn.execute(
            """
                SELECT DISTINCT pitches.batter, pitches.home_team from pitches
                JOIN players on pitches.batter = players.player_id
                WHERE pitches.game_pk = ? and pitches.inning_topbot = ?
            """, (game_pk, topbot[1])
        ).fetchall()
        away_pitchers = conn.execute(
            """
                SELECT DISTINCT pitches.pitcher, pitches.away_team from pitches
                JOIN players on pitches.pitcher = players.player_id
                WHERE pitches.game_pk = ? and pitches.inning_topbot = ?
            """, (game_pk, topbot[1])
        ).fetchall()
        home_pitchers = conn.execute(
            """
                SELECT DISTINCT pitches.pitcher, pitches.home_team from pitches
                JOIN players on pitches.pitcher = players.player_id
                WHERE pitches.game_pk = ? and pitches.inning_topbot = ?
            """, (game_pk, topbot[0])
        ).fetchall()

        players = away_batters + home_batters + away_pitchers + home_pitchers

        for player in players:
            player_id = int(player[0])
            team = str(player[1])
            conn.execute(
                """
                    UPDATE players
                    SET team_abbrev = ?
                    WHERE player_id = ?
                """, (team, player_id))

        
    



def parse_iso_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(
            f"invalid date '{value}'; expected YYYY-MM-DD"
        ) from exc


def main() -> None:

    # conn = get_db_connection(DB_PATH)
    # with open(Path(__file__).parent / "schema.sql", "r") as f:
    #     conn.executescript(f.read())
    # conn.close()
    

    parser = argparse.ArgumentParser(
        description=(
            "Ingest Statcast pitch data into fantasy_baseball.db "
            "for every date in an inclusive YYYY-MM-DD range."
        )
    )
    parser.add_argument(
        "start_date",
        type=parse_iso_date,
        help="First date to ingest (YYYY-MM-DD)",
    )
    parser.add_argument(
        "end_date",
        type=parse_iso_date,
        help="Last date to ingest (YYYY-MM-DD), inclusive",
    )
    args = parser.parse_args()

    if args.end_date < args.start_date:
        parser.error(
            f"end_date {args.end_date.isoformat()} precedes "
            f"start_date {args.start_date.isoformat()}"
        )

    current = args.start_date
    while current <= args.end_date:
        ingest_statcast(current.isoformat())
        current += timedelta(days=1)


if __name__ == "__main__":
    main()
