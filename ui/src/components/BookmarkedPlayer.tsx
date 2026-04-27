import React from "react";

export default function BookmarkedPlayer({ player, onDelete }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded bg-[#c4c4c4] border border-[#999] text-sm">
      <div className="flex flex-col leading-tight overflow-hidden">
        <span className="font-medium text-[#1a1a1a] truncate">{player.name}</span>
        <span className="text-xs text-[#444] truncate">{player.team ?? "—"}</span>
      </div>
      <button
        onClick={() => onDelete(player)}
        className="ml-2 shrink-0 px-2 py-0.5 rounded bg-[#b0b0b0] border border-[#888] text-xs font-semibold text-[#1a1a1a] hover:bg-[#9a9a9a] transition-colors"
      >
        DEL
      </button>
    </div>
  );
}
