import PlayerContainer from "./PlayerContainer.tsx";
import type { PlayerSlot, Slot } from "../api.ts";

const SLOTS: Slot[] = [1, 2];

type MainContentProps = {
  focusedSlot: Slot;
  onFocusChange: (slot: Slot) => void;
  playerSlot1: PlayerSlot | null;
  playerSlot2: PlayerSlot | null;
  onBookmark?: (player: PlayerSlot | null) => void;
};

export default function MainContent({
  focusedSlot,
  onFocusChange,
  playerSlot1,
  playerSlot2,
  onBookmark,
}: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 gap-3 overflow-hidden">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-semibold tracking-widest text-white/35 uppercase mr-1">
          Active Slot
        </span>
        {SLOTS.map((slot) => (
          <button
            key={slot}
            onClick={() => onFocusChange(slot)}
            className={`w-9 h-9 rounded-xl font-semibold text-sm transition-all ${
              focusedSlot === slot
                ? "bg-accent text-black shadow-accent-glow"
                : "bg-surface-raised text-white/50 border border-white/10 hover:border-white/20 hover:text-white/80"
            }`}
          >
            {slot}
          </button>
        ))}
      </div>

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
