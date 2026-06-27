import logging
from datetime import date

import statsapi

from api.database import get_db

logger = logging.getLogger(__name__)

_schedule_games: list[dict] = []
_schedule_date: date | None = None

# statsapi schedule names that do not match ballparks.team_name exactly
_NAME_ALIASES: dict[str, str] = {
    "athletics": "Athletics",
    "oakland athletics": "Athletics",
}


def _load_team_name_to_abbrev() -> dict[str, str]:
    conn = get_db()
    rows = conn.execute(
        "SELECT team_name, team_abbrev FROM ballparks"
    ).fetchall()
    conn.close()
    mapping: dict[str, str] = {}
    for row in rows:
        mapping[row["team_name"].lower()] = row["team_abbrev"]
    return mapping


def team_name_to_abbrev(name: str, mapping: dict[str, str]) -> str | None:
    if not name:
        return None
    key = name.strip().lower()
    alias = _NAME_ALIASES.get(key)
    if alias:
        key = alias.lower()
    abbrev = mapping.get(key)
    if abbrev:
        return abbrev
    # partial match (e.g. shortened schedule label)
    for team_name, team_abbrev in mapping.items():
        if key in team_name or team_name in key:
            return team_abbrev
    return None


def fetch_schedule(for_date: date) -> list[dict]:
    date_str = for_date.strftime("%m/%d/%Y")
    raw = statsapi.schedule(start_date=date_str, end_date=date_str)
    mapping = _load_team_name_to_abbrev()

    games: list[dict] = []
    for game in raw:
        home_name = game.get("home_name") or ""
        away_name = game.get("away_name") or ""
        home_abbrev = team_name_to_abbrev(home_name, mapping)
        away_abbrev = team_name_to_abbrev(away_name, mapping)
        games.append(
            {
                "game_pk": int(game["game_id"]),
                "home_name": home_name,
                "away_name": away_name,
                "home_abbrev": home_abbrev,
                "away_abbrev": away_abbrev,
                "home_probable_pitcher": game.get("home_probable_pitcher") or None,
                "away_probable_pitcher": game.get("away_probable_pitcher") or None,
            }
        )
    return games


def refresh_schedule(for_date: date | None = None) -> None:
    global _schedule_games, _schedule_date
    target = for_date or date.today()
    try:
        _schedule_games = fetch_schedule(target)
        _schedule_date = target
        logger.info("Loaded %s games for %s", len(_schedule_games), target.isoformat())
    except Exception:
        logger.exception("Failed to load MLB schedule for %s", target.isoformat())
        _schedule_games = []
        _schedule_date = target


def get_cached_schedule() -> tuple[date | None, list[dict]]:
    return _schedule_date, list(_schedule_games)


_ABBREV_ALIASES: dict[str, set[str]] = {
    "OAK": {"OAK", "ATH"},
    "ATH": {"OAK", "ATH"},
}


def _abbrevs_match(player_abbrev: str, game_abbrev: str | None) -> bool:
    if not game_abbrev:
        return False
    if player_abbrev == game_abbrev:
        return True
    aliases = _ABBREV_ALIASES.get(player_abbrev, {player_abbrev})
    return game_abbrev in aliases


def find_game_for_team(games: list[dict], team_abbrev: str) -> dict | None:
    for game in games:
        if _abbrevs_match(team_abbrev, game.get("home_abbrev")):
            return game
        if _abbrevs_match(team_abbrev, game.get("away_abbrev")):
            return game
    return None


def lineup_side_for_pitcher(team_abbrev: str, game: dict) -> str:
    """Opposing lineup side: away batters if pitcher is on home team."""
    if _abbrevs_match(team_abbrev, game.get("home_abbrev")):
        return "away"
    return "home"
