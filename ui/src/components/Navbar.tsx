import React, { useState, useRef, useEffect } from "react";
<<<<<<< HEAD
import { getHitterStats, getPitcherStats, searchPlayers } from "../api.ts";
import type { HitterStatLines, PitcherStatLines, Player } from "../api.ts";

/** Placeholder context until starting pitcher / park come from schedule data */
const TEST_PITCHER_ID = "656492";
const TEST_HAND = "R";
const TEST_PITCH_TYPE = "CH";
const TEST_BALLPARK = "NYY";
const TEST_ONE = "701807";
const TEST_TWO = "666182";
const TEST_THREE = "665742";
const TEST_FOUR = "668901";
const TEST_FIVE = "543760";
const TEST_SIX = "621438";
const TEST_SEVEN = "703492";
const TEST_EIGHT = "683146";
const TEST_NINE = "620443";

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

export default function Navbar({ onGoClick, onSearchSelect }) {
  const [selectedSearchPlayer, setSelectedSearchPlayer] =
    useState<Player | null>(null);
  const [goLoading, setGoLoading] = useState(false);

  const playerIdForGo = selectedSearchPlayer?.player_id || "";

  async function handleGoClick() {
    let stats: HitterStatLines | PitcherStatLines;
    if (!playerIdForGo) return;
    setGoLoading(true);
    try {
      console.log(selectedSearchPlayer.position);
      stats =
        selectedSearchPlayer.position === "Hitter"
          ? await getHitterStats(
              String(playerIdForGo),
              TEST_PITCHER_ID,
              TEST_HAND,
              TEST_PITCH_TYPE,
              TEST_BALLPARK,
            )
          : await getPitcherStats(
              String(playerIdForGo),
              TEST_BALLPARK,
              TEST_HAND,
              TEST_PITCH_TYPE,
              TEST_ONE,
              TEST_TWO,
              TEST_THREE,
              TEST_FOUR,
              TEST_FIVE,
              TEST_SIX,
              TEST_SEVEN,
              TEST_EIGHT,
              TEST_NINE,
            );
      const displayName = selectedSearchPlayer
        ? `${selectedSearchPlayer.name_first} ${selectedSearchPlayer.name_last}`
        : String(playerIdForGo);
      onGoClick({
        name: displayName,
        stats,
        position: selectedSearchPlayer.position,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setGoLoading(false);
    }
  }

  return (
    <nav className="flex items-center gap-3 px-4 py-2 bg-[#2b2b2b] w-full">
      {/* Brand slot — fixed width matching sidebar */}
      <div className="w-56 shrink-0 text-white font-semibold text-base leading-tight">
        Fantasy Scout Report
      </div>

      <SearchBar
        onSelectPlayer={(data) => {
          setSelectedSearchPlayer(data.player);
          if (onSearchSelect) onSearchSelect(data);
        }}
      />

      {/* GO button */}
      <button
        type="button"
        onClick={() => void handleGoClick()}
        // disabled={!batterIdForGo || goLoading}
        className="h-9 px-4 rounded bg-[#d4d4d4] text-[#1a1a1a] text-sm font-semibold hover:bg-[#bcbcbc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {goLoading ? "…" : "GO"}
      </button>

      {/* Account button */}
      <button
        className="w-9 h-9 rounded-full bg-[#d4d4d4] text-[#1a1a1a] text-sm font-semibold hover:bg-[#bcbcbc] transition-colors shrink-0 ml-auto"
        aria-label="Account"
      />
    </nav>
  );
}
=======

import {

  getHitterStats,

  getPitcherStats,

  getLineup,

  searchPlayers,

  findGameForTeam,

  lineupSideForPitcher,

} from "../api.ts";

import type {

  HitterStatLines,

  PitcherStatLines,

  Player,

  ScheduleGame,

} from "../api.ts";



/** Placeholder context until starting pitcher / park come from schedule data */

const TEST_PITCHER_ID = "656492";

const TEST_HAND = "R";

const TEST_PITCH_TYPE = "CH";

const TEST_BALLPARK = "NYY";



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

  }



  function handleSelect(player: Player) {

    setQuery(`${player.name_first} ${player.name_last}`);

    setSuggestions([]);

    if (onSelectPlayer) onSelectPlayer({ player });

  }



  return (

    <div ref={wrapperRef} className="relative flex-1 min-w-0 max-w-xl mx-auto">

      <div className="relative">

        <svg

          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none"

          fill="none"

          stroke="currentColor"

          viewBox="0 0 24 24"

        >

          <path

            strokeLinecap="round"

            strokeLinejoin="round"

            strokeWidth={2}

            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"

          />

        </svg>

        <input

          type="text"

          value={query}

          onChange={handleInput}

          placeholder="Search players…"

          className="w-full h-10 pl-10 pr-4 rounded-full bg-surface-raised border border-white/10 text-white placeholder-white/35 text-sm focus:outline-none focus:border-accent/50 focus:shadow-accent-glow-sm transition-all"

        />

      </div>

      {suggestions.length > 0 && (

        <ul className="absolute top-full left-0 right-0 z-[100] bg-surface-overlay border-2 border-white/25 rounded-2xl mt-2 max-h-64 overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.85)]">

          {suggestions.map((player) => (

            <li

              key={player.player_id}

              onMouseDown={() => handleSelect(player)}

              className="px-4 py-2.5 text-sm text-white bg-surface-overlay cursor-pointer hover:bg-surface-hover first:rounded-t-2xl last:rounded-b-2xl transition-colors"

            >

              {player.name_first} {player.name_last}

            </li>

          ))}

        </ul>

      )}

    </div>

  );

}



type NavbarProps = {

  onGoClick: (payload: unknown) => void;

  onSearchSelect?: (data: unknown) => void;

  scheduleGames: ScheduleGame[];

  scheduleError: string | null;

};



export default function Navbar({

  onGoClick,

  onSearchSelect,

  scheduleGames,

  scheduleError,

}: NavbarProps) {

  const [selectedSearchPlayer, setSelectedSearchPlayer] =

    useState<Player | null>(null);

  const [goLoading, setGoLoading] = useState(false);

  const [goError, setGoError] = useState<string | null>(null);



  const playerIdForGo = selectedSearchPlayer?.player_id || "";



  async function handleGoClick() {

    if (!playerIdForGo || !selectedSearchPlayer) return;

    setGoLoading(true);

    setGoError(null);

    try {

      let stats: HitterStatLines | PitcherStatLines;

      if (selectedSearchPlayer.position === "Hitter") {

        stats = await getHitterStats(

          String(playerIdForGo),

          TEST_PITCHER_ID,

          TEST_HAND,

          TEST_PITCH_TYPE,

          TEST_BALLPARK,

        );

      } else {

        const teamAbbrev = selectedSearchPlayer.team_abbrev;

        if (!teamAbbrev) {

          throw new Error(

            "Player team not set — run statcast ingest for team data",

          );

        }

        if (scheduleGames.length === 0) {

          throw new Error(scheduleError ?? "No games on today's schedule");

        }

        const game = findGameForTeam(scheduleGames, teamAbbrev);

        if (!game) {

          throw new Error(`No game found for team ${teamAbbrev} today`);

        }

        const side = lineupSideForPitcher(teamAbbrev, game);

        const { starters } = await getLineup(game.game_pk, side);

        const ids = starters.map((s) => String(s.player_id));

        stats = await getPitcherStats(

          String(playerIdForGo),

          ids[0],

          ids[1],

          ids[2],

          ids[3],

          ids[4],

          ids[5],

          ids[6],

          ids[7],

          ids[8],

          String(game.game_pk),

        );

      }

      const displayName = `${selectedSearchPlayer.name_first} ${selectedSearchPlayer.name_last}`;

      onGoClick({

        name: displayName,

        stats,

        position: selectedSearchPlayer.position,

      });

    } catch (err) {

      const message = err instanceof Error ? err.message : "GO failed";

      setGoError(message);

      console.error(err);

    } finally {

      setGoLoading(false);

    }

  }



  return (

    <nav className="flex items-center gap-4 px-5 py-3 bg-canvas border-b border-white/10 w-full">

      <div className="w-12 h-10 shrink-0 flex items-center justify-center rounded-xl bg-surface-raised border border-white/10 text-accent font-bold text-sm tracking-wide">

        FS

      </div>



      <div className="hidden sm:block w-44 shrink-0 text-white/90 font-semibold text-sm leading-tight">

        Fantasy Scout Report

      </div>



      <SearchBar

        onSelectPlayer={(data) => {

          setSelectedSearchPlayer(data.player);

          setGoError(null);

          if (onSearchSelect) onSearchSelect(data);

        }}

      />



      {goError && (

        <span

          className="text-xs text-red-400/90 truncate max-w-xs"

          title={goError}

        >

          {goError}

        </span>

      )}



      <button

        type="button"

        onClick={() => void handleGoClick()}

        disabled={goLoading || !playerIdForGo}

        className="h-10 px-6 rounded-full bg-white text-neutral-900 text-sm font-bold border-2 border-white/90 hover:bg-neutral-100 disabled:bg-neutral-600 disabled:text-neutral-300 disabled:border-neutral-500 disabled:cursor-not-allowed transition-all shadow-md shrink-0"

      >

        {goLoading ? "…" : "GO"}

      </button>



      <button

        className="w-10 h-10 rounded-full bg-surface-raised border border-white/10 hover:border-white/20 transition-colors shrink-0 ml-auto"

        aria-label="Account"

      />

    </nav>

  );

}

>>>>>>> pitcher_stats
