import { useState, useMemo } from "react";
import { EvaluatedSite, MissingSite, CorruptedSite, CarparkDirectoryRecord } from "../types";
import {
  Search,
  X,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2
} from "lucide-react";

interface CarparkSearchProps {
  allRecords?: CarparkDirectoryRecord[];
  totalRecords?: number;
  flaggedSites: EvaluatedSite[];
  quietList: EvaluatedSite[];
  missingSites: MissingSite[];
  corruptedSites?: CorruptedSite[];
  omittedSites?: Array<{ id: string; development: string; area?: string; reason: string; lotsAvailable?: number | null }>;
  isMiscalibrated?: boolean;
  onSelectSite?: (siteId: string) => void;
}

interface WatchedSiteItem {
  id: string;
  development: string;
  area: string;
  agency?: string;
  lotsAvailable: number | null;
  expectedLots?: number;
  variance?: number;
  deviationPercent: number | null;
  deviationSignedStr: string | null;
  isFlagged: boolean;
  isFull: boolean;
  isMissing: boolean;
  isCorrupted?: boolean;
  noBaseline?: boolean;
  weatherArea?: string | null;
  weatherForecast?: string | null;
  rainFactor?: number;
  plainSentence?: string;
}

export function CarparkSearch({
  allRecords = [],
  totalRecords,
  flaggedSites,
  quietList,
  missingSites,
  corruptedSites = [],
  omittedSites = [],
  isMiscalibrated = false,
  onSelectSite
}: CarparkSearchProps) {
  // Toggle: "watched" (default) or "all"
  const [searchMode, setSearchMode] = useState<"watched" | "all">("watched");
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Combine watched sites into a unified list
  const watchedList = useMemo(() => {
    const list: WatchedSiteItem[] = [];

    flaggedSites.forEach((site) => {
      const expected = site.expectedAdjusted ?? site.expectedRaw ?? site.lotsAvailable;
      const variance = site.carsDiff ?? (site.lotsAvailable - expected);
      list.push({
        id: site.id,
        development: site.development,
        area: site.area,
        agency: "LTA",
        lotsAvailable: site.lotsAvailable,
        expectedLots: expected,
        variance,
        deviationPercent: site.deviationPercent,
        deviationSignedStr: site.deviationSignedStr,
        isFlagged: true,
        isFull: site.lotsAvailable === 0,
        isMissing: false,
        weatherArea: site.nearestAreaName,
        weatherForecast: site.nearestAreaForecast,
        rainFactor: site.rainFactor,
        plainSentence: site.plainSentence
      });
    });

    quietList.forEach((site) => {
      const expected = site.expectedAdjusted ?? site.expectedRaw ?? site.lotsAvailable;
      const variance = site.carsDiff ?? (site.lotsAvailable - expected);
      list.push({
        id: site.id,
        development: site.development,
        area: site.area,
        agency: "LTA",
        lotsAvailable: site.lotsAvailable,
        expectedLots: expected,
        variance,
        deviationPercent: site.deviationPercent,
        deviationSignedStr: site.deviationSignedStr,
        isFlagged: false,
        isFull: site.lotsAvailable === 0,
        isMissing: false,
        weatherArea: site.nearestAreaName,
        weatherForecast: site.nearestAreaForecast,
        rainFactor: site.rainFactor,
        plainSentence: site.plainSentence
      });
    });

    corruptedSites.forEach((site) => {
      list.push({
        id: site.id,
        development: site.development,
        area: site.area || "Watched Site",
        agency: "LTA",
        lotsAvailable: site.lotsAvailable,
        deviationPercent: null,
        deviationSignedStr: null,
        isFlagged: false,
        isFull: false,
        isMissing: false,
        isCorrupted: true,
        plainSentence: "Reading looks wrong for this site"
      });
    });

    missingSites.forEach((site) => {
      list.push({
        id: site.id,
        development: site.development,
        area: "Monitored Zone",
        agency: "LTA",
        lotsAvailable: null,
        deviationPercent: null,
        deviationSignedStr: null,
        isFlagged: false,
        isFull: false,
        isMissing: true,
        plainSentence: "Feed absent — no reading for this site"
      });
    });

    omittedSites.forEach((site) => {
      list.push({
        id: site.id,
        development: site.development,
        area: site.area || "Watched Site",
        agency: "LTA",
        lotsAvailable: site.lotsAvailable ?? null,
        deviationPercent: null,
        deviationSignedStr: null,
        isFlagged: false,
        isFull: site.lotsAvailable === 0,
        isMissing: false,
        noBaseline: true,
        plainSentence: site.reason || "No baseline yet — availability only"
      });
    });

    return list;
  }, [flaggedSites, quietList, missingSites, corruptedSites, omittedSites]);

  // Lookup map to quickly identify watched sites by ID or lower-case name
  const watchedMap = useMemo(() => {
    const byId = new Map<string, WatchedSiteItem>();
    const byName = new Map<string, WatchedSiteItem>();
    watchedList.forEach((item) => {
      byId.set(item.id, item);
      byName.set(item.development.toLowerCase(), item);
    });
    return { byId, byName };
  }, [watchedList]);

  // Live payload counts
  const watchedCount = watchedList.length;
  const baselinesCount = watchedList.filter((s) => !s.isCorrupted && !s.isMissing && !s.noBaseline).length;
  const excludedCount = watchedList.filter((s) => s.isCorrupted || s.isMissing || s.noBaseline).length;
  const allCount = allRecords.length > 0 ? allRecords.length : totalRecords || 2607;

  // Filter chips
  const watchedFilterChips = [
    { id: "all", label: "All Watched Sites" },
    { id: "flagged", label: "Flagged Exceptions" },
    { id: "City", label: "City / Bras Basah" },
    { id: "Marina", label: "Marina" },
    { id: "Orchard", label: "Orchard / Somerset" },
    { id: "available", label: "Available > 100 Lots" },
    { id: "full", label: "Full / Near Full" }
  ];

  const allFilterChips = [
    { id: "all", label: "All Directory" },
    { id: "HDB", label: "HDB Only" },
    { id: "URA", label: "URA Only" },
    { id: "LTA", label: "LTA Only" },
    { id: "Orchard", label: "Orchard" },
    { id: "Marina", label: "Marina / City" },
    { id: "available", label: "Available > 100 Lots" },
    { id: "full", label: "Full (0 free)" }
  ];

  // Filtered Watched sites
  const filteredWatched = useMemo(() => {
    let result = watchedList;

    if (selectedFilter === "flagged") {
      result = result.filter((s) => s.isFlagged);
    } else if (selectedFilter === "full") {
      result = result.filter(
        (s) => s.lotsAvailable === 0 || (s.lotsAvailable !== null && s.lotsAvailable < 20)
      );
    } else if (selectedFilter === "available") {
      result = result.filter((s) => s.lotsAvailable !== null && s.lotsAvailable >= 100);
    } else if (selectedFilter !== "all") {
      result = result.filter((s) => s.area.toLowerCase().includes(selectedFilter.toLowerCase()));
    }

    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return result;

    return result.filter((site) => {
      return (
        site.development.toLowerCase().includes(cleanQuery) ||
        site.area.toLowerCase().includes(cleanQuery) ||
        site.id.toLowerCase() === cleanQuery ||
        (site.weatherArea && site.weatherArea.toLowerCase().includes(cleanQuery)) ||
        (site.weatherForecast && site.weatherForecast.toLowerCase().includes(cleanQuery))
      );
    });
  }, [watchedList, query, selectedFilter]);

  // Filtered Directory sites (All mode)
  const filteredDirectory = useMemo(() => {
    let list = allRecords;

    // Apply quick filter chip
    if (selectedFilter === "HDB") {
      list = list.filter((s) => s.agency?.toUpperCase() === "HDB");
    } else if (selectedFilter === "URA") {
      list = list.filter((s) => s.agency?.toUpperCase() === "URA");
    } else if (selectedFilter === "LTA") {
      list = list.filter((s) => s.agency?.toUpperCase() === "LTA");
    } else if (selectedFilter === "Orchard") {
      list = list.filter(
        (s) =>
          s.area?.toLowerCase().includes("orchard") ||
          s.development?.toLowerCase().includes("orchard")
      );
    } else if (selectedFilter === "Marina") {
      list = list.filter(
        (s) =>
          s.area?.toLowerCase().includes("marina") ||
          s.area?.toLowerCase().includes("city") ||
          s.development?.toLowerCase().includes("marina") ||
          s.development?.toLowerCase().includes("city")
      );
    } else if (selectedFilter === "available") {
      list = list.filter((s) => s.availableLots !== null && s.availableLots >= 100);
    } else if (selectedFilter === "full") {
      list = list.filter((s) => s.availableLots === 0);
    }

    // Apply text search: matching on development name, CarParkID, area, and agency case-insensitively
    const cleanQuery = query.trim().toLowerCase();
    if (cleanQuery) {
      list = list.filter((site) => {
        const dev = site.development?.toLowerCase() || "";
        const id = site.carParkId?.toLowerCase() || "";
        const area = site.area?.toLowerCase() || "";
        const agency = site.agency?.toLowerCase() || "";

        return (
          dev.includes(cleanQuery) ||
          id.includes(cleanQuery) ||
          area.includes(cleanQuery) ||
          agency.includes(cleanQuery)
        );
      });
    }

    // Sort by name by default (Do not sort by raw availability)
    const sorted = [...list].sort((a, b) =>
      a.development.localeCompare(b.development, undefined, { numeric: true, sensitivity: "base" })
    );

    return sorted;
  }, [allRecords, query, selectedFilter]);

  // Cap visible directory items at 50 to maintain high performance
  const visibleDirectory = useMemo(() => {
    return filteredDirectory.slice(0, 50);
  }, [filteredDirectory]);

  // Active match counts
  const totalMatches = searchMode === "watched" ? filteredWatched.length : filteredDirectory.length;
  const visibleCount = searchMode === "watched" ? filteredWatched.length : visibleDirectory.length;

  const getLotTypeLabel = (code: string) => {
    const c = code.toUpperCase();
    if (c === "C") return "Cars";
    if (c === "Y") return "Motorcycles";
    if (c === "H") return "Heavy";
    return c;
  };

  return (
    <section className="mb-8 bg-white border border-stone-200/90 rounded-xl p-5 shadow-xs">
      {/* Screen Reader Announcement for results */}
      <div aria-live="polite" className="sr-only">
        {searchMode === "watched"
          ? `${filteredWatched.length} watched sites matched.`
          : `Showing ${visibleCount} of ${filteredDirectory.length} directory matches.`}
      </div>

      <div className="flex flex-col gap-3">
        {/* Top Header Row: Title and Mode-Appropriate Counts */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-stone-700" />
            <h2 className="text-sm font-semibold tracking-tight text-stone-900">
              Carpark Directory &amp; Status Lookup
            </h2>
          </div>

          {/* D. Updated Header Count: Reflects active mode */}
          <div className="text-xs font-mono text-stone-600">
            {searchMode === "watched"
              ? `${watchedCount} watched · ${baselinesCount} with baselines · ${excludedCount} excluded`
              : `${allCount.toLocaleString()} in the directory · ${baselinesCount} with baselines`}
          </div>
        </div>

        {/* Search input and Scope Toggle beside each other */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Search input field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchMode === "watched"
                  ? "Search watched sites by name, ID, area, or weather..."
                  : `Search ${allCount.toLocaleString()} carparks by name, ID, area, or agency...`
              }
              className="w-full pl-9 pr-9 py-2 text-sm bg-stone-50/70 border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all shadow-2xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-0.5 focus-visible:ring-2 focus-visible:ring-stone-500 focus:outline-none rounded"
                title="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* A. The toggle: Two options beside the search box, single-select */}
          <div
            role="group"
            aria-label="Carpark scope toggle"
            className="inline-flex items-center rounded-lg bg-stone-100 p-1 border border-stone-200/90 text-xs font-medium shrink-0 self-start sm:self-center"
          >
            <button
              type="button"
              aria-pressed={searchMode === "watched"}
              onClick={() => {
                setSearchMode("watched");
                setSelectedFilter("all");
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-stone-600 focus:outline-none ${
                searchMode === "watched"
                  ? "bg-white text-stone-950 font-semibold shadow-xs border border-stone-200/80"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
            >
              Watched sites ({watchedCount})
            </button>
            <span className="text-stone-300 px-1 select-none" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              aria-pressed={searchMode === "all"}
              onClick={() => {
                setSearchMode("all");
                setSelectedFilter("all");
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-stone-600 focus:outline-none ${
                searchMode === "all"
                  ? "bg-white text-stone-950 font-semibold shadow-xs border border-stone-200/80"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
            >
              All carparks ({allCount.toLocaleString()})
            </button>
          </div>
        </div>

        {/* Quick filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-stone-400 shrink-0 mr-1 font-mono text-[11px]">Filter:</span>
          {(searchMode === "watched" ? watchedFilterChips : allFilterChips).map((chip) => {
            const isActive = selectedFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedFilter(chip.id)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-stone-500 focus:outline-none ${
                  isActive
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Result Match Telemetry Bar */}
        {(query.trim() !== "" || selectedFilter !== "all" || searchMode === "all") && (
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-mono text-stone-500">
            <div>
              {searchMode === "watched" ? (
                <span>
                  {filteredWatched.length} {filteredWatched.length === 1 ? "site" : "sites"} found
                </span>
              ) : (
                <span>
                  {totalMatches === 0
                    ? "0 matches"
                    : totalMatches > 50
                    ? `showing 50 of ${totalMatches.toLocaleString()} matches`
                    : `showing all ${totalMatches} matches`}
                </span>
              )}
            </div>

            {searchMode === "all" && totalMatches > 50 && (
              <span className="text-[11px] text-stone-400">
                Display capped at 50 for rendering speed
              </span>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* WATCHED MODE RESULTS: Only when query or chip filter active  */}
        {/* ============================================================ */}
        {searchMode === "watched" && (query.trim() !== "" || selectedFilter !== "all") && (
          <div className="mt-2 pt-3 border-t border-stone-100">
            {filteredWatched.length === 0 ? (
              <div className="py-8 text-center bg-stone-50/50 rounded-lg border border-dashed border-stone-200">
                <p className="text-sm text-stone-700 font-medium mb-1">
                  No carparks matching &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-stone-400">
                  Try searching for sites like Suntec, Raffles City, Marina Square, ION Orchard.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSelectedFilter("all");
                  }}
                  className="mt-3 text-xs text-stone-700 underline font-semibold cursor-pointer hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-stone-500 focus:outline-none"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredWatched.map((site) => {
                  const isDeficit = site.deviationPercent !== null && site.deviationPercent < 0;

                  return (
                    <div
                      key={site.id}
                      onClick={() => onSelectSite && onSelectSite(site.id)}
                      className="bg-stone-50/60 hover:bg-stone-100/70 border border-stone-200 rounded-lg p-3.5 transition-colors cursor-pointer flex flex-col justify-between gap-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono text-[11px] font-semibold text-stone-500 bg-white px-1.5 py-0.5 border border-stone-200 rounded">
                              #{site.id}
                            </span>
                            <span className="text-stone-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-400" />
                              {site.area}
                            </span>
                            {site.weatherForecast && (
                              <span className="text-stone-500 text-[11px]">
                                · {site.weatherForecast}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                            {site.development}
                          </h3>
                        </div>

                        {/* Status / Deviation Badge */}
                        <div>
                          {site.isCorrupted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-mono text-[11px] font-semibold">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Reading looks wrong for this site
                            </span>
                          ) : site.isMissing ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[11px] font-semibold">
                              <AlertTriangle className="w-3 h-3" />
                              Feed Absent
                            </span>
                          ) : site.isFull ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-800 font-mono text-[11px] font-bold">
                              FULL (0 free)
                            </span>
                          ) : site.noBaseline ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 font-mono text-[11px] font-medium">
                              No baseline yet — availability only
                            </span>
                          ) : isMiscalibrated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100/80 border border-amber-300 text-amber-900 font-mono text-[11px] font-medium">
                              Deviation suppressed
                            </span>
                          ) : site.isFlagged ? (
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                                isDeficit
                                  ? "bg-amber-100 border border-amber-300 text-amber-900"
                                  : "bg-sky-100 border border-sky-300 text-sky-900"
                              }`}
                            >
                              {isDeficit ? (
                                <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                              )}
                              Exception: {site.deviationSignedStr}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] font-medium">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Normal ({site.deviationSignedStr || "±0%"})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Lot availability counts */}
                      {!site.isMissing && !site.isCorrupted && site.lotsAvailable !== null && (
                        <div className="mt-1 pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[11px] font-mono text-stone-600">
                          <span>
                            <strong className="text-stone-900 font-bold">
                              {site.lotsAvailable.toLocaleString()}
                            </strong>{" "}
                            lots free
                          </span>
                          {!isMiscalibrated && !site.noBaseline && site.expectedLots !== undefined && (
                            <span className="text-stone-500">
                              (expected: {site.expectedLots.toLocaleString()} free)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Sentence note */}
                      {site.plainSentence && (
                        <p className="text-[11px] text-stone-500 italic mt-0.5 line-clamp-1">
                          {site.plainSentence}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ALL CARPARKS DIRECTORY MODE: Availability only, capped at 50 */}
        {/* ============================================================ */}
        {searchMode === "all" && (
          <div className="mt-2 pt-3 border-t border-stone-100">
            {filteredDirectory.length === 0 ? (
              /* C. Distinct empty state sentence for directory */
              <div className="py-8 text-center bg-stone-50/50 rounded-lg border border-dashed border-stone-200">
                <p className="text-sm text-stone-700 font-medium mb-1">
                  Nothing in the directory matches that. Try a carpark name, an ID, or an area.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSelectedFilter("all");
                  }}
                  className="mt-3 text-xs text-stone-700 underline font-semibold cursor-pointer hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-stone-500 focus:outline-none"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {visibleDirectory.map((record) => {
                    // Check if this directory site is one of our watched campus sites
                    const watchedItem =
                      watchedMap.byId.get(record.carParkId) ||
                      watchedMap.byName.get(record.development.toLowerCase());

                    const isWatched = !!watchedItem;

                    return (
                      <div
                        key={`${record.carParkId}_${record.lotType}`}
                        onClick={() => {
                          if (isWatched && onSelectSite) {
                            onSelectSite(watchedItem.id);
                          }
                        }}
                        className={`border rounded-lg p-3 transition-colors flex flex-col justify-between gap-2 text-xs ${
                          isWatched
                            ? "bg-amber-50/30 border-amber-200/80 hover:bg-amber-50/60 cursor-pointer"
                            : "bg-stone-50/50 border-stone-200 hover:bg-stone-100/60"
                        }`}
                      >
                        {/* Row 1: Badges and Details */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="font-mono text-[11px] font-semibold text-stone-600 bg-white px-1.5 py-0.5 border border-stone-200 rounded">
                                #{record.carParkId}
                              </span>

                              <span className="text-stone-600 flex items-center gap-1 font-medium">
                                <MapPin className="w-3 h-3 text-stone-400" />
                                {record.area || "Singapore"}
                              </span>

                              {record.agency && (
                                <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                                  {record.agency}
                                </span>
                              )}

                              <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                                {getLotTypeLabel(record.lotType)}
                              </span>
                            </div>

                            <h3 className="text-sm font-semibold text-stone-900 tracking-tight truncate">
                              {record.development}
                            </h3>
                          </div>

                          {/* B. Watched sites keep their deviation and are marked */}
                          {isWatched && (
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-900 text-white font-mono text-[10px] font-semibold tracking-wide">
                                <Building2 className="w-2.5 h-2.5" />
                                Campus Watched
                              </span>
                              {watchedItem.isCorrupted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-mono text-[10px] font-semibold">
                                  Corrupted
                                </span>
                              ) : watchedItem.isMissing ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-semibold">
                                  Feed Absent
                                </span>
                              ) : watchedItem.isFull ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-800 font-mono text-[10px] font-bold">
                                  FULL
                                </span>
                              ) : watchedItem.isFlagged ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 border border-amber-300 text-amber-900">
                                  Exception: {watchedItem.deviationSignedStr}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] font-medium">
                                  Normal ({watchedItem.deviationSignedStr || "±0%"})
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Row 2: Availability only (no baseline for directory, deviation kept for watched) */}
                        <div className="mt-1 pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[11px] font-mono">
                          <div>
                            {record.availableLots !== null ? (
                              record.availableLots === 0 ? (
                                <span className="text-rose-700 font-bold">
                                  0 free lots (FULL)
                                </span>
                              ) : (
                                <span className="text-stone-700">
                                  <strong className="text-stone-950 font-bold text-xs">
                                    {record.availableLots.toLocaleString()}
                                  </strong>{" "}
                                  available lots
                                </span>
                              )
                            ) : (
                              <span className="text-stone-400 italic">Feed absent / No reading</span>
                            )}
                          </div>

                          {isWatched && watchedItem.expectedLots !== undefined && (
                            <span className="text-stone-500">
                              (expected: {watchedItem.expectedLots.toLocaleString()} free)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* B. Notice under results: verbatim requirement */}
                <div className="mt-4 pt-3 border-t border-stone-100 text-xs font-mono text-stone-500 text-center">
                  {allCount.toLocaleString()} sites in the directory. Only the {baselinesCount}{" "}
                  campus sites have baselines, so no deviation is calculated for the rest.
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
