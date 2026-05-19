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

export async function getPlayer(playerId: string) {
  const response = await fetch(`${BASE_URL}/players/${playerId}`);
  if (!response.ok) throw new Error("Player not found");
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

export async function getPlayerStats(
  batterId: string,
  pitcherId: string,
  hand: string,
  pitchType: string,
  ballpark: string,
): Promise<BatterStatLines> {
  const params = new URLSearchParams({
    pitcher_id: pitcherId,
    hand,
    pitch_type: pitchType,
    ballpark,
  });
  const response = await fetch(`${BASE_URL}/stats/${batterId}?${params}`);
  if (!response.ok) throw new Error("Stats unavailable");
  return response.json();
}
