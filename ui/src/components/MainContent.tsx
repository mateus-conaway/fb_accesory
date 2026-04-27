import React from "react";
import PlayerContainer from "./PlayerContainer.tsx";

export default function MainContent({
  focusedSlot,
  onFocusChange,
  playerSlot1,
  playerSlot2,
  onBookmark,
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#d4d4d4] p-3 gap-3 overflow-hidden">
      {/* Focus toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onFocusChange(1)}
          className={`w-8 h-8 rounded border font-semibold text-sm transition-colors ${
            focusedSlot === 1
              ? "bg-[#2b2b2b] text-white border-[#2b2b2b]"
              : "bg-[#c4c4c4] text-[#1a1a1a] border-[#888] hover:bg-[#b0b0b0]"
          }`}
        >
          1
        </button>
        <button
          onClick={() => onFocusChange(2)}
          className={`w-8 h-8 rounded border font-semibold text-sm transition-colors ${
            focusedSlot === 2
              ? "bg-[#2b2b2b] text-white border-[#2b2b2b]"
              : "bg-[#c4c4c4] text-[#1a1a1a] border-[#888] hover:bg-[#b0b0b0]"
          }`}
        >
          2
        </button>
      </div>

      {/* Side-by-side player containers */}
      <div className="flex flex-1 gap-3 min-h-0">
        <PlayerContainer
          playerData={playerSlot1}
          onBookmark={onBookmark}
          isFocused={focusedSlot === 1}
        />
        <PlayerContainer
          playerData={playerSlot2}
          onBookmark={onBookmark}
          isFocused={focusedSlot === 2}
        />
      </div>
    </div>
  );
}
