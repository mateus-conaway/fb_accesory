-- Fantasy Baseball Database Schema
-- SQLite DDL for core and pre-aggregate tables

-- =============================================================================
-- CORE TABLES
-- =============================================================================
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS pitches;
DROP TABLE IF EXISTS ballparks;
DROP TABLE IF EXISTS pitch_type_class;
-- ALTER TABLE pitches DROP COLUMN pitch_name;

CREATE TABLE IF NOT EXISTS players (
    player_id INTEGER PRIMARY KEY,
    name_last TEXT NOT NULL,
    name_first TEXT NOT NULL,
    name_full TEXT NOT NULL,
    position TEXT NOT NULL,
    mlb_played_first REAL,
    mlb_played_last REAL
);

CREATE TABLE IF NOT EXISTS games (
    game_pk INTEGER PRIMARY KEY,
    game_date DATE NOT NULL,
    game_year INTEGER NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pitches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_pk INTEGER NOT NULL,
    game_date DATE NOT NULL,
    game_year INTEGER NOT NULL,
    batter INTEGER NOT NULL,
    pitcher INTEGER NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    stand TEXT NOT NULL,
    p_throws TEXT NOT NULL,
    pitch_type TEXT,
    pitch_name TEXT,
    events TEXT,
    description TEXT,
    result_type TEXT,
    release_speed REAL,
    launch_speed REAL,
    at_bat_number INTEGER NOT NULL,
    pitch_number INTEGER NOT NULL,
    inning INTEGER NOT NULL,
    inning_topbot TEXT,
    outs_when_up INTEGER,
    bat_score INTEGER,
    fld_score INTEGER,
    post_bat_score INTEGER,
    post_fld_score INTEGER,
    FOREIGN KEY (game_pk) REFERENCES games(game_pk),
    FOREIGN KEY (batter) REFERENCES players(player_id),
    FOREIGN KEY (pitcher) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS ballparks (
    team_abbrev TEXT,
    ballpark_name TEXT,
    team_name TEXT
);

CREATE TABLE IF NOT EXISTS pitch_type_class (
    id INTEGER PRIMARY KEY, 
    pitch_type TEXT,
    pitch_name TEXT,
    is_offspeed INTEGER NOT NULL
);

-- =============================================================================
-- INSERT VALUES FOR BALLPARKS AND PITCH TYPE CLASS
INSERT INTO ballparks (team_abbrev, ballpark_name, team_name) VALUES
    ('AZ', 'Chase Field', 'Arizona Diamondbacks'),
    ('ATL', 'Truist Park', 'Atlanta Braves'),
    ('BAL', 'Oriole Park at Camden Yards', 'Baltimore Orioles'),
    ('BOS', 'Fenway Park', 'Boston Red Sox'),
    ('CHC', 'Wrigley Field', 'Chicago Cubs'),
    ('CIN', 'Great American Ball Park', 'Cincinnati Reds'),
    ('CLE', 'Progressive Field', 'Cleveland Guardians'),
    ('COL', 'Coors Field', 'Colorado Rockies'),
    ('CWS', 'Rate Field', 'Chicago White Sox'),
    ('DET', 'Comerica Park', 'Detroit Tigers'),
    ('HOU', 'Daikin Park', 'Houston Astros'),
    ('KC', 'Kauffman Stadium', 'Kansas City Royals'),
    ('LAA', 'Angel Stadium', 'Los Angeles Angels'),
    ('LAD', 'Dodger Stadium', 'Los Angeles Dodgers'),
    ('MIA', 'LoanDepot Park', 'Miami Marlins'),
    ('MIL', 'American Family Field', 'Milwaukee Brewers'),
    ('MIN', 'Target Field', 'Minnesota Twins'),
    ('NYM', 'Citi Field', 'New York Mets'),
    ('NYY', 'Yankee Stadium', 'New York Yankees'),
    ('OAK', 'Sutter Health Park', 'Athletics'),
    ('PHI', 'Citizens Bank Park', 'Philadelphia Phillies'),
    ('PIT', 'PNC Park', 'Pittsburgh Pirates'),
    ('SD', 'Petco Park', 'San Diego Padres'),
    ('SEA', 'T-Mobile Park', 'Seattle Mariners'),
    ('SF', 'Oracle Park', 'San Francisco Giants'),
    ('STL', 'Busch Stadium', 'St. Louis Cardinals'),
    ('TB', 'Tropicana Field', 'Tampa Bay Rays'),
    ('TEX', 'Globe Life Field', 'Texas Rangers'),
    ('TOR', 'Rogers Centre', 'Toronto Blue Jays'),
    ('WSH', 'Nationals Park', 'Washington Nationals');

INSERT INTO pitch_type_class (id, pitch_type, pitch_name, is_offspeed) VALUES
(1, 'FF', '4-Seam Fastball', 0),
(2, 'FC', 'Cutter', 0),
(3, 'FS', 'Splitter', 1),
(4, 'SI', 'Sinker', 0),
(5, 'ST', 'Sweeper', 1),
(6, 'EP', 'Eephus', 1),
(7, 'SL', 'Slider', 1),
(8, 'KC', 'Knuckle Curve', 1),
(9, 'CU', 'Curveball', 1),
(10, 'CH', 'Changeup', 1),
(11, 'CS', 'Slow Curve', 1),
(12, 'SV', 'Slurve', 1),
(13, 'FA','Other', 1);


-- =============================================================================

-- =============================================================================
-- PRE-AGGREGATE TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS pitcher_arsenal (
    player_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    pitch_type TEXT NOT NULL,
    pitch_name TEXT,
    usage_pct REAL NOT NULL,
    pitches INTEGER NOT NULL,
    PRIMARY KEY (player_id, year, pitch_type),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS pitcher_game_stats (
    game_pk INTEGER NOT NULL,
    pitcher INTEGER NOT NULL,
    game_date DATE NOT NULL,
    ip REAL NOT NULL,
    er INTEGER,
    k INTEGER NOT NULL,
    bb INTEGER NOT NULL,
    hbp INTEGER NOT NULL,
    hr INTEGER NOT NULL,
    pitches INTEGER NOT NULL,
    PRIMARY KEY (game_pk, pitcher),
    FOREIGN KEY (game_pk) REFERENCES games(game_pk),
    FOREIGN KEY (pitcher) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS batter_game_stats (
    game_pk INTEGER NOT NULL,
    batter INTEGER NOT NULL,
    game_date DATE NOT NULL,
    ab INTEGER NOT NULL,
    h INTEGER NOT NULL,
    doubles INTEGER NOT NULL,
    triples INTEGER NOT NULL,
    hr INTEGER NOT NULL,
    bb INTEGER NOT NULL,
    hbp INTEGER NOT NULL,
    so INTEGER NOT NULL,
    pa INTEGER NOT NULL,
    bip_count INTEGER NOT NULL,
    hard_hit_count INTEGER NOT NULL,
    ev_count INTEGER NOT NULL,
    PRIMARY KEY (game_pk, batter),
    FOREIGN KEY (game_pk) REFERENCES games(game_pk),
    FOREIGN KEY (batter) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS batter_vs_pitcher (
    batter INTEGER NOT NULL,
    pitcher INTEGER NOT NULL,
    ab INTEGER NOT NULL,
    h INTEGER NOT NULL,
    doubles INTEGER NOT NULL,
    triples INTEGER NOT NULL,
    hr INTEGER NOT NULL,
    rbi INTEGER NOT NULL,
    bb INTEGER NOT NULL,
    hbp INTEGER NOT NULL,
    so INTEGER NOT NULL,
    avg REAL NOT NULL,
    obp REAL NOT NULL,
    slg REAL NOT NULL,
    ops REAL NOT NULL,
    PRIMARY KEY (batter, pitcher),
    FOREIGN KEY (batter) REFERENCES players(player_id),
    FOREIGN KEY (pitcher) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS batter_vs_hand (
    batter INTEGER NOT NULL,
    p_throws TEXT NOT NULL,
    game_year INTEGER NOT NULL,
    ab INTEGER NOT NULL,
    h INTEGER NOT NULL,
    doubles INTEGER NOT NULL,
    triples INTEGER NOT NULL,
    hr INTEGER NOT NULL,
    rbi INTEGER NOT NULL,
    bb INTEGER NOT NULL,
    hbp INTEGER NOT NULL,
    so INTEGER NOT NULL,
    avg REAL NOT NULL,
    obp REAL NOT NULL,
    slg REAL NOT NULL,
    ops REAL NOT NULL,
    PRIMARY KEY (batter, p_throws, game_year),
    FOREIGN KEY (batter) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS batter_at_ballpark (
    batter INTEGER NOT NULL,
    home_team TEXT NOT NULL,
    game_year INTEGER NOT NULL,
    ab INTEGER NOT NULL,
    h INTEGER NOT NULL,
    doubles INTEGER NOT NULL,
    triples INTEGER NOT NULL,
    hr INTEGER NOT NULL,
    rbi INTEGER NOT NULL,
    bb INTEGER NOT NULL,
    hbp INTEGER NOT NULL,
    so INTEGER NOT NULL,
    avg REAL NOT NULL,
    obp REAL NOT NULL,
    slg REAL NOT NULL,
    ops REAL NOT NULL,
    PRIMARY KEY (batter, home_team, game_year),
    FOREIGN KEY (batter) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS batter_vs_pitcher_pitch_type (
    batter INTEGER NOT NULL,
    pitcher INTEGER NOT NULL,
    game_year INTEGER NOT NULL,
    pitch_type TEXT NOT NULL,
    ab INTEGER NOT NULL,
    h INTEGER NOT NULL,
    doubles INTEGER NOT NULL,
    triples INTEGER NOT NULL,
    hr INTEGER NOT NULL,
    rbi INTEGER NOT NULL,
    bb INTEGER NOT NULL,
    hbp INTEGER NOT NULL,
    so INTEGER NOT NULL,
    avg REAL NOT NULL,
    obp REAL NOT NULL,
    slg REAL NOT NULL,
    ops REAL NOT NULL,
    PRIMARY KEY (batter, pitcher, game_year, pitch_type),
    FOREIGN KEY (batter) REFERENCES players(player_id),
    FOREIGN KEY (pitcher) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS pitcher_vs_batter (
    pitcher INTEGER NOT NULL,
    batter INTEGER NOT NULL,
    ab INTEGER NOT NULL,
    h INTEGER NOT NULL,
    doubles INTEGER NOT NULL,
    triples INTEGER NOT NULL,
    hr INTEGER NOT NULL,
    rbi INTEGER NOT NULL,
    bb INTEGER NOT NULL,
    hbp INTEGER NOT NULL,
    so INTEGER NOT NULL,
    avg REAL NOT NULL,
    obp REAL NOT NULL,
    slg REAL NOT NULL,
    ops REAL NOT NULL,
    PRIMARY KEY (pitcher, batter),
    FOREIGN KEY (pitcher) REFERENCES players(player_id),
    FOREIGN KEY (batter) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS pitcher_vs_hand (
    pitcher INTEGER NOT NULL,
    stand TEXT NOT NULL,
    game_year INTEGER NOT NULL,
    ab INTEGER NOT NULL,
    h INTEGER NOT NULL,
    doubles INTEGER NOT NULL,
    triples INTEGER NOT NULL,
    hr INTEGER NOT NULL,
    rbi INTEGER NOT NULL,
    bb INTEGER NOT NULL,
    hbp INTEGER NOT NULL,
    so INTEGER NOT NULL,
    avg REAL NOT NULL,
    obp REAL NOT NULL,
    slg REAL NOT NULL,
    ops REAL NOT NULL,
    PRIMARY KEY (pitcher, stand, game_year),
    FOREIGN KEY (pitcher) REFERENCES players(player_id)
);

CREATE TABLE IF NOT EXISTS pitcher_at_ballpark (
    pitcher INTEGER NOT NULL,
    home_team TEXT NOT NULL,
    game_year INTEGER NOT NULL,
    ab INTEGER NOT NULL,
    h INTEGER NOT NULL,
    doubles INTEGER NOT NULL,
    triples INTEGER NOT NULL,
    hr INTEGER NOT NULL,
    rbi INTEGER NOT NULL,
    bb INTEGER NOT NULL,
    hbp INTEGER NOT NULL,
    so INTEGER NOT NULL,
    avg REAL NOT NULL,
    obp REAL NOT NULL,
    slg REAL NOT NULL,
    ops REAL NOT NULL,
    PRIMARY KEY (pitcher, home_team, game_year),
    FOREIGN KEY (pitcher) REFERENCES players(player_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Pitches: batter-centric
CREATE INDEX IF NOT EXISTS idx_pitches_batter_pitcher ON pitches(batter, pitcher);
CREATE INDEX IF NOT EXISTS idx_pitches_batter_pitcher_year ON pitches(batter, pitcher, game_year);
CREATE INDEX IF NOT EXISTS idx_pitches_batter_pthrows ON pitches(batter, p_throws);
CREATE INDEX IF NOT EXISTS idx_pitches_batter_pthrows_year ON pitches(batter, p_throws, game_year);
CREATE INDEX IF NOT EXISTS idx_pitches_batter_home ON pitches(batter, home_team);
CREATE INDEX IF NOT EXISTS idx_pitches_batter_home_year ON pitches(batter, home_team, game_year);
CREATE INDEX IF NOT EXISTS idx_pitches_batter_date ON pitches(batter, game_date DESC);

-- Pitches: pitcher-centric
CREATE INDEX IF NOT EXISTS idx_pitches_pitcher_batter ON pitches(pitcher, batter);
CREATE INDEX IF NOT EXISTS idx_pitches_pitcher_stand ON pitches(pitcher, stand);
CREATE INDEX IF NOT EXISTS idx_pitches_pitcher_stand_year ON pitches(pitcher, stand, game_year);
CREATE INDEX IF NOT EXISTS idx_pitches_pitcher_home ON pitches(pitcher, home_team);
CREATE INDEX IF NOT EXISTS idx_pitches_pitcher_home_year ON pitches(pitcher, home_team, game_year);
CREATE INDEX IF NOT EXISTS idx_pitches_pitcher_date ON pitches(pitcher, game_date DESC);

-- Pitches: game and pitch-type
CREATE INDEX IF NOT EXISTS idx_pitches_game ON pitches(game_pk);
CREATE INDEX IF NOT EXISTS idx_pitches_pitcher_pitch ON pitches(pitcher, pitch_type, game_year);

-- Pre-aggregate tables
CREATE INDEX IF NOT EXISTS idx_batter_game_stats_batter_date ON batter_game_stats(batter, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_pitcher_game_stats_pitcher_date ON pitcher_game_stats(pitcher, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_batter_vs_hand_lookup ON batter_vs_hand(batter, p_throws, game_year);
CREATE INDEX IF NOT EXISTS idx_batter_at_ballpark_lookup ON batter_at_ballpark(batter, home_team, game_year);
CREATE INDEX IF NOT EXISTS idx_pitcher_vs_hand_lookup ON pitcher_vs_hand(pitcher, stand, game_year);
CREATE INDEX IF NOT EXISTS idx_pitcher_at_ballpark_lookup ON pitcher_at_ballpark(pitcher, home_team, game_year);
CREATE INDEX IF NOT EXISTS idx_batter_vs_pitcher_pitch ON batter_vs_pitcher_pitch_type(batter, pitcher, game_year, pitch_type);
