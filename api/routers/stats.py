from fastapi import APIRouter, HTTPException
from api.database import get_db
from api.services.stats_service import career_vs_pitcher, calculate_stats

router = APIRouter()

# get_batter_stats possible queries

@router.get("/{playerId}")
def get_batter_stats(playerId: int):
    """GET /stats/701398"""
    conn = get_db()
    return career_vs_pitcher(701398, 685299)
    # rows = conn.execute(
    #     """
    #     SELECT * from pitches where batter = ? and events != 0 and events != 'truncated_pa';
    #     """, (playerId,)
    # ).fetchall()
    # conn.close()

    # plate_apps = [dict(row) for row in rows]
    
    # single = 0
    # double = 0
    # triples= 0
    # home_run = 0
    # for plate_app in plate_apps:
    #     if plate_app["events"] == "single":
    #         single += 1
    #     elif plate_app["events"] == "double":
    #         double += 1
    #     elif plate_app["events"] == "triple":
    #         triple += 1
    #     elif plate_app["events"] == "home_run":
    #         home_run += 1
    #     else:
    #         continue
    # return [single, double, triple, home_run]




    #     SELECT name_first, name_last, position
    #     FROM players
    #     WHERE name_full LIKE ?
    #     ORDER BY name_last
    #     LIMIT 20
    #     """,
    #     (f"%{name}%",) # trailing comma need to make tuple for sqlite execute
    # ).fetchall()
    # conn.close()
    # return [dict(row) for row in rows]

