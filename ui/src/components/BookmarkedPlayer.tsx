import React from "react";

export default function BookmarkedPlayer({ player, onDelete }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-raised border border-white/10 text-sm hover:border-white/15 transition-colors">
      <div className="flex flex-col leading-tight overflow-hidden">
        <span className="font-medium text-white/90 truncate">{player.name}</span>
        <span className="text-xs text-white/40 truncate mt-0.5">
          {player.team ?? "—"}
        </span>
      </div>
      <button
        onClick={() => onDelete(player)}
        className="ml-2 shrink-0 px-2 py-1 rounded-lg bg-surface-card border border-white/10 text-[10px] font-semibold text-white/50 hover:text-red-400 hover:border-red-400/30 transition-colors"
      >
        DEL
      </button>
    </div>
  );
}
