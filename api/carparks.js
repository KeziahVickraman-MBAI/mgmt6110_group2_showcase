import { WATCHED_SITES, WATCHED_IDS } from "./constants.js";

// In-memory cache for carparks (60s TTL)
let memoryCache = {
  data: null,
  fetchedAt: 0
};

/**
 * Server-side internal fetcher for LTA CarParkAvailabilityv2 with pagination loop
 *
 * LTA DataMall v2 paginates in batches of 500 via $skip.
 * We loop $skip in increments of 500 until fewer than 500 records are returned,
 * capped at 20 pages as a safety stop.
 */
export async function fetchCarparksData() {
  const accountKey = process.env.LTA_ACCOUNT_KEY;

  // Guard BEFORE the fetch: if missing or empty, return 503 with a named error.
  // An unset variable is sent as "undefined" and LTA answers 401.
  if (!accountKey || accountKey.trim() === "") {
    const err = new Error("LTA_ACCOUNT_KEY is not set. Add it in Vercel and redeploy.");
    err.statusCode = 503;
    throw err;
  }

  const now = Date.now();
  if (memoryCache.data && (now - memoryCache.fetchedAt < 60000)) {
    const cacheAge = Math.floor((now - memoryCache.fetchedAt) / 1000);
    return { ...memoryCache.data, cacheAge, fromCache: true };
  }

  const baseUrl = "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2";
  const allRecords = [];
  const seenKeys = new Set();
  const recordsByLotType = { C: 0, H: 0, Y: 0 };
  let pageIndex = 0;
  let isPartial = false;
  let partialMessage = null;
  const maxPages = 20;

  while (pageIndex < maxPages) {
    const skip = pageIndex * 500;
    const url = skip > 0 ? `${baseUrl}?$skip=${skip}` : baseUrl;

    let response;
    try {
      response = await fetch(url, {
        headers: {
          AccountKey: accountKey.trim()
        }
      });
    } catch (netErr) {
      if (pageIndex === 0) {
        const err = new Error("Can't reach the transport feed. " + (netErr.message || "Network unreachable"));
        err.statusCode = 502;
        throw err;
      } else {
        isPartial = true;
        partialMessage = `Showing ${allRecords.length} of an unknown total; the feed stopped responding at page ${pageIndex + 1}`;
        console.warn(`[PAGINATION] Failed to fetch page ${pageIndex + 1}:`, netErr.message);
        break;
      }
    }

    // Check response.ok BEFORE reading any body. LTA returns an empty body on 401.
    if (!response.ok) {
      if (pageIndex === 0) {
        if (response.status === 401 || response.status === 403) {
          const err = new Error("The transport feed rejected our credential. Nothing on this screen is current.");
          err.statusCode = 401;
          throw err;
        }
        const err = new Error(`Transport feed answered with HTTP ${response.status}`);
        err.statusCode = response.status;
        throw err;
      } else {
        isPartial = true;
        partialMessage = `Showing ${allRecords.length} of an unknown total; the feed stopped responding at page ${pageIndex + 1}`;
        console.warn(`[PAGINATION] Page ${pageIndex + 1} returned status ${response.status}`);
        break;
      }
    }

    let json;
    try {
      json = await response.json();
    } catch (parseErr) {
      if (pageIndex === 0) {
        const err = new Error("Failed to parse transport feed response JSON.");
        err.statusCode = 502;
        throw err;
      } else {
        isPartial = true;
        partialMessage = `Showing ${allRecords.length} of an unknown total; the feed stopped responding at page ${pageIndex + 1}`;
        break;
      }
    }

    const pageItems = Array.isArray(json?.value) ? json.value : [];
    pageIndex++;

    for (const item of pageItems) {
      const carParkId = String(item.CarParkID || "").trim();
      const lotType = String(item.LotType || "C").trim().toUpperCase();
      const dedupKey = `${carParkId}_${lotType}`;

      if (seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);

      // Count lot types ('C', 'H', 'Y', or other)
      if (recordsByLotType[lotType] !== undefined) {
        recordsByLotType[lotType]++;
      } else {
        recordsByLotType[lotType] = 1;
      }

      // Cast AvailableLots at boundary (supports number or string)
      const rawAvailable = item.AvailableLots;
      let availableLots = null;
      if (rawAvailable !== undefined && rawAvailable !== null && rawAvailable !== "") {
        const parsed = Number(rawAvailable);
        if (!isNaN(parsed)) {
          availableLots = parsed;
        }
      }

      // Parse Location (e.g. "1.29375 103.85718")
      let latitude = null;
      let longitude = null;
      if (typeof item.Location === "string" && item.Location.trim()) {
        const parts = item.Location.trim().split(/[\s,]+/);
        if (parts.length >= 2) {
          const p0 = Number(parts[0]);
          const p1 = Number(parts[1]);
          if (p0 >= 1.0 && p0 <= 1.5 && p1 >= 103.0 && p1 <= 104.5) {
            latitude = p0;
            longitude = p1;
          } else if (p1 >= 1.0 && p1 <= 1.5 && p0 >= 103.0 && p0 <= 104.5) {
            latitude = p1;
            longitude = p0;
          }
        }
      }

      allRecords.push({
        carParkId,
        development: item.Development || "Unknown Carpark",
        area: item.Area || "Singapore",
        agency: item.Agency || "Unknown",
        lotType,
        availableLots,
        latitude,
        longitude
      });
    }

    // Stop looping when page returns fewer than 500 records
    if (pageItems.length < 500) {
      break;
    }
  }

  if (pageIndex >= maxPages) {
    console.warn(`[PAGINATION] Hit 20-page safety cap. Loop stopped after fetching ${allRecords.length} records across ${pageIndex} pages.`);
  }

  const readingTimestamp = new Date().toISOString();

  // Check whether ION Orchard appeared across all fetched pages
  // Note: ION Orchard is on later pages. If it appears, previous "No reading for this site"
  // was a pagination artifact caused by capping at page 1, not an LTA data gap.
  const ionOrchardRecord = allRecords.find(r => r.carParkId === "7" || /ion orchard/i.test(r.development));
  const ionOrchardFound = Boolean(ionOrchardRecord);
  if (ionOrchardFound) {
    console.log(`[PAGINATION] ION Orchard (ID 7) successfully retrieved from feed on page > 1: ${ionOrchardRecord.availableLots} available lots (${ionOrchardRecord.lotType})`);
  }

  const result = {
    timestamp: readingTimestamp,
    cacheAge: 0,
    pagesFetched: pageIndex,
    totalRecords: allRecords.length,
    recordsByLotType,
    isPartial,
    partialMessage,
    ionOrchardFound,
    allRecords
  };

  memoryCache = {
    data: result,
    fetchedAt: now
  };

  return result;
}

/**
 * Express / Vercel Handler
 */
export default async function handler(req, res) {
  try {
    const data = await fetchCarparksData();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(data);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      error: err.message || "Failed to fetch carpark data",
      status
    });
  }
}
