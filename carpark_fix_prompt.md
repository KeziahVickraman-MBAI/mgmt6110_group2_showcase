Fix three things in the carpark board, all found by calling the endpoint by hand. Keep the
existing 8-site campus watch set, the four state sentences, the reconciliation counts, the
weather adjustment and every attribution.

--- WHAT THE FEED ACTUALLY RETURNS
A hand call on 14 Sep 2026 returned exactly seven fields and nothing else:

    Agency, Area, AvailableLots, CarParkID, Development, Location, LotType

One record, verbatim:

    {'CarParkID': '1', 'Area': 'Marina', 'Development': 'Suntec City',
     'Location': '1.29375 103.85718', 'AvailableLots': 1610,
     'LotType': 'C', 'Agency': 'LTA'}

    lot types: ['C', 'H', 'Y']
    agencies:  ['HDB', 'LTA', 'URA']
    records:   500

Three consequences, and all three are currently wrong in our code.

--- 1. THERE IS NO CAPACITY FIELD
TotalLots does not exist. Any total in our code was invented during the build, which means
every occupancy percentage the board has displayed was computed against a denominator
nobody verified. It is also why the corrupted-reading guard fires: available exceeding
total is arithmetically inevitable when the total is a guess that is too small. The guard
has been catching our own error and attributing it to LTA.

REBUILD THE METRIC AROUND AVAILABLE LOTS. Do not hardcode a capacity anywhere, do not
estimate one, do not derive one from an observed maximum.

  - BASELINES holds expected AVAILABLE LOTS per CarParkID, per day-type, per hour, each
    entry with an observedOn date.
  - deviation = (actual available - expected available) / expected available
  - The headline stays net cars, which was always the useful figure:
    "975 more free than normal" / "310 fewer free than normal"
  - REMOVE ENTIRELY: totalLots, actualOccupancyRate, expectedOccupancyRate,
    baselineOccupancyRate, isFull, and the available-exceeds-total branch of the corrupted
    guard, which can no longer arise.
  - KEEP a guard for AvailableLots being negative, non-numeric, or absent.

  Persistent line on screen, not a footnote:
    "LTA publishes available lots, not capacity. This board compares each site against its
    own usual availability — not a percentage full. No capacity figure appears anywhere
    because the feed does not provide one."

  Where a percentage-full would previously have been shown, show nothing and say why:
    "Capacity not published"
  Never substitute an estimate.

--- 2. THE RESPONSE IS PAGINATED AT 500
Not "roughly 2,000 in one response", which is what our build prompt asserted. Singapore has
thousands of carparks across HDB, LTA and URA, and we have only ever seen page one.

  Loop the $skip parameter in increments of 500 until a page returns fewer than 500
  records, concatenating as you go. Cap the loop at 20 pages as a safety stop and log if
  the cap is hit. Deduplicate on CarParkID plus LotType.

  ION Orchard is currently reported as "No reading for this site". It may simply be on a
  later page — re-check after this fix before trusting any missing-site state. If it
  appears, our missing-site state has been reporting a pagination bug as a data gap, and
  that is worth a note in the code.

--- 3. RECORDS SPLIT BY LOT TYPE
C is cars, H is heavy vehicles, Y is motorcycles. A carpark appears once per type it
offers, so matching on CarParkID alone can return the motorcycle row.

  Default to LotType 'C' everywhere. Add a vehicle-type selector — Cars / Motorcycles /
  Heavy vehicles — that re-filters the already-fetched payload. It must NOT trigger another
  API call.

  Baselines are per lot type. A site with a car baseline but no motorcycle baseline is
  EXCLUDED from the ranking when motorcycles are selected, never ranked against the car
  baseline. Say so: "No baseline for motorcycles at this site."

  Show the selected type on screen at all times, so a figure is never ambiguous about what
  it counts.

--- 4. SHOW ALL
Add a "Show all sites" toggle beside the existing campus watch set.

  Campus view (default): the 8 watched sites, with baselines, ranked by deviation.
  All view: every record returned across all pages, for the selected lot type.

  In All view there are no baselines for most sites, so there is no deviation and no
  ranking. Display availability only, and say so plainly:
    "Showing all [N] sites the feed returned. Only the [N] campus sites have baselines, so
    no deviation is calculated for the rest."

  Do not invent baselines for the rest. Do not rank by raw availability and imply it means
  something — a carpark with 2,000 free lots is not more interesting than one with 20
  unless you know what each usually has.

  Include Agency in the All view, since HDB, LTA and URA sites behave differently and the
  reader should be able to see which is which. Sortable by name, area and agency. Paginate
  or virtualise the table so several hundred rows do not stall the page.

--- 5. EVERY READING IS A LIVE CALL
No fixture, no fallback dataset, no last-known-good file committed to the repo. If the feed
cannot be reached, the unreachable state fires and the board says so. A stale cached
response may be served with its age visible, but nothing may be fabricated to fill a gap.

  If a watched site is absent from the payload after pagination, it is MISSING — which is
  a different thing from a site reporting zero. Zero available means FULL, the opposite of
  what a blank row implies.

GUARDRAILS:
 - LTA_ACCOUNT_KEY via process.env inside api/ only. Never in browser code, a file, a
   comment, a README or a log, and never a variable name starting with VITE_.
 - Guard BEFORE the fetch: if the variable is missing or empty, return 503 with a named
   error and do not call LTA. An unset variable is sent as the string "undefined" and LTA
   answers 401 exactly as for a wrong key.
 - Check response.ok BEFORE reading any body, on EVERY page of the pagination loop. LTA
   returns an empty body on 401, so response.json() on a failed reply throws.
 - If page one succeeds and page three fails, that is a PARTIAL result. Say so on screen —
   "Showing [N] of an unknown total; the feed stopped responding at page 3" — rather than
   presenting a truncated list as complete.
 - Cast every number at the boundary. AvailableLots arrives as a number in this payload but
   has been quoted in others.
 - Cache 60 seconds (s-maxage=60, stale-while-revalidate=120). Pagination means several
   round trips, so cache the assembled result, not each page. The on-screen refresh
   interval must match the TTL and the cache age must be visible.
 - Keep the calibration guard, and TIGHTEN IT: currently it fires only above 100%
   deviation. If every evaluated site deviates in the SAME direction by more than 25%, that
   is a baseline problem, not simultaneous events at every site. Show "Baselines look
   miscalibrated — deviations suppressed" and the board's raw availability instead.
 - Keep the four state sentences, the reconciliation counts, the weather adjustment and
   both licence lines unchanged.

WHEN DONE: report how many pages the loop fetched, how many total records, whether ION
Orchard appeared, and the record count per lot type.
