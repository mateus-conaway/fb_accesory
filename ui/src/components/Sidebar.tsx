import React from "react";
import BookmarkedPlayer from "./BookmarkedPlayer.tsx";

export default function Sidebar({
  bookmarkedPlayers,
  hpFilter,
  onHpFilterChange,
  onDeleteBookmark,
}) {
  return (
<<<<<<< HEAD
    <aside className="w-56 shrink-0 bg-[#d4d4d4] flex flex-col border-r border-[#aaa] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#aaa]">
        <span className="font-semibold text-sm text-[#1a1a1a]">My Players</span>

        {/* H / P toggle */}
        <div className="flex ml-auto rounded overflow-hidden border border-[#888]">
          <button
            onClick={() => onHpFilterChange("H")}
            className={`px-2.5 py-0.5 text-xs font-semibold transition-colors ${
              hpFilter === "H"
                ? "bg-[#2b2b2b] text-white"
                : "bg-[#c4c4c4] text-[#1a1a1a] hover:bg-[#b0b0b0]"
=======
    <aside className="w-56 shrink-0 bg-surface rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <span className="font-semibold text-sm text-white/90">My Players</span>

        <div className="flex ml-auto rounded-full overflow-hidden border border-white/10 bg-surface-raised p-0.5">
          <button
            onClick={() => onHpFilterChange("H")}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              hpFilter === "H"
                ? "bg-accent text-black shadow-accent-glow-sm"
                : "text-white/50 hover:text-white/80"
>>>>>>> pitcher_stats
            }`}
          >
            H
          </button>
          <button
            onClick={() => onHpFilterChange("P")}
<<<<<<< HEAD
            className={`px-2.5 py-0.5 text-xs font-semibold border-l border-[#888] transition-colors ${
              hpFilter === "P"
                ? "bg-[#2b2b2b] text-white"
                : "bg-[#c4c4c4] text-[#1a1a1a] hover:bg-[#b0b0b0]"
=======
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              hpFilter === "P"
                ? "bg-accent text-black shadow-accent-glow-sm"
                : "text-white/50 hover:text-white/80"
>>>>>>> pitcher_stats
            }`}
          >
            P
          </button>
        </div>
      </div>

<<<<<<< HEAD
      {/* Bookmarked player list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 px-2 py-2">
        {bookmarkedPlayers.length === 0 ? (
          <p className="text-xs text-[#666] text-center mt-4">
=======
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 py-3">
        {bookmarkedPlayers.length === 0 ? (
          <p className="text-xs text-white/35 text-center mt-6 px-2">
>>>>>>> pitcher_stats
            No bookmarked players
          </p>
        ) : (
          bookmarkedPlayers.map((player) => (
<<<<<<< HEAD
            <BookmarkedPlayer player={player} onDelete={onDeleteBookmark} />
=======
            <BookmarkedPlayer
              key={player.name}
              player={player}
              onDelete={onDeleteBookmark}
            />
>>>>>>> pitcher_stats
          ))
        )}
      </div>
    </aside>
  );
}
