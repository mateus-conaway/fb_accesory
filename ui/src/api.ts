const BASE_URL = "http://localhost:8000";

export interface Player {
  player_id: string;
  name_last: string;
  name_first: string;
  position: string;
  team_abbrev?: string | null;
}

export type ScheduleGame = {
  game_pk: number;
  home_name: string;
  away_name: string;
  home_abbrev: string | null;
  away_abbrev: string | null;
  home_probable_pitcher: string | null;
  away_probable_pitcher: string | null;
};

export type ScheduleResponse = {
  date: string | null;
  games: ScheduleGame[];
};

export type LineupStarter = {
  player_id: number;
  name: string;
  batting_order: string;
};

const ABBREV_ALIASES: Record<string, string[]> = {
  OAK: ["OAK", "ATH"],
  ATH: ["OAK", "ATH"],
};

function abbrevsMatch(
  playerAbbrev: string,
  gameAbbrev: string | null,
): boolean {
  if (!gameAbbrev) return false;
  const aliases = ABBREV_ALIASES[playerAbbrev] ?? [playerAbbrev];
  return aliases.includes(gameAbbrev);
}

export async function searchPlayers(name: string): Promise<Player[]> {
  const response = await fetch(`${BASE_URL}/players/search?name=${name}`);
  if (!response.ok) throw new Error("Search failed");
  return response.json();
}

export async function getPlayer(playerId: string): Promise<Player> {
  const response = await fetch(`${BASE_URL}/players/${playerId}`);
  if (!response.ok) throw new Error("Player not found");
  return response.json();
}

export async function getSchedule(): Promise<ScheduleResponse> {
  const response = await fetch(`${BASE_URL}/schedule`);
  if (!response.ok) throw new Error("Schedule unavailable");
  return response.json();
}

export async function getLineup(
  gamePk: number,
  side: "home" | "away",
): Promise<{ starters: LineupStarter[] }> {
  const params = new URLSearchParams({
    game_pk: String(gamePk),
    side,
  });
  const response = await fetch(`${BASE_URL}/stats/lineup?${params}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail =
      typeof body.detail === "string"
        ? body.detail
        : "Lineup not available yet";
    throw new Error(detail);
  }
  return response.json();
}

export type BatterStatLines = {
  season_stats: number[];
  career_vs_pitcher: number[];
  season_vs_pitcher: number[];
  career_vs_hand: number[];
  season_vs_hand: number[];
  season_vs_offspeed: number[];
  career_at_ballpark: number[];
  season_at_ballpark: number[];
};

export type PitcherStatLines = {
  era: number | null;
  career_vs_Batter_one: number[];
  career_vs_Batter_two: number[];
  career_vs_Batter_three: number[];
  career_vs_Batter_four: number[];
  career_vs_Batter_five: number[];
  career_vs_Batter_six: number[];
  career_vs_Batter_seven: number[];
  career_vs_Batter_eight: number[];
  career_vs_Batter_nine: number[];
};

export type StatLines = BatterStatLines | PitcherStatLines;

/** A player as displayed in one of the two comparison slots */
export type PlayerSlot = {
  name: string;
  stats?: StatLines;
  position?: string;
  team?: string;
};

/** Either a fully loaded player from GO, or a bare player name */
export type GoPayload =
  | string
  | { name: string; stats?: StatLines; position?: string };

export type SearchSelection = {
  player: Player;
};

export type Slot = 1 | 2;

export type HpFilter = "H" | "P";

export async function getBatterStats(
  batterId: string,
  pitcherId: string,
  hand: string,
  pitchType: string,
  ballpark: string,
): Promise<BatterStatLines> {
  const params = new URLSearchParams({
    pitcher_id: pitcherId,
    hand: hand,
    pitch_type: pitchType,
    ballpark: ballpark,
  });
  const response = await fetch(
    `${BASE_URL}/stats/Batter/${batterId}?${params}`,
  );
  if (!response.ok) throw new Error("Stats unavailable");
  return response.json();
}

export async function getPitcherStats(
  pitcherId: string,
  BatterOne: string,
  BatterTwo: string,
  BatterThree: string,
  BatterFour: string,
  BatterFive: string,
  BatterSix: string,
  BatterSeven: string,
  BatterEight: string,
  BatterNine: string,
  // gamePk: string,
): Promise<PitcherStatLines> {
  const params = new URLSearchParams({
    Batter_one: BatterOne,
    Batter_two: BatterTwo,
    Batter_three: BatterThree,
    Batter_four: BatterFour,
    Batter_five: BatterFive,
    Batter_six: BatterSix,
    Batter_seven: BatterSeven,
    Batter_eight: BatterEight,
    Batter_nine: BatterNine,
    // game_pk: gamePk,
  });
  const response = await fetch(
    `${BASE_URL}/stats/pitcher/${pitcherId}?${params}`,
  );
  if (!response.ok) throw new Error("Stats unavailable");
  return response.json();
}

export function findGameForTeam(
  games: ScheduleGame[],
  teamAbbrev: string,
): ScheduleGame | undefined {
  return games.find(
    (g) =>
      abbrevsMatch(teamAbbrev, g.home_abbrev) ||
      abbrevsMatch(teamAbbrev, g.away_abbrev),
  );
}

export function lineupSideForPitcher(
  teamAbbrev: string,
  game: ScheduleGame,
): "home" | "away" {
  if (abbrevsMatch(teamAbbrev, game.home_abbrev)) {
    return "away";
  }
  return "home";
}
