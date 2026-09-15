import { DeviationsResponse, EvaluatedSite, CarparkDirectoryRecord } from "./types";

let memoizedSimulatedDirectory: CarparkDirectoryRecord[] | null = null;

export function getSimulatedDirectoryRecords(): CarparkDirectoryRecord[] {
  if (memoizedSimulatedDirectory) return memoizedSimulatedDirectory;

  const records: CarparkDirectoryRecord[] = [];

  // The 8 watched campus sites first
  const watched: CarparkDirectoryRecord[] = [
    { carParkId: "1", development: "Suntec City", area: "Marina", agency: "LTA", lotType: "C", availableLots: 420, latitude: 1.2935, longitude: 103.8572 },
    { carParkId: "2", development: "Marina Square", area: "Marina", agency: "LTA", lotType: "C", availableLots: 310, latitude: 1.2911, longitude: 103.8576 },
    { carParkId: "3", development: "Raffles City", area: "City", agency: "LTA", lotType: "C", availableLots: 190, latitude: 1.2939, longitude: 103.8532 },
    { carParkId: "4", development: "The Centrepoint", area: "Orchard", agency: "LTA", lotType: "C", availableLots: 85, latitude: 1.3015, longitude: 103.8398 },
    { carParkId: "5", development: "313@Somerset", area: "Orchard", agency: "LTA", lotType: "C", availableLots: 62, latitude: 1.3010, longitude: 103.8385 },
    { carParkId: "6", development: "Orchard Central", area: "Orchard", agency: "LTA", lotType: "C", availableLots: 54, latitude: 1.3007, longitude: 103.8397 },
    { carParkId: "7", development: "ION Orchard", area: "Orchard", agency: "LTA", lotType: "C", availableLots: 140, latitude: 1.3040, longitude: 103.8318 },
    { carParkId: "8", development: "Tangs Plaza", area: "Orchard", agency: "LTA", lotType: "C", availableLots: null, latitude: 1.3048, longitude: 103.8332 }
  ];
  records.push(...watched);

  // Towns across Singapore
  const towns = [
    "Ang Mo Kio", "Bedok", "Bishan", "Bukit Batok", "Bukit Merah", "Bukit Panjang", "Choa Chu Kang",
    "Clementi", "Geylang", "Hougang", "Jurong East", "Jurong West", "Kallang", "Marine Parade",
    "Novena", "Pasir Ris", "Punggol", "Queenstown", "Sembawang", "Sengkang", "Serangoon", "Tampines",
    "Toa Payoh", "Woodlands", "Yishun", "Orchard", "City", "Marina"
  ];

  const landmarks = [
    "Mall Multi-Storey", "Point Basement", "Central MSCP", "Plaza Deck", "Hub West",
    "Square East", "Interchange Carpark", "Community Club", "Sports Complex", "Market & Food Centre",
    "Commercial Complex", "Industrial Park", "Logistics Hub", "Heights MSCP", "Green Deck",
    "Gardens Lot", "View MSCP", "Court Carpark", "Gateway B2", "Terminal Carpark"
  ];

  const agencies = ["HDB", "HDB", "HDB", "URA", "LTA"];
  const prefixes = ["ACB", "AM", "BD", "BS", "BB", "BM", "BP", "CCK", "CL", "GL", "HG", "JE", "JW", "KL", "MP", "NV", "PR", "PG", "QT", "SB", "SK", "SR", "TM", "TP", "WL", "YS"];

  const targetCount = 2607;
  while (records.length < targetCount) {
    const idx = records.length;
    const town = towns[(idx * 7) % towns.length];
    const landmark = landmarks[(idx * 11) % landmarks.length];
    const agency = agencies[idx % agencies.length];
    const prefix = prefixes[idx % prefixes.length];
    const carParkId = `${prefix}${Math.floor(idx / prefixes.length) + 1}`;

    let availableLots: number | null = (idx * 37) % 480;
    if (idx % 29 === 0) availableLots = 0; // full
    if (idx % 73 === 0) availableLots = null; // missing/unreported

    const lotType = (idx % 15 === 0) ? "Y" : (idx % 47 === 0) ? "H" : "C";

    records.push({
      carParkId,
      development: `${town} ${landmark} (${carParkId})`,
      area: town,
      agency,
      lotType,
      availableLots,
      latitude: 1.35 + ((idx % 50) - 25) * 0.003,
      longitude: 103.82 + ((idx % 70) - 35) * 0.003
    });
  }

  memoizedSimulatedDirectory = records;
  return records;
}

/**
 * Verified coordinates for accurate distance and area matching
 */
const SITE_COORDS: Record<string, { lat: number; lng: number; area: string; nearestArea: string; distKm: number }> = {
  "1": { lat: 1.2935, lng: 103.8572, area: "Marina", nearestArea: "City", distKm: 1.5 },
  "2": { lat: 1.2911, lng: 103.8576, area: "Marina", nearestArea: "City", distKm: 1.5 },
  "3": { lat: 1.2939, lng: 103.8532, area: "City", nearestArea: "City", distKm: 1.0 },
  "4": { lat: 1.3015, lng: 103.8398, area: "Orchard", nearestArea: "City", distKm: 1.2 },
  "5": { lat: 1.3010, lng: 103.8385, area: "Orchard", nearestArea: "City", distKm: 1.2 },
  "6": { lat: 1.3007, lng: 103.8397, area: "Orchard", nearestArea: "City", distKm: 1.1 },
  "7": { lat: 1.3040, lng: 103.8318, area: "Orchard", nearestArea: "City", distKm: 1.9 },
  "8": { lat: 1.3048, lng: 103.8332, area: "Orchard", nearestArea: "City", distKm: 1.9 },
  "9": { lat: 1.3025, lng: 103.8344, area: "Orchard", nearestArea: "City", distKm: 1.6 },
  "10": { lat: 1.2644, lng: 103.8222, area: "HarbourFront", nearestArea: "Bukit Merah", distKm: 1.4 },
  "11": { lat: 1.2642, lng: 103.8188, area: "HarbourFront", nearestArea: "Bukit Merah", distKm: 1.4 },
  "12": { lat: 1.3404, lng: 103.7060, area: "Jurong West", nearestArea: "Jurong West", distKm: 0.1 },
  "13": { lat: 1.3526, lng: 103.9452, area: "Tampines", nearestArea: "Tampines", distKm: 0.9 },
  "14": { lat: 1.3018, lng: 103.9052, area: "Marine Parade", nearestArea: "Marine Parade", distKm: 1.7 }
};

function enrichSite(s: EvaluatedSite): EvaluatedSite {
  const rainFactor = typeof s.rainFactor === "number" && !isNaN(s.rainFactor) ? s.rainFactor : 1.00;
  const baselineRate = typeof s.baselineOccupancyRate === "number" ? s.baselineOccupancyRate : (s.expectedOccupancyRate || 0.80);
  const expectedRaw = typeof s.expectedRaw === "number" ? s.expectedRaw : Math.round((1 - baselineRate) * s.totalLots);
  const expectedAdjusted = typeof s.expectedAdjusted === "number" ? s.expectedAdjusted : Math.round(expectedRaw * rainFactor);
  const deviationRaw = typeof s.deviationRaw === "number" ? s.deviationRaw : (expectedRaw > 0 ? Math.round(((s.lotsAvailable - expectedRaw) / expectedRaw) * 100) : 0);
  const deviationAdjusted = typeof s.deviationAdjusted === "number" ? s.deviationAdjusted : (expectedAdjusted > 0 ? Math.round(((s.lotsAvailable - expectedAdjusted) / expectedAdjusted) * 100) : 0);
  return {
    ...s,
    rainFactor,
    expectedRaw,
    expectedAdjusted,
    deviationRaw,
    deviationAdjusted
  };
}

function formatResponse(resp: DeviationsResponse): DeviationsResponse {
  const topAbove = resp.topAbove ? enrichSite(resp.topAbove) : null;
  const topBelow = resp.topBelow ? enrichSite(resp.topBelow) : null;
  const flaggedExceptions = resp.flaggedExceptions.map(enrichSite);
  const quietList = resp.quietList.map(enrichSite);

  const evalC = {
    lotType: "C" as const,
    evaluatedSites: [...flaggedExceptions, ...quietList],
    missingSites: resp.missingSites,
    corruptedSites: resp.corruptedSites || [],
    omittedDueToNoBaseline: resp.omittedDueToNoBaseline || [],
    flaggedExceptions,
    quietList,
    topAbove,
    topBelow,
    isAllWithinThreshold: resp.isAllWithinThreshold,
    isMiscalibrated: resp.isMiscalibrated || false,
    miscalibrationReason: resp.miscalibrationReason || null,
    over100Count: resp.over100Count || 0,
    evaluatedCount: resp.evaluatedCount,
    totalWatchedCount: resp.totalWatchedCount,
    decisionHeadline: resp.decisionHeadline || "Sites behaving normally.",
    decisionSubtext: resp.decisionSubtext || ""
  };

  const evalY = {
    lotType: "Y" as const,
    evaluatedSites: [
      enrichSite({
        id: "1",
        development: "Suntec City",
        area: "Marina",
        lotType: "Y",
        lotsAvailable: 45,
        expectedRaw: 30,
        expectedAdjusted: 30,
        carsDiff: 15,
        absCarsDiff: 15,
        carsHeadline: "15 more free than normal",
        actionText: "More motorcycle space available.",
        direction: "above" as const,
        rainFactor: 1.0,
        nearestAreaName: "City",
        nearestAreaForecast: "Fair",
        distanceKm: 1.5,
        deviation: 0.50,
        deviationPercent: 50,
        deviationSignedStr: "+50%",
        absDeviation: 0.50,
        plainSentence: "running 50% above its usual motorcycle baseline"
      })
    ],
    missingSites: [],
    corruptedSites: [],
    omittedDueToNoBaseline: [
      { id: "2", development: "Marina Square", reason: "No baseline for motorcycles at this site." },
      { id: "3", development: "Raffles City", reason: "No baseline for motorcycles at this site." },
      { id: "4", development: "The Centrepoint", reason: "No baseline for motorcycles at this site." },
      { id: "7", development: "ION Orchard", reason: "No baseline for motorcycles at this site." }
    ],
    flaggedExceptions: [],
    quietList: [
      enrichSite({
        id: "1",
        development: "Suntec City",
        area: "Marina",
        lotType: "Y",
        lotsAvailable: 45,
        expectedRaw: 30,
        expectedAdjusted: 30,
        carsDiff: 15,
        absCarsDiff: 15,
        carsHeadline: "15 more free than normal",
        actionText: "Normal motorcycle variance.",
        direction: "above" as const,
        rainFactor: 1.0,
        nearestAreaName: "City",
        nearestAreaForecast: "Fair",
        distanceKm: 1.5,
        deviation: 0.50,
        deviationPercent: 50,
        deviationSignedStr: "+50%",
        absDeviation: 0.50,
        plainSentence: "running 50% above its usual motorcycle baseline"
      })
    ],
    topAbove: null,
    topBelow: null,
    isAllWithinThreshold: true,
    isMiscalibrated: false,
    miscalibrationReason: null,
    over100Count: 0,
    evaluatedCount: 1,
    totalWatchedCount: 14,
    decisionHeadline: "Motorcycle lots operating normally.",
    decisionSubtext: "1 watched site evaluated; remaining sites have no designated motorcycle baselines."
  };

  const evalH = {
    lotType: "H" as const,
    evaluatedSites: [],
    missingSites: [],
    corruptedSites: [],
    omittedDueToNoBaseline: [
      { id: "1", development: "Suntec City", reason: "No baseline for heavy vehicles at this site." },
      { id: "2", development: "Marina Square", reason: "No baseline for heavy vehicles at this site." },
      { id: "3", development: "Raffles City", reason: "No baseline for heavy vehicles at this site." },
      { id: "7", development: "ION Orchard", reason: "No baseline for heavy vehicles at this site." }
    ],
    flaggedExceptions: [],
    quietList: [],
    topAbove: null,
    topBelow: null,
    isAllWithinThreshold: true,
    isMiscalibrated: false,
    miscalibrationReason: null,
    over100Count: 0,
    evaluatedCount: 0,
    totalWatchedCount: 14,
    decisionHeadline: "No heavy vehicle baselines for watched retail sites.",
    decisionSubtext: "Heavy vehicle lots ('H') are typically restricted to industrial and logistics parks."
  };

  return {
    ...resp,
    topAbove,
    topBelow,
    flaggedExceptions,
    quietList,
    pagesFetched: 6,
    totalRecords: resp.totalRecords || 2607,
    allRecords: resp.allRecords || getSimulatedDirectoryRecords(),
    recordsByLotType: { C: 2150, Y: 390, H: 67 },
    isPartial: false,
    ionOrchardFound: true,
    selectedLotType: "C",
    evaluatedByLotType: {
      C: evalC,
      Y: evalY,
      H: evalH
    }
  };
}

export function getScenarioData(
  scenario: "flagged" | "rain-adjusted" | "empty" | "stale" | "weather-degraded" | "miscalibrated"
): DeviationsResponse {
  const baseTimestamp = new Date().toISOString();
  const oldTimestamp = new Date(Date.now() - 22 * 60 * 1000).toISOString();

  // 1. MISCALIBRATED SANITY CHECK SCENARIO
  if (scenario === "miscalibrated") {
    return formatResponse({
      readingTimestamp: baseTimestamp,
      minutesOld: 1,
      isStale: false,
      cacheAge: 12,
      timeContext: {
        dayType: "sunday",
        hour: 19,
        weekdayName: "Sunday",
        period: "evening",
        timeLabel: "Sunday evening"
      },
      decisionHeadline: "Baseline calibration failure detected.",
      decisionSubtext: "11 of 14 evaluated sites deviate by over 100% from baseline. Deviations suppressed to avoid bad dispatches.",
      topAbove: null,
      topBelow: null,
      flaggedDistance: null,
      isAllWithinThreshold: false,
      isMiscalibrated: true,
      miscalibrationReason: "11 of 14 evaluated sites deviate by over 100% from baseline.",
      over100Count: 11,
      totalWatchedCount: 14,
      evaluatedCount: 14,
      flaggedExceptions: [],
      quietList: [
        {
          id: "1",
          development: "Suntec City",
          area: "Marina",
          lotsAvailable: 210,
          totalLots: 3100,
          actualLotsOccupied: 2890,
          expectedLotsOccupied: 1200,
          carsDiff: 1690,
          absCarsDiff: 1690,
          carsHeadline: "1,690 cars above normal",
          actionText: "Send someone.",
          direction: "above",
          actualOccupancyRate: 0.93,
          expectedOccupancyRate: 0.39,
          baselineOccupancyRate: 0.39,
          observedOn: "2026-08-28",
          rainFactor: 1.0,
          nearestAreaName: "City",
          nearestAreaForecast: "Fair",
          distanceKm: 1.5,
          deviation: 1.38,
          deviationPercent: 138,
          deviationSignedStr: "+138%",
          absDeviation: 1.38,
          plainSentence: "running 138% above its usual Sunday evening occupancy",
          isFull: false
        }
      ],
      missingSites: [],
      corruptedSites: [],
      omittedDueToNoBaseline: [],
      weather: {
        degraded: false,
        reason: "",
        unmatchedForecastStrings: []
      },
      lastGoodReadingTimestamp: baseTimestamp
    });
  }

  // 2. EMPTY STATE SCENARIO (Nothing needs a floater right now)
  if (scenario === "empty") {
    return formatResponse({
      readingTimestamp: baseTimestamp,
      minutesOld: 2,
      isStale: false,
      cacheAge: 24,
      timeContext: {
        dayType: "sunday",
        hour: 20,
        weekdayName: "Sunday",
        period: "evening",
        timeLabel: "Sunday evening"
      },
      decisionHeadline: "Nothing needs a floater right now.",
      decisionSubtext: "All 14 watched sites are operating within normal baseline limits. Floaters on standby.",
      topAbove: null,
      topBelow: null,
      flaggedDistance: null,
      isAllWithinThreshold: true,
      totalWatchedCount: 14,
      evaluatedCount: 14,
      flaggedExceptions: [],
      quietList: [
        {
          id: "10",
          development: "VivoCity",
          area: "HarbourFront",
          lotsAvailable: 168,
          totalLots: 2100,
          actualLotsOccupied: 1932,
          expectedLotsOccupied: 1932,
          carsDiff: 0,
          absCarsDiff: 0,
          carsHeadline: "Normal occupancy",
          actionText: "Monitor site.",
          direction: "normal",
          actualOccupancyRate: 0.92,
          expectedOccupancyRate: 0.92,
          baselineOccupancyRate: 0.92,
          observedOn: "2026-08-31",
          rainFactor: 1.0,
          nearestAreaName: "Bukit Merah",
          nearestAreaForecast: "Fair (Night)",
          distanceKm: 1.4,
          deviation: 0.0,
          deviationPercent: 0,
          deviationSignedStr: "0%",
          absDeviation: 0.0,
          plainSentence: "running at its usual Sunday evening occupancy (92% expected)",
          isFull: false
        },
        {
          id: "1",
          development: "Suntec City",
          area: "Marina",
          lotsAvailable: 465,
          totalLots: 3100,
          actualLotsOccupied: 2635,
          expectedLotsOccupied: 2635,
          carsDiff: 0,
          absCarsDiff: 0,
          carsHeadline: "Normal occupancy",
          actionText: "Monitor site.",
          direction: "normal",
          actualOccupancyRate: 0.85,
          expectedOccupancyRate: 0.85,
          baselineOccupancyRate: 0.85,
          observedOn: "2026-08-28",
          rainFactor: 1.0,
          nearestAreaName: "City",
          nearestAreaForecast: "Fair (Night)",
          distanceKm: 1.5,
          deviation: 0.0,
          deviationPercent: 0,
          deviationSignedStr: "0%",
          absDeviation: 0.0,
          plainSentence: "running at its usual Sunday evening occupancy (85% expected)",
          isFull: false
        },
        {
          id: "12",
          development: "Jurong Point",
          area: "Jurong West",
          lotsAvailable: 156,
          totalLots: 1420,
          actualLotsOccupied: 1264,
          expectedLotsOccupied: 1292,
          carsDiff: -28,
          absCarsDiff: 28,
          carsHeadline: "28 cars below normal",
          actionText: "Monitor site.",
          direction: "below",
          actualOccupancyRate: 0.89,
          expectedOccupancyRate: 0.91,
          baselineOccupancyRate: 0.91,
          observedOn: "2026-08-31",
          rainFactor: 1.0,
          nearestAreaName: "Jurong West",
          nearestAreaForecast: "Fair (Night)",
          distanceKm: 0.1,
          deviation: -0.02,
          deviationPercent: -2,
          deviationSignedStr: "-2%",
          absDeviation: 0.02,
          plainSentence: "running 2% below its usual Sunday evening occupancy",
          isFull: false
        },
        {
          id: "14",
          development: "Parkway Parade",
          area: "Marine Parade",
          lotsAvailable: 140,
          totalLots: 1200,
          actualLotsOccupied: 1060,
          expectedLotsOccupied: 1080,
          carsDiff: -20,
          absCarsDiff: 20,
          carsHeadline: "20 cars below normal",
          actionText: "Monitor site.",
          direction: "below",
          actualOccupancyRate: 0.88,
          expectedOccupancyRate: 0.90,
          baselineOccupancyRate: 0.90,
          observedOn: "2026-08-31",
          rainFactor: 1.0,
          nearestAreaName: "Marine Parade",
          nearestAreaForecast: "Fair (Night)",
          distanceKm: 1.7,
          deviation: -0.02,
          deviationPercent: -2,
          deviationSignedStr: "-2%",
          absDeviation: 0.02,
          plainSentence: "running 2% below its usual Sunday evening occupancy",
          isFull: false
        }
      ],
      missingSites: [],
      corruptedSites: [],
      omittedDueToNoBaseline: [],
      weather: {
        degraded: false,
        reason: "",
        unmatchedForecastStrings: []
      },
      lastGoodReadingTimestamp: baseTimestamp
    });
  }

  // 3. FLAGGED / RAIN-ADJUSTED / STALE / WEATHER-DEGRADED SCENARIOS
  const isStale = scenario === "stale";
  const isWeatherDegraded = scenario === "weather-degraded";
  const isRainAdjusted = scenario === "rain-adjusted";

  // Top Above (Needs Attention): Suntec City
  // Under rain-adjusted, baseline drops with rain factor, so Suntec is even more heavily off-pattern!
  const topAbove: EvaluatedSite = {
    id: "1",
    development: "Suntec City",
    area: "Marina",
    lotsAvailable: isRainAdjusted ? 373 : 373,
    totalLots: 3060,
    actualLotsOccupied: 2687,
    expectedLotsOccupied: isRainAdjusted ? 2521 : 2448,
    carsDiff: isRainAdjusted ? 166 : 239,
    absCarsDiff: isRainAdjusted ? 166 : 239,
    carsHeadline: isRainAdjusted ? "166 cars above rain-adjusted baseline" : "239 cars above normal",
    actionText: "Filling faster than usual.",
    direction: "above",
    actualOccupancyRate: 0.88,
    expectedOccupancyRate: isRainAdjusted ? 0.82 : 0.80,
    baselineOccupancyRate: 0.80,
    expectedRaw: 612,
    expectedAdjusted: isRainAdjusted ? 539 : 612,
    deviationRaw: -39,
    deviationAdjusted: isRainAdjusted ? -31 : -39,
    observedOn: "2026-08-28",
    rainFactor: isRainAdjusted ? 0.88 : 1.0,
    nearestAreaName: "City",
    nearestAreaForecast: isRainAdjusted
      ? "Heavy Rain"
      : isWeatherDegraded
      ? "Thundery Showers"
      : "Clear",
    distanceKm: 1.48,
    deviation: isRainAdjusted ? -0.31 : -0.39,
    deviationPercent: isRainAdjusted ? -31 : -39,
    deviationSignedStr: isRainAdjusted ? "-31%" : "-39%",
    absDeviation: isRainAdjusted ? 0.31 : 0.39,
    plainSentence: isRainAdjusted
      ? "running 31% below its usual weekday afternoon availability, after lowering the expectation 12% for heavy rain in City"
      : "running 39% below its usual weekday afternoon availability. No weather adjustment — clear in City",
    isFull: false
  };

  // Top Below (Has Capacity): Raffles City
  const topBelow: EvaluatedSite = {
    id: "3",
    development: "Raffles City",
    area: "City",
    lotsAvailable: isRainAdjusted ? 525 : 525,
    totalLots: 1050,
    actualLotsOccupied: 525,
    expectedLotsOccupied: isRainAdjusted ? 892 : 871,
    carsDiff: isRainAdjusted ? -367 : -346,
    absCarsDiff: isRainAdjusted ? 367 : 346,
    carsHeadline: isRainAdjusted ? "367 cars below rain-adjusted baseline" : "346 cars below normal",
    actionText: "More capacity available than usual.",
    direction: "below",
    actualOccupancyRate: 0.50,
    expectedOccupancyRate: isRainAdjusted ? 0.85 : 0.83,
    baselineOccupancyRate: 0.83,
    expectedRaw: 179,
    expectedAdjusted: isRainAdjusted ? 158 : 179,
    deviationRaw: 193,
    deviationAdjusted: isRainAdjusted ? 232 : 193,
    observedOn: "2026-08-28",
    rainFactor: isRainAdjusted ? 0.88 : 1.0,
    nearestAreaName: "City",
    nearestAreaForecast: isRainAdjusted
      ? "Heavy Rain"
      : isWeatherDegraded
      ? "Thundery Showers"
      : "Clear",
    distanceKm: 1.0,
    deviation: isRainAdjusted ? 2.32 : 1.93,
    deviationPercent: isRainAdjusted ? 232 : 193,
    deviationSignedStr: isRainAdjusted ? "+232%" : "+193%",
    absDeviation: isRainAdjusted ? 0.41 : 0.40,
    plainSentence: isRainAdjusted
      ? "running 232% above its usual weekday afternoon availability, after lowering the expectation 12% for heavy rain in City"
      : "running 193% above its usual weekday afternoon availability. No weather adjustment — clear in City",
    isFull: false
  };

  // Straight line Haversine distance between Suntec City (1.2935, 103.8572) and Raffles City (1.2939, 103.8532)
  // Distance is 0.45 km (< 5km threshold -> One trip)
  const flaggedDistance = {
    distanceKm: 0.5,
    isOneTrip: true,
    tripSummary: "One trip",
    tripDescription: "0.5 km apart — one trip. A single floater can cover both sites.",
    origin: "Raffles City",
    destination: "Suntec City"
  };

  // Decision line for duty dispatcher
  const decisionHeadline = isRainAdjusted
    ? "Rain adjustment active: Two sites deviate from storm baseline."
    : "Two sites need attention before the evening peak.";
  const decisionSubtext = isRainAdjusted
    ? "Heavy Thundery Showers in City (-12% demand discount). Suntec City is still running hot (+558 cars); Raffles City has surplus capacity (-242 cars)."
    : "Redeploy floater from Raffles City to Suntec City (0.5 km — single trip). Queues forming at Suntec; excess capacity at Raffles City.";

  return formatResponse({
    readingTimestamp: isStale ? oldTimestamp : baseTimestamp,
    minutesOld: isStale ? 22 : 3,
    isStale,
    cacheAge: isStale ? 1320 : 18,
    timeContext: {
      dayType: "sunday",
      hour: 19,
      weekdayName: "Sunday",
      period: "evening",
      timeLabel: "Sunday evening"
    },
    decisionHeadline,
    decisionSubtext,
    topAbove,
    topBelow,
    flaggedDistance,
    isAllWithinThreshold: false,
    totalWatchedCount: 14,
    evaluatedCount: 12,
    flaggedExceptions: [topAbove, topBelow],
    quietList: [
      {
        id: "10",
        development: "VivoCity",
        area: "HarbourFront",
        lotsAvailable: 150,
        totalLots: 2100,
        actualLotsOccupied: 1950,
        expectedLotsOccupied: 1974,
        carsDiff: -24,
        absCarsDiff: 24,
        carsHeadline: "24 cars below normal",
        actionText: "Monitor site.",
        direction: "below",
        actualOccupancyRate: 0.93,
        expectedOccupancyRate: 0.94,
        baselineOccupancyRate: 0.94,
        observedOn: "2026-08-31",
        rainFactor: 1.0,
        nearestAreaName: "Bukit Merah",
        nearestAreaForecast: "Fair (Night)",
        distanceKm: 1.4,
        deviation: -0.01,
        deviationPercent: -1,
        deviationSignedStr: "-1%",
        absDeviation: 0.01,
        plainSentence: "running 1% below its usual Sunday evening occupancy (94% expected)",
        isFull: false
      },
      {
        id: "11",
        development: "HarbourFront Centre",
        area: "HarbourFront",
        lotsAvailable: 170,
        totalLots: 980,
        actualLotsOccupied: 810,
        expectedLotsOccupied: 813,
        carsDiff: -3,
        absCarsDiff: 3,
        carsHeadline: "3 cars below normal",
        actionText: "Monitor site.",
        direction: "below",
        actualOccupancyRate: 0.83,
        expectedOccupancyRate: 0.83,
        baselineOccupancyRate: 0.83,
        observedOn: "2026-08-31",
        rainFactor: 1.0,
        nearestAreaName: "Bukit Merah",
        nearestAreaForecast: "Fair (Night)",
        distanceKm: 1.4,
        deviation: 0.0,
        deviationPercent: 0,
        deviationSignedStr: "0%",
        absDeviation: 0.0,
        plainSentence: "running at its usual Sunday evening occupancy (83% expected)",
        isFull: false
      },
      {
        id: "12",
        development: "Jurong Point",
        area: "Jurong West",
        lotsAvailable: 110,
        totalLots: 1420,
        actualLotsOccupied: 1310,
        expectedLotsOccupied: 1306,
        carsDiff: 4,
        absCarsDiff: 4,
        carsHeadline: "4 cars above normal",
        actionText: "Monitor site.",
        direction: "above",
        actualOccupancyRate: 0.92,
        expectedOccupancyRate: 0.92,
        baselineOccupancyRate: 0.92,
        observedOn: "2026-08-31",
        rainFactor: 1.0,
        nearestAreaName: "Jurong West",
        nearestAreaForecast: "Fair (Night)",
        distanceKm: 0.1,
        deviation: 0.0,
        deviationPercent: 0,
        deviationSignedStr: "0%",
        absDeviation: 0.0,
        plainSentence: "running at its usual Sunday evening occupancy (92% expected)",
        isFull: false
      },
      {
        id: "14",
        development: "Parkway Parade",
        area: "Marine Parade",
        lotsAvailable: 95,
        totalLots: 1200,
        actualLotsOccupied: 1105,
        expectedLotsOccupied: 1092,
        carsDiff: 13,
        absCarsDiff: 13,
        carsHeadline: "13 cars above normal",
        actionText: "Monitor site.",
        direction: "above",
        actualOccupancyRate: 0.92,
        expectedOccupancyRate: 0.91,
        baselineOccupancyRate: 0.91,
        observedOn: "2026-08-31",
        rainFactor: 1.0,
        nearestAreaName: "Marine Parade",
        nearestAreaForecast: "Fair (Night)",
        distanceKm: 1.7,
        deviation: 0.01,
        deviationPercent: 1,
        deviationSignedStr: "+1%",
        absDeviation: 0.01,
        plainSentence: "running 1% above its usual Sunday evening occupancy",
        isFull: false
      },
      {
        id: "13",
        development: "Tampines Mall",
        area: "Tampines",
        lotsAvailable: 88,
        totalLots: 850,
        actualLotsOccupied: 762,
        expectedLotsOccupied: 765,
        carsDiff: -3,
        absCarsDiff: 3,
        carsHeadline: "3 cars below normal",
        actionText: "Monitor site.",
        direction: "below",
        actualOccupancyRate: 0.90,
        expectedOccupancyRate: 0.90,
        baselineOccupancyRate: 0.90,
        observedOn: "2026-08-31",
        rainFactor: 1.0,
        nearestAreaName: "Tampines",
        nearestAreaForecast: "Fair (Night)",
        distanceKm: 0.9,
        deviation: 0.0,
        deviationPercent: 0,
        deviationSignedStr: "0%",
        absDeviation: 0.0,
        plainSentence: "running at its usual Sunday evening occupancy (90% expected)",
        isFull: false
      },
      {
        id: "7",
        development: "ION Orchard",
        area: "Orchard",
        lotsAvailable: 0,
        totalLots: 600,
        actualLotsOccupied: 600,
        expectedLotsOccupied: 558,
        carsDiff: 42,
        absCarsDiff: 42,
        carsHeadline: "42 cars above normal",
        actionText: "Monitor site.",
        direction: "above",
        actualOccupancyRate: 1.0,
        expectedOccupancyRate: 0.93,
        baselineOccupancyRate: 0.93,
        observedOn: "2026-08-30",
        rainFactor: 1.0,
        nearestAreaName: "City",
        nearestAreaForecast: "Fair (Night)",
        distanceKm: 1.9,
        deviation: 0.08,
        deviationPercent: 8,
        deviationSignedStr: "+8%",
        absDeviation: 0.08,
        plainSentence: "running 8% above its usual Sunday evening occupancy",
        isFull: true
      },
      {
        id: "2",
        development: "Marina Square",
        area: "Marina",
        lotsAvailable: 410,
        totalLots: 2200,
        actualLotsOccupied: 1790,
        expectedLotsOccupied: 1804,
        carsDiff: -14,
        absCarsDiff: 14,
        carsHeadline: "14 cars below normal",
        actionText: "Monitor site.",
        direction: "below",
        actualOccupancyRate: 0.81,
        expectedOccupancyRate: 0.82,
        baselineOccupancyRate: 0.82,
        observedOn: "2026-08-28",
        rainFactor: 1.0,
        nearestAreaName: "City",
        nearestAreaForecast: "Fair (Night)",
        distanceKm: 1.5,
        deviation: -0.01,
        deviationPercent: -1,
        deviationSignedStr: "-1%",
        absDeviation: 0.01,
        plainSentence: "running 1% below its usual Sunday evening occupancy",
        isFull: false
      },
      {
        id: "4",
        development: "The Centrepoint",
        area: "Orchard",
        lotsAvailable: 130,
        totalLots: 850,
        actualLotsOccupied: 720,
        expectedLotsOccupied: 723,
        carsDiff: -3,
        absCarsDiff: 3,
        carsHeadline: "3 cars below normal",
        actionText: "Monitor site.",
        direction: "below",
        actualOccupancyRate: 0.85,
        expectedOccupancyRate: 0.85,
        baselineOccupancyRate: 0.85,
        observedOn: "2026-08-29",
        rainFactor: 1.0,
        nearestAreaName: "City",
        nearestAreaForecast: "Fair (Night)",
        distanceKm: 1.2,
        deviation: 0.0,
        deviationPercent: 0,
        deviationSignedStr: "0%",
        absDeviation: 0.0,
        plainSentence: "running at its usual Sunday evening occupancy",
        isFull: false
      },
      {
        id: "5",
        development: "313@Somerset",
        area: "Orchard",
        lotsAvailable: 22,
        totalLots: 230,
        actualLotsOccupied: 208,
        expectedLotsOccupied: 207,
        carsDiff: 1,
        absCarsDiff: 1,
        carsHeadline: "1 car above normal",
        actionText: "Monitor site.",
        direction: "above",
        actualOccupancyRate: 0.90,
        expectedOccupancyRate: 0.90,
        baselineOccupancyRate: 0.90,
        observedOn: "2026-08-29",
        rainFactor: 1.0,
        nearestAreaName: "City",
        nearestAreaForecast: "Fair (Night)",
        distanceKm: 1.2,
        deviation: 0.0,
        deviationPercent: 0,
        deviationSignedStr: "0%",
        absDeviation: 0.0,
        plainSentence: "running at its usual Sunday evening occupancy",
        isFull: false
      },
      {
        id: "6",
        development: "Orchard Central",
        area: "Orchard",
        lotsAvailable: 55,
        totalLots: 420,
        actualLotsOccupied: 365,
        expectedLotsOccupied: 365,
        carsDiff: 0,
        absCarsDiff: 0,
        carsHeadline: "Normal occupancy",
        actionText: "Monitor site.",
        direction: "normal",
        actualOccupancyRate: 0.87,
        expectedOccupancyRate: 0.87,
        baselineOccupancyRate: 0.87,
        observedOn: "2026-08-29",
        rainFactor: 1.0,
        nearestAreaName: "City",
        nearestAreaForecast: "Fair (Night)",
        distanceKm: 1.1,
        deviation: 0.0,
        deviationPercent: 0,
        deviationSignedStr: "0%",
        absDeviation: 0.0,
        plainSentence: "running at its usual Sunday evening occupancy",
        isFull: false
      }
    ],
    // Corrupted reading quarantine: Site 9 (Ngee Ann City)
    corruptedSites: [
      {
        id: "9",
        development: "Ngee Ann City",
        area: "Orchard",
        lotsAvailable: -5,
        status: "Reading looks wrong for this site",
        reason: "Available lots negative (-5)"
      }
    ],
    // Missing site feed absent: Site 8 (Tangs Plaza)
    missingSites: [
      {
        id: "8",
        development: "Tangs Plaza",
        status: "No reading for this site"
      }
    ],
    omittedDueToNoBaseline: [],
    weather: {
      degraded: isWeatherDegraded,
      reason: isWeatherDegraded
        ? "Rain adjustment unavailable — deviations are unadjusted."
        : "",
      unmatchedForecastStrings: []
    },
    lastGoodReadingTimestamp: baseTimestamp
  });
}
