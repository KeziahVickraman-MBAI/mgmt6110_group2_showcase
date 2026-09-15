# Singapore Carpark Exception Board

**Course:** MGMT 6110 · Group 2 showcase 

**Live:** https://mgmt6110group2showcase.vercel.app/
**Repository:** https://github.com/KeziahVickraman-MBAI/mgmt6110_group2_showcase

---

## What this is

An exception board for eight carparks within walking distance of the Bras Basah campus. It does not show you availability. It shows you **deviation** — which sites have more or fewer free lots than they normally do *at this hour, on this day-type*, in net cars, after lowering the expectation for rain.

**The user sentence:** an SMU student who drives in opens this before leaving home on a class morning, sees whether the carparks near campus are behaving normally for a weekday morning and by how many cars, and decides whether to leave early or take the train.

**The gap it closes is timing, not data.** Every existing app shows what a carpark looks like right now, which is the single moment the information is useless, because the driver is already circling Bras Basah. The decision can only be changed at home.

---

## The claim on the screen, and what backs it

| What the screen says | What it is computed from |
|---|---|
| "975 more free than normal" | `actual available lots − (observed baseline for this hour × rain factor)` |
| "running 18% below its usual weekday morning availability" | that difference, over the adjusted expectation |
| "after lowering the expectation 12% for thundery showers in Orchard" | the 2-hour forecast for the nearest forecast area, matched by Haversine distance |
| "No reading for this site" | the site was absent across **all** fetched pages of the feed |
| "No baseline yet — availability only" | the site is in the feed but has no observed baseline for that vehicle type |

**Two sources, both open data:**
- **LTA DataMall `CarParkAvailabilityv2`** — live available lots. Requires `LTA_ACCOUNT_KEY`.
- **data.gov.sg `two-hr-forecast`** — per-area rain forecast. Keyless.

---

## The rules this thing is built on

**1. FULL and UNKNOWN never share a sentence.**
A genuine zero and a dead feed look identical from the outside. A carpark reporting zero available lots is **FULL**. A carpark absent from the response is **UNKNOWN**. A site missing from the payload shows "No reading for this site" in the ranked list — never "0 lots". This rule is printed in the footer of the running app, not just written here.

**2. A baseline is an observed reading, never a converted percentage.**
`api/constants.js` carries this in capitals at the top of the file. LTA does not publish carpark capacity, so any "expected available" derived as `capacity × (1 − occupancy%)` is an invented number wearing a measurement's clothes, and it produces enormous false deviations. Every baseline is stored per `CarParkID`, per lot type, per day-type, per hour, with an `observedOn` date attached. **A site with no observed baseline is excluded from ranking** and shown as availability only. Tangs Plaza (ID 8) ships with `lotTypes: {}` for exactly this reason.

**3. If everything deviates, the baseline is wrong — not the world.**
A calibration guard suppresses the whole ranking and shows *"Baselines look miscalibrated — deviations suppressed"* when either every evaluated site deviates more than 25% **in the same direction**, or more than half the sites deviate by over 100%. Eight simultaneous anomalies at eight sites is not an event. It is a bad table.

**4. Rain lowers the expectation. It does not get "removed".**
The rain factor (0.88 heavy/thundery · 0.93 light/moderate · 0.98 cloudy · 1.00 otherwise) multiplies the *expected* free lots before the comparison. Unrecognised forecast strings fall back to 1.00, are logged, and are surfaced in the payload — the table never guesses.

**5. The weather feed degrades on its own.**
If data.gov.sg is down the board still runs, unadjusted, and says so: *"Rain adjustment unavailable — deviations are unadjusted."* Only the LTA feed can take the whole board down, because without it there is nothing to compare.

---

## States

Each has its own sentence, and they are not interchangeable.

| State | What the user sees |
|---|---|
| Loading | "Reading the last hour of counts…" |
| Flagged | The two largest deviations — one filling faster than usual, one with extra space |
| Empty | "Nothing is off baseline right now." Styled as **good news**, green, not as an error |
| Miscalibrated | "Baselines look miscalibrated — deviations suppressed." Rankings hidden, availability still shown |
| Refused | "The transport feed rejected our credential. Nothing on this screen is current." |
| Unreachable | "Can't reach the transport feed. Last good reading was 08:42 SGT." |
| Stale | Reading older than 15 minutes is labelled as such rather than shown as current |
| Partial | "Showing 412 of an unknown total; the feed stopped responding at page 3" |

A **simulated feed** toggle runs all seven scenarios on demand, so the failure states can be reviewed without waiting for a real outage.

---

## Architecture

No database, no login, no model calls.

```
api/carparks.js     LTA fetch + $skip pagination loop + 60s memory cache + dedupe by CarParkID_LotType
api/weather.js      data.gov.sg 2-hour forecast + 5min cache + area coordinate merge
api/deviations.js   the arithmetic: baseline → rain factor → difference → ranking → calibration guard
api/constants.js    WATCHED_SITES, BASELINES (with observedOn), RAIN_FACTORS
api/health.js       keyConfigured per provider, upstream status, never prints the key
src/                React 19 + Tailwind 4, one board, eight components
server.ts           Express shim so the same four handlers run locally and on Vercel
```

**Pagination is not optional.** LTA DataMall v2 returns 500 records per page and paginates with `$skip`. The loop runs in increments of 500 until a page returns fewer than 500, capped at 20 pages. ION Orchard sits on a later page — reading only page one makes it vanish from the feed and renders a *truthful-looking* "No reading for this site" that is entirely an artefact of our own code.

**One fetch, three vehicle types.** The server evaluates cars (`C`), motorcycles (`Y`) and heavy vehicles (`H`) in the same pass, so the vehicle selector re-filters a payload already in memory instead of firing another request.

**Cache TTL and refresh interval are the same number.** 60 seconds both, so the screen never claims to be fresher than the data behind it.

---

## Running it

```bash
npm install
echo "LTA_ACCOUNT_KEY=your_key_here" > .env
npm run dev          # http://localhost:3000
```

Get an LTA DataMall account key from `datamall.lta.gov.sg`. On Vercel, set `LTA_ACCOUNT_KEY` as an environment variable and redeploy — the key is read via `process.env` inside `api/` only and never reaches the browser. `/api/health` will tell you whether it is configured and whether each provider answered, without printing any part of the key.

---

## Attribution

Contains information from **LTA DataMall** and **data.gov.sg**, made available under the terms of the **Singapore Open Data Licence v1.0** (`data.gov.sg/open-data-licence`). The attribution line is a licence condition and renders in the footer with the access date. All times are SGT (UTC+8).

---

## Known limitations — read these before trusting a number

- **The baselines are hand-entered.** They carry an `observedOn` date so you can see how old they are and who is responsible for them, but they are a small set of observed readings, not a fitted historical model. The calibration guard exists precisely because this is the weakest link in the chain.
- **Only cars have baselines.** Motorcycle and heavy-vehicle selections will correctly show most sites as "No baseline yet — availability only". That is the honest state, not a bug, but it means the vehicle selector promises more than the data delivers.
- **Rain is matched to the nearest forecast area, not to the carpark.** The distance is shown on screen (e.g. `1.48km`) so you can judge how much to trust it.
- **`ComputationTransparency.tsx` still contains a dead `(1 − occupancyRate) × totalLots` fallback**, which is the exact conversion `constants.js` forbids. The server always supplies `expectedRaw`, so the branch never executes — but it should be deleted, and `totalLots` / `baselineOccupancyRate` should come out of `types.ts` with it.
- **`.env.example` and `metadata.json` still declare a Gemini key and a Cloud Run callback URL.** Nothing in this repository calls a model. They are scaffold left over from the build environment and should be removed.
- **The notify form says "Notification saved. You will be alerted when a site breaches baseline."** There is no scheduler. Submitting sends one email to a fixed inbox with the current flagged sites. The sentence claims a standing service that does not exist.
