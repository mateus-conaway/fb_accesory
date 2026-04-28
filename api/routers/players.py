from fastapi import APIRouter, HTTPException
from api.database import get_db

router = APIRouter()

@router.get("/search")
def search_players(name: str):
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

@router.get("/{player_id}")
def get_player(player_id: int):
    """GET /players/592450"""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM players WHERE player_id = ?", (player_id,)
    ).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return dict(row)