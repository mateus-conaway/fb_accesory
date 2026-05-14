from fastapi import APIRouter, HTTPException
from api.database import get_db

router = APIRouter()

@router.get("/batter_game_stats")
def get_batter_stats():
    """GET /players/search?name=judge"""
    conn = get_db()
    rows = conn.execute(
        """
        SELECT name_first, name_last, position
        FROM players
        WHERE name_full LIKE ?
        ORDER BY name_last
        LIMIT 20
        """,
        (f"%{name}%",) # trailing comma need to make tuple for sqlite execute
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]