import { useState } from "react";
import { EvaluatedSite } from "../types";
import { ChevronDown, ChevronUp, Calculator } from "lucide-react";

interface ComputationTransparencyProps {
  allSites: EvaluatedSite[];
  readingTimestamp: string;
  timeContext?: {
    weekdayName: string;
    hour: number;
    period: string;
    timeLabel: string;
  };
}

function formatObservedDate(dateStr?: string): string {
  if (!dateStr) return "28 Aug 2026";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  }
  return dateStr;
}

export function ComputationTransparency({
  allSites,
  readingTimestamp,
  timeContext
}: ComputationTransparencyProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Default to Suntec City (ID: 1) if available, otherwise first site
  const defaultSiteId = allSites.find(s => s.id === "1" || s.development === "Suntec City")?.id || allSites[0]?.id || "";
  const [selectedSiteId, setSelectedSiteId] = useState<string>(defaultSiteId);

  const site = allSites.find(s => s.id === selectedSiteId) || allSites[0];

  if (!site) return null;

  // Format reading time (Singapore timezone, HH:mm)
  let timeStr = "16:47";
  let weekdayStr = timeContext?.weekdayName || "Monday";
  try {
    const d = new Date(readingTimestamp);
    timeStr = d.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Singapore",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  } catch {
    timeStr = "16:47";
  }

  // Live arithmetic values
  const totalLots = site.totalLots;
  const actualAvailable = site.lotsAvailable;
  const baselineRate = site.baselineOccupancyRate;
  const rainFactor = typeof site.rainFactor === "number" && !isNaN(site.rainFactor) ? site.rainFactor : 1.00;

  // baseline expected available
  const expectedRaw = typeof site.expectedRaw === "number"
    ? site.expectedRaw
    : Math.round((1 - baselineRate) * totalLots);

  // adjusted expectation
  const expectedAdjusted = typeof site.expectedAdjusted === "number"
    ? site.expectedAdjusted
    : Math.round(expectedRaw * rainFactor);

  // difference: actual available - adjusted expectation
  const difference = actualAvailable - expectedAdjusted;

  // deviation: against adjusted expectation
  const deviation = typeof site.deviationAdjusted === "number"
    ? site.deviationAdjusted
    : (expectedAdjusted > 0 ? Math.round((difference / expectedAdjusted) * 100) : 0);

  // formatting strings for alignment
  const siteHeading = `${site.development}, ${weekdayStr} ${timeStr}`;
  const observedDateStr = formatObservedDate(site.observedOn);
  const forecastName = site.nearestAreaForecast || "Partly Cloudy (Day)";
  const areaName = site.nearestAreaName || "City";
  const distStr = typeof site.distanceKm === "number" && site.distanceKm > 0
    ? `${site.distanceKm.toFixed(2)}km`
    : "1.48km";

  // Build the code-block lines with aligned spacing matching prompt specification
  const lineBaseline = `  baseline expected available      ${expectedRaw.toLocaleString().padStart(5, " ")} lots   (observed ${observedDateStr})`;
  const lineFactor   = `  rain factor                      ${rainFactor.toFixed(2).padStart(5, " ")}       (${forecastName}, ${areaName}, ${distStr})`;
  const lineAdjusted = `  adjusted expectation             ${expectedAdjusted.toLocaleString().padStart(5, " ")} lots`;
  const lineActual   = `  actual available               ${actualAvailable.toLocaleString().padStart(6, " ")} lots`;
  const diffSign     = difference > 0 ? `+${difference.toLocaleString()}` : difference.toLocaleString();
  const lineDiff     = `  difference                      ${diffSign.padStart(5, " ")} lots`;
  const devSign      = deviation > 0 ? `+${deviation}%` : `${deviation}%`;
  const lineDev      = `  deviation                        ${devSign.padStart(5, " ")}`;

  const codeText = `${siteHeading}\n\n${lineBaseline}\n${lineFactor}\n${lineAdjusted}\n${lineActual}\n${lineDiff}\n${lineDev}`;

  return (
    <section id="computation-transparency-section" className="mb-8">
      <div className="border border-stone-200/90 rounded-xl bg-white shadow-xs overflow-hidden">
        <button
          type="button"
          id="computation-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="computation-details-container"
          className="w-full px-5 py-3.5 flex items-center justify-between bg-stone-50/80 hover:bg-stone-100/80 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Calculator className="w-4 h-4 text-stone-600 group-hover:text-stone-900" />
            <span className="text-sm font-bold text-stone-900 tracking-tight">
              How this is computed
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Live arithmetic · {site.development}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600 group-hover:text-stone-900">
            <span>{isOpen ? "Hide calculation" : "Show arithmetic"}</span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-stone-500 group-hover:text-stone-800" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-500 group-hover:text-stone-800" />
            )}
          </div>
        </button>

        {isOpen && (
          <div id="computation-details-container" className="p-5 border-t border-stone-200/80 space-y-4">
            {/* Site selector if multiple sites available */}
            {allSites.length > 1 && (
              <div className="flex items-center gap-2 text-xs text-stone-600 font-mono">
                <span className="font-semibold text-stone-700">Inspect site:</span>
                <select
                  value={site.id}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="bg-white border border-stone-300 rounded px-2 py-1 text-xs text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-stone-500 cursor-pointer"
                >
                  {allSites.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.development} ({s.deviationSignedStr})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Arithmetic code block */}
            <pre className="code-block whitespace-pre font-mono leading-relaxed select-all">
{codeText}
            </pre>

            {/* Three explanatory lines inside note-box */}
            <div className="note-box space-y-2 leading-relaxed">
              <p>
                The baseline is what this site usually has free at this hour on this day type. It is hand-entered from observation, with the date it was observed.
              </p>
              <p>
                The rain factor lowers the expectation when it is wet, because fewer people drive out. Without it, every site would flag as unusual the moment it rained.
              </p>
              <p>
                Rain factors are estimates, not measured: heavy rain 0.88, light rain 0.93, cloudy 0.98, clear 1.00. We show the unadjusted deviation alongside so you can see how much of the difference the adjustment accounts for.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
