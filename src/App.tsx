import { useEffect, useState, useCallback, useMemo } from "react";
import { DeviationsResponse, BoardState, VehicleType, LotTypeEvaluation } from "./types";
import { getScenarioData } from "./demoData";
import { FreshnessHeader } from "./components/FreshnessHeader";
import { ExceptionCard } from "./components/ExceptionCard";
import { FlaggedDistanceBanner } from "./components/FlaggedDistanceBanner";
import { QuietRankedList } from "./components/QuietRankedList";
import { LoadingView, EmptyView, RefusedView, UnreachableView, MiscalibratedView } from "./components/StateViews";
import { NotifyForm } from "./components/NotifyForm";
import { CarparkSearch } from "./components/CarparkSearch";
import { UserStatementBanner } from "./components/UserStatementBanner";
import { ComputationTransparency } from "./components/ComputationTransparency";
import { Footer } from "./components/Footer";
import { Radio, Layers, AlertTriangle, ChevronDown, ChevronUp, Car, Bike, Truck, CheckCircle2 } from "lucide-react";

export default function App() {
  const [feedMode, setFeedMode] = useState<"live" | "simulated">("live");
  const [scenario, setScenario] = useState<"flagged" | "rain-adjusted" | "empty" | "stale" | "weather-degraded" | "miscalibrated" | "refused" | "unreachable">("flagged");
  const [data, setData] = useState<DeviationsResponse | null>(null);
  const [selectedLotType, setSelectedLotType] = useState<VehicleType>("C");
  const [boardState, setBoardState] = useState<BoardState>("loading");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastGoodReadingTime, setLastGoodReadingTime] = useState<string | null>(null);
  const [isExceptionsExpanded, setIsExceptionsExpanded] = useState<boolean>(true);

  const loadData = useCallback(async (isManualRefresh = false) => {
    setIsRefreshing(true);

    if (feedMode === "simulated") {
      // Handle simulated scenarios for duty supervisor review
      setTimeout(() => {
        if (scenario === "refused") {
          setBoardState("refused");
          setData(null);
        } else if (scenario === "unreachable") {
          setBoardState("unreachable");
          setData(null);
        } else {
          const simData = getScenarioData(scenario);
          setData(simData);
          setLastGoodReadingTime(simData.lastGoodReadingTimestamp);
          if (simData.isMiscalibrated) {
            setBoardState("miscalibrated");
          } else if (simData.isAllWithinThreshold) {
            setBoardState("empty");
          } else {
            setBoardState("flagged");
          }
        }
        setIsRefreshing(false);
      }, isManualRefresh ? 300 : 0);
      return;
    }

    // Live API mode
    try {
      const res = await fetch("/api/deviations");
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || json.isRefused) {
          setBoardState("refused");
        } else if (res.status === 503 && json.error && json.error.includes("LTA_ACCOUNT_KEY")) {
          // LTA_ACCOUNT_KEY is not set in environment
          setBoardState("refused");
        } else {
          setBoardState("unreachable");
          if (json.lastGoodReadingTimestamp) {
            setLastGoodReadingTime(json.lastGoodReadingTimestamp);
          }
        }
        setData(null);
        setIsRefreshing(false);
        return;
      }

      setData(json);
      if (json.lastGoodReadingTimestamp) {
        setLastGoodReadingTime(json.lastGoodReadingTimestamp);
      }

      // Sanity check before render
      if (json.isMiscalibrated) {
        setBoardState("miscalibrated");
      } else if (json.isAllWithinThreshold) {
        setBoardState("empty");
      } else {
        setBoardState("flagged");
      }
    } catch {
      setBoardState("unreachable");
      setData(null);
    } finally {
      setIsRefreshing(false);
    }
  }, [feedMode, scenario]);

  useEffect(() => {
    loadData();

    // Cache TTL is 60 seconds, refresh interval on screen must match
    const interval = setInterval(() => {
      loadData();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Active evaluation for currently selected vehicle type (re-filtered without triggering API call)
  const activeEval: LotTypeEvaluation | null = useMemo(() => {
    if (!data) return null;
    if (data.evaluatedByLotType && data.evaluatedByLotType[selectedLotType]) {
      return data.evaluatedByLotType[selectedLotType];
    }
    // Fallback if evaluatedByLotType is not populated
    return {
      lotType: selectedLotType,
      evaluatedSites: [...data.flaggedExceptions, ...data.quietList],
      missingSites: data.missingSites,
      corruptedSites: data.corruptedSites || [],
      omittedDueToNoBaseline: data.omittedDueToNoBaseline || [],
      flaggedExceptions: data.flaggedExceptions,
      quietList: data.quietList,
      topAbove: data.topAbove || null,
      topBelow: data.topBelow || null,
      isAllWithinThreshold: data.isAllWithinThreshold,
      isMiscalibrated: data.isMiscalibrated || false,
      miscalibrationReason: data.miscalibrationReason || null,
      over100Count: data.over100Count || 0,
      evaluatedCount: data.evaluatedCount,
      totalWatchedCount: data.totalWatchedCount,
      decisionHeadline: data.decisionHeadline || "Sites behaving normally.",
      decisionSubtext: data.decisionSubtext || ""
    };
  }, [data, selectedLotType]);

  // Current view state for the active vehicle type
  const activeVehicleState = useMemo<"flagged" | "empty" | "miscalibrated">(() => {
    if (!activeEval) return "empty";
    if (activeEval.isMiscalibrated) return "miscalibrated";
    if (activeEval.isAllWithinThreshold || activeEval.flaggedExceptions.length === 0) return "empty";
    return "flagged";
  }, [activeEval]);

  const flaggedSites = activeEval ? activeEval.flaggedExceptions : [];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-stone-200">
      {/* Supervisor Control & Scenario Toolbar */}
      <div className="bg-stone-900 text-stone-300 text-xs px-4 py-2 border-b border-stone-800">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              FEED SOURCE:
            </span>
            <div className="inline-flex rounded bg-stone-800 p-0.5 border border-stone-700">
              <button
                onClick={() => {
                  setFeedMode("live");
                  setBoardState("loading");
                }}
                className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  feedMode === "live"
                    ? "bg-emerald-700 text-white"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                Live API (LTA + data.gov.sg)
              </button>
              <button
                onClick={() => {
                  setFeedMode("simulated");
                  setBoardState("loading");
                }}
                className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  feedMode === "simulated"
                    ? "bg-stone-700 text-white"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                State Scenarios
              </button>
            </div>
          </div>

          {feedMode === "simulated" && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-stone-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-stone-400" />
                State:
              </span>
              {(["flagged", "rain-adjusted", "empty", "stale", "weather-degraded", "miscalibrated", "refused", "unreachable"] as const).map((sc) => (
                <button
                  key={sc}
                  onClick={() => {
                    setScenario(sc);
                    setBoardState("loading");
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                    scenario === sc
                      ? "bg-amber-400 text-stone-950 font-bold"
                      : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Freshness Top Line Header */}
      <FreshnessHeader
        readingTimestamp={data ? data.readingTimestamp : null}
        cacheAge={data ? data.cacheAge : 0}
        minutesOld={data ? data.minutesOld : 0}
        isStale={data ? data.isStale : false}
        weatherDegraded={data ? data.weather.degraded : false}
        weatherReason={data ? data.weather.reason : ""}
        unmatchedStrings={data ? data.weather.unmatchedForecastStrings : []}
        isRefreshing={isRefreshing}
        onRefresh={() => loadData(true)}
        feedMode={feedMode}
      />

      {/* Main Single-Screen Exception Board */}
      <main className="max-w-5xl mx-auto w-full px-6 py-8 flex-1">
        {/* Class Overview: Collapsible Product & User Statement Segment */}
        <UserStatementBanner />

        {/* FEED TELEMETRY & BOUNDED PAGINATION STATUS */}
        {data && (
          <div className="mb-6 flex flex-col gap-2">
            {/* Resilient mid-fetch failure banner */}
            {data.isPartial && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Partial Feed:</strong> {data.partialMessage || `Showing ${data.totalRecords} records across ${data.pagesFetched} pages of an unknown total; the feed stopped responding.`}
                </span>
              </div>
            )}

            {/* Pagination & Lot Type Telemetry Line */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-stone-100/70 border border-stone-200/90 rounded-lg text-xs font-mono text-stone-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800">LTA DataMall v2:</span>
                <span>
                  {data.pagesFetched || 1} pages fetched · {data.totalRecords || activeEval?.evaluatedSites.length || 0} records
                  {data.recordsByLotType ? ` (Cars: ${data.recordsByLotType.C || 0}, Motorcycles: ${data.recordsByLotType.Y || 0}, Heavy: ${data.recordsByLotType.H || 0})` : ""}
                </span>
              </div>
              {data.ionOrchardFound && (
                <div className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ION Orchard verified (page 2)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VEHICLE TYPE SELECTOR: Cars (C) / Motorcycles (Y) / Heavy Vehicles (H) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 font-mono">
              Vehicle Type:
            </span>
            <div className="inline-flex rounded-lg bg-stone-100 p-1 border border-stone-200/80">
              <button
                type="button"
                onClick={() => setSelectedLotType("C")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  selectedLotType === "C"
                    ? "bg-stone-900 text-white shadow-xs font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Cars (C)</span>
                {data?.recordsByLotType?.C && (
                  <span className="text-[10px] opacity-80 font-mono">({data.recordsByLotType.C})</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedLotType("Y")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  selectedLotType === "Y"
                    ? "bg-stone-900 text-white shadow-xs font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Motorcycles (Y)</span>
                {data?.recordsByLotType?.Y && (
                  <span className="text-[10px] opacity-80 font-mono">({data.recordsByLotType.Y})</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedLotType("H")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  selectedLotType === "H"
                    ? "bg-stone-900 text-white shadow-xs font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Heavy Vehicles (H)</span>
                {data?.recordsByLotType?.H && (
                  <span className="text-[10px] opacity-80 font-mono">({data.recordsByLotType.H})</span>
                )}
              </button>
            </div>
          </div>

          <div className="text-xs text-stone-500 font-mono">
            Evaluated lots: {activeEval?.evaluatedCount || 0} with baselines · {activeEval?.omittedDueToNoBaseline?.length || 0} omitted
          </div>
        </div>

        {/* Carpark Search Bar: Available across all modes */}
        <CarparkSearch
          allRecords={data?.allRecords}
          totalRecords={data?.totalRecords}
          flaggedSites={activeEval ? activeEval.flaggedExceptions : []}
          quietList={activeEval ? activeEval.quietList : []}
          missingSites={activeEval ? activeEval.missingSites : []}
          corruptedSites={activeEval ? activeEval.corruptedSites : []}
          omittedSites={activeEval ? activeEval.omittedDueToNoBaseline : []}
          isMiscalibrated={activeVehicleState === "miscalibrated"}
          onSelectSite={(id) => {
            const el = document.getElementById(`carpark-site-${id}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
        />

        {/* Loading State Sentence */}
        {boardState === "loading" && <LoadingView />}

        {/* Refused State Sentence */}
        {boardState === "refused" && <RefusedView onRetry={() => loadData(true)} />}

        {/* Unreachable State Sentence */}
        {boardState === "unreachable" && (
          <UnreachableView
            lastGoodReadingTime={lastGoodReadingTime}
            onRetry={() => loadData(true)}
          />
        )}

        {/* Baselines Miscalibrated Sanity Check State */}
        {boardState !== "loading" && boardState !== "refused" && boardState !== "unreachable" && activeVehicleState === "miscalibrated" && activeEval && (
          <>
            <MiscalibratedView
              over100Count={activeEval.over100Count || 0}
              evaluatedCount={activeEval.evaluatedCount}
              timeLabel={data?.timeContext?.timeLabel || "this hour"}
              reason={activeEval.miscalibrationReason}
              sameDirection={activeEval.miscalibrationReason?.toLowerCase().includes("same direction")}
              onRetry={() => loadData(true)}
            />
            <QuietRankedList
              quietList={activeEval.quietList}
              missingSites={activeEval.missingSites}
              corruptedSites={activeEval.corruptedSites}
              omittedSites={activeEval.omittedDueToNoBaseline}
              defaultExpanded={true}
              suppressDeviations={true}
              suppressionNotice="Baselines look miscalibrated — deviations suppressed. Showing live availability only."
            />
          </>
        )}

        {/* Empty State Sentence (Good News) */}
        {boardState !== "loading" && boardState !== "refused" && boardState !== "unreachable" && activeVehicleState === "empty" && activeEval && (
          <>
            <EmptyView totalWatched={activeEval.totalWatchedCount} />
            <QuietRankedList
              quietList={activeEval.quietList}
              missingSites={activeEval.missingSites}
              corruptedSites={activeEval.corruptedSites}
              omittedSites={activeEval.omittedDueToNoBaseline}
              defaultExpanded={true}
            />
          </>
        )}

        {/* Flagged Exceptions State (Reframed for Duty Dispatcher) */}
        {boardState !== "loading" && boardState !== "refused" && boardState !== "unreachable" && activeVehicleState === "flagged" && activeEval && (
          <>
            {/* E. One decision line above everything */}
            <div
              id="campus-status-decision-line"
              className="mb-6 bg-stone-900 text-stone-100 rounded-xl p-6 border border-stone-800 shadow-xs"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-mono tracking-wider uppercase">
                  {selectedLotType === "C" ? "Car Arrivals" : selectedLotType === "Y" ? "Motorcycle Arrivals" : "Heavy Vehicle Arrivals"}
                </span>
                <span className="text-xs text-stone-400 font-mono">Next 60 Minutes • Campus Proximity</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5">
                {activeEval.decisionHeadline || "Sites near campus behaving normally."}
              </h1>
              {activeEval.decisionSubtext && (
                <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-3xl">
                  {activeEval.decisionSubtext}
                </p>
              )}
            </div>

            {/* Notable Exceptions */}
            {(activeEval.topAbove || activeEval.topBelow) && (
              <div id="flagged-exceptions-section" className="mb-8">
                <div className="flex items-center justify-between gap-3 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 font-mono">
                      Notable Exceptions ({activeEval.topAbove && activeEval.topBelow ? "2 sites" : "1 site"})
                    </span>
                    <span className="text-xs text-stone-500">
                      {activeEval.topAbove && activeEval.topBelow
                        ? "Filling faster & More space"
                        : activeEval.topAbove
                        ? "Filling faster than normal"
                        : "More space than normal"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExceptionsExpanded(!isExceptionsExpanded)}
                    aria-expanded={isExceptionsExpanded}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:border-stone-300 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{isExceptionsExpanded ? "Collapse exceptions" : "Expand exceptions"}</span>
                    {isExceptionsExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                    )}
                  </button>
                </div>

                {isExceptionsExpanded && (
                  <div className={activeEval.topAbove && activeEval.topBelow ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "grid grid-cols-1 gap-6 max-w-2xl"}>
                    {/* Column 1: Filling faster than usual (fewer free lots than normal) */}
                    {activeEval.topAbove && (
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between gap-2 mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100"></span>
                            <h2 className="text-base font-bold text-stone-900 uppercase tracking-wide">
                              Filling Faster Than Usual
                            </h2>
                          </div>
                          <span className="text-xs text-stone-500 font-medium">
                            Fewer free lots than normal
                          </span>
                        </div>
                        <ExceptionCard site={activeEval.topAbove} columnType="needs-attention" />
                      </div>
                    )}

                    {/* Column 2: More space available than usual (more free lots than normal) */}
                    {activeEval.topBelow && (
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between gap-2 mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-sky-500 ring-4 ring-sky-100"></span>
                            <h2 className="text-base font-bold text-stone-900 uppercase tracking-wide">
                              More Space Than Usual
                            </h2>
                          </div>
                          <span className="text-xs text-stone-500 font-medium">
                            More free lots than normal
                          </span>
                        </div>
                        <ExceptionCard site={activeEval.topBelow} columnType="has-capacity" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quiet Ranked List Beneath */}
            <QuietRankedList
              quietList={activeEval.quietList}
              missingSites={activeEval.missingSites}
              corruptedSites={activeEval.corruptedSites}
              omittedSites={activeEval.omittedDueToNoBaseline}
              defaultExpanded={true}
            />
          </>
        )}

        {/* How this is computed block beneath the board */}
        {activeEval && (activeVehicleState === "flagged" || activeVehicleState === "empty" || activeVehicleState === "miscalibrated") && (
          <ComputationTransparency
            allSites={[
              ...(activeEval.topAbove ? [activeEval.topAbove] : []),
              ...(activeEval.topBelow ? [activeEval.topBelow] : []),
              ...activeEval.quietList
            ]}
            readingTimestamp={data?.readingTimestamp || new Date().toISOString()}
            timeContext={data?.timeContext}
          />
        )}

        {/* Notify Form Below the Board */}
        <NotifyForm flaggedSites={flaggedSites} />

        {/* Footer with Licence Attribution & Headline Trap */}
        <Footer />
      </main>
    </div>
  );
}

