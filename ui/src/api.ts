const BASE_URL = "http://localhost:8000";

export interface Player {
  player_id: string;
  name_last: string;
  name_first: string;
  position: string;
<<<<<<< HEAD
=======
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

function abbrevsMatch(playerAbbrev: string, gameAbbrev: string | null): boolean {
  if (!gameAbbrev) return false;
  const aliases = ABBREV_ALIASES[playerAbbrev] ?? [playerAbbrev];
  return aliases.includes(gameAbbrev);
>>>>>>> pitcher_stats
}

export async function searchPlayers(name: string) {
  const response = await fetch(`${BASE_URL}/players/search?name=${name}`);
  if (!response.ok) throw new Error("Search failed");
  return response.json();
}

export async function getPlayer(playerId: string): Promise<Player> {
  const response = await fetch(`${BASE_URL}/players/${playerId}`);
  if (!response.ok) throw new Error("Player not found");
  return response.json();
}

<<<<<<< HEAD
=======
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

>>>>>>> pitcher_stats
export type HitterStatLines = {
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
<<<<<<< HEAD
=======
  era: number | null;
>>>>>>> pitcher_stats
  career_vs_hitter_one: number[];
  career_vs_hitter_two: number[];
  career_vs_hitter_three: number[];
  career_vs_hitter_four: number[];
  career_vs_hitter_five: number[];
  career_vs_hitter_six: number[];
  career_vs_hitter_seven: number[];
  career_vs_hitter_eight: number[];
  career_vs_hitter_nine: number[];
};

export async function getHitterStats(
  batterId: string,
  pitcherId: string,
  hand: string,
  pitchType: string,
  ballpark: string,
): Promise<HitterStatLines> {
  const params = new URLSearchParams({
    pitcher_id: pitcherId,
    hand,
    pitch_type: pitchType,
    ballpark,
  });
  const response = await fetch(
    `${BASE_URL}/stats/hitter/${batterId}?${params}`,
  );
  if (!response.ok) throw new Error("Stats unavailable");
  return response.json();
}

export async function getPitcherStats(
  pitcherId: string,
<<<<<<< HEAD
  hand: string,
  pitchType: string,
  ballpark: string,
=======
>>>>>>> pitcher_stats
  hitterOne: string,
  hitterTwo: string,
  hitterThree: string,
  hitterFour: string,
  hitterFive: string,
  hitterSix: string,
  hitterSeven: string,
  hitterEight: string,
  hitterNine: string,
<<<<<<< HEAD
): Promise<PitcherStatLines> {
  const params = new URLSearchParams({
    ballpark,
    hand,
    pitch_type: pitchType,
=======
  gamePk: string,
): Promise<PitcherStatLines> {
  const params = new URLSearchParams({
>>>>>>> pitcher_stats
    hitter_one: hitterOne,
    hitter_two: hitterTwo,
    hitter_three: hitterThree,
    hitter_four: hitterFour,
    hitter_five: hitterFive,
    hitter_six: hitterSix,
    hitter_seven: hitterSeven,
    hitter_eight: hitterEight,
    hitter_nine: hitterNine,
<<<<<<< HEAD
=======
    game_pk: gamePk,
>>>>>>> pitcher_stats
  });
  const response = await fetch(
    `${BASE_URL}/stats/pitcher/${pitcherId}?${params}`,
  );
<<<<<<< HEAD
  if (!response) throw new Error("Stats unavailable");
  return response.json();
}
=======
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
>>>>>>> pitcher_stats
