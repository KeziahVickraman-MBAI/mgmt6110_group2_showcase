import { FlaggedDistance } from "../types";
import { Navigation, AlertTriangle, CheckCircle2, Split } from "lucide-react";

interface FlaggedDistanceBannerProps {
  distance: FlaggedDistance;
}

export function FlaggedDistanceBanner({ distance }: FlaggedDistanceBannerProps) {
  const { distanceKm, isOneTrip, tripSummary, tripDescription, origin, destination } = distance;

  return (
    <div
      id="flagged-sites-distance-banner"
      className={`rounded-xl border p-4 mb-6 transition-colors ${
        isOneTrip
          ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950"
          : "bg-amber-50/80 border-amber-200/90 text-amber-950"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              isOneTrip ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {isOneTrip ? (
              <Navigation className="w-5 h-5" />
            ) : (
              <Split className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold">
                {distanceKm} km straight-line distance
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  isOneTrip
                    ? "bg-emerald-100/80 border-emerald-300 text-emerald-800"
                    : "bg-amber-100/80 border-amber-300 text-amber-800"
                }`}
              >
                {tripSummary} (threshold: 5.0 km)
              </span>
            </div>

            <p className="text-sm mt-0.5 text-stone-700">
              {tripDescription}
            </p>
          </div>
        </div>

        {/* Route context */}
        <div className="text-xs font-mono text-stone-600 bg-white/80 border border-stone-200/70 px-3 py-1.5 rounded-lg shrink-0">
          <span className="text-stone-400">Route: </span>
          <span className="font-semibold text-stone-800">{origin}</span>
          <span className="text-stone-400 mx-1.5">→</span>
          <span className="font-semibold text-stone-800">{destination}</span>
        </div>
      </div>
    </div>
  );
}
