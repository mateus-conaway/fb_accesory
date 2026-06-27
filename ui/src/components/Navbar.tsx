import React, { useState, useRef, useEffect } from "react";

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

