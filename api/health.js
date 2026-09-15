/**
 * Health check endpoint
 * Reports keyConfigured for LTA_ACCOUNT_KEY and whether each provider answered,
 * with upstream status codes. Never prints the key or any part of it.
 */
export default async function handler(req, res) {
  const accountKey = process.env.LTA_ACCOUNT_KEY;
  const keyConfigured = Boolean(accountKey && accountKey.trim().length > 0);

  const report = {
    timestamp: new Date().toISOString(),
    keyConfigured,
    providers: {
      lta: {
        configured: keyConfigured,
        answered: false,
        statusCode: null,
        message: ""
      },
      weather: {
        configured: true, // Keyless endpoint
        answered: false,
        statusCode: null,
        message: ""
      }
    }
  };

  // 1. Check weather provider
  try {
    const wRes = await fetch("https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast", {
      method: "GET"
    });
    report.providers.weather.statusCode = wRes.status;
    report.providers.weather.answered = wRes.ok;
    report.providers.weather.message = wRes.ok ? "OK" : `HTTP ${wRes.status}`;
  } catch (wErr) {
    report.providers.weather.answered = false;
    report.providers.weather.statusCode = 502;
    report.providers.weather.message = wErr.message || "Network unreachable";
  }

  // 2. Check LTA provider
  if (!keyConfigured) {
    report.providers.lta.statusCode = 503;
    report.providers.lta.answered = false;
    report.providers.lta.message = "LTA_ACCOUNT_KEY is not set in environment";
  } else {
    try {
      const ltaRes = await fetch("https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2", {
        headers: {
          AccountKey: accountKey.trim()
        }
      });
      report.providers.lta.statusCode = ltaRes.status;
      report.providers.lta.answered = ltaRes.ok;
      if (ltaRes.status === 401 || ltaRes.status === 403) {
        report.providers.lta.message = "Credential rejected by transport feed";
      } else if (ltaRes.ok) {
        report.providers.lta.message = "OK";
      } else {
        report.providers.lta.message = `HTTP ${ltaRes.status}`;
      }
    } catch (ltaErr) {
      report.providers.lta.answered = false;
      report.providers.lta.statusCode = 502;
      report.providers.lta.message = ltaErr.message || "Network unreachable";
    }
  }

  const isHealthy = report.providers.weather.answered && (keyConfigured ? report.providers.lta.answered : true);
  const status = isHealthy ? 200 : (keyConfigured ? 502 : 200);

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.status(status).json(report);
}
