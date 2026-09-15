import { useState } from "react";
import { EvaluatedSite, MissingSite, CorruptedSite } from "../types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface QuietRankedListProps {
  quietList: EvaluatedSite[];
  missingSites: MissingSite[];
  corruptedSites?: CorruptedSite[];
  omittedSites?: Array<{ id: string; development: string; area?: string; reason: string; lotsAvailable?: number | null }>;
  defaultExpanded?: boolean;
  suppressDeviations?: boolean;
  suppressionNotice?: string;
}

export function QuietRankedList({
  quietList,
  missingSites,
  corruptedSites = [],
  omittedSites = [],
  defaultExpanded = true,
  suppressDeviations = false,
  suppressionNotice
}: QuietRankedListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const totalCount = quietList.length + missingSites.length + corruptedSites.length + omittedSites.length;
  const hasItems = totalCount > 0;

  if (!hasItems) return null;

  return (
    <section
      id="quiet-sites-section"
      className="mt-8 pt-6 border-t border-stone-200"
    >
      <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="quiet-sites-table-container"
          className="w-full px-4 py-3.5 flex items-center justify-between bg-stone-50/75 hover:bg-stone-100/80 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 font-mono">
              {suppressDeviations ? "Watched Sites Availability" : "Other Watched Sites (Within Normal Range or Unflagged)"}
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700 font-mono">
              {suppressDeviations
                ? `${quietList.length} monitored · ${omittedSites.length} no baseline`
                : `${quietList.length} normal · ${missingSites.length} missing${corruptedSites.length > 0 ? ` · ${corruptedSites.length} corrupted` : ""}${omittedSites.length > 0 ? ` · ${omittedSites.length} omitted` : ""}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600 group-hover:text-stone-900">
            <span>{isExpanded ? "Hide sites" : `Show ${totalCount} sites`}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-stone-500 group-hover:text-stone-800" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-500 group-hover:text-stone-800" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div id="quiet-sites-table-container" className="overflow-x-auto border-t border-stone-200/80">
            {suppressDeviations && suppressionNotice && (
              <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200/70 text-xs font-medium text-amber-900 flex items-center gap-2 font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span>{suppressionNotice}</span>
              </div>
            )}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50 text-stone-600 font-mono">
                  <th className="py-2.5 px-3.5 font-medium">Development</th>
                  <th className="py-2.5 px-3 font-medium">Area &amp; Weather</th>
                  <th className="py-2.5 px-3 font-medium text-right">Available Lots</th>
                  {suppressDeviations ? (
                    <th className="py-2.5 px-3.5 font-medium text-right">Status</th>
                  ) : (
                    <>
                      <th className="py-2.5 px-3 font-medium text-right">Expected Free</th>
                      <th className="py-2.5 px-3 font-medium text-right">Variance</th>
                      <th className="py-2.5 px-3.5 font-medium text-right">Deviation</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {quietList.map((site) => {
                  const available = site.lotsAvailable;
                  const expected = site.expectedAdjusted ?? site.expectedRaw ?? available;
                  const diff = site.carsDiff ?? (available - expected);
                  const isMoreFree = diff > 0;
                  const diffText = diff > 0 
                    ? `+${diff.toLocaleString()} free` 
                    : diff < 0 
                    ? `${diff.toLocaleString()} free` 
                    : "0 lots";

                  const devAdjusted = site.deviationAdjusted ?? site.deviationPercent;
                  const devRaw = site.deviationRaw ?? devAdjusted;
                  const adjustedStr = (devAdjusted > 0 ? "+" : "") + `${devAdjusted}%`;
                  const rawStr = (devRaw > 0 ? "+" : "") + `${devRaw}%`;
                  const hasAdjustment = site.rainFactor !== undefined && site.rainFactor < 1.0 && devRaw !== devAdjusted;

                  return (
                    <tr
                      key={site.id}
                      id={`carpark-site-${site.id}`}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-medium text-stone-900">
                        {site.development}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">
                        <span>{site.area}</span>
                        {site.nearestAreaName && (
                          <span className="text-stone-500 text-[11px] block">
                            near {site.nearestAreaName} {site.distanceKm ? `(${site.distanceKm}km)` : ""} · {site.nearestAreaForecast || "Fair"}
                            {site.rainFactor && site.rainFactor < 1.0 ? (
                              <span className="text-sky-700 font-semibold"> ({site.rainFactor}× rain discount)</span>
                            ) : null}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {available === 0 ? (
                          <span className="inline-flex items-center text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                            FULL (0 free)
                          </span>
                        ) : (
                          <span className="font-semibold text-stone-900">
                            {available.toLocaleString()} lots
                          </span>
                        )}
                      </td>
                      {suppressDeviations ? (
                        <td className="py-2.5 px-3.5 text-right font-mono text-stone-500 italic">
                          Deviation suppressed
                        </td>
                      ) : (
                        <>
                          <td className="py-2.5 px-3 text-right font-mono">
                            <span className="font-medium text-stone-800">{expected.toLocaleString()} lots</span>
                            {hasAdjustment && site.expectedRaw && (
                              <span className="text-stone-400 text-[11px] ml-1">({site.expectedRaw} unadj)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            <span className={isMoreFree ? "text-sky-800" : diff < 0 ? "text-amber-800" : "text-stone-500"}>
                              {diffText}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-semibold">
                            <span className={isMoreFree ? "text-sky-800" : diff < 0 ? "text-amber-800" : "text-stone-600"}>
                              {adjustedStr}
                            </span>
                            {hasAdjustment && (
                              <span className="text-stone-400 font-normal text-[11px] block">
                                {rawStr} unadj.
                              </span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}

                {/* Corrupted sites: available negative or invalid */}
                {corruptedSites.map((corrupted) => (
                  <tr key={corrupted.id} id={`carpark-site-${corrupted.id}`} className="bg-amber-50/50 text-stone-700">
                    <td className="py-2.5 px-3.5 font-medium text-stone-900">
                      {corrupted.development}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">
                      {corrupted.area || "Watched Site"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-900 font-semibold">
                      {corrupted.lotsAvailable !== null ? `${corrupted.lotsAvailable} lots` : "Invalid"}
                    </td>
                    <td colSpan={suppressDeviations ? 1 : 3} className="py-2.5 px-3.5 text-right font-mono text-rose-700 font-medium italic">
                      Reading looks wrong for this site
                    </td>
                  </tr>
                ))}

                {/* Missing sites: absent from feed */}
                {missingSites.map((missing) => (
                  <tr key={missing.id} id={`carpark-site-${missing.id}`} className="bg-stone-50/40 text-stone-600">
                    <td className="py-2.5 px-3.5 font-medium text-stone-600">
                      {missing.development}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 italic">Feed absent</td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-400">—</td>
                    <td colSpan={suppressDeviations ? 1 : 3} className="py-2.5 px-3.5 text-right font-mono text-amber-800/90 italic">
                      No reading for this site
                    </td>
                  </tr>
                ))}

                {/* Omitted due to no baseline */}
                {omittedSites.map((omitted) => (
                  <tr key={omitted.id} id={`carpark-site-${omitted.id}`} className="bg-stone-50/30 text-stone-600">
                    <td className="py-2.5 px-3.5 font-medium text-stone-800">
                      {omitted.development}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">
                      {omitted.area || "Watched Site"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-stone-900">
                      {omitted.lotsAvailable !== null && omitted.lotsAvailable !== undefined
                        ? `${omitted.lotsAvailable.toLocaleString()} lots`
                        : "—"}
                    </td>
                    <td colSpan={suppressDeviations ? 1 : 3} className="py-2.5 px-3.5 text-right font-mono text-stone-500 italic">
                      {omitted.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
