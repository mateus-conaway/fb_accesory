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
