import React from "react";
import BookmarkedPlayer from "./BookmarkedPlayer.tsx";

export default function Sidebar({
  bookmarkedPlayers,
  hpFilter,
  onHpFilterChange,
  onDeleteBookmark,
}) {
  return (
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
            }`}
          >
            H
          </button>
          <button
            onClick={() => onHpFilterChange("P")}
            className={`px-2.5 py-0.5 text-xs font-semibold border-l border-[#888] transition-colors ${
              hpFilter === "P"
                ? "bg-[#2b2b2b] text-white"
                : "bg-[#c4c4c4] text-[#1a1a1a] hover:bg-[#b0b0b0]"
            }`}
          >
            P
          </button>
        </div>
      </div>

      {/* Bookmarked player list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 px-2 py-2">
        {bookmarkedPlayers.length === 0 ? (
          <p className="text-xs text-[#666] text-center mt-4">
            No bookmarked players
          </p>
        ) : (
          bookmarkedPlayers.map((player) => (
            <BookmarkedPlayer player={player} onDelete={onDeleteBookmark} />
          ))
        )}
      </div>
    </aside>
  );
}
