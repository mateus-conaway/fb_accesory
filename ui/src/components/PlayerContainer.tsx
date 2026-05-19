import React from "react";
import type { BatterStatLines } from "../api.ts";

const STATLINE_KEYS: (keyof BatterStatLines)[] = [
  "season_stats",
  "career_vs_pitcher",
  "season_vs_pitcher",
  "career_vs_hand",
  "season_vs_hand",
  "season_vs_offspeed",
  "career_at_ballpark",
  "season_at_ballpark",
];

/** [ab, pa, hits, bb, hbp, k, single, double, triples, home_run, rbi, avg, obp, slg, ops] */
function formatStatline(arr: number[]): string[] {
  const ab = arr[0] ?? 0;
  const hits = arr[2] ?? 0;
  const bb = arr[3] ?? 0;
  const hbp = arr[4] ?? 0;
  const k = arr[5] ?? 0;
  const single = arr[6] ?? 0;
  const double = arr[7] ?? 0;
  const triples = arr[8] ?? 0;
  const home_run = arr[9] ?? 0;
  const rbi = arr[10] ?? 0;
  const avg = arr[11] ?? 0;
  const obp = arr[12] ?? 0;
  const slg = arr[13] ?? 0;
  const ops = arr[14] ?? 0;

  // return `${hits}/${ab}, ${single} 1B, ${double} 2B, ${triples} 3B, ${home_run} HR, ${rbi} RBI, ${bb} BB, ${hbp} HBP, ${k} K, ${avg.toFixed(3)} AVG, ${obp.toFixed(3)}/${slg.toFixed(3)}/${ops.toFixed(3)}`;
  return [
    `${avg.toFixed(3)}: ${hits}/${ab}`,
    `Outcome Breakdown: ${single} singles, ${double} doubles, ${triples} triples, ${home_run} home runs, ${rbi} RBIs, ${bb} BBs, ${hbp} HBPs, ${k} Ks`,
    `OBP/SLG/OPS: ${obp.toFixed(3)}/${slg.toFixed(3)}/${ops.toFixed(3)}`,
  ];
}

export default function PlayerContainer({ playerData, onBookmark, isFocused }) {
  const displayName = playerData ? playerData.name : "Player Name";
  const stats = playerData?.stats as BatterStatLines | undefined;

  return (
    <div
      className={`flex flex-col flex-1 min-w-0 rounded border-2 transition-all ${
        isFocused ? "border-[#2b2b2b]" : "border-[#999] opacity-80"
      } bg-[#d4d4d4] overflow-hidden`}
    >
      {/* Player name row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#aaa] bg-[#c4c4c4]">
        <span className="font-semibold text-sm text-[#1a1a1a] truncate">
          {displayName}
        </span>
        <button
          onClick={() => onBookmark && onBookmark(playerData)}
          disabled={!playerData}
          className="ml-2 shrink-0 px-2.5 py-0.5 rounded border border-[#888] bg-[#b8b8b8] text-xs font-semibold text-[#1a1a1a] hover:bg-[#a0a0a0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          BB
        </button>
      </div>

      {/* Statlines panel (~35% height) */}
      <div
        className="flex flex-col border-b border-[#aaa] bg-[#c4c4c4] min-h-0"
        style={{ flex: "0 0 35%" }}
      >
        <span className="px-3 pt-2 pb-1 text-xs font-semibold text-[#1a1a1a] shrink-0">
          Statlines
        </span>
        <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-2">
          {!stats ? (
            <p className="text-xs text-[#555]">Select a player and click GO</p>
          ) : (
            STATLINE_KEYS.map((key) => {
              const arr = stats[key];
              if (!arr) return null;
              return (
                <div key={key}>
                  <div className="text-xs font-semibold text-[#1a1a1a]">
                    {key}
                  </div>
                  <div className="text-xs text-[#333] leading-snug">
                    {formatStatline(arr)[0]}
                  </div>
                  <div className="text-xs text-[#333] leading-snug">
                    {formatStatline(arr)[1]}
                  </div>
                  <div className="text-xs text-[#333] leading-snug">
                    {formatStatline(arr)[2]}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Trends panel (~65% height) */}
      <div className="flex flex-col flex-1 bg-[#c4c4c4]">
        <span className="px-3 pt-2 text-xs font-semibold text-[#1a1a1a]">
          Trends
        </span>
      </div>
    </div>
  );
}
