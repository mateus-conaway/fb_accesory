const BASE_URL = "http://localhost:8000";

export interface Player {
  player_id: string;
  name_last: string;
  name_first: string;
  position: string;
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
  hand: string,
  pitchType: string,
  ballpark: string,
  hitterOne: string,
  hitterTwo: string,
  hitterThree: string,
  hitterFour: string,
  hitterFive: string,
  hitterSix: string,
  hitterSeven: string,
  hitterEight: string,
  hitterNine: string,
): Promise<PitcherStatLines> {
  const params = new URLSearchParams({
    ballpark,
    hand,
    pitch_type: pitchType,
    hitter_one: hitterOne,
    hitter_two: hitterTwo,
    hitter_three: hitterThree,
    hitter_four: hitterFour,
    hitter_five: hitterFive,
    hitter_six: hitterSix,
    hitter_seven: hitterSeven,
    hitter_eight: hitterEight,
    hitter_nine: hitterNine,
  });
  const response = await fetch(
    `${BASE_URL}/stats/pitcher/${pitcherId}?${params}`,
  );
  if (!response) throw new Error("Stats unavailable");
  return response.json();
}
