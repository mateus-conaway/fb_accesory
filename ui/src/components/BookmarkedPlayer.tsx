import React from "react";

export default function BookmarkedPlayer({ player, onDelete }) {
  return (
<<<<<<< HEAD
    <div className="flex items-center justify-between px-2 py-1.5 rounded bg-[#c4c4c4] border border-[#999] text-sm">
      <div className="flex flex-col leading-tight overflow-hidden">
        <span className="font-medium text-[#1a1a1a] truncate">{player.name}</span>
        <span className="text-xs text-[#444] truncate">{player.team ?? "—"}</span>
      </div>
      <button
        onClick={() => onDelete(player)}
        className="ml-2 shrink-0 px-2 py-0.5 rounded bg-[#b0b0b0] border border-[#888] text-xs font-semibold text-[#1a1a1a] hover:bg-[#9a9a9a] transition-colors"
=======
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
>>>>>>> pitcher_stats
      >
        DEL
      </button>
    </div>
  );
}
