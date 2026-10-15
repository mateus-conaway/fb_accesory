import PlayerContainer from "./PlayerContainer.tsx";
import PlayerSearch from "./PlayerSearch.tsx";
import type {
  GoPayload,
  PlayerSlot,
  ScheduleGame,
  SearchSelection,
} from "../api.ts";

type MainContentProps = {
  playerData: PlayerSlot | null;
  onBookmark?: (player: PlayerSlot | null) => void;
  onGoClick: (payload: GoPayload) => void;
  onSearchSelect?: (selection: SearchSelection) => void;
  scheduleGames: ScheduleGame[];
  scheduleError: string | null;
};

export default function MainContent({
  playerData,
  onBookmark,
  onGoClick,
  onSearchSelect,
  scheduleGames,
  scheduleError,
}: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 gap-3 overflow-hidden">
      <PlayerSearch
        onGoClick={onGoClick}
        onSearchSelect={onSearchSelect}
        scheduleGames={scheduleGames}
        scheduleError={scheduleError}
      />

      <div className="flex flex-1 min-h-0 p-2">
        <PlayerContainer playerData={playerData} onBookmark={onBookmark} />
      </div>
    </div>
  );
}
