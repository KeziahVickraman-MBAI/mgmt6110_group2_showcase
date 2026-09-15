// In-memory cache for weather (5 minutes TTL)
let weatherMemoryCache = {
  data: null,
  fetchedAt: 0
};

/**
 * Server-side internal fetcher for data.gov.sg two-hr-forecast
 */
export async function fetchWeatherData() {
  const now = Date.now();
  if (weatherMemoryCache.data && (now - weatherMemoryCache.fetchedAt < 300000)) {
    const cacheAge = Math.floor((now - weatherMemoryCache.fetchedAt) / 1000);
    return { ...weatherMemoryCache.data, cacheAge, fromCache: true };
  }

  const weatherUrl = "https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast";

  let response;
  try {
    response = await fetch(weatherUrl);
  } catch (netErr) {
    const err = new Error("Can't reach the weather feed: " + (netErr.message || "Network unreachable"));
    err.statusCode = 502;
    throw err;
  }

  if (!response.ok) {
    const err = new Error(`Weather feed responded with HTTP ${response.status}`);
    err.statusCode = response.status;
    throw err;
  }

  let body;
  try {
    body = await response.json();
  } catch (parseErr) {
    const err = new Error("Failed to parse weather feed JSON response.");
    err.statusCode = 502;
    throw err;
  }

  // data.gov.sg v2 wraps payload in {"code":0, "data": {...}, "errorMsg": ""}
  const data = body.data || body;
  const areaMetadata = Array.isArray(data.area_metadata) ? data.area_metadata : [];
  const items = Array.isArray(data.items) ? data.items : [];
  const firstItem = items[0] || {};
  const rawForecasts = Array.isArray(firstItem.forecasts) ? firstItem.forecasts : [];

  // Build metadata map by area name
  // NOTE: Key order varies between entries (some list longitude first, some latitude).
  // We read by key explicitly (lat = m.label_location.latitude, lng = m.label_location.longitude).
  const metaMap = new Map();
  for (const meta of areaMetadata) {
    if (meta && meta.name && meta.label_location) {
      const lat = Number(meta.label_location.latitude);
      const lng = Number(meta.label_location.longitude);
      metaMap.set(meta.name, {
        latitude: isNaN(lat) ? 0 : lat,
        longitude: isNaN(lng) ? 0 : lng
      });
    }
  }

  // Merge forecasts with coordinates
  const areas = [];
  for (const f of rawForecasts) {
    const areaName = f.area;
    const forecastStr = f.forecast || "Fair";
    const coords = metaMap.get(areaName) || { latitude: 0, longitude: 0 };
    areas.push({
      name: areaName,
      latitude: coords.latitude,
      longitude: coords.longitude,
      forecast: forecastStr
    });
  }

  const result = {
    timestamp: firstItem.timestamp || new Date().toISOString(),
    updateTimestamp: firstItem.update_timestamp || new Date().toISOString(),
    validPeriod: firstItem.valid_period || null,
    cacheAge: 0,
    areaCount: areas.length,
    areas
  };

  weatherMemoryCache = {
    data: result,
    fetchedAt: now
  };

  return result;
}

/**
 * Vercel Serverless Function Handler / Express Handler
 */
export default async function handler(req, res) {
  try {
    const data = await fetchWeatherData();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(data);
  } catch (err) {
    const status = err.statusCode || 502;
    return res.status(status).json({
      error: err.message || "Failed to fetch weather forecast",
      status
    });
  }
}
