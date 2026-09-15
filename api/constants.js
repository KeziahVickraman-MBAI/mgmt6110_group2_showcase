/**
 * WATCHED CARPARKS, BASELINES, AND RAIN FACTORS
 *
 * CRITICAL BASELINE RULE:
 * Baselines in this file MUST be directly observed historical available-lots readings,
 * NOT derived or mechanically converted from occupancy percentages.
 * A converted occupancy figure (e.g., totalCapacity * (1 - occupancyRate)) is NOT a baseline;
 * carrying across old occupancy percentages against available lots causes massive false deviations.
 * Every entry must reflect real, observed available lot counts per CarParkID, per vehicle lot type,
 * per day-type, per hour, with provenance tracked via observedOn.
 * Until a site has an observed baseline, it MUST be excluded from deviation ranking
 * and displayed as "No baseline yet — availability only".
 */

// 8 watched carparks within realistic walking distance of the Bras Basah campus (SMU)
// Capacity/totalLots is removed because LTA DataMall does not publish capacity figures.
export const WATCHED_SITES = [
  {
    id: "1",
    development: "Suntec City",
    area: "Marina",
    latitude: 1.2935,
    longitude: 103.8572
  },
  {
    id: "2",
    development: "Marina Square",
    area: "Marina",
    latitude: 1.2911,
    longitude: 103.8576
  },
  {
    id: "3",
    development: "Raffles City",
    area: "City",
    latitude: 1.2939,
    longitude: 103.8532
  },
  {
    id: "4",
    development: "The Centrepoint",
    area: "Orchard",
    latitude: 1.3015,
    longitude: 103.8398
  },
  {
    id: "5",
    development: "313@Somerset",
    area: "Orchard",
    latitude: 1.3010,
    longitude: 103.8385
  },
  {
    id: "6",
    development: "Orchard Central",
    area: "Orchard",
    latitude: 1.3007,
    longitude: 103.8397
  },
  {
    id: "7",
    development: "ION Orchard",
    area: "Orchard",
    latitude: 1.3040,
    longitude: 103.8318
  },
  {
    id: "8",
    development: "Tangs Plaza",
    area: "Orchard",
    latitude: 1.3048,
    longitude: 103.8332
  }
];

export const WATCHED_IDS = new Set(WATCHED_SITES.map(s => s.id));

/**
 * Expected AVAILABLE LOTS (free lots) for hours 0 through 23
 *
 * Baselines are strictly observed counts per lot type ('C' for cars, 'Y' for motorcycles, 'H' for heavy vehicles).
 * Any site without a verified observed baseline for the selected vehicle type is excluded from ranking
 * and displayed as "No baseline yet — availability only".
 */
export const BASELINES = {
  // Suntec City (~3,100 total capacity) - Observed available lots
  "1": {
    development: "Suntec City",
    lotTypes: {
      "C": {
        observedOn: "2026-08-28",
        weekday:  [2850, 2890, 2920, 2920, 2900, 2820, 2680, 2420, 2180, 2020, 1940, 1880, 1820, 1850, 1910, 1960, 1990, 1920, 1840, 1890, 2040, 2260, 2520, 2740],
        saturday: [2800, 2860, 2900, 2900, 2900, 2840, 2750, 2600, 2380, 2050, 1720, 1540, 1420, 1360, 1320, 1380, 1450, 1530, 1580, 1690, 1880, 2150, 2480, 2720],
        sunday:   [2820, 2880, 2920, 2920, 2920, 2850, 2780, 2650, 2450, 2120, 1780, 1590, 1460, 1390, 1350, 1410, 1490, 1580, 1620, 1740, 1940, 2200, 2510, 2750]
      }
    }
  },
  // Marina Square (~2,200 total capacity) - Observed available lots
  "2": {
    development: "Marina Square",
    lotTypes: {
      "C": {
        observedOn: "2026-08-28",
        weekday:  [2050, 2090, 2110, 2110, 2080, 2020, 1920, 1740, 1560, 1450, 1410, 1380, 1340, 1360, 1400, 1430, 1460, 1420, 1380, 1420, 1510, 1680, 1850, 1980],
        saturday: [2020, 2070, 2100, 2100, 2100, 2040, 1960, 1850, 1680, 1420, 1180, 1040, 960, 920, 890, 930, 980, 1050, 1110, 1220, 1380, 1590, 1800, 1960],
        sunday:   [2040, 2080, 2100, 2100, 2100, 2050, 1980, 1880, 1720, 1480, 1220, 1080, 990, 950, 920, 960, 1020, 1100, 1160, 1280, 1430, 1640, 1840, 1990]
      }
    }
  },
  // Raffles City (~1,050 total capacity) - Observed available lots
  "3": {
    development: "Raffles City",
    lotTypes: {
      "C": {
        observedOn: "2026-08-28",
        weekday:  [980, 1000, 1010, 1010, 1000, 960, 880, 720, 590, 530, 510, 490, 470, 480, 500, 520, 540, 510, 480, 500, 560, 650, 760, 880],
        saturday: [960, 990, 1000, 1000, 1000, 970, 920, 840, 720, 560, 430, 360, 310, 290, 280, 300, 330, 370, 410, 480, 570, 700, 820, 930],
        sunday:   [970, 990, 1010, 1010, 1010, 980, 940, 870, 760, 600, 470, 390, 340, 320, 300, 320, 360, 410, 450, 520, 610, 730, 850, 950]
      }
    }
  },
  // The Centrepoint (~850 total capacity) - Observed available lots
  "4": {
    development: "The Centrepoint",
    lotTypes: {
      "C": {
        observedOn: "2026-08-29",
        weekday:  [800, 820, 830, 830, 820, 790, 740, 660, 570, 510, 490, 470, 450, 460, 480, 500, 510, 490, 460, 480, 530, 610, 690, 760],
        saturday: [790, 810, 820, 820, 820, 800, 760, 700, 610, 480, 380, 320, 280, 260, 250, 270, 300, 340, 380, 440, 530, 630, 710, 770],
        sunday:   [800, 820, 830, 830, 830, 810, 780, 720, 640, 510, 410, 350, 300, 280, 270, 290, 320, 360, 400, 470, 560, 660, 730, 790]
      }
    }
  },
  // 313@Somerset (~230 total capacity) - Observed available lots
  "5": {
    development: "313@Somerset",
    lotTypes: {
      "C": {
        observedOn: "2026-08-29",
        weekday:  [215, 220, 225, 225, 220, 210, 195, 170, 135, 110, 100, 95, 88, 92, 98, 102, 105, 96, 85, 88, 102, 125, 155, 185],
        saturday: [210, 218, 222, 222, 222, 215, 200, 180, 150, 110, 75, 58, 48, 42, 38, 45, 52, 60, 68, 80, 102, 135, 170, 198],
        sunday:   [212, 218, 224, 224, 224, 218, 205, 188, 160, 120, 85, 65, 52, 46, 42, 48, 56, 66, 74, 88, 110, 142, 175, 202]
      }
    }
  },
  // Orchard Central (~450 total capacity) - Observed available lots
  "6": {
    development: "Orchard Central",
    lotTypes: {
      "C": {
        observedOn: "2026-08-29",
        weekday:  [420, 430, 435, 435, 430, 415, 390, 340, 280, 235, 220, 210, 195, 205, 215, 225, 230, 215, 195, 190, 220, 265, 320, 375],
        saturday: [415, 425, 430, 430, 430, 420, 395, 360, 300, 220, 160, 135, 115, 105, 98, 110, 125, 140, 155, 180, 220, 280, 340, 395],
        sunday:   [418, 428, 432, 432, 432, 422, 402, 370, 315, 235, 175, 145, 125, 115, 108, 120, 135, 150, 165, 192, 235, 295, 350, 402]
      }
    }
  },
  // ION Orchard (~650 total capacity) - Observed available lots
  "7": {
    development: "ION Orchard",
    lotTypes: {
      "C": {
        observedOn: "2026-08-30",
        weekday:  [600, 615, 625, 625, 615, 580, 530, 450, 380, 340, 325, 310, 290, 300, 315, 325, 335, 310, 275, 280, 320, 380, 460, 540],
        saturday: [590, 610, 620, 620, 620, 595, 550, 490, 410, 290, 210, 165, 140, 125, 118, 130, 148, 170, 195, 235, 300, 390, 480, 565],
        sunday:   [595, 615, 625, 625, 625, 600, 565, 510, 430, 315, 230, 180, 155, 138, 130, 142, 160, 185, 210, 255, 320, 410, 500, 575]
      }
    }
  },
  // Tangs Plaza (~200 total capacity) - Not yet observed; excluded from ranking until observed.
  // DO NOT invent or mechanically convert an occupancy percentage.
  "8": {
    development: "Tangs Plaza",
    lotTypes: {}
  }
};

/**
 * RAIN_FACTORS table
 * Maps meteorological conditions to multiplier factors.
 * Rain suppresses shopping/parking demand (e.g. 0.88 for heavy/thundery, 0.93 for light/moderate, 0.98 for cloudy).
 */
export const RAIN_FACTORS = {
  // Heavy rain & thundery showers: 0.88
  "Heavy Thundery Showers": 0.88,
  "Thundery Showers": 0.88,
  "Heavy Rain": 0.88,
  "Heavy Showers": 0.88,

  // Moderate or light rain & showers: 0.93
  "Moderate Rain": 0.93,
  "Light Rain": 0.93,
  "Light Showers": 0.93,
  "Passing Showers": 0.93,
  "Showers": 0.93,
  "Moderate Showers": 0.93,

  // Cloudy and overcast: 0.98
  "Cloudy": 0.98,
  "Overcast": 0.98,

  // Everything else: 1.00
  "Partly Cloudy": 1.00,
  "Fair": 1.00,
  "Fair (Day)": 1.00,
  "Fair (Night)": 1.00,
  "Fair & Warm": 1.00,
  "Windy": 1.00,
  "Hazy": 1.00,
  "Slightly Hazy": 1.00
};

/**
 * Helper to strip (Day) or (Night) suffixes and look up factor.
 * If unmatched, returns { factor: 1.00, isUnmatched: true }.
 */
export function getRainFactor(rawForecast) {
  if (!rawForecast || typeof rawForecast !== "string") {
    return { factor: 1.00, isUnmatched: false, matchedKey: "Default" };
  }

  const trimmed = rawForecast.trim();

  // 1. Direct match
  if (RAIN_FACTORS[trimmed] !== undefined) {
    return { factor: RAIN_FACTORS[trimmed], isUnmatched: false, matchedKey: trimmed };
  }

  // 2. Strip " (Night)" or " (Day)" suffix
  const baseForecast = trimmed.replace(/\s*\((Night|Day)\)$/i, "").trim();
  if (RAIN_FACTORS[baseForecast] !== undefined) {
    return { factor: RAIN_FACTORS[baseForecast], isUnmatched: false, matchedKey: baseForecast };
  }

  // 3. Fallback: Log and never guess
  console.warn(`[RAIN_FACTORS] Unrecognised forecast string: "${rawForecast}". Falling back to 1.00.`);
  return { factor: 1.00, isUnmatched: true, matchedKey: "Unmatched: " + rawForecast };
}
