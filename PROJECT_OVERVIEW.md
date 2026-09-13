# Fantasy Scout Report — Project Overview

> A catch-up document. Read this top to bottom to get back up to speed on what this project is, how it is built, how data flows into the database, and how the React frontend talks to the Python backend.

---

## 1. What This Project Is

**Fantasy Scout Report** is a fantasy baseball scouting tool. The purpose is to give a fantasy baseball manager the *matchup-specific* splits that normal stat sites bury or don't show at all, so they can make better start/sit and waiver decisions for a given day's games.

Instead of just showing "Player X is hitting .270 this season," the app answers questions like:

- How has this hitter performed **against this specific pitcher**, career and this season?
- How does this hitter perform **against right-handed vs left-handed pitching**?
- How does this hitter perform **against offspeed pitches**?
- How does this hitter perform **at this specific ballpark**?
- For a starting pitcher, how has he performed **against each of the nine hitters in tonight's opposing lineup**?

The app pulls raw pitch-by-pitch Statcast data into a local SQLite database, computes these splits on demand, and displays two players side by side so you can compare them.

**Core interaction model:** search for a player → pick a slot (1 or 2) → press **GO** → the app fetches that player's stat lines and renders them in the slot. Players you care about can be bookmarked into a "My Players" sidebar.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Data source | [`pybaseball`](https://github.com/jldbc/pybaseball) (Baseball Savant / Statcast), [`MLB-StatsAPI`](https://github.com/toddrob99/MLB-StatsAPI) |
| Database | SQLite (`fantasy_baseball.db`) |
| Backend | Python + FastAPI (served by uvicorn on port **8000**) |
| Frontend | React 19 + TypeScript, built with Vite (dev server on port **5173**) |
| Styling | Tailwind CSS 3 (custom dark theme) |

### Running it locally

Two servers must run at the same time, in two terminals.

**Backend** — from the repo root (`fb_accesory/`):

```powershell
uvicorn api.main:app --reload
```

Backend lives at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs` (this is how endpoints were tested during development).

**Frontend** — from the `ui/` folder:

```powershell
cd ui
npm run dev
```

Frontend lives at `http://localhost:5173`.

**Data ingestion** is a separate, manual, offline step (not part of running the app):

```powershell
python ingest_statcast.py
```

---

## 3. Project Directory Tour

```
fb_accesory/
├── ingest_statcast.py        <- the data pipeline (Statcast -> SQLite)
├── update_splits.py          <- abandoned WIP
├── schema.sql                <- full database DDL + seed data
├── fantasy_baseball.db       <- the SQLite database itself
├── api/                      <- FastAPI backend
│   ├── main.py
│   ├── database.py
│   ├── routers/
│   └── services/
└── ui/                       <- React + TypeScript frontend
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api.ts
        ├── index.css
        └── components/
```

*(JSON, CSV, config, `.gitignore`, and image files are omitted per request. `node_modules/`, `__pycache__/`, and `ui/dist/` are build/vendor artifacts and are ignored here too.)*

### Root-level Python files

| File | What it does |
|---|---|
| **`ingest_statcast.py`** | The heart of the data layer. Downloads a day of Statcast pitch data, cleans it, and writes rows into the `players`, `games`, and `pitches` tables. Also assigns each player a team abbreviation. Fully detailed in §4. |
| **`update_splits.py`** | An abandoned attempt to populate the pre-aggregate split tables from `pitches`. Roughly 30 lines, contains an invalid SQL statement (a stray comma before `FROM`), no `main()`, and writes nothing. Safe to ignore or delete. |
| **`schema.sql`** | The complete database definition: drops and recreates the core tables, defines the pre-aggregate tables and 28 indexes, and seeds the 30-row `ballparks` table and 13-row `pitch_type_class` table. Run manually (the call is currently commented out in `ingest_statcast.main()`). |

### `api/` — the FastAPI backend

**`api/main.py`** — Application entry point. Three responsibilities:

1. Creates the `FastAPI` app with a **lifespan hook** that calls `refresh_schedule(date.today())` on startup, so today's MLB schedule is cached in memory before the first request arrives.
2. Registers **CORS middleware** allowing origin `http://localhost:5173`, methods `GET` and `POST`, all headers, credentials enabled.
3. Mounts three routers: `players.router` at `/players`, `schedule.router` at `/schedule`, `stats.router` at `/stats`.

**`api/database.py`** — A single helper, `get_db()`, that opens a `sqlite3` connection to `fantasy_baseball.db` and sets `conn.row_factory = sqlite3.Row` so query results can be accessed by column name. No pooling; every caller opens and closes its own connection.

#### `api/routers/` — HTTP endpoint definitions

| File | Endpoints |
|---|---|
| **`players.py`** | `GET /players/search?name=` — case-insensitive `LIKE` search on `name_full`, returns up to 20 players.<br>`GET /players/{player_id}` — full player row, 404 if not found. |
| **`schedule.py`** | `GET /schedule` — returns the in-memory cached schedule `{date, games}`.<br>`POST /schedule/refresh` — re-fetches today's schedule from MLB StatsAPI and returns it. |
| **`stats.py`** | `GET /stats/lineup?game_pk=&side=` — the nine starters for one side of a game; returns **422** if fewer than 9 starters are posted yet.<br>`GET /stats/hitter/{batter_id}?pitcher_id=&hand=&pitch_type=&ballpark=` — eight hitter stat lines.<br>`GET /stats/pitcher/{pitcher_id}?hitter_one=…&hitter_nine=&game_pk=` — the pitcher's ERA plus nine career stat lines, one per opposing hitter. |
| **`games.py`** | Empty placeholder. Not mounted in `main.py`. |

#### `api/services/` — business logic (SQL and external API calls)

| File | What it does |
|---|---|
| **`batter_stats_service.py`** | The active hitter-stats module. Defines the event-name sets (`AB_EVENTS`, `PA_EVENTS`, `BB_EVENTS`, `K_EVENTS`, etc.) used to classify plate-appearance outcomes, the `calculate_stats()` aggregator, and eight query functions: `season_stats`, `career_vs_pitcher`, `season_vs_pitcher`, `career_vs_hand`, `season_vs_hand`, `season_vs_offspeed`, `career_at_ballpark`, `season_at_ballpark`. Also `get_year()`, which determines "the current season" by reading the most recent `game_year` in `pitches`. |
| **`pitcher_stats_service.py`** | Pitcher-side logic. Contains the innings-pitched reconstruction algorithm (`calculate_outs`, `calculate_innings_pitched`, `parse_innings_pitched`), earned-run lookup via MLB StatsAPI (`get_earned_runs`), `calculate_era`, and `get_starting_lineup`. Defines its own duplicate `get_db()` rather than importing from `api/database.py`. |
| **`schedule_service.py`** | Holds today's schedule in module-level globals (`_schedule_games`, `_schedule_date`). `fetch_schedule()` calls `statsapi.schedule()`; `refresh_schedule()` updates the cache and swallows/logs errors so a failed fetch can't crash startup. Maps MLB team names to your `ballparks.team_abbrev` values, including an alias for the Athletics rebrand (`OAK` ↔ `ATH`). Also `find_game_for_team()` and `lineup_side_for_pitcher()`. |
| **`stats_service.py`** | A byte-for-byte duplicate of `batter_stats_service.py`, left over from the rename. **Not imported anywhere** — dead code. |
| **`mlbstatsapi.py`** | Your scratchpad for experimenting with the `statsapi` library. Contains `get_roster`, `get_mlb_teams`, an earlier `get_starting_lineup` with `print` debugging, and two unrelated math experiments (`one_percent`, `min_innings`). Not imported by the API — the production version of `get_starting_lineup` was copied out of here into `pitcher_stats_service.py`. |
| **`__init__.py`** | A single comment marking the package. |

### `ui/` — the React frontend

**`ui/index.html`** — The single HTML page. Contains `<div id="root">` and a script tag loading `/src/main.tsx`. Also sets `<meta name="theme-color" content="#1e1e1e">` for the dark theme.

#### `ui/src/`

| File | What it does |
|---|---|
| **`main.tsx`** | Bootstrap. `ReactDOM.createRoot(...).render(<React.StrictMode><App /></React.StrictMode>)`. |
| **`App.tsx`** | The root component and the **single source of truth for application state**: `bookmarkedPlayers`, `focusedSlot` (1 or 2), `playerSlot1`, `playerSlot2`, `hpFilter`, `scheduleGames`, `scheduleError`. Owns two effects: one that persists bookmarks to `localStorage` under the key `fb_bookmarked_players`, and one that fetches the schedule once on mount. Renders `Navbar`, `Sidebar`, and `MainContent`. |
| **`api.ts`** | The entire network layer, isolated in one file. Exports the TypeScript types (`Player`, `ScheduleGame`, `ScheduleResponse`, `LineupStarter`, `HitterStatLines`, `PitcherStatLines`) and one function per backend endpoint. Also contains the pure helpers `abbrevsMatch`, `findGameForTeam`, and `lineupSideForPitcher`, which mirror the Python versions in `schedule_service.py`. `BASE_URL` is hardcoded to `http://localhost:8000`. |
| **`index.css`** | Tailwind directives plus base layer styles: the `#1e1e1e` canvas background, `color-scheme: dark`, a custom `.bg-canvas` utility, and thin custom scrollbars. |

#### `ui/src/components/`

| Component | What it does |
|---|---|
| **`Navbar.tsx`** | The busiest component. Contains an internal (non-exported) `SearchBar` component and the **GO** button, which holds all the branching logic for fetching hitter vs pitcher stats. Local state: `selectedSearchPlayer`, `goLoading`, `goError`. Also holds four hardcoded placeholder constants (`TEST_PITCHER_ID`, `TEST_HAND`, `TEST_PITCH_TYPE`, `TEST_BALLPARK`) used for the hitter path. |
| **`Sidebar.tsx`** | The "My Players" panel. Renders a `BookmarkedPlayer` for each bookmark and an H/P toggle. Purely presentational — no state of its own. |
| **`BookmarkedPlayer.tsx`** | One bookmark row: player name, team, and a `DEL` button. |
| **`MainContent.tsx`** | The slot selector (buttons "1" and "2") and the two side-by-side `PlayerContainer`s. Presentational. |
| **`PlayerContainer.tsx`** | One player panel. Displays the player name, a `BB` (bookmark) button, the **Statlines** panel (fixed at 35% height), and a **Trends** panel that currently shows "Coming soon". Contains `formatStatline()`, which turns the 15-number stat array from the backend into three human-readable lines, plus the `HITTER_STATLINE_KEYS` / `PITCHER_STATLINE_KEYS` arrays that control which stat lines render and in what order. Handles `era` as a special case since it's a single number, not an array. |

---

## 4. The Database

### 4.1 Where the data comes from

Two external sources, used for different things:

**1. `pybaseball` → Baseball Savant (Statcast).** This is the bulk data source and the only thing that writes to the database. Two functions are used:

- `statcast(start_dt="2026-07-18")` — returns a pandas DataFrame with **one row per pitch** for that entire day across all games, with ~90 columns.
- `playerid_reverse_lookup([mlbam_id], key_type="mlbam")` — takes an MLBAM player ID and returns that player's first name, last name, and first/last MLB seasons.

**2. `MLB-StatsAPI` → the official MLB Stats API.** This is queried **live at request time** and is never persisted:

- `statsapi.schedule(start_date=..., end_date=...)` — today's games, including probable pitchers. Used by `schedule_service.py`.
- `statsapi.get("game", {"gamePk": ...})` — the full live game feed. Used two ways: to read `liveData.boxscore.teams[side].players` for starting lineups, and to read a specific pitcher's `earnedRuns` for the ERA calculation.

**Why the split:** Statcast gives you pitch-level granularity (pitch type, velocity, exit velocity, count state) which is what the splits are built from — but it doesn't tell you who is *starting tonight*. The MLB Stats API gives you schedule and lineup information but not pitch-level detail. So Statcast is warehoused locally and the Stats API is called live.

### 4.2 How data gets into the database

Ingestion is **manual and offline**. You edit `main()` in `ingest_statcast.py` to specify which dates to pull, then run the file. Currently `main()` has most date loops commented out and two active calls:

```python
ingest_statcast("2026-07-17")
ingest_statcast("2026-07-18")
```

The commented-out loops are the pattern you used to backfill whole months, e.g.:

```python
for i in range(0, 30):
    date_string = f"2026-06-0{i+1}" if i < 9 else f"2026-06-{i+1}"
    ingest_statcast(date_string)
```

`ingest_statcast(date_string)` runs these phases in order:

1. Open a DB connection and call `statcast(start_dt=date_string)`.
2. Clean and insert every pitch into `pitches`.
3. Filter and de-duplicate the DataFrame down to unique games.
4. Call `upsert_players()` to insert every batter and pitcher seen that day.
5. Call `assign_teams()` to backfill each player's team abbreviation.
6. Insert the unique games into `games`.
7. Commit and close.

### 4.3 What operations are performed on the data before insert

This is the part worth re-reading, because most of the pipeline's logic is cleanup.

#### Column selection
The raw Statcast DataFrame has far more columns than you need. `PITCH_COLS` narrows it to 27: game identifiers, batter/pitcher IDs, both teams, batter stance and pitcher handedness, pitch type and name, `events`, `description`, `des`, `type`, release and launch speed, at-bat and pitch numbers, inning and half-inning, outs, and the four score fields.

```python
pitches_df = df[available_cols]
```

#### Null handling
Statcast leaves many fields empty (a pitch that doesn't end a plate appearance has no `events` value, a pitch that isn't hit has no `launch_speed`). Every null is converted to the integer `0`:

```python
pitches_df = pitches_df.where(~pd.isnull(pitches_df), 0)
```

This is a deliberate choice, and it's why every stat query in `batter_stats_service.py` filters with `WHERE events != 0` — that condition is how you say "only rows that ended a plate appearance."

`launch_speed` gets special treatment because `0` mph is meaningless: it's converted back to `None` (SQL `NULL`) when it's zero, and to a float otherwise.

#### Type coercion
`pybaseball` returns pandas types (`numpy.int64`, `pandas.Series` scalars) that the `sqlite3` driver rejects with `sqlite3.ProgrammingError: parameters are of unsupported type`. Every field is therefore explicitly cast in a row-by-row loop:

```python
game_pk = int(pitches_df["game_pk"].iat[i])
game_date = str(pitches_df["game_date"].iat[i])
release_speed = float(pitches_df["release_speed"].iat[i])
```

The same problem is handled for player records by `series_to_sql()`, which pulls scalars out of the lookup DataFrame with `.iat[0]` and casts them.

#### Pitch type normalization
Statcast pitch codes are mapped to small integer IDs through the `PITCH_TYPES` dict, so `pitches.pitch_type` stores numbers, not strings:

| Code | ID | | Code | ID |
|---|---|---|---|---|
| FF (4-seam) | 1 | | SL (slider) | 7 |
| FC (cutter) | 2 | | KC (knuckle curve) | 8 |
| FS (splitter) | 3 | | CU (curveball) | 9 |
| SI (sinker) | 4 | | CH (changeup) | 10 |
| ST (sweeper) | 5 | | SV (slurve) | 11 |
| EP (eephus) | 6 | | FA (other) | 12 |

The `pitch_type_class` table stores the human-readable mapping plus an `is_offspeed` flag, so offspeed queries can be driven from the database rather than hardcoded.

#### Row filtering (junk pitches)
Two categories of rows are skipped entirely:

```python
if pitch_type == 0 and events == 0:
    continue                       # unknown pitch that ended nothing
elif (description == "automatic_ball" or description == "automatic_strike") and events == 0:
    continue                       # pitch-clock violation with no PA outcome
```

The second case matters because pitch-clock violations aren't real pitches — they'd inflate pitch counts. They're only kept when they actually produced a walk or strikeout.

#### De-duplication for games
A day of pitches contains thousands of rows per game, but you only want one `games` row per game. The DataFrame is first filtered to rows where all `GAME_COLS` are non-null, then reduced:

```python
games_df = df[["game_pk","game_date","game_year","home_team","away_team"]].drop_duplicates()
```

#### Player upsert strategy
`upsert_players()` collects the unique batter and pitcher IDs for the day (via `set()`), casts them to `int`, looks each one up with `playerid_reverse_lookup`, skips any empty lookup result, and inserts with:

```sql
INSERT OR IGNORE INTO players (player_id, name_last, name_first, name_full, position,
                               mlb_played_first, mlb_played_last) VALUES (?,?,?,?,?,?,?)
```

Two decisions embedded here:

- **`INSERT OR IGNORE`, not `INSERT OR REPLACE`.** This was changed deliberately. `REPLACE` deletes and re-inserts the row, which wiped out `team_abbrev` (and `position`) on every subsequent ingest day. `IGNORE` leaves existing players untouched.
- **`position` is inferred, not read from the data.** Statcast doesn't hand you a position, so a player who appears in the `batter` column is stored as `"Hitter"` and a player in the `pitcher` column as `"Pitcher"`. `name_full` is synthesized as `f"{first} {last}"` specifically so the search endpoint can do a single `LIKE` against one column.

#### Team assignment (`assign_teams`)
Statcast tells you the home and away team for each game, and `inning_topbot` tells you which half-inning a pitch occurred in — from those two facts you can deduce which team a player is on. In the top of an inning the **away** team bats and the **home** team pitches; in the bottom it's reversed. So four queries run per game:

| Query | Half-inning | Yields |
|---|---|---|
| away batters | `Top` | `(batter, away_team)` |
| home batters | `Bot` | `(batter, home_team)` |
| away pitchers | `Bot` | `(pitcher, away_team)` |
| home pitchers | `Top` | `(pitcher, home_team)` |

The results are unioned and written with:

```sql
UPDATE players SET team_abbrev = COALESCE(team_abbrev, ?) WHERE player_id = ?
```

`COALESCE` means the value is only written if `team_abbrev` is currently `NULL`, so a mid-season trade won't cause the value to flip back and forth on every re-ingest.

### 4.4 Database tables

#### Core tables

**`players`**

| Column | Type | Notes |
|---|---|---|
| `player_id` | INTEGER | PRIMARY KEY (MLBAM ID) |
| `name_last` | TEXT | NOT NULL |
| `name_first` | TEXT | NOT NULL |
| `name_full` | TEXT | NOT NULL — synthesized, used for search |
| `position` | TEXT | NOT NULL — `"Hitter"` or `"Pitcher"` |
| `mlb_played_first` | REAL | first MLB season |
| `mlb_played_last` | REAL | most recent MLB season |
| `team_abbrev` | TEXT | filled in by `assign_teams()` |

**`games`**

| Column | Type | Notes |
|---|---|---|
| `game_pk` | INTEGER | PRIMARY KEY (MLB game ID) |
| `game_date` | DATE | NOT NULL |
| `game_year` | INTEGER | NOT NULL |
| `home_team` | TEXT | NOT NULL |
| `away_team` | TEXT | NOT NULL |

**`pitches`** — the fact table. Every stat in the app is derived from this.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `game_pk` | INTEGER | NOT NULL, FK → `games` |
| `game_date` | DATE | NOT NULL |
| `game_year` | INTEGER | NOT NULL — used for season filtering |
| `batter` | INTEGER | NOT NULL, FK → `players` |
| `pitcher` | INTEGER | NOT NULL, FK → `players` |
| `home_team` | TEXT | NOT NULL — doubles as the ballpark key |
| `away_team` | TEXT | NOT NULL |
| `stand` | TEXT | NOT NULL — batter stance (L/R) |
| `p_throws` | TEXT | NOT NULL — pitcher handedness (L/R) |
| `pitch_type` | TEXT | stores the integer ID from `PITCH_TYPES` |
| `pitch_name` | TEXT | declared but never populated by the ingest |
| `events` | TEXT | plate-appearance outcome, or `0` if the pitch didn't end one |
| `description` | TEXT | pitch-level result (e.g. `swinging_strike`, `automatic_ball`) |
| `story_description` | TEXT | Statcast's `des` narrative field |
| `result_type` | TEXT | Statcast `type` (B/S/X) |
| `release_speed` | REAL | pitch velocity |
| `launch_speed` | REAL | exit velocity, `NULL` when not batted |
| `at_bat_number` | INTEGER | NOT NULL — sequence within the game |
| `pitch_number` | INTEGER | NOT NULL — sequence within the at-bat |
| `inning` | INTEGER | NOT NULL |
| `inning_topbot` | TEXT | `Top` / `Bot` — used to derive team assignment |
| `outs_when_up` | INTEGER | used by the innings-pitched algorithm |
| `bat_score` | INTEGER | batting team's score before the PA |
| `fld_score` | INTEGER | fielding team's score before the PA |
| `post_bat_score` | INTEGER | batting team's score after — RBIs come from the delta |
| `post_fld_score` | INTEGER | fielding team's score after |

**`ballparks`** — seeded with all 30 teams in `schema.sql`.

| Column | Type |
|---|---|
| `team_abbrev` | TEXT |
| `ballpark_name` | TEXT |
| `team_name` | TEXT |

Used by `schedule_service.py` to translate MLB Stats API team names (e.g. `"New York Yankees"`) into your abbreviations (`"NYY"`).

**`pitch_type_class`** — seeded with 13 rows.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY |
| `pitch_type` | TEXT | Statcast code |
| `pitch_name` | TEXT | human-readable name |
| `is_offspeed` | INTEGER | NOT NULL — `1` for offspeed, `0` for fastballs |

#### Pre-aggregate tables (defined, **not yet populated**)

`schema.sql` also defines ten rollup tables. Nothing currently writes to them — `update_splits.py` was the intended populator and was never finished. Every stat the app serves today is computed live from `pitches`. These exist as a performance escape hatch for later.

| Table | Primary key | Columns beyond the key |
|---|---|---|
| `pitcher_arsenal` | `(player_id, year, pitch_type)` | `pitch_name`, `usage_pct`, `pitches` |
| `pitcher_game_stats` | `(game_pk, pitcher)` | `game_date`, `ip`, `er`, `k`, `bb`, `hbp`, `hr`, `pitches` |
| `batter_game_stats` | `(game_pk, batter)` | `game_date`, `ab`, `h`, `doubles`, `triples`, `hr`, `bb`, `hbp`, `so`, `pa`, `bip_count`, `hard_hit_count`, `ev_count` |
| `batter_vs_pitcher` | `(batter, pitcher)` | `ab`, `h`, `doubles`, `triples`, `hr`, `rbi`, `bb`, `hbp`, `so`, `avg`, `obp`, `slg`, `ops` |
| `batter_vs_hand` | `(batter, p_throws, game_year)` | same stat block as above |
| `batter_at_ballpark` | `(batter, home_team, game_year)` | same stat block |
| `batter_vs_pitcher_pitch_type` | `(batter, pitcher, game_year, pitch_type)` | same stat block |
| `pitcher_vs_batter` | `(pitcher, batter)` | same stat block |
| `pitcher_vs_hand` | `(pitcher, stand, game_year)` | same stat block |
| `pitcher_at_ballpark` | `(pitcher, home_team, game_year)` | same stat block |

#### Indexes

28 indexes are defined. The important group is on `pitches`, and it maps directly onto the split queries: `(batter, pitcher)`, `(batter, pitcher, game_year)`, `(batter, p_throws)`, `(batter, home_team)`, `(batter, game_date DESC)` and the pitcher-side mirrors. There are no views.

### 4.5 How a stat line is actually computed

Worth remembering, because it explains the shape of the API responses.

Every hitter query function returns **full pitch rows** — the raw list of terminal plate-appearance rows matching the split. For example:

```sql
SELECT * FROM pitches
WHERE events != 0 AND events != 'truncated_pa'
  AND batter = ? AND pitcher = ?
```

That list is then handed to `calculate_stats()`, which loops through the rows and classifies each `events` value against the event sets:

- **PA** if `events` is in `PA_EVENTS`
- **AB** if in `AB_EVENTS` (excludes walks, HBP, sac flies)
- **BB / HBP / K / 1B / 2B / 3B / HR** from their respective sets
- **RBI** from `post_bat_score - bat_score`, skipping the case where `events == "field_error"` and `outs_when_up == 2`

Then it derives the rate stats, each guarded against division by zero:

```
hits = 1B + 2B + 3B + HR
avg  = hits / ab
obp  = (hits + bb + hbp) / pa
slg  = (1B + 2·2B + 3·3B + 4·HR) / ab
ops  = obp + slg
```

The return value is a **fixed 15-element list**, and the frontend depends on this exact ordering:

```
[ab, pa, hits, bb, hbp, k, 1B, 2B, 3B, hr, rbi, avg, obp, slg, ops]
   0   1     2   3    4  5   6   7   8   9   10   11   12   13   14
```

"This season" is not hardcoded anywhere — `get_year()` reads the newest `game_year` present in `pitches` and uses that.

### 4.6 The pitcher innings/ERA algorithm

This is the least obvious code in the project, so here's the reasoning.

**The problem:** Statcast has no "innings pitched" column. You have to reconstruct it from `inning`, `outs_when_up`, and the `events` of each plate appearance.

**`calculate_outs(pitcher, game_date)`** works like this:

1. Find the pitcher's **first** and **last** plate appearance that day (by `at_bat_number`).
2. Compute the raw deltas: `inning_delta = last.inning - first.inning`, `outs_delta = last.outs_when_up - first.outs_when_up`.
3. `outs_when_up` is the out count *before* the plate appearance, so the outs recorded *on* the final PA must be added manually: +1 for `SINGLE_OUT_EVENTS`, +2 for `DOUBLE_OUT_EVENTS` (double plays), +3 for `TRIPLE_OUT_EVENTS`.
4. Look up the **next** plate appearance in the game (`at_bat_number + 1`, any pitcher) to detect an inning rollover the pitcher's own rows can't reveal. If `next.outs_when_up == 0` the inning ended, so add `3 - last.outs_when_up`; otherwise add the difference.
5. Normalize: 3 outs becomes +1 inning and 0 outs; a negative out count borrows from the inning count.
6. Return `(innings × 3) + outs` as total outs.

**`calculate_innings_pitched(pitcher)`** sums `calculate_outs` across every distinct `game_date` for that pitcher and formats the result in baseball notation, `f"{outs // 3}.{outs % 3}"` — so 37 outs renders as `"12.1"` (12⅓ innings).

**`parse_innings_pitched("12.1")`** converts that back to a decimal `12.333…` for arithmetic.

**`get_earned_runs(pitcher, game_pk)`** does not compute ER from Statcast at all — earned vs unearned requires official scoring judgment. Instead it determines which side the pitcher is on (a pitcher appearing in the `Top` half is on the **home** team) and reads the value straight from the MLB Stats API boxscore:

```python
statsapi.get("game", {"gamePk": game_pk})["liveData"]["boxscore"]["teams"][side]["players"][f"ID{pitcher}"]["stats"]["pitching"]["earnedRuns"]
```

**`calculate_era(pitcher, game_pk)`** then returns `(ER × 9) / IP`. See §7 for a correctness caveat here.

---

## 5. How the Frontend Connects to the Backend

### 5.1 The concepts

Since you were learning this when you built it, here is the mental model.

**They are two completely separate programs.** The Python backend and the React frontend do not share memory, variables, or function calls. They are two operating-system processes that happen to run on the same machine:

- uvicorn runs your FastAPI app and listens on TCP port **8000**
- Vite runs a dev server for your React app and listens on port **5173**

**They talk over HTTP.** The only thing that connects them is the browser making HTTP requests. There is no magic import, no shared type checking across the boundary. The frontend sends a URL; the backend sends back a JSON string.

**The contract is the URL + JSON shape.** When `api.ts` declares `Promise<HitterStatLines>`, that is a *promise you are making to TypeScript*, not something TypeScript verified against Python. If you change a dict key in `stats.py`, TypeScript will not complain — it will break at runtime. This is why the `HitterStatLines` / `PitcherStatLines` types in `api.ts` need to be kept in sync with the return dicts in `api/routers/stats.py` by hand.

**What actually enables the communication — four pieces:**

1. **`fetch()`** — the browser's built-in HTTP client. Every call in `api.ts` boils down to `fetch(url)`. It returns a `Promise`, which is why every API function is `async` and every caller uses `await`.

2. **REST endpoints in FastAPI.** Decorators map URLs to Python functions:
   ```python
   @router.get("/hitter/{batter_id}")
   def get_batter_stats(batter_id: int, pitcher_id: int, hand: str, ...):
   ```
   FastAPI reads the function signature to decide where each value comes from. A name that appears in the URL pattern (`{batter_id}`) is a **path parameter**; every other parameter becomes a **query parameter** (`?pitcher_id=…&hand=…`). It also coerces and validates types — `batter_id: int` means a non-numeric value returns a 422 error before your code runs. Returning a Python dict is enough; FastAPI serializes it to JSON and sets the `Content-Type` header.

3. **CORS.** Browsers enforce the *same-origin policy*: JavaScript loaded from `localhost:5173` is not allowed to read a response from `localhost:8000`, because a different port counts as a different origin. Without an explicit exception, the request is sent but the browser refuses to hand you the response. That exception is what `CORSMiddleware` provides:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],
       allow_credentials=True,
       allow_methods=["GET", "POST"],
       allow_headers=["*"],
   )
   ```
   The backend responds with an `Access-Control-Allow-Origin` header, and the browser then permits the read. This is a **browser** rule only — `localhost:8000/docs` and `curl` work fine without it, which is a common source of "it works in the docs but not in my app" confusion.

4. **React state.** Receiving JSON changes nothing on screen by itself. The value has to be written into state with a setter (`setPlayerSlot1(...)`), which triggers a re-render, which causes the component to display the new data. **Fetch → setState → re-render** is the loop.

**Why `api.ts` exists.** You could call `fetch()` directly inside components (that was your first version). Centralizing it means the `BASE_URL`, the query-string construction, the error handling, and the response types live in one file, so a backend change is a one-file edit rather than a hunt through components.

### 5.2 Every user interaction, step by step

#### Flow A — App startup: loading today's schedule

No user input, but everything in the pitcher flow depends on it.

1. Browser loads `http://localhost:5173`. Vite serves `index.html`, which loads `main.tsx`.
2. `main.tsx` calls `ReactDOM.createRoot(...).render(<App />)`.
3. `App` renders once with `scheduleGames = []`.
4. After the first paint, the mount effect (dependency array `[]`) runs and calls `getSchedule()`.
5. `getSchedule()` in `api.ts` executes:
   ```ts
   const response = await fetch(`${BASE_URL}/schedule`);
   ```
   → `GET http://localhost:8000/schedule`
6. The browser sends the request. Because the origin differs, it checks CORS on the response.
7. uvicorn routes `/schedule` to `get_schedule()` in `api/routers/schedule.py`.
8. That handler calls `get_cached_schedule()` — **no network call and no database query**, because the schedule was already fetched during startup by the lifespan hook. It returns `{date, games}`.
9. FastAPI serializes the dict to JSON and attaches the CORS headers.
10. `response.ok` is true, so `api.ts` returns `response.json()`.
11. Back in `App`, `.then()` runs `setScheduleGames(data.games)` and `setScheduleError(null)`.
12. State change → re-render → `scheduleGames` is passed down to `Navbar` as a prop.

If the fetch fails (backend down, or `statsapi` failed at startup), `.catch()` sets `scheduleGames = []` and `scheduleError = "Schedule unavailable"`. Nothing appears broken until you press GO on a pitcher, at which point that message surfaces.

#### Flow B — Typing in the search bar

1. User types a character into the input in `SearchBar` (inside `Navbar.tsx`).
2. React fires `onChange` → `handleInput(e)`.
3. `setQuery(val)` updates the controlled input.
4. If the value is empty or whitespace, `setSuggestions([])` and return.
5. Otherwise `await searchPlayers(val)`:
   ```ts
   const response = await fetch(`${BASE_URL}/players/search?name=${name}`);
   ```
   → `GET http://localhost:8000/players/search?name=judge`
6. FastAPI routes to `search_players(name: str)` in `players.py`. Because `name` is not in the URL pattern, FastAPI takes it from the query string.
7. The handler opens a SQLite connection and runs:
   ```sql
   SELECT player_id, name_first, name_last, position
   FROM players
   WHERE name_full LIKE ?
   ORDER BY name_last
   LIMIT 20
   ```
   with the parameter `%judge%`. The `LIKE` wildcards are added in Python, and the value is passed as a bound parameter (`(f"%{name}%",)` — the trailing comma makes it a tuple) rather than string-concatenated, which is what prevents SQL injection.
8. Rows are converted with `[dict(row) for row in rows]`, which works because `row_factory = sqlite3.Row`. The connection is closed.
9. JSON array comes back; `setSuggestions(results)` stores it.
10. Re-render: if `suggestions.length > 0`, the dropdown `<ul>` renders one `<li>` per player showing `{name_first} {name_last}`, each with a `key={player.player_id}`.

Two details worth remembering:

- **There is no debounce.** Every keystroke fires a request. Typing "judge" sends five requests. Adding a ~300ms debounce is a cheap, worthwhile improvement.
- **Click-outside** is handled by a mount effect that registers a `mousedown` listener on `document`; if the click target is outside `wrapperRef`, suggestions clear. Suggestion clicks use `onMouseDown` (not `onClick`) so the selection registers before the outside-click handler fires.

#### Flow C — Selecting a player from the suggestions

No backend call.

1. `onMouseDown` on the `<li>` fires `handleSelect(player)`.
2. `setQuery("First Last")` fills the input; `setSuggestions([])` closes the dropdown.
3. `onSelectPlayer({ player })` is called, which in `Navbar` does:
   - `setSelectedSearchPlayer(data.player)` — **this is the value GO depends on**
   - `setGoError(null)`
   - `onSearchSelect(data)` → `App.handleSearchSelect`
4. `App.handleSearchSelect` writes the payload into `playerSlot1` or `playerSlot2` depending on `focusedSlot`.
5. The GO button becomes enabled (`disabled={goLoading || !playerIdForGo}`).

Note that the panel still shows the "Player Name" placeholder at this point — the object stored by this path is `{ player }`, which has no `.name` or `.stats`. Real data appears only after GO.

#### Flow D — Pressing GO for a **hitter**

1. Click fires `handleGoClick()` in `Navbar.tsx`.
2. Guard: return immediately if there's no `selectedSearchPlayer`.
3. `setGoLoading(true)`, `setGoError(null)`. The button renders `…` and disables itself.
4. `selectedSearchPlayer.position === "Hitter"` is true (that value came from the `players.position` column, which the ingest set), so the hitter branch runs:
   ```ts
   stats = await getHitterStats(
     String(playerIdForGo),
     TEST_PITCHER_ID,   // "656492"
     TEST_HAND,         // "R"
     TEST_PITCH_TYPE,   // "CH"
     TEST_BALLPARK,     // "NYY"
   );
   ```
   These four are **hardcoded placeholders** — the opposing pitcher and ballpark are not yet wired to the schedule for hitters.
5. `getHitterStats` builds the query string with `URLSearchParams` and fetches:
   → `GET http://localhost:8000/stats/hitter/592450?pitcher_id=656492&hand=R&pitch_type=CH&ballpark=NYY`
6. FastAPI routes to `get_batter_stats()`. `batter_id` comes from the path; `pitcher_id`, `hand`, `pitch_type`, `ballpark` come from the query string.
7. The handler calls **eight** service functions, wrapping each in `calculate_stats()`:

   | Response key | Service call |
   |---|---|
   | `season_stats` | `season_stats(batter_id)` |
   | `career_vs_pitcher` | `career_vs_pitcher(batter_id, pitcher_id)` |
   | `season_vs_pitcher` | `season_vs_pitcher(batter_id, pitcher_id)` |
   | `career_vs_hand` | `career_vs_hand(batter_id, hand)` |
   | `season_vs_hand` | `season_vs_hand(batter_id, hand)` |
   | `season_vs_offspeed` | `season_vs_offspeed(batter_id, pitch_type)` |
   | `career_at_ballpark` | `career_at_ballpark(batter_id, ballpark)` |
   | `season_at_ballpark` | `season_at_ballpark(batter_id, ballpark)` |

   Each service function queries `pitches`, and `calculate_stats()` reduces the rows to the 15-number array.
8. Response: a JSON object with eight keys, each a 15-element array.
9. If `!response.ok`, `api.ts` throws `Error("Stats unavailable")`.
10. On success, `handleGoClick` calls up to `App`:
    ```ts
    onGoClick({ name: "First Last", stats, position: "Hitter" });
    ```
11. `App.handleGoClick` sees an object with `.stats`, builds `{ name, stats, position }`, and writes it to `playerSlot1` or `playerSlot2` based on `focusedSlot`.
12. Re-render: `App` → `MainContent` → the appropriate `PlayerContainer` receives the new `playerData`.
13. `PlayerContainer` reads `position === "Hitter"`, selects `HITTER_STATLINE_KEYS`, and maps over the eight keys. For each one it calls `formatStatline(arr)` and renders three lines:
    - `".284: 27/95"`
    - `"Outcome Breakdown: 18 singles, 5 doubles, 0 triples, 4 home runs, …"`
    - `"OBP/SLG/OPS: 0.351/0.474/0.825"`

    The key label is displayed with underscores replaced by spaces.
14. `finally { setGoLoading(false) }` re-enables the button.

On any thrown error, the message is caught, stored via `setGoError(message)`, and rendered as red text in the navbar.

#### Flow E — Pressing GO for a **pitcher** (the most involved path)

This one chains **three** backend calls, because to show a pitcher's matchup stats you first need to know who he's facing tonight.

1. `handleGoClick()` runs, `position !== "Hitter"`, so the pitcher branch executes.
2. **Read the pitcher's team** from `selectedSearchPlayer.team_abbrev` (the column `assign_teams()` populated). If missing:
   → throw `"Player team not set — run statcast ingest for team data"`
3. **Check the schedule** already in state. If `scheduleGames.length === 0`:
   → throw `scheduleError ?? "No games on today's schedule"`
4. **Find tonight's game** with `findGameForTeam(scheduleGames, teamAbbrev)`. This scans the games and compares the pitcher's abbreviation against each game's `home_abbrev` and `away_abbrev` using `abbrevsMatch`, which consults `ABBREV_ALIASES` so `OAK` and `ATH` are treated as the same club. If nothing matches:
   → throw `` `No game found for team ${teamAbbrev} today` ``
5. **Decide which lineup to fetch** with `lineupSideForPitcher(teamAbbrev, game)`. The logic is inverted on purpose: if the pitcher is on the **home** team, you want the **away** lineup, because those are the nine hitters he will face.
6. **Fetch the lineup** — first backend call of this flow:
   ```ts
   const { starters } = await getLineup(game.game_pk, side);
   ```
   → `GET http://localhost:8000/stats/lineup?game_pk=823244&side=away`
7. FastAPI routes to `get_lineup()`. Note `side: Literal["home", "away"]` — FastAPI rejects any other value with a 422 automatically.
8. `get_starting_lineup(game_pk, side)` in `pitcher_stats_service.py` calls the MLB Stats API live:
   ```python
   game = statsapi.get("game", {"gamePk": game_pk})
   players = game["liveData"]["boxscore"]["teams"][side]["players"]
   ```
   It then identifies starters by `battingOrder`: MLB encodes the batting order as a string where a **starter** in slot *n* is `"n00"` (`"100"`, `"200"`, …) and substitutes get `"101"`, `"102"`, etc. So the filter is "`battingOrder` exists and ends with `00`". The list is sorted by `int(batting_order)` to put it in 1-through-9 order.
9. The router checks `len(starters) < 9` and raises **HTTP 422** with detail `"Lineup not available yet (N starters found)"` — this is the case where lineups haven't been posted yet.
10. `getLineup` in `api.ts` handles that specially: on a non-OK response it parses the body and throws an `Error` carrying the backend's `detail` string, so the user sees the real reason rather than a generic failure.
11. **Flatten to nine IDs:** `const ids = starters.map(s => String(s.player_id))`.
12. **Fetch the pitcher's stats** — second backend call:
    ```ts
    stats = await getPitcherStats(
      String(playerIdForGo),
      ids[0], ids[1], ids[2], ids[3], ids[4],
      ids[5], ids[6], ids[7], ids[8],
      String(game.game_pk),
    );
    ```
    → `GET http://localhost:8000/stats/pitcher/657277?hitter_one=…&hitter_nine=…&game_pk=823244`
13. FastAPI routes to `get_pitcher_stats()`, which declares eleven query parameters (`hitter_one` … `hitter_nine`, `game_pk`) plus the path parameter.
14. The handler does two things:
    - `calculate_era(pitcher_id, game_pk)` — which internally makes a **third** external call to the MLB Stats API for earned runs, and runs the innings-pitched reconstruction against SQLite.
    - Nine calls to `calculate_stats(career_vs_pitcher(hitter_n, pitcher_id))`, one per lineup slot. Note the argument order: `career_vs_pitcher(batter_id, pitcher_id)` is reused from the hitter side, just called nine times with the pitcher held constant.
15. Response: `{ era, career_vs_hitter_one, …, career_vs_hitter_nine }`.
16. Same as the hitter flow: `onGoClick({ name, stats, position })` → `App` writes it into the focused slot → `PlayerContainer` re-renders.
17. `PlayerContainer` sees `position !== "Hitter"`, selects `PITCHER_STATLINE_KEYS`, and renders `era` first as a special case (a single number formatted with `.toFixed(2)`, or `"—"` when `null`) followed by the nine hitter matchup lines through `formatStatline`.

#### Flow F — Bookmarking (BB) and deleting (DEL)

Entirely client-side; no backend involvement.

1. `BB` in `PlayerContainer` calls `onBookmark(playerData)` (disabled when there's no `playerData`).
2. `App.handleBookmark` ignores falsy input, de-duplicates by `name`, and appends to `bookmarkedPlayers`.
3. The `[bookmarkedPlayers]` effect fires and runs `saveBookmarks()`, writing `JSON.stringify(...)` to `localStorage` under `fb_bookmarked_players`.
4. `Sidebar` re-renders one `BookmarkedPlayer` per entry.
5. `DEL` calls `onDelete(player)` → `App.handleDeleteBookmark` filters by `name` → the effect persists the shorter list.
6. On the next page load, `loadBookmarks()` reads and parses that key during `useState` initialization, wrapped in try/catch so corrupt JSON falls back to `[]`.

#### Flow G — Slot focus and the H/P toggle

Also purely client-side.

- Clicking **1** or **2** in `MainContent` calls `onFocusChange(slot)` → `setFocusedSlot`. This determines which slot the *next* GO result is written into, and drives the accent border/glow styling on the focused panel.
- The **H / P** toggle in `Sidebar` calls `onHpFilterChange` → `setHpFilter`. Right now this only changes button styling; it does **not** filter the bookmark list. That filtering is unimplemented.

### 5.3 Quick request reference

| User action | Frontend function | HTTP request | Backend handler |
|---|---|---|---|
| App loads | `getSchedule()` | `GET /schedule` | `schedule.get_schedule` |
| Type in search | `searchPlayers(name)` | `GET /players/search?name=` | `players.search_players` |
| GO (hitter) | `getHitterStats(...)` | `GET /stats/hitter/{id}?pitcher_id=&hand=&pitch_type=&ballpark=` | `stats.get_batter_stats` |
| GO (pitcher), step 1 | `getLineup(gamePk, side)` | `GET /stats/lineup?game_pk=&side=` | `stats.get_lineup` |
| GO (pitcher), step 2 | `getPitcherStats(...)` | `GET /stats/pitcher/{id}?hitter_one…nine=&game_pk=` | `stats.get_pitcher_stats` |
| *(unused)* | `getPlayer(playerId)` | `GET /players/{player_id}` | `players.get_player` |
| *(unused by UI)* | — | `POST /schedule/refresh` | `schedule.post_refresh_schedule` |

---

## 6. How the Project Got Here

Rough chronology, reconstructed from the work history. Useful for remembering *why* certain things look the way they do.

1. **Ingestion first (March 2026).** Built `ingest_statcast.py` against `pybaseball`. Most of the early debugging was pandas-to-SQLite friction: only 10 of 334 players inserting, only the first pitch of a day inserting repeatedly, `pandas.Series` → `int`/`str` conversion, and `INSERT OR REPLACE` silently wiping columns. Also built out `schema.sql` including the 30-team `ballparks` seed.

2. **UI design (March 2026).** Designed a wireframe, then built it as React + Tailwind: navbar with search, "My Players" sidebar, two player containers each split into a Statlines panel and a Trends panel.

3. **JS → TS migration (April 2026).** Converted `.jsx` files to `.tsx` and fixed the `--jsx` / `tsconfig.json` fallout.

4. **Backend choice (April 2026).** Compared FastAPI vs Express vs Django. Chose **FastAPI** because the entire data layer was already Python — reusing `pybaseball` and the SQLite logic mattered more than language consistency with the frontend.

5. **First endpoints (April 2026).** Built `/players/search` and the original `/stats/{batter_id}`. Debugged 500s in `/search`, then decided to move SQL out of the router into a service layer. Built `api.ts` as the single network layer rather than calling `fetch` inside components.

6. **Stat lines end to end (April–May 2026).** Split `stats_service.py` into `batter_stats_service.py`, added the eight hitter splits, fixed `ZeroDivisionError` in `calculate_stats` and a missing `conn = get_db()` in `get_year()`, then wired the results into `PlayerContainer` with `formatStatline`. Fixed React key warnings and several null-handling crashes for the "no player selected yet" state.

7. **Pitcher support (May–June 2026).** Added `team_abbrev` to `players` and `assign_teams()` to populate it (including reworking an O(n²) first attempt). Built the innings-pitched reconstruction, then pulled earned runs from MLB StatsAPI because Statcast can't tell earned from unearned. Added `schedule_service.py` and the `/schedule` + `/stats/lineup` endpoints so the pitcher GO flow could find tonight's opposing lineup automatically.

8. **Git cleanup (June 2026).** The committed `fantasy_baseball.db` exceeded GitHub's 100 MB limit and blocked pushes; history was rewritten to remove it, and the db plus `__pycache__` were added to `.gitignore`. A later merge between `main` and `pitcher_stats` left conflict markers in 15 files, which were resolved in favor of the `pitcher_stats` side.

9. **Dark theme (September 2026).** Restyled the whole UI from the original light gray to a dark theme: `#1e1e1e` canvas with layered `#252526`/`#2d2d2d`/`#333333` surfaces and a cyan `#00e5ff` accent, defined as custom Tailwind tokens. Fixed a transparent search-dropdown background and low GO-button contrast along the way.

10. **Charting decision (September 2026).** For the Trends panel, decided against matplotlib (static server-rendered images, no interactivity, hard to theme) in favor of a React charting library — Recharts being the leading candidate — fed by JSON from a future trends endpoint. Recharts was installed and uninstalled once during experimentation; it is **not** currently a dependency.

---

## 7. Where You Left Off — Known Issues and Next Steps

### Blockers worth fixing first

**1. `/players/search` doesn't return `team_abbrev`, which breaks the entire pitcher GO flow.**
The query in `api/routers/players.py` selects only `player_id, name_first, name_last, position`. But `Navbar.handleGoClick` reads `selectedSearchPlayer.team_abbrev` to find tonight's game — so for any pitcher it will be `undefined` and immediately throw `"Player team not set — run statcast ingest for team data"`. The `Player` type in `api.ts` already declares `team_abbrev?`, and the column exists in the table. Adding it to the `SELECT` list is a one-line fix.

**2. `season_vs_offspeed` will always come back empty.**
The ingest converts pitch codes to integers via `PITCH_TYPES` (`CH` → `10`), so `pitches.pitch_type` holds `"10"`. But the frontend sends `TEST_PITCH_TYPE = "CH"` and the query does `WHERE pitch_type = ?`. The two never match. Either send the integer ID from the frontend, or join through `pitch_type_class` — the better version being to use `is_offspeed = 1` so the split covers *all* offspeed pitches rather than one pitch type.

**3. ERA mixes single-game earned runs with career innings.**
`calculate_era` divides `get_earned_runs(pitcher, game_pk)` — one game — by `calculate_innings_pitched(pitcher)` — every date in the database. The resulting number isn't a meaningful ERA. Decide which you want (single-game ERA, or season ERA summed across games) and make both halves agree.

**4. `story_description` stores the same value on every row.**
In `ingest_statcast.py` the line reads `pitches_df["des"].iat[1]` instead of `.iat[i]`, so row index 1's narrative is copied to every pitch of the day.

### Smaller cleanups

- **Hardcoded placeholders in the hitter path.** `TEST_PITCHER_ID`, `TEST_HAND`, `TEST_PITCH_TYPE`, `TEST_BALLPARK` in `Navbar.tsx` should come from the schedule (opposing probable pitcher, his handedness, and the home team's park) the same way the pitcher path already does.
- **Search has no debounce and no error handling.** `handleInput` fires a request per keystroke and has no try/catch, so a failed search produces an unhandled promise rejection.
- **No 9-starter guard on the frontend.** The backend returns 422 for short lineups, but `ids[0]`…`ids[8]` would pass `undefined` if a partial list ever got through.
- **Dead code.** `api/services/stats_service.py` (exact duplicate of `batter_stats_service.py`), `api/routers/games.py` (empty, unmounted), `update_splits.py` (broken WIP), and the string branch of `App.handleGoClick` along with `selectedTeam`, which is never set.
- **Duplicate `get_db()`** in `pitcher_stats_service.py` instead of importing from `api/database.py`.
- **`ingest_statcast.py` calls `statcast()` twice per day** — once in `ingest_statcast` and again inside `upsert_players`. Passing the DataFrame through would halve the network cost.
- **`get_db_connection(conn)`** takes a connection-typed parameter but is passed a path; and `check_schema` looks for a table named `player` rather than `players`.
- **`hpFilter` doesn't filter anything** — it only restyles the H/P buttons.

### Planned features

- **Trends panel.** The intended next feature. The plan: add a trends endpoint that returns time-series JSON (rolling AVG, OPS by date, velocity by game), then render it with Recharts inside `PlayerContainer`.
- **Populate the pre-aggregate tables.** Ten rollup tables and their indexes already exist in `schema.sql`. Filling them would replace the current pattern of pulling full pitch rows into Python and reducing them per request.
- **Ideas noted in the ingest file:** combined hitter-vs-pitching-staff probabilities, a machine-learning layer, moving off SQLite to DuckDB for analytics, deploying to a VM, and parallelizing ingestion across multiple days.
