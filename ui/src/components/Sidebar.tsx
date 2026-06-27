import React from "react";
import BookmarkedPlayer from "./BookmarkedPlayer.tsx";

export default function Sidebar({
  bookmarkedPlayers,
  hpFilter,
  onHpFilterChange,
  onDeleteBookmark,
}) {
  return (
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
            }`}
          >
            H
          </button>
          <button
            onClick={() => onHpFilterChange("P")}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
              hpFilter === "P"
                ? "bg-accent text-black shadow-accent-glow-sm"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            P
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 py-3">
        {bookmarkedPlayers.length === 0 ? (
          <p className="text-xs text-white/35 text-center mt-6 px-2">
            No bookmarked players
          </p>
        ) : (
          bookmarkedPlayers.map((player) => (
            <BookmarkedPlayer
              key={player.name}
              player={player}
              onDelete={onDeleteBookmark}
            />
          ))
        )}
      </div>
    </aside>
  );
}
