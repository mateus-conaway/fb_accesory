import sqlite3
from pathlib import Path

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(Path(__file__).parent.parent / "fantasy_baseball.db")
    conn.row_factory = sqlite3.Row # access columns by name
    return conn