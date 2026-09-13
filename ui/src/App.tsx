import { useState, useEffect } from "react";

import Navbar from "./components/Navbar.tsx";

import Sidebar from "./components/Sidebar.tsx";

import MainContent from "./components/MainContent.tsx";

import { getSchedule } from "./api.ts";

import type {
  GoPayload,
  HpFilter,
  PlayerSlot,
  ScheduleGame,
  SearchSelection,
  Slot,
} from "./api.ts";



const STORAGE_KEY = "fb_bookmarked_players";



function loadBookmarks(): PlayerSlot[] {

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? (parsed as PlayerSlot[]) : [];

  } catch {

    return [];

  }

}



function saveBookmarks(bookmarks: PlayerSlot[]) {

  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));

}



export default function App() {

  const [bookmarkedPlayers, setBookmarkedPlayers] =
    useState<PlayerSlot[]>(loadBookmarks);

  const [focusedSlot, setFocusedSlot] = useState<Slot>(1);

  const [playerSlot1, setPlayerSlot1] = useState<PlayerSlot | null>(null);

  const [playerSlot2, setPlayerSlot2] = useState<PlayerSlot | null>(null);

  const [hpFilter, setHpFilter] = useState<HpFilter>("H");

  const [selectedTeam] = useState("");

  const [scheduleGames, setScheduleGames] = useState<ScheduleGame[]>([]);

  const [scheduleError, setScheduleError] = useState<string | null>(null);



  useEffect(() => {

    saveBookmarks(bookmarkedPlayers);

  }, [bookmarkedPlayers]);



  useEffect(() => {

    getSchedule()

      .then((data) => {

        setScheduleGames(data.games);

        setScheduleError(null);

      })

      .catch(() => {

        setScheduleGames([]);

        setScheduleError("Schedule unavailable");

      });

  }, []);



  function handleBookmark(playerData: PlayerSlot | null) {

    if (!playerData) return;

    const alreadyBookmarked = bookmarkedPlayers.some(

      (p) => p.name === playerData.name,

    );

    if (alreadyBookmarked) return;

    setBookmarkedPlayers((prev) => [...prev, playerData]);

  }



  function handleDeleteBookmark(player: PlayerSlot) {

    setBookmarkedPlayers((prev) => prev.filter((p) => p.name !== player.name));

  }



  function handleGoClick(payload: GoPayload | null) {

    if (!payload) return;

    if (typeof payload === "object" && payload.stats) {

      const playerData = {

        name: payload.name,

        stats: payload.stats,

        position: payload.position,

      };

      if (focusedSlot === 1) {

        setPlayerSlot1(playerData);

      } else {

        setPlayerSlot2(playerData);

      }

      return;

    }

    if (typeof payload === "string" && payload) {

      const playerData = { name: payload, team: selectedTeam };

      if (focusedSlot === 1) {

        setPlayerSlot1(playerData);

      } else {

        setPlayerSlot2(playerData);

      }

    }

  }



  function handleSearchSelect({ player }: SearchSelection) {

    const playerData: PlayerSlot = {

      name: `${player.name_first} ${player.name_last}`,

      position: player.position,

      team: player.team_abbrev ?? undefined,

    };

    if (focusedSlot === 1) {

      setPlayerSlot1(playerData);

    } else {

      setPlayerSlot2(playerData);

    }

  }



  return (

    <div className="flex flex-col h-screen bg-canvas overflow-hidden">

      <Navbar

        onGoClick={handleGoClick}

        onSearchSelect={handleSearchSelect}

        scheduleGames={scheduleGames}

        scheduleError={scheduleError}

      />



      <div className="flex flex-1 min-h-0 p-3 gap-3">

        <Sidebar

          bookmarkedPlayers={bookmarkedPlayers}

          hpFilter={hpFilter}

          onHpFilterChange={setHpFilter}

          onDeleteBookmark={handleDeleteBookmark}

        />



        <MainContent

          focusedSlot={focusedSlot}

          onFocusChange={setFocusedSlot}

          playerSlot1={playerSlot1}

          playerSlot2={playerSlot2}

          onBookmark={handleBookmark}

        />

      </div>

    </div>

  );

}

