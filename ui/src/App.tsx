import React, { useState, useEffect } from "react";

import Navbar from "./components/Navbar.tsx";

import Sidebar from "./components/Sidebar.tsx";

import MainContent from "./components/MainContent.tsx";

import { getSchedule } from "./api.ts";

import type { ScheduleGame } from "./api.ts";



const STORAGE_KEY = "fb_bookmarked_players";



function loadBookmarks() {

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];

  } catch {

    return [];

  }

}



function saveBookmarks(bookmarks) {

  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));

}



export default function App() {

  const [bookmarkedPlayers, setBookmarkedPlayers] = useState(loadBookmarks);

  const [focusedSlot, setFocusedSlot] = useState(1);

  const [playerSlot1, setPlayerSlot1] = useState(null);

  const [playerSlot2, setPlayerSlot2] = useState(null);

  const [hpFilter, setHpFilter] = useState("H");

  const [selectedTeam, setSelectedTeam] = useState("");

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



  function handleBookmark(playerData) {

    if (!playerData) return;

    const alreadyBookmarked = bookmarkedPlayers.some(

      (p) => p.name === playerData.name,

    );

    if (alreadyBookmarked) return;

    setBookmarkedPlayers((prev) => [...prev, playerData]);

  }



  function handleDeleteBookmark(player) {

    setBookmarkedPlayers((prev) => prev.filter((p) => p.name !== player.name));

  }



  function handleGoClick(payload) {

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



  function handleSearchSelect(playerData) {

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

