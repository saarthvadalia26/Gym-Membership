"use client";

import { useState } from "react";
import { formatINRCompact } from "@/lib/currency";

interface MonthDatum {
  label: string;
  paise: number;
  isForecast?: boolean;
}

interface Props {
  data: MonthDatum[];
}

export function CollectionsChart({ data }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.paise), 1);
  const total = data.reduce((acc, d) => (d.isForecast ? acc : acc + d.paise), 0);
  const forecast = data.find((d) => d.isForecast);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-soft p-6">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Collections Trend
          </h3>
          <div className="mt-1.5 text-2xl font-bold text-slate-100 tracking-tight">
            {formatINRCompact(total)}
            <span className="text-sm text-slate-500 font-normal ml-2">
              past 6 months
            </span>
          </div>
        </div>
        {forecast && (
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Forecast (next 30d)
            </div>
            <div className="mt-1.5 text-xl font-bold text-cyan-400">
              {formatINRCompact(forecast.paise)}
            </div>
          </div>
        )}
      </div>

      <div className="relative h-56">
        <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-3">
          {data.map((d, idx) => {
            const heightPct = (d.paise / max) * 100;
            const isHovered = hoverIdx === idx;
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                {isHovered && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none animate-fade-in z-10">
                    {d.label}: {formatINRCompact(d.paise)}
                  </div>
                )}
                <div className="relative w-full flex justify-center" style={{ height: `${Math.max(heightPct, 2)}%` }}>
                  <div
                    className={
                      d.isForecast
                        ? "w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-cyan-800 to-cyan-600 border-2 border-dashed border-cyan-500 transition-all"
                        : `w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all ${
                            isHovered ? "shadow-glow scale-105" : ""
                          }`
                    }
                  />
                </div>
                <div
                  className={`text-[10px] sm:text-xs font-medium ${
                    d.isForecast
                      ? "text-cyan-400"
                      : "text-slate-400"
                  }`}
                >
                  {d.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-5 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-t from-brand-600 to-brand-400" />
          <span className="text-slate-400">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cyan-800 border-2 border-dashed border-cyan-500" />
          <span className="text-slate-400">Projected</span>
        </div>
      </div>
    </div>
  );
}
