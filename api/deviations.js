import { WATCHED_SITES, BASELINES, getRainFactor } from "./constants.js";
import { fetchCarparksData } from "./carparks.js";
import { fetchWeatherData } from "./weather.js";

// Memory storage for last successful read to support unreachable state sentence
let lastGoodReading = {
  timestamp: null,
  carparksData: null
};

/**
 * Determine Singapore day-type and hour
 */
export function getSingaporeTimeContext(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Singapore",
    weekday: "long",
    hour: "numeric",
    hourCycle: "h23"
  });
  const parts = formatter.formatToParts(date);
  let weekdayName = "";
  let hour = 0;
  for (const p of parts) {
    if (p.type === "weekday") weekdayName = p.value;
    if (p.type === "hour") hour = parseInt(p.value, 10);
  }

  const lower = weekdayName.toLowerCase();
  let dayType = "weekday";
  if (lower === "saturday") dayType = "saturday";
  else if (lower === "sunday") dayType = "sunday";

  let period = "afternoon";
  if (hour >= 0 && hour < 6) period = "early morning";
  else if (hour >= 6 && hour < 12) period = "morning";
  else if (hour >= 12 && hour < 18) period = "afternoon";
  else period = "evening";

  const timeLabel = dayType === "weekday"
    ? `weekday ${period}`
    : `${weekdayName} ${period}`;

  return { dayType, hour, weekdayName, period, timeLabel };
}

/**
 * Haversine formula for spherical distance between two coordinates in kilometers
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearest forecast area by Haversine distance
 */
function findNearestForecastArea(siteLat, siteLng, forecastAreas) {
  if (!forecastAreas || forecastAreas.length === 0) {
    return { name: "City", forecast: "Partly Cloudy (Day)", distanceKm: 0 };
  }

  let nearest = null;
  let minDistance = Infinity;

  for (const area of forecastAreas) {
    if (typeof area.latitude !== "number" || typeof area.longitude !== "number") continue;
    const d = haversineDistanceKm(siteLat, siteLng, area.latitude, area.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = {
        name: area.name,
        forecast: area.forecast,
        latitude: area.latitude,
        longitude: area.longitude,
        distanceKm: Number(d.toFixed(2))
      };
    }
  }

  return nearest || { name: "City", forecast: "Partly Cloudy (Day)", distanceKm: 0 };
}

/**
 * Find watched record matching by CarParkID, aliases, or development name
 * and resolve appropriate lot type.
 */
function findWatchedRecord(watched, allRecords, targetLotType) {
  const watchedId = String(watched.id).trim().toLowerCase();
  const watchedDev = watched.development.toLowerCase().replace(/\s+/g, " ").trim();

  // Name patterns for each watched site
  const devPatterns = {
    "1": /suntec/i,
    "2": /marina\s*square/i,
    "3": /raffles\s*city/i,
    "4": /centrepoint/i,
    "5": /313\s*(@|at)?\s*somerset/i,
    "6": /orchard\s*central/i,
    "7": /ion\s*orchard/i,
    "8": /tangs(\s*plaza)?/i
  };

  const pattern = devPatterns[watched.id];

  const candidates = allRecords.filter(r => {
    const rId = String(r.carParkId || "").trim().toLowerCase();
    const rDev = String(r.development || "").toLowerCase().replace(/\s+/g, " ").trim();

    // Match by ID (exact string or numerical equality)
    if (rId === watchedId) return true;
    if (!isNaN(Number(rId)) && !isNaN(Number(watchedId)) && Number(rId) === Number(watchedId)) {
      return true;
    }

    // Match by regex pattern
    if (pattern && pattern.test(r.development)) return true;

    // Match by development name substring
    if (rDev.includes(watchedDev) || watchedDev.includes(rDev)) return true;

    return false;
  });

  if (candidates.length === 0) {
    return { record: null, reason: "absent_from_feed" };
  }

  // 1. Prefer candidate with exact target lot type
  const exactLotMatch = candidates.find(r => String(r.lotType || "").trim().toUpperCase() === targetLotType.toUpperCase());
  if (exactLotMatch) {
    return { record: exactLotMatch, reason: "matched" };
  }

  // 2. If target is 'C' (cars), check if site has a general/unspecified lot record
  if (targetLotType.toUpperCase() === "C") {
    const generalMatch = candidates.find(r => !r.lotType || r.lotType === "" || r.lotType.toUpperCase() === "ALL");
    if (generalMatch) {
      return { record: generalMatch, reason: "matched_general" };
    }
  }

  // 3. Site is published, but with a different lot type
  const otherRecord = candidates[0];
  return {
    record: null,
    reason: "different_lot_type",
    publishedLotType: otherRecord.lotType || "Other",
    otherRecord
  };
}

/**
 * Evaluate watched sites for a specific lot type ('C', 'Y', 'H')
 */
function evaluateLotTypeGroup(lotType, allRecords, forecastAreas, weatherDegraded, unmatchedForecastStrings, timeContext) {
  const evaluatedSites = [];
  const missingSites = [];
  const corruptedSites = [];
  const omittedDueToNoBaseline = [];

  for (const watched of WATCHED_SITES) {
    const lookup = findWatchedRecord(watched, allRecords, lotType);

    if (lookup.reason === "absent_from_feed") {
      // Genuinely absent across all fetched pages -> UNKNOWN / No reading for this site
      missingSites.push({
        id: watched.id,
        development: watched.development,
        area: watched.area,
        status: "No reading for this site"
      });
      continue;
    }

    if (lookup.reason === "different_lot_type") {
      // Present in feed, but published under another vehicle lot type
      omittedDueToNoBaseline.push({
        id: watched.id,
        development: watched.development,
        area: watched.area,
        lotsAvailable: lookup.otherRecord?.availableLots ?? null,
        reason: `Publishes lot type ${lookup.publishedLotType}, no ${lotType} reading.`
      });
      continue;
    }

    const rec = lookup.record;
    const availableLots = rec ? rec.availableLots : null;

    // Guard for AvailableLots being negative, non-numeric, or null
    if (availableLots === null || isNaN(availableLots) || availableLots < 0) {
      corruptedSites.push({
        id: watched.id,
        development: watched.development,
        area: watched.area,
        lotsAvailable: availableLots,
        status: "Reading looks wrong for this site"
      });
      continue;
    }

    // Baselines are strictly observed counts per lot type ('C' for cars, 'Y' for motorcycles, 'H' for heavy vehicles)
    const siteBaselines = BASELINES[watched.id];
    const lotTypeBaseline = siteBaselines?.lotTypes?.[lotType];

    // Check if site has an actual observed baseline
    if (!lotTypeBaseline || !lotTypeBaseline.observedOn) {
      omittedDueToNoBaseline.push({
        id: watched.id,
        development: watched.development,
        area: watched.area,
        lotsAvailable: availableLots,
        reason: "No baseline yet — availability only"
      });
      continue;
    }

    const hourlyBaselines = lotTypeBaseline[timeContext.dayType];
    const expectedRaw = hourlyBaselines && typeof hourlyBaselines[timeContext.hour] === "number"
      ? hourlyBaselines[timeContext.hour]
      : null;

    if (expectedRaw === null || expectedRaw <= 0) {
      omittedDueToNoBaseline.push({
        id: watched.id,
        development: watched.development,
        area: watched.area,
        lotsAvailable: availableLots,
        reason: "No baseline yet — availability only"
      });
      continue;
    }

    // Match nearest forecast area using Haversine
    const siteLat = rec.latitude || watched.latitude;
    const siteLng = rec.longitude || watched.longitude;
    const nearestArea = findNearestForecastArea(siteLat, siteLng, forecastAreas);

    let rainFactor = 1.00;
    if (!weatherDegraded && nearestArea) {
      const factorResult = getRainFactor(nearestArea.forecast);
      rainFactor = typeof factorResult.factor === "number" && !isNaN(factorResult.factor) ? factorResult.factor : 1.00;
      if (factorResult.isUnmatched) {
        unmatchedForecastStrings.add(nearestArea.forecast);
      }
    }

    // Adjusted expected available lots
    const expectedAdjusted = Math.round(expectedRaw * rainFactor);

    // Difference in available lots (net cars)
    // actualAvailable - expectedAdjusted
    const diff = availableLots - expectedAdjusted;
    const absDiff = Math.abs(diff);

    // deviation = (actual available - expected available) / expected available
    const deviation = expectedAdjusted > 0
      ? Number(((availableLots - expectedAdjusted) / expectedAdjusted).toFixed(4))
      : 0;
    const deviationPercent = Math.round(deviation * 100);
    const deviationSignedStr = (deviationPercent > 0 ? "+" : "") + `${deviationPercent}%`;

    // Headline stays net cars / vehicles:
    // "975 more free than normal" / "310 fewer free than normal"
    const vehicleLabel = lotType === "Y" ? "motorcycles" : (lotType === "H" ? "heavy vehicles" : "cars");
    let carsHeadline = "Operating at normal baseline";
    let direction = "normal";
    let actionText = "Operating within normal variance.";

    if (diff > 0) {
      direction = "above"; // more free lots than normal
      carsHeadline = `${absDiff.toLocaleString()} more free than normal`;
      actionText = "More parking space than usual.";
    } else if (diff < 0) {
      direction = "below"; // fewer free lots than normal
      carsHeadline = `${absDiff.toLocaleString()} fewer free than normal`;
      actionText = "Filling faster than usual.";
    }

    // Plain sentence
    const absPercent = Math.abs(deviationPercent);
    const dirWord = diff >= 0 ? "above" : "below";
    let plainSentence = "";

    if (rainFactor === 1.00 || weatherDegraded || !nearestArea) {
      let weatherDesc = "clear in City";
      if (!weatherDegraded && nearestArea && nearestArea.forecast) {
        weatherDesc = `${nearestArea.forecast.toLowerCase()} in ${nearestArea.name}`;
      }
      plainSentence = `running ${absPercent}% ${dirWord} its usual ${timeContext.timeLabel} availability. No weather adjustment — ${weatherDesc}`;
    } else {
      const loweringPercent = Math.round((1 - rainFactor) * 100);
      const weatherDesc = nearestArea && nearestArea.forecast
        ? `${nearestArea.forecast.toLowerCase()} in ${nearestArea.name}`
        : "heavy rain in City";
      plainSentence = `running ${absPercent}% ${dirWord} its usual ${timeContext.timeLabel} availability, after lowering the expectation ${loweringPercent}% for ${weatherDesc}`;
    }

    evaluatedSites.push({
      id: watched.id,
      development: watched.development,
      area: watched.area,
      agency: rec.agency,
      lotType,
      lotsAvailable: availableLots,
      expectedRaw,
      expectedAdjusted,
      carsDiff: diff,
      absCarsDiff: absDiff,
      carsHeadline,
      actionText,
      direction,
      latitude: siteLat,
      longitude: siteLng,
      observedOn: lotTypeBaseline.observedOn,
      rainFactor: Number(rainFactor.toFixed(2)),
      nearestAreaName: nearestArea ? nearestArea.name : null,
      nearestAreaForecast: nearestArea ? nearestArea.forecast : null,
      distanceKm: nearestArea ? Number(nearestArea.distanceKm) : 0,
      deviation,
      deviationPercent,
      deviationSignedStr,
      absDeviation: Math.abs(deviation),
      plainSentence
    });
  }

  // TIGHTENED CALIBRATION GUARD:
  // Rule 1: If every evaluated site deviates in the SAME direction by more than 25%,
  // that is a baseline problem, not simultaneous events at every site.
  // Rule 2: If more than half the evaluated sites deviate by over 100%
  const allAbove25 = evaluatedSites.length >= 2 && evaluatedSites.every(s => s.deviation > 0.25);
  const allBelow25 = evaluatedSites.length >= 2 && evaluatedSites.every(s => s.deviation < -0.25);
  const sameDirection25 = allAbove25 || allBelow25;

  const over100Deviations = evaluatedSites.filter(s => s.absDeviation > 1.0);
  const overHalf100 = evaluatedSites.length > 0 && (over100Deviations.length > evaluatedSites.length / 2);

  const isMiscalibrated = sameDirection25 || overHalf100;
  let miscalibrationReason = null;
  if (sameDirection25) {
    miscalibrationReason = allAbove25
      ? "Every evaluated site is deviating more than 25% above its baseline in the same direction. When all sites move together, this indicates miscalibrated baselines, not real-world events. Baselines look miscalibrated — deviations suppressed."
      : "Every evaluated site is deviating more than 25% below its baseline in the same direction. When all sites move together, this indicates miscalibrated baselines, not real-world events. Baselines look miscalibrated — deviations suppressed.";
    console.warn(`[CALIBRATION GUARD] All evaluated sites deviate in the SAME direction by > 25%. Baselines miscalibrated, suppressing deviations.`);
  } else if (overHalf100) {
    miscalibrationReason = `${over100Deviations.length} of ${evaluatedSites.length} evaluated sites deviate by over 100% from baseline. Baselines look miscalibrated — deviations suppressed.`;
    console.warn(`[CALIBRATION GUARD] Over 50% of sites deviate by > 100%. Baselines miscalibrated, suppressing deviations.`);
  }

  // Split exceptions:
  // "Needs attention": filling faster than usual (diff < 0, fewer free lots than normal)
  // "Has capacity": extra space (diff > 0, more free lots than normal)
  const thresholdRate = 0.10; // 10% deviation
  const thresholdLots = 15;   // at least 15 lots affected

  const fillingFaster = evaluatedSites
    .filter(s => s.carsDiff < 0 && s.absDeviation >= thresholdRate && s.absCarsDiff >= thresholdLots)
    .sort((a, b) => b.absCarsDiff - a.absCarsDiff);

  const extraCapacity = evaluatedSites
    .filter(s => s.carsDiff > 0 && s.absDeviation >= thresholdRate && s.absCarsDiff >= thresholdLots)
    .sort((a, b) => b.absCarsDiff - a.absCarsDiff);

  const topAbove = !isMiscalibrated && fillingFaster.length > 0 ? fillingFaster[0] : null;
  const topBelow = !isMiscalibrated && extraCapacity.length > 0 ? extraCapacity[0] : null;

  const flaggedExceptions = [
    ...(topAbove ? [topAbove] : []),
    ...(topBelow ? [topBelow] : [])
  ];

  const flaggedIds = new Set(flaggedExceptions.map(s => s.id));
  const quietList = evaluatedSites
    .filter(s => !flaggedIds.has(s.id))
    .sort((a, b) => b.absCarsDiff - a.absCarsDiff);

  const isAllWithinThreshold = !isMiscalibrated && !topAbove && !topBelow;

  // Decision headline
  let decisionHeadline = "All watched sites near campus are operating within normal baseline.";
  let decisionSubtext = "Availability across watched sites is within expected baseline limits for this hour.";

  if (isMiscalibrated) {
    decisionHeadline = "Baselines look miscalibrated — deviations suppressed.";
    decisionSubtext = miscalibrationReason || "Baselines look miscalibrated — deviations suppressed.";
  } else if (topAbove && topBelow) {
    decisionHeadline = `Two sites near campus deviating from normal baseline.`;
    decisionSubtext = `${topAbove.development} is filling faster than usual (${topAbove.carsHeadline}); ${topBelow.development} has extra space (${topBelow.carsHeadline}).`;
  } else if (topAbove) {
    decisionHeadline = `${topAbove.development} is filling faster than normal.`;
    decisionSubtext = `${topAbove.carsHeadline} (${topAbove.deviationSignedStr} vs baseline). Consider leaving earlier or heading to an alternative campus carpark.`;
  } else if (topBelow) {
    decisionHeadline = `${topBelow.development} has more space than usual.`;
    decisionSubtext = `${topBelow.carsHeadline} (${topBelow.deviationSignedStr} vs baseline). Other campus carparks operating near normal baseline.`;
  }

  return {
    lotType,
    evaluatedSites,
    missingSites,
    corruptedSites,
    omittedDueToNoBaseline,
    flaggedExceptions,
    quietList,
    topAbove,
    topBelow,
    isAllWithinThreshold,
    isMiscalibrated,
    miscalibrationReason,
    over100Count: over100Deviations.length,
    evaluatedCount: evaluatedSites.length,
    totalWatchedCount: WATCHED_SITES.length,
    decisionHeadline,
    decisionSubtext
  };
}

/**
 * Compute deviation payload
 */
export async function computeDeviations() {
  const timeContext = getSingaporeTimeContext();
  const unmatchedForecastStrings = new Set();

  // 1. Fetch weather (degrades separately, never fails entire board)
  let weatherData = null;
  let weatherDegraded = false;
  let weatherDegradedReason = "";

  try {
    weatherData = await fetchWeatherData();
  } catch (wErr) {
    weatherDegraded = true;
    weatherDegradedReason = "Rain adjustment unavailable — deviations are unadjusted.";
    console.warn("[DEVIATIONS] Weather feed unavailable:", wErr.message);
  }

  // 2. Fetch carparks (key required, fails whole board if refused or unreachable)
  let carparksData;
  try {
    carparksData = await fetchCarparksData();
    lastGoodReading = {
      timestamp: carparksData.timestamp,
      carparksData
    };
  } catch (cErr) {
    const status = cErr.statusCode || 500;
    const errorObj = {
      error: cErr.message,
      status,
      lastGoodReadingTimestamp: lastGoodReading.timestamp,
      isRefused: status === 401 || status === 403,
      isUnreachable: status === 502 || status === 503 || status === 504
    };
    throw errorObj;
  }

  const {
    allRecords,
    pagesFetched,
    totalRecords,
    recordsByLotType,
    isPartial,
    partialMessage,
    ionOrchardFound,
    timestamp: readingTimestamp,
    cacheAge
  } = carparksData;

  const forecastAreas = weatherData ? weatherData.areas : [];

  // Pre-evaluate for all 3 lot types ('C', 'Y', 'H')
  // This allows the frontend vehicle-type selector to re-filter the already-fetched payload
  // without triggering another API call!
  const evaluatedByLotType = {
    C: evaluateLotTypeGroup("C", allRecords, forecastAreas, weatherDegraded, unmatchedForecastStrings, timeContext),
    Y: evaluateLotTypeGroup("Y", allRecords, forecastAreas, weatherDegraded, unmatchedForecastStrings, timeContext),
    H: evaluateLotTypeGroup("H", allRecords, forecastAreas, weatherDegraded, unmatchedForecastStrings, timeContext)
  };

  // Freshness & staleness calculation (above 15 minutes old triggers stale state)
  const readingDate = new Date(readingTimestamp);
  const now = new Date();
  const minutesOld = Math.max(0, Math.floor((now.getTime() - readingDate.getTime()) / 60000));
  const isStale = minutesOld > 15;

  // Default to Cars ('C')
  const defaultEval = evaluatedByLotType["C"];

  return {
    readingTimestamp,
    minutesOld,
    isStale,
    cacheAge,
    timeContext,
    pagesFetched,
    totalRecords,
    recordsByLotType,
    isPartial,
    partialMessage,
    ionOrchardFound,
    selectedLotType: "C",
    ...defaultEval,
    evaluatedByLotType,
    allRecords,
    weather: {
      degraded: weatherDegraded,
      reason: weatherDegradedReason,
      unmatchedForecastStrings: Array.from(unmatchedForecastStrings)
    },
    lastGoodReadingTimestamp: lastGoodReading.timestamp
  };
}

/**
 * Express / Vercel Handler
 */
export default async function handler(req, res) {
  try {
    const data = await computeDeviations();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(data);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json(err);
  }
}
