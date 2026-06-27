import React from "react";

import type { HitterStatLines } from "../api.ts";

import type { PitcherStatLines } from "../api.ts";

const HITTER_STATLINE_KEYS: (keyof HitterStatLines)[] = [
  "season_stats",

  "career_vs_pitcher",

  "season_vs_pitcher",

  "career_vs_hand",

  "season_vs_hand",

  "season_vs_offspeed",

  "career_at_ballpark",

  "season_at_ballpark",
];

const PITCHER_STATLINE_KEYS: (keyof PitcherStatLines)[] = [
  "era",

  "career_vs_hitter_one",

  "career_vs_hitter_two",

  "career_vs_hitter_three",

  "career_vs_hitter_four",

  "career_vs_hitter_five",

  "career_vs_hitter_six",

  "career_vs_hitter_seven",

  "career_vs_hitter_eight",

  "career_vs_hitter_nine",
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

  return [
    `${avg.toFixed(3)}: ${hits}/${ab}`,

    `Outcome Breakdown: ${single} singles, ${double} doubles, ${triples} triples, ${home_run} home runs, ${rbi} RBIs, ${bb} BBs, ${hbp} HBPs, ${k} Ks`,

    `OBP/SLG/OPS: ${obp.toFixed(3)}/${slg.toFixed(3)}/${ops.toFixed(3)}`,
  ];
}

export default function PlayerContainer({ playerData, onBookmark, isFocused }) {
  const displayName = playerData ? playerData.name : "Player Name";

  const position = playerData?.position;

  const stats =
    position === "Hitter"
      ? (playerData?.stats as HitterStatLines | undefined)
      : (playerData?.stats as PitcherStatLines | undefined);

  const keys =
    position === "Hitter" ? HITTER_STATLINE_KEYS : PITCHER_STATLINE_KEYS;

  return (
    <div
      className={`flex flex-col flex-1 min-w-0 rounded-2xl border transition-all overflow-hidden shadow-card ${
        isFocused
          ? "border-accent/60 shadow-accent-glow bg-surface"
          : "border-white/10 bg-surface opacity-75"
      }`}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-white/10 ${
          isFocused ? "bg-surface-card" : "bg-surface-raised"
        }`}
      >
        <span className="font-semibold text-sm text-white/90 truncate">
          {displayName}
        </span>

        <button
          onClick={() => onBookmark && onBookmark(playerData)}
          disabled={!playerData}
          className="ml-2 shrink-0 px-3 py-1 rounded-full border border-white/10 bg-surface-raised text-xs font-semibold text-white/60 hover:text-accent hover:border-accent/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          BB
        </button>
      </div>

      <div
        className="flex flex-col border-b border-white/10 bg-surface-raised min-h-0"
        style={{ flex: "0 0 35%" }}
      >
        <span className="px-4 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest text-white/35 uppercase shrink-0">
          Statlines
        </span>

        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3">
          {!stats ? (
            <p className="text-xs text-white/35">
              Select a player and click GO
            </p>
          ) : (
            keys.map((key) => {
              if (key === "era") {
                const era = (stats as PitcherStatLines).era;

                return (
                  <div
                    key={key}
                    className="rounded-xl bg-surface-card border border-white/5 px-3 py-2"
                  >
                    <div className="text-[10px] font-semibold tracking-wide text-accent/80 uppercase mb-1">
                      {key}
                    </div>

                    <div className="text-xs text-white/70 leading-snug">
                      {era != null ? era.toFixed(2) : "—"}
                    </div>
                  </div>
                );
              }

              const arr = stats[key] as number[] | undefined;

              if (!arr || !Array.isArray(arr)) return null;

              const lines = formatStatline(arr);

              return (
                <div
                  key={key}
                  className="rounded-xl bg-surface-card border border-white/5 px-3 py-2"
                >
                  <div className="text-[10px] font-semibold tracking-wide text-accent/80 uppercase mb-1">
                    {key.replace(/_/g, " ")}
                  </div>

                  {lines.map((line) => (
                    <div
                      key={line.slice(0, 20)}
                      className="text-xs text-white/60 leading-snug"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 bg-surface">
        <span className="px-4 pt-3 text-[10px] font-semibold tracking-widest text-white/35 uppercase">
          Trends
        </span>

        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-white/25">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
