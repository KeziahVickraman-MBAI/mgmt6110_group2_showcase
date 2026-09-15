import { AlertTriangle, CloudOff, RefreshCw, CloudRain } from "lucide-react";

interface FreshnessHeaderProps {
  readingTimestamp: string | null;
  cacheAge: number;
  minutesOld: number;
  isStale: boolean;
  weatherDegraded: boolean;
  weatherReason?: string;
  unmatchedStrings?: string[];
  isRefreshing: boolean;
  onRefresh: () => void;
  feedMode: "live" | "simulated";
}

export function FreshnessHeader({
  readingTimestamp,
  cacheAge,
  minutesOld,
  isStale,
  weatherDegraded,
  weatherReason,
  unmatchedStrings,
  isRefreshing,
  onRefresh,
  feedMode
}: FreshnessHeaderProps) {
  const formattedTime = readingTimestamp
    ? new Date(readingTimestamp).toLocaleTimeString("en-SG", {
        timeZone: "Asia/Singapore",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }) + " SGT"
    : "Reading pending";

  return (
    <header className="border-b border-stone-200 bg-stone-50/80 backdrop-blur-sm px-6 py-4">
      <div className="max-w-5xl mx-auto flex flex-col gap-2.5">
        {/* Freshness Top Line */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            <span className="font-medium text-stone-900 tracking-tight">
              Singapore Carpark Exceptions
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-stone-600">
              Last count: <span className="font-mono text-stone-800 font-semibold">{formattedTime}</span>
            </span>
            <span className="text-stone-400 text-xs font-mono">
              (cache age: {cacheAge}s, refresh: 60s)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {feedMode === "simulated" && (
              <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-medium">
                Scenario Preview
              </span>
            )}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-100 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              title="Refresh carpark and weather counts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-stone-900" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stale Warning (Trigger above 15 minutes, shown ALONGSIDE the data) */}
        {isStale && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-200/80 rounded-md text-amber-900 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Counts are {minutesOld} minutes old. Treat this as indicative.</span>
          </div>
        )}

        {/* Weather Degraded Notice */}
        {weatherDegraded ? (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-stone-100 border border-stone-300 rounded-md text-stone-800 text-sm">
            <CloudOff className="w-4 h-4 text-stone-600 shrink-0" />
            <span>{weatherReason || "Rain adjustment unavailable — deviations are unadjusted."}</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-1.5 bg-sky-50/70 border border-sky-200/80 rounded-md text-xs text-sky-950">
            <div className="flex items-center gap-2">
              <CloudRain className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span>
                <strong>Weather Normalization:</strong> NEA 2-hour localized forecasts dynamically discount baseline expected demand by up to 12% during rain.
              </span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded border border-sky-200/80 shrink-0">
              Prevents false rain alarms
            </span>
          </div>
        )}

        {/* Unmatched Forecast Vocabulary Alert */}
        {unmatchedStrings && unmatchedStrings.length > 0 && (
          <div className="text-xs text-stone-500 bg-stone-100/70 px-3 py-1.5 rounded border border-stone-200">
            <span className="font-semibold text-stone-700">Notice for developers:</span> Unmatched weather forecast vocabulary:{" "}
            <span className="font-mono text-stone-800">{unmatchedStrings.map(s => `"${s}"`).join(", ")}</span>. Factor defaulted to 1.00 and logged.
          </div>
        )}
      </div>
    </header>
  );
}
