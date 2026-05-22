from api.database import get_db

SINGLE_EVENT = {"single"}
DOUBLE_EVENT = {"double"}
TRIPLE_EVENT = {"triple"}
HOME_RUN_EVENT = {"home_run"}
BB_EVENTS = {"walk", "intent_walk"}
HBP_EVENT = {"hit_by_pitch"}
K_EVENTS = {"strikeout", "strikeout_double_play"}
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


def calculate_stats(plate_apps: list) -> list:
    pa = 0
    ab = 0
    bb = 0
    hbp = 0
    k = 0
    single = 0
    double = 0
    triples = 0
    home_run = 0
    rbi = 0
    for plate_app in plate_apps:
        pa += 1 if plate_app["events"] in PA_EVENTS else 0
        ab += 1 if plate_app["events"] in AB_EVENTS else 0
        bb += 1 if plate_app["events"] in BB_EVENTS else 0
        hbp += 1 if plate_app["events"] in HBP_EVENT else 0
        k += 1 if plate_app["events"] in K_EVENTS else 0
        single += 1 if plate_app["events"] in SINGLE_EVENT else 0
        double += 1 if plate_app["events"] in DOUBLE_EVENT else 0
        triples += 1 if plate_app["events"] in TRIPLE_EVENT else 0
        home_run += 1 if plate_app["events"] in HOME_RUN_EVENT else 0
        if plate_app["events"] == "field_error" and plate_app["outs_when_up"] == 2:
            continue
        rbi += plate_app["post_bat_score"] - plate_app["bat_score"]

    hits = single + double + triples + home_run
    avg = hits / ab if ab else 0.0
    obp = (hits + bb + hbp) / pa if pa else 0.0
    slg = (
        (single * 1) + (double * 2) + (triples * 3) + (home_run * 4)
    ) / ab if ab else 0.0
    ops = obp + slg

    return [ab, pa, hits, bb, hbp, k, single, double, triples, home_run, rbi, avg, obp, slg, ops]


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

def season_stats(batter_id: int):
    conn = get_db()
    year = get_year()
    if year is None:
        return []
    rows = conn.execute(
        """
        SELECT * FROM pitches WHERE events != 0 AND events != 'truncated_pa'
        AND batter = ? AND game_year = ?;
        """,
        (batter_id, year),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def career_vs_pitcher(batter_id: int, pitcher_id: int):
    conn = get_db()
    rows = conn.execute(
        """
        SELECT * FROM pitches WHERE
        AND batter = ? AND pitcher = ?;
        """,
        (batter_id, pitcher_id),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def season_vs_pitcher(batter_id: int, pitcher_id: int):
    year = get_year()
    if year is None:
        return []
    conn = get_db()
    rows = conn.execute(
        """
        SELECT * FROM pitches WHERE events != 0 AND events != 'truncated_pa'
        AND batter = ? AND pitcher = ? AND game_year = ?;
        """,
        (batter_id, pitcher_id, year),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def career_vs_hand(batter_id: int, hand: str):
    conn = get_db()
    rows = conn.execute(
        """
        SELECT * FROM pitches WHERE events != 0 AND events != 'truncated_pa'
        AND batter = ? AND p_throws = ?;
        """,
        (batter_id, hand),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def season_vs_hand(batter_id: int, hand: str):
    year = get_year()
    if year is None:
        return []
    conn = get_db()
    rows = conn.execute(
        """
        SELECT * FROM pitches WHERE events != 0 AND events != 'truncated_pa'
        AND batter = ? AND p_throws = ? AND game_year = ?;
        """,
        (batter_id, hand, year),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def season_vs_offspeed(batter_id: int, pitch_type: str):
    year = get_year()
    if year is None:
        return []
    conn = get_db()
    rows = conn.execute(
        """
        SELECT * FROM pitches WHERE events != 0 AND events != 'truncated_pa'
        AND batter = ? AND pitch_type = ? AND game_year = ?;
        """,
        (batter_id, pitch_type, year),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def career_at_ballpark(batter_id: int, ballpark: str):
    conn = get_db()
    rows = conn.execute(
        """
        SELECT * FROM pitches WHERE events != 0 AND events != 'truncated_pa'
        AND batter = ? AND home_team = ?;
        """,
        (batter_id, ballpark),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def season_at_ballpark(batter_id: int, ballpark: str):
    year = get_year()
    if year is None:
        return []
    conn = get_db()
    rows = conn.execute(
        """
        SELECT * FROM pitches WHERE events != 0 AND events != 'truncated_pa'
        AND batter = ? AND home_team = ? AND game_year = ?;
        """,
        (batter_id, ballpark, year),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]
