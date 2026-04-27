import React from "react";

export default function PlayerContainer({ playerData, onBookmark, isFocused }) {
  const displayName = playerData ? playerData.name : "Player Name";

  return (
    <div
      className={`flex flex-col flex-1 min-w-0 rounded border-2 transition-all ${
        isFocused ? "border-[#2b2b2b]" : "border-[#999] opacity-80"
      } bg-[#d4d4d4] overflow-hidden`}
    >
      {/* Player name row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#aaa] bg-[#c4c4c4]">
        <span className="font-semibold text-sm text-[#1a1a1a] truncate">{displayName}</span>
        <button
          onClick={() => onBookmark && onBookmark(playerData)}
          disabled={!playerData}
          className="ml-2 shrink-0 px-2.5 py-0.5 rounded border border-[#888] bg-[#b8b8b8] text-xs font-semibold text-[#1a1a1a] hover:bg-[#a0a0a0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          BB
        </button>
      </div>

      {/* Statlines panel (~35% height) */}
      <div className="flex flex-col border-b border-[#aaa] bg-[#c4c4c4]" style={{ flex: "0 0 35%" }}>
        <span className="px-3 pt-2 text-xs font-semibold text-[#1a1a1a]">Statlines</span>
      </div>

      {/* Trends panel (~65% height) */}
      <div className="flex flex-col flex-1 bg-[#c4c4c4]">
        <span className="px-3 pt-2 text-xs font-semibold text-[#1a1a1a]">Trends</span>
      </div>
    </div>
  );
}
