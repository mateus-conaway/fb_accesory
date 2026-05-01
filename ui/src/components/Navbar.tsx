import React, { useState, useRef, useEffect } from "react";
import { searchPlayers } from "../api.ts";
import { getPlayerStats } from "../api.ts";
import type { Player } from "../api.ts";

const MLB_TEAMS = [
  { abbrev: "AZ", name: "Arizona Diamondbacks" },
  { abbrev: "ATL", name: "Atlanta Braves" },
  { abbrev: "BAL", name: "Baltimore Orioles" },
  { abbrev: "BOS", name: "Boston Red Sox" },
  { abbrev: "CHC", name: "Chicago Cubs" },
  { abbrev: "CIN", name: "Cincinnati Reds" },
  { abbrev: "CLE", name: "Cleveland Guardians" },
  { abbrev: "COL", name: "Colorado Rockies" },
  { abbrev: "CWS", name: "Chicago White Sox" },
  { abbrev: "DET", name: "Detroit Tigers" },
  { abbrev: "HOU", name: "Houston Astros" },
  { abbrev: "KC", name: "Kansas City Royals" },
  { abbrev: "LAA", name: "Los Angeles Angels" },
  { abbrev: "LAD", name: "Los Angeles Dodgers" },
  { abbrev: "MIA", name: "Miami Marlins" },
  { abbrev: "MIL", name: "Milwaukee Brewers" },
  { abbrev: "MIN", name: "Minnesota Twins" },
  { abbrev: "NYM", name: "New York Mets" },
  { abbrev: "NYY", name: "New York Yankees" },
  { abbrev: "OAK", name: "Athletics" },
  { abbrev: "PHI", name: "Philadelphia Phillies" },
  { abbrev: "PIT", name: "Pittsburgh Pirates" },
  { abbrev: "SD", name: "San Diego Padres" },
  { abbrev: "SEA", name: "Seattle Mariners" },
  { abbrev: "SF", name: "San Francisco Giants" },
  { abbrev: "STL", name: "St. Louis Cardinals" },
  { abbrev: "TB", name: "Tampa Bay Rays" },
  { abbrev: "TEX", name: "Texas Rangers" },
  { abbrev: "TOR", name: "Toronto Blue Jays" },
  { abbrev: "WSH", name: "Washington Nationals" },
];

function SearchBar({ onSelectPlayer }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    const results = await searchPlayers(val);
    setSuggestions(results);

    //   const lower = val.toLowerCase();
    //   const matches = PLAYER_STUB.filter((name) =>
    //     name.toLowerCase().includes(lower),
    //   ).slice(0, 10);
    //   setSuggestions(matches);
    //
  }

  function handleSelect(player: Player) {
    setQuery(`${player.name_first} ${player.name_last}`);
    setSuggestions([]);
    if (onSelectPlayer) onSelectPlayer({ player });
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0 max-w-lg">
      <input
        type="text"
        value={query}
        onChange={handleInput}
        placeholder="Search Bar"
        className="w-full h-9 px-3 rounded bg-[#d4d4d4] text-[#1a1a1a] placeholder-[#6b6b6b] text-sm focus:outline-none"
      />
      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 z-50 bg-[#2b2b2b] border border-[#555] rounded mt-1 max-h-64 overflow-y-auto">
          {suggestions.map((player) => (
            <li
              key={player.player_id}
              onMouseDown={() => handleSelect(player)}
              className="px-3 py-2 text-sm text-white cursor-pointer hover:bg-[#444]"
            >
              {player.name_first} {player.name_last}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Navbar({
  selectedTeam,
  onTeamChange,
  onGoClick,
  onSearchSelect,
}) {
  const [selectedPlayer, setSelectedPlayer] = useState("");

  function handleTeamChange(e) {
    onTeamChange(e.target.value);
    setSelectedPlayer("");
  }

  return (
    <nav className="flex items-center gap-3 px-4 py-2 bg-[#2b2b2b] w-full">
      {/* Brand slot — fixed width matching sidebar */}
      <div className="w-56 shrink-0 text-white font-semibold text-base leading-tight">
        Fantasy Scout Report
      </div>

      <SearchBar onSelectPlayer={onSearchSelect} />

      {/* Team dropdown */}
      <select
        value={selectedTeam}
        onChange={handleTeamChange}
        className="h-9 px-2 rounded bg-[#d4d4d4] text-[#1a1a1a] text-sm focus:outline-none cursor-pointer"
      >
        <option value="">Team</option>
        {MLB_TEAMS.map((t) => (
          <option key={t.abbrev} value={t.abbrev}>
            {t.abbrev} — {t.name}
          </option>
        ))}
      </select>

      {/* Player dropdown */}
      <select
        value={selectedPlayer}
        onChange={(e) => setSelectedPlayer(e.target.value)}
        disabled={!selectedTeam}
        className="h-9 px-2 rounded bg-[#d4d4d4] text-[#1a1a1a] text-sm focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Player</option>
        {/* Roster options populated in a future update */}
      </select>

      {/* GO button */}
      <button
        onClick={() => onGoClick(selectedPlayer)}
        disabled={!selectedPlayer}
        className="h-9 px-4 rounded bg-[#d4d4d4] text-[#1a1a1a] text-sm font-semibold hover:bg-[#bcbcbc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        GO
      </button>

      {/* Account button */}
      <button
        className="w-9 h-9 rounded-full bg-[#d4d4d4] text-[#1a1a1a] text-sm font-semibold hover:bg-[#bcbcbc] transition-colors shrink-0 ml-auto"
        aria-label="Account"
      />
    </nav>
  );
}
