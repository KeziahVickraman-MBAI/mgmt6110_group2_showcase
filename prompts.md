# prompts.md — Singapore Carpark Exception Board

**Course:** MGMT 6110 · Group 2 showcase · **Log author:** Keziah Sherlyn Vanessa Vickraman

**Live:** https://mgmt6110group2showcase.vercel.app/
**Repository:** https://github.com/KeziahVickraman-MBAI/mgmt6110_group2_showcase

**User sentence:** An *SMU student who drives in* opens this before leaving home on a class morning to decide whether to *leave early or take the train*, and knows it worked when the decision got made at home instead of on arrival.

> The git history on this repo is two commits, because the build happened inside the AI Studio session and was pushed as a showcase. **The commits are not the history. This file is.**
>
> Blocks marked `[reconstructed]` are rebuilt from the specification that survives verbatim in the code — the capitalised rule at the top of `api/constants.js`, the pagination comment in `api/carparks.js`, the state sentences in `StateViews.tsx`. Paste the original over them where you still have it.

### The original github repository and application can be found here:
**Live:** https://mgmt6110group2baselineapplication.vercel.app/
**Repository:** https://github.com/KeziahVickraman-MBAI/mgmt6110_group2_baseline_application.git


---

## 1. The master prompt

`[reconstructed]`

> ```
> ROLE: Senior full-stack developer. React + Vite front end, serverless handlers in api/,
> deployed to Vercel. No database, no login, no model calls.
>
> GOAL: An exception board for carparks near the Bras Basah campus.
>  THE USER: an SMU student who drives to campus.
>  THE DECISION: leave now, leave early, or take the train — made at home, before leaving.
>  THE CLAIM: this screen tells the user whether the carparks near campus are behaving
>  normally for this hour of this day-type, and by how many cars. Not what is available
>  right now — every app already does that, and it is useless by the time you are circling
>  Bras Basah. The gap is TIMING, not availability.
>
> WHAT IT SHOWS: not availability, DEVIATION. Of eight watched sites, surface the two
> largest departures from normal — one filling faster than usual, one with unusual spare
> capacity — and rank the rest quietly beneath.
>
> SOURCES:
>  1) LTA DataMall CarParkAvailabilityv2 — live available lots. AccountKey header.
>  2) data.gov.sg two-hr-forecast — per-area rain. Keyless.
>
> THE ARITHMETIC, in this order, and it must be inspectable on screen:
>   baseline expected available   (observed, per site, per lot type, per day-type, per hour)
>   × rain factor                 (from the nearest forecast area to that site)
>   = adjusted expectation
>   actual available − adjusted expectation = difference, in net cars
>   difference / adjusted expectation       = deviation %
> Rank by ABSOLUTE CARS, not by percentage. A 40% swing on a 90-lot site is noise next to
> 300 cars at Suntec.
>
> THRESHOLDS: flag only if deviation ≥ 10% AND at least 15 lots are affected. Below both,
> the site is quiet and the board says so.
>
> STATES, each with its own sentence — do not collapse into one error banner:
>   loading:      "Reading the last hour of counts…"
>   empty:        "Nothing is off baseline right now."  <- GOOD NEWS. Style it as good news.
>                 Green, calm, second line "All 8 watched sites near campus are operating
>                 within normal baseline limits for this hour." Do NOT grey the page out,
>                 do NOT show an empty-box illustration, do NOT style it as a failure.
>   refused:      "The transport feed rejected our credential. Nothing on this screen is
>                 current."
>   unreachable:  "Can't reach the transport feed. Last good reading was [time]."
>   stale:        a reading older than 15 minutes is labelled stale, not shown as current.
>
> THE HEADLINE TRAP — this is the whole product:
>  A genuine zero and a dead feed look identical from the outside. A carpark reporting zero
>  available lots is FULL. A carpark absent from the response is UNKNOWN. THESE NEVER SHARE
>  A SENTENCE. A site missing from the payload shows "No reading for this site" in the
>  ranked list, never "0 lots", never an empty cell, never a dash. State this rule in the
>  footer of the running app so the user can hold us to it.
>
> GUARDRAILS:
>  - LTA_ACCOUNT_KEY read via process.env inside api/ only. Never in browser code, never a
>    variable name starting with VITE_, never printed in a response or a log.
>  - Guard BEFORE the fetch: if the key is missing or empty, return 503 with a named error
>    and do not call LTA. An unset variable is sent as the string "undefined" and LTA
>    answers 401 exactly as it would for a wrong key.
>  - Check response.ok BEFORE reading any body. LTA returns an empty body on 401.
>  - Cast AvailableLots with Number() at the boundary. Never emit NaN into a ranking.
>  - Cache the carpark read 60s. Cache weather 5 minutes. The on-screen refresh interval
>    must equal the cache TTL — the screen may never claim to be fresher than its data.
>  - api/health.js reports keyConfigured and each provider's upstream status, and never
>    prints the key or any part of it.
>  - Singapore Open Data Licence attribution in the footer with the access date. This is a
>    licence condition, not decoration.
>  - No new npm packages beyond React, Tailwind and lucide. No charting library.
> ```

Came back with: a running board, four handlers, eight components, all the state sentences present and worded as specified. The FULL-versus-UNKNOWN rule made it into the footer of the running app, which is where it is any use.
Action: kept it. Then went and called both feeds by hand, which is entry 2, and which changed two things in this prompt that I had got wrong.

---

## 2. Calling both feeds by hand before trusting either

Not a prompt. Three findings, and two of them were already broken in the build above.

**LTA paginates, and the pagination is invisible.** `CarParkAvailabilityv2` returns **500 records per page** and pages with `$skip`. One request returns a perfectly valid JSON array of 500 carparks and no indication whatever that there are more. ION Orchard is **not on page one.** So the board was showing "No reading for this site" for a carpark that was in the feed the whole time.

**data.gov.sg does not guarantee key order.** In `area_metadata`, some entries list `latitude` before `longitude` and some the reverse. Reading `label_location` positionally works for most of the array and silently puts a handful of forecast areas in the wrong place.

**LTA's `Location` field is a space-separated string,** not an object, and the order is not reliable either.

Action: all three went into prompts as named traps rather than as descriptions. The fix for the third is a range check — a Singapore latitude is between 1.0 and 1.5 and a longitude between 103.0 and 104.5, so if the pair arrives backwards you can tell, and swap it.
Lesson: the pagination finding is the one I would show someone. It did not produce an error, a warning or a blank space. **It produced one of my own honest states, correctly rendered, saying something false.**

---

## 3. The pagination fix

`[reconstructed]`

> ```
> BUG, with evidence: ION Orchard renders "No reading for this site". It is in the LTA feed.
> I found it by hand at $skip=500.
>
> LTA DataMall v2 paginates at 500 records. A single request returns 500 valid records and
> NO indication that more exist. We are reading page one and treating everything beyond it
> as absent from the feed.
>
> Rewrite the fetcher to loop $skip in increments of 500 until a page returns FEWER than 500
> records. Cap at 20 pages as a safety stop and log if the cap is ever hit.
>
> WHY THIS MATTERS MORE THAN IT LOOKS: "No reading for this site" is one of our honest
> states. It is supposed to mean the feed does not have this site. Right now it means our
> loop stopped early. An honest state reporting our own bug is worse than an error, because
> nothing about it looks wrong.
>
> PARTIAL READS: if page one succeeds and a later page fails, do NOT throw away the records
> you have and do NOT pretend the read was complete. Set isPartial and surface:
>   "Showing [N] of an unknown total; the feed stopped responding at page [P]"
> Only a failure on page one takes the board down.
>
> DEDUPE on CarParkID + LotType across pages — the same carpark appears once per vehicle
> lot type, and those are different rows, not duplicates.
> ```

Came back with: the loop, the 20-page cap, the partial-read state, and dedupe keyed on `CarParkID_LotType`.
Action: kept it, and left the ION Orchard check in the code as a permanent canary — the handler still logs when ID 7 is retrieved from a page beyond the first.
Lesson: the honest states are not self-verifying. Each one is a claim about the world that our own code can manufacture.

---

## 4. The baseline rewrite — the thing I got wrong on purpose and had to undo

`[reconstructed]`

> ```
> STOP. The baseline model is wrong and everything downstream of it is invalid.
>
> We are computing expected available lots as capacity × (1 − expected occupancy rate).
> LTA DOES NOT PUBLISH CAPACITY. Every totalLots figure in our table was estimated to make
> that formula work. A number derived from an estimate, converted through a percentage we
> also estimated, is not a baseline. It is two guesses wearing a measurement's clothes, and
> it is producing deviations of several hundred per cent that I nearly shipped.
>
> Rewrite BASELINES so that a baseline is a DIRECTLY OBSERVED available-lots reading:
>  - keyed per CarParkID, per lot type ('C' cars, 'Y' motorcycles, 'H' heavy), per day-type
>    (weekday / saturday / sunday), 24 values, one per hour
>  - each carrying observedOn, the date the readings were taken
>  - remove totalLots and every occupancy rate from the table entirely
>
> AND THE PART THAT MATTERS MOST: a site with no observed baseline for the selected vehicle
> type MUST be excluded from the deviation ranking and displayed as
>   "No baseline yet — availability only"
> Do not fall back. Do not interpolate from a neighbouring site. Do not carry a car baseline
> across to motorcycles. Do not mechanically convert an occupancy percentage. Tangs Plaza
> has no observed baseline — ship it with an empty lotTypes object and let the screen say so.
>
> Put this rule in capitals at the top of constants.js so the next person cannot miss it.
> ```

Came back with: the rewritten table, the `observedOn` provenance field, the exclusion path, Tangs Plaza shipping empty, and the rule written at the top of the file where I asked for it.
Action: kept it. This is the most consequential prompt in the build.
What it did not do, and what I found only by reading the front end afterwards: `ComputationTransparency.tsx` still contains `Math.round((1 - baselineRate) * totalLots)` as a fallback, and `types.ts` still carries `totalLots` and `baselineOccupancyRate` under a comment reading "backward compatibility". **The banned formula is still in the repository.** It is dead — the server always supplies `expectedRaw`, so the branch never runs — but "currently unreachable" is not the same as "gone", and a future change to that payload wakes it up.
Lesson: I asked for a rule and I got the rule. I never asked for the old path to be removed, so it was not.

---

## 5. The calibration guard

`[reconstructed]`

> ```
> The baselines are hand-entered, so the failure mode I am most worried about is not a bad
> feed. It is a bad table of mine rendering as eight simultaneous real-world events.
>
> Add a sanity check that runs BEFORE ranking, and fails the board safe:
>  Rule 1 — if EVERY evaluated site deviates in the SAME DIRECTION by more than 25%,
>           that is a baseline problem, not eight simultaneous events.
>  Rule 2 — if MORE THAN HALF the evaluated sites deviate by over 100%.
>
> On either, suppress the deviation ranking entirely and show:
>   "Baselines look miscalibrated — deviations suppressed."
> plus which rule tripped and how many sites.
>
> Still show raw availability — that number comes straight from LTA and is not in doubt.
> It is our arithmetic that is in doubt, and the screen should say which is which.
>
> This must fail CLOSED. If the check is uncertain, suppress. I would rather show nothing
> than show a confident ranking built on a table I typed.
> ```

Came back with: both rules, the suppressed state, the reason string naming which rule tripped, and availability still rendering underneath.
Action: kept it, and wired it into the simulated feed (entry 7) so that I could actually look at it.
Lesson: this guard exists because I do not trust my own baselines, and saying so in code is more useful than saying so in a document. It is the only part of the build that treats **me** as the unreliable input.

---

## 6. Rain adjusts the expectation. It does not get removed.

`[reconstructed]`

> ```
> Wire the rain adjustment per site, not globally. Singapore weather is local — it can be
> thundery in Orchard and clear in Marina in the same two-hour window.
>
> For each watched site, find the NEAREST data.gov.sg forecast area by Haversine distance
> from the site's coordinates, and use that area's forecast. Show the distance on screen
> (e.g. 1.48km) so the user can see how far away the reading actually came from.
>
> RAIN_FACTORS multiplies the EXPECTED free lots before comparison:
>   heavy / thundery showers   0.88
>   light / moderate rain      0.93
>   cloudy / overcast          0.98
>   everything else            1.00
>
> UNMATCHED FORECAST STRINGS: data.gov.sg adds condition strings over time, and some arrive
> with " (Day)" or " (Night)" suffixes. Strip the suffix and retry the lookup. If it still
> does not match, fall back to 1.00, LOG IT, and surface the unmatched string in the payload.
> NEVER guess a factor for a condition you do not recognise.
>
> WEATHER DEGRADES SEPARATELY. If data.gov.sg is unreachable the board still runs, unadjusted,
> and says "Rain adjustment unavailable — deviations are unadjusted." Only LTA can take the
> whole board down, because without LTA there is nothing to compare against.
>
> WORDING, and I want this exact: when the factor is 1.00 the sentence reads
>   "…No weather adjustment — fair in City"
> and when it is not:
>   "…after lowering the expectation 12% for thundery showers in Orchard"
> We LOWER AN EXPECTATION. We do not "remove weather" and we do not "control for" it. Those
> phrases claim a model we do not have.
> ```

Came back with: per-site Haversine matching, the distance surfaced on screen, the suffix-stripping lookup, the logged unmatched strings, and independent weather degradation.
Action: kept it. The wording instruction was the point of the prompt, and it is the one I had to come back to anyway — see entry 9.

---

## 7. The simulated feed

`[reconstructed]`

> ```
> I cannot review the failure states, because the failure states require the failures.
> LTA has not refused my key, the feed has not gone down, and nothing has been miscalibrated
> since I fixed the baselines. So five of my seven states have never been seen by anyone.
>
> Add a feed-mode toggle — live / simulated — and a scenario picker covering: flagged,
> rain-adjusted, empty, stale, weather-degraded, miscalibrated, refused, unreachable.
> Simulated data lives in one file and is obviously synthetic on inspection.
>
> The toggle must be visible on the screen, not a URL parameter and not a keyboard shortcut.
> Anyone looking at this board must be able to tell at a glance whether they are looking at
> Singapore or at a fixture.
> ```

Came back with: the toggle, the scenario picker and a fixtures file.
Action: kept it. This is how the "Nothing is off baseline right now" state got styled as good news rather than as an empty error, because it is the first time I had actually looked at it rendered.
Lesson: a state you have never seen on a screen is a state you have only specified.

---

## 8. Where I stopped prompting

Two places.

**Registering for the LTA DataMall account key, and setting it in Vercel.** Both are web forms in someone else's dashboard. Describing them to an agent that cannot see them is slower than doing them, every time.

**Choosing the eight sites and typing the baselines.** This is a judgement about which carparks a student would actually consider from Bras Basah, and it needs someone who has parked there. Handing it over would have produced eight plausible carparks and twenty-four plausible numbers per site per day-type, and there is no way to tell those apart from real ones by looking at them.

---

## 9. The wording commit

Commit `9190dc3`, and the only substantive commit in this repo besides the initial push.

| Before | After |
|---|---|
| "…running above or below their usual **occupancy**…" | "…have more or fewer **free lots** than they usually do…" |
| "**Weather is already removed**, so a wet Tuesday does not read as unusual" | "**When it rains the expectation is lowered first**, so a wet Tuesday does not read as unusual" |
| Metric: Net cars vs. rain-adjusted baseline | Metric: Net free lots vs. own weekday baseline |

The first is leftover vocabulary from the occupancy model I deleted in entry 4 — the screen was still describing a quantity the code had stopped computing. The second is the overclaim: **"weather is already removed" describes a model that isolates a weather effect.** What we have is a four-value lookup table that multiplies an expectation. Those are not the same claim, and only the second one is defensible.
Lesson: deleting a model from the code does not delete it from the copy. The words outlived the arithmetic by a whole session.

---

## 10. Everything that turned out to be wrong, and how I found out

| What I believed, or was told | How I found out |
|---|---|
| ION Orchard is missing from the LTA feed | Called the endpoint by hand at `$skip=500`. It was there all along. Our loop stopped at page one and rendered one of our own honest states over it. |
| The occupancy baselines were usable | Deviations in the hundreds of per cent. LTA publishes no capacity, so every `totalLots` behind that formula was mine. |
| The occupancy model was gone after the rewrite | Read the front end. `(1 − baselineRate) × totalLots` is still in `ComputationTransparency.tsx`, and `totalLots` is still in `types.ts` under "backward compatibility". Dead, not deleted. |
| The screen described what the code computed | Only when I read the panel copy against the payload, a session later. "Occupancy" and "weather is already removed" had both outlived their implementations. |
| The repo contains only what this product needs | `.env.example` declares `GEMINI_API_KEY` and a Cloud Run `APP_URL` for OAuth callbacks. `metadata.json` declares a server-side Gemini capability. `@google/genai` sits in the dependency list. **Nothing in this repository calls a model.** Scaffold from the build environment, still in the tree. |
| "Notification saved. You will be alerted when a site breaches baseline." | Read `NotifyForm.tsx`. There is no scheduler. Submitting posts once to a fixed inbox with the sites flagged at that moment. The sentence promises a standing service that does not exist — and it is the only claim on the screen that nothing in the code backs. |

The pattern in the last three rows is one thing: **the code stopped being the product's description of itself.** Each is a sentence, a file or a dependency that was true earlier in the build, survived the change that made it false, and had nothing pointing at it to say so.
