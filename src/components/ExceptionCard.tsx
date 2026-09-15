import { EvaluatedSite } from "../types";
import { ArrowDownRight, ArrowUpRight, AlertCircle, CheckCircle2, CloudRain } from "lucide-react";

interface ExceptionCardProps {
  site: EvaluatedSite;
  columnType: "needs-attention" | "has-capacity";
}

export function ExceptionCard({ site, columnType }: ExceptionCardProps) {
  const isAboveDemand = columnType === "needs-attention" || site.direction === "below" || (site.carsDiff !== undefined && site.carsDiff < 0);

  // Available lots calculations
  const lotsAvailable = site.lotsAvailable;
  const expectedRaw = site.expectedRaw ?? lotsAvailable;
  const expectedAdjusted = site.expectedAdjusted ?? expectedRaw;
  const diff = site.carsDiff ?? (lotsAvailable - expectedAdjusted);
  const absDiff = Math.abs(diff);

  // Headline: e.g. "975 more free than normal" or "310 fewer free than normal"
  const headline = site.carsHeadline || (
    diff > 0
      ? `${absDiff.toLocaleString()} more free than normal`
      : diff < 0
      ? `${absDiff.toLocaleString()} fewer free than normal`
      : "Normal availability"
  );

  const actionText = site.actionText || (
    diff < 0
      ? "Filling faster than usual."
      : diff > 0
      ? "More space available than usual."
      : "Operating within normal variance."
  );

  const devAdjusted = site.deviationAdjusted ?? site.deviationPercent;
  const devRaw = site.deviationRaw ?? (expectedRaw > 0 ? Math.round(((lotsAvailable - expectedRaw) / expectedRaw) * 100) : devAdjusted);
  const adjustedStr = (devAdjusted > 0 ? "+" : "") + `${devAdjusted}%`;
  const rawStr = (devRaw > 0 ? "+" : "") + `${devRaw}%`;
  const isAdjustedDifferent = site.rainFactor !== undefined && site.rainFactor < 1.0 && devRaw !== devAdjusted;

  return (
    <div
      id={`carpark-card-${site.id}`}
      className={`rounded-xl border bg-white shadow-xs transition-colors flex flex-col justify-between overflow-hidden ${
        isAboveDemand
          ? "border-amber-200 hover:border-amber-300"
          : "border-sky-200 hover:border-sky-300"
      }`}
    >
      <div className="p-6">
        {/* Top meta & badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                isAboveDemand
                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                  : "bg-sky-100 text-sky-900 border border-sky-200"
              }`}
            >
              {isAboveDemand ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Filling faster than normal</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
                  <span>More capacity available</span>
                </>
              )}
            </span>
            <span className="text-xs text-stone-500 font-medium">{site.area}</span>
          </div>

          <div className="text-xs font-mono text-stone-400">
            Site #{site.id}
          </div>
        </div>

        {/* Development Name */}
        <h3 className="text-2xl font-bold tracking-tight text-stone-900 mb-4">
          {site.development}
        </h3>

        {/* HEADLINE: Net free lots vs normal baseline (No capacity figures) */}
        <div className="bg-stone-50/90 rounded-lg p-4 border border-stone-200/80 mb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 tabular-nums">
              {headline}
            </div>
            <div
              className={`flex items-baseline gap-1.5 font-mono text-lg font-bold tabular-nums ${
                isAboveDemand ? "text-amber-800" : "text-sky-800"
              }`}
            >
              <span className="inline-flex items-center gap-0.5">
                {diff >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                )}
                <span>{adjustedStr}</span>
              </span>
              {isAdjustedDifferent && (
                <span className="text-stone-400 font-normal text-xs sm:text-sm">
                  · {rawStr} unadjusted
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-stone-500 font-mono mt-1">
            vs {isAdjustedDifferent ? "weather-adjusted baseline" : "normal baseline"} ({expectedAdjusted.toLocaleString()} free lots expected)
          </div>

          {/* Weather Discount Callout: Highlights the exact weather factor */}
          {site.rainFactor && site.rainFactor < 1.0 && (
            <div className="mt-3 pt-2.5 border-t border-stone-200/70 flex items-center justify-between gap-2 text-[11px] font-mono text-sky-900">
              <div className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                <span>
                  <strong>Rain Discount ({site.rainFactor}×):</strong> Expected free lots lowered {expectedRaw} → {expectedAdjusted} lots
                </span>
              </div>
              <span className="text-[10px] bg-sky-100 text-sky-900 font-semibold px-1.5 py-0.5 rounded border border-sky-200 shrink-0">
                Prevents rain false-alarm
              </span>
            </div>
          )}
        </div>

        {/* Observation plain sentence */}
        <p className="text-stone-700 text-sm leading-relaxed mb-4">
          {site.plainSentence.endsWith(".") ? site.plainSentence : `${site.plainSentence}.`}
        </p>

        {/* Supporting details: actual available lots & weather */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 pt-3 border-t border-stone-100 font-mono">
          <div>
            <span className="font-semibold text-stone-800">
              {lotsAvailable.toLocaleString()}
            </span>{" "}
            lots currently free
          </div>
          <div className="flex items-center gap-1">
            <span>Weather:</span>
            <span className="font-semibold text-stone-800">
              {site.nearestAreaForecast || "Fair"}
            </span>
            <span className="text-stone-500">
              ({site.nearestAreaName || "Local"}{site.distanceKm ? ` · ${site.distanceKm}km` : ""}{site.rainFactor && site.rainFactor < 1.0 ? ` · ${site.rainFactor}×` : ""})
            </span>
          </div>
        </div>
      </div>

      {/* IMPERATIVE ACTION LINE: Ending each card in an operational action */}
      <div
        className={`px-6 py-4 border-t flex items-center justify-between ${
          isAboveDemand
            ? "bg-amber-50/80 border-amber-200 text-amber-950"
            : "bg-sky-50/80 border-sky-200 text-sky-950"
        }`}
      >
        <div className="flex items-center gap-2">
          {isAboveDemand ? (
            <AlertCircle className="w-4 h-4 text-amber-700" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-sky-700" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Action:
          </span>
          <span className="text-sm sm:text-base font-bold tracking-tight">
            {actionText}
          </span>
        </div>

        <span className="text-xs font-medium text-stone-500 bg-white/70 px-2 py-0.5 rounded border border-stone-200">
          Next 60 mins
        </span>
      </div>
    </div>
  );
}

