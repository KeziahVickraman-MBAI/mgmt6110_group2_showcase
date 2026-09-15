# assessment.md - Singapore Carpark Exception Board · Is today normal, and by how many cars?

**Course:** MGMT 6110 · Group 2 showcase · **Log author:** Keziah Sherlyn Vanessa Vickraman

**Live:** https://mgmt6110group2showcase.vercel.app/
**Repository:** https://github.com/KeziahVickraman-MBAI/mgmt6110_group2_showcase

This board makes one claim: *the carparks near campus are behaving normally for this hour, or they are not, and here is by how many cars.* Everything below is about whether that claim is earned. The short version is that the arithmetic is defensible and the **vocabulary around it kept drifting out of date**, which turned out to be the harder problem.

---

## Part 1: My criteria, and where I actually land

### A good front end

**FULL and UNKNOWN never share a sentence.** `5/5` — A genuine zero and a dead feed look identical from the outside, so a site absent from the payload reads "No reading for this site" and never "0 lots", never a dash, never an empty cell. <mark>The rule is printed in the footer of the running app</mark>, not just written in a document, which means a user can hold us to it.

**Good news reads as good news.** `5/5` — "Nothing is off baseline right now" is the most common state this board will ever be in, and it is green, calm and second-lined with "All 8 watched sites near campus are operating within normal baseline limits for this hour". It is not greyed out, not an empty-box illustration, not styled as a failure. Most dashboards get this wrong and teach the user that a quiet screen means a broken screen.

**The arithmetic is inspectable.** `5/5` — "How this is computed" opens a per-site panel showing baseline → rain factor → adjusted expectation → actual → difference → deviation, with the `observedOn` date on the baseline line and the forecast area and its distance on the rain line. The user can see that the rain reading came from 1.48km away, not from the carpark.

**The screen describes what the code computes.** `3/5` — It does *now*. It did not for a whole session after the baseline rewrite, when the panel still said "occupancy" and "weather is already removed" while the code had moved to free lots and a lookup table. Fixed in `9190dc3`. Marked down because nothing caught it but me re-reading the copy.

**Every claim on screen is backed.** `2/5` — One is not. "Notification saved. **You will be alerted** when a site breaches baseline" promises a standing service. There is no scheduler; submitting sends one email. That sentence is the single worst thing in this build and it is worse than a bug, because it is a promise.

### A good back end

**The credential never leaves the server.** `4/5` — `LTA_ACCOUNT_KEY` via `process.env` inside `api/` only, `.env*` gitignored, `/api/health` reports `keyConfigured` and an upstream status without printing any part of the key. Not `5/5`, because the Web3Forms access key is hard-coded in browser code. It is defensible — it can do exactly one thing, post to one inbox we own — and there is a comment saying so. But a justification written next to a credential is doing a policy's job, and a policy is what it should be.

**It fails before it calls.** `5/5` — An unset variable is sent as the string `"undefined"` and LTA answers 401 exactly as it would for a wrong key, which is an hour of debugging the wrong thing. The guard sits before the fetch and returns 503 with a named error.

**It reads the whole feed.** `5/5` — `$skip` loop in increments of 500 until a short page, 20-page safety cap, dedupe on `CarParkID_LotType`. A page-one failure takes the board down; a later-page failure produces "Showing 412 of an unknown total; the feed stopped responding at page 3" rather than a silent short read.

**A baseline is an observed reading.** `4/5` — Per site, per lot type, per day-type, per hour, each carrying `observedOn`. No capacity, no converted occupancy percentage, and a site without a baseline is excluded from ranking rather than defaulted. Marked down one because the banned `(1 − rate) × capacity` conversion **is still in `ComputationTransparency.tsx`** as a dead fallback, with `totalLots` still in `types.ts` under "backward compatibility". Unreachable is not the same as deleted.

**It fails closed when the fault might be mine.** `5/5` — If every site deviates the same way by more than 25%, or more than half deviate by over 100%, the ranking is suppressed and the board says "Baselines look miscalibrated — deviations suppressed" while still showing raw availability. This is the part of the build I would defend hardest, because it is the only part that assumes the unreliable input is me.

**The repo contains only what the product needs.** `1/5` — It does not. `.env.example` declares `GEMINI_API_KEY` and a Cloud Run `APP_URL` for OAuth callbacks, `metadata.json` declares a server-side Gemini capability, and `@google/genai` is a dependency. Nothing here calls a model. I looked at the running app for the whole build and never at the file tree.

> The arithmetic and the failure handling are the strong parts, and they are strong because the judgement went in before the code existed. The weak parts are all the same species: **a true thing that stopped being true and had nothing watching it.**

---

## Q1: Where did the agent make me faster, and by how much?

A running board — four handlers, eight components, seven states, a paginating fetcher and a per-site Haversine weather match — in a session. By hand that is a week, and most of it would have been the boring half: pagination loops, cache TTLs, `response.ok` checks, the eight different ways a row can be missing.

What I did with the time is the part I would defend. I spent it calling both feeds by hand, which is where all three of the real traps came from: that LTA paginates at 500 with no indication it has done so, that `data.gov.sg` does not guarantee key order inside `label_location`, and that LTA's `Location` arrives as a space-separated string with unreliable ordering. None of those three is in any documentation I read. All three were in the responses.

Two kinds of task, and the distinction matters more than the instance:
- The pagination loop, the dedupe, the cache headers --> things I **could have written but slowly**. Known shape, no judgement in them.
- The Haversine matching and the day-type/hour indexing in Singapore time --> things I would have written **badly** and then debugged for an hour, because `Intl.DateTimeFormat` with `hourCycle: "h23"` and `timeZone: "Asia/Singapore"` is exactly the kind of thing I would have got 95% right and never noticed the other 5%.

**Where it was faster by hand:** registering the LTA DataMall key and setting it in Vercel. Both are forms in someone else's dashboard. Describing a dashboard to an agent that cannot see it is always slower than clicking it.

---

## Q2: Where did it cost me time, and whose fault was that?

The occupancy baselines, and the fault is almost entirely mine.

I specified the first baseline model as `capacity × (1 − expected occupancy rate)`, because that is how I think about carparks and because an occupancy percentage feels like the natural unit. The agent built exactly that. It was not wrong about my instruction; my instruction was wrong about the world. <mark>LTA DataMall does not publish capacity.</mark> So every `totalLots` in that table was a number I had estimated in order to make a formula work, and then I divided a real observed figure by it. Two guesses and one measurement, presented as a deviation.

It did not fail quietly. Sites came back deviating by several hundred per cent, which is how I caught it — the output was absurd enough to be obvious. Had my capacity estimates been better, they would have been wrong by 20% instead of 300%, and **I would have shipped it**, because a 20% error looks exactly like a real anomaly.

The cost was a full rewrite of the baseline table, the exclusion path and everything downstream. The remedy was not a better prompt. It was noticing that "expected available lots" needed to be a thing someone had *seen*, not a thing computed from two things nobody had. That is why every baseline now carries `observedOn` and why the rule sits in capitals at the top of `constants.js`: the fix had to survive me forgetting it.

**The agent's share, small but real:** when I asked for the new rule, it wrote the new rule. It did not remove the old path. The banned conversion is still in the front end as a dead fallback, and `totalLots` is still in `types.ts` under a comment reading "backward compatibility". I asked for an addition and received an addition.

---

## Q3: Did it ever hand me something that looked right and was not?

The best example in this build is not something the agent got wrong. It is something we both got right, which then told a lie.

**ION Orchard showed "No reading for this site."** That is one of my own carefully-worded honest states. It is the state I wrote specifically to avoid the FULL/UNKNOWN collapse — it exists to say *the feed does not have this site, and we will not pretend a zero.* It rendered perfectly. It was correctly styled, correctly placed in the ranked list, correctly excluded from the deviation ranking.

ION Orchard was in the feed the entire time. It sits past the first 500 records, and we were reading one page. <mark>Our own bug was being reported by our own honesty mechanism, in our own careful wording, and there was nothing on the screen that looked wrong.</mark> An error would have been better. An error draws attention.

I found it by calling the endpoint by hand with `$skip=500` — not because I suspected pagination, but because I was checking something else and noticed the response was exactly 500 rows. Exactly 500 is not a number nature produces.

Two smaller ones, both the same species. The product panel described the metric as "occupancy" and claimed "weather is already removed" for a session after the code had stopped computing occupancy and started multiplying an expectation by a four-value lookup table — found by reading the copy against the payload, not by anything failing. And the file tree carries a Gemini key slot, a Cloud Run OAuth URL and the `@google/genai` dependency in a repository that calls no model at all — found by finally opening the tree instead of the running app.

---

## Q4: What did I have to know in order to supervise it?

Four things, and every one of them came from calling something by hand.

- **That a complete-looking response can be a page.** 500 valid records, valid JSON, no `nextLink`, no total count, no hint. The only tell is that the number is round.
- **That LTA does not publish capacity**, and therefore that any "expected availability" derived from a capacity figure is derived from something I invented.
- **That `data.gov.sg` varies its key order**, so reading `label_location` positionally works for most of the array and quietly relocates the rest. Read by key, always.
- **That Singapore weather is local enough to matter.** Thundery in Orchard and fair in Marina inside the same two-hour window is normal, so a single national rain factor would have been a wrong number applied confidently to eight sites at once.

**Now the harder half.** What would I have needed to know to catch what I did not catch? Not more about the feeds. The three things I missed — the dead conversion in the front end, the stale panel copy, the Gemini scaffold — share one property: **none of them is visible from the running app.** I supervised this build by opening the board, which catches an absurd deviation and cannot catch a file that should not exist or a sentence that used to be true. The judgement that stays mine is knowing which questions the screen can answer and which ones only the file tree can.

*I could read enough to verify a tile of arithmetic and a state sentence. I could not have gone looking for a dependency I never asked for, because I had no reason to think one was there.*

---

## Q5: Which decisions did I keep, and should I have kept more or fewer?

Mine, in the order they happened: that the product is about **timing rather than availability** · the eight sites, chosen because I know what is walkable from Bras Basah · that ranking is by **absolute cars, not percentage**, because a 40% swing on a 90-lot site is noise next to 300 cars at Suntec · the 10%-and-15-lots double threshold · every state sentence, including the two different kinds of missing · that FULL and UNKNOWN never share a sentence, and that the rule goes in the footer · that a baseline must be observed and carry its date · that a site without one is excluded rather than defaulted · the calibration guard, and that it fails closed · that rain **lowers an expectation** and is never described as "removed" · that the weather feed degrades on its own and only LTA can take the board down · to stop prompting and do the Vercel key by hand.

**One I should have handed over.** The vehicle-type selector. I specified cars, motorcycles and heavy vehicles because LTA publishes all three lot types, without working out that I only had observed baselines for cars. The result is a control that, when switched, correctly and honestly reports that almost nothing can be evaluated. Every sentence it produces is true. The feature still over-promises, and that was a product decision I made badly rather than one the agent got wrong.

**Two that never reached my list at all.** The agent settled that the old occupancy path would **stay** in the front end as a fallback — I never knew that was an open question. And something in the build environment settled that this repository would declare a Gemini capability, ship a key slot and carry `@google/genai`, none of which I asked for, all of which I signed by pushing.

**And the one that is worst.** "Notification saved. You will be alerted when a site breaches baseline." Nobody decided that sentence was a promise. It reads as UI copy. But *alerted* is a word with an operational meaning — it says a thing will happen later, without me — and there is no scheduler anywhere in this repository. The arithmetic on this board is careful to the point of suppressing itself when it doubts its own baselines, and then the form at the bottom makes a commitment the system cannot keep.

---

## Q6: Now scale it up — what does this mean for a team of thirty?

Three rules, and all three trace to the same fact: **everything I missed was invisible from the running product.**

**1. Somebody reads the file tree, not the preview, and accounts for every file nobody asked for.**
*Traced to:* a Gemini key slot, a Cloud Run OAuth callback and `@google/genai` sitting in a repository that calls no model, through the entire build and both commits, because I only ever looked at the board. At thirty people that is not untidiness — it is a declared capability and a credential-shaped hole in something that ships.

**2. Any word with an operational meaning gets signed off by someone who owns that operation before a user sees it.**
*Traced to:* "You will be alerted when a site breaches baseline", and to a panel that said "weather is already removed" while the code multiplied by a lookup table. Both are ordinary-looking copy. Both assert a system behaviour. <mark>Alerted, verified, removed, controlled for, monitored — these are claims, not labels</mark>, and the person who can falsify them is never the person writing the component.

**3. Every rule an agent is given gets a paired instruction to delete what it replaces — and a check that it did.**
*Traced to:* the banned `(1 − rate) × capacity` conversion still living in `ComputationTransparency.tsx` after a prompt that put the prohibition in capitals at the top of `constants.js`. I asked for a rule and got a rule. Dead code is not neutral; it is a branch waiting for a payload shape to change. A test asserting that no expectation is ever derived from a capacity figure would have caught it. The prohibition, as written, could not.

**The thing I would refuse outright, and sign my name to:** any number on a screen whose provenance cannot be stated in one sentence, and any sentence that says something will happen later without a named thing that makes it happen. Across thirty people the failure never arrives as somebody inventing a figure. It arrives as a metric that was observed in August, described as "expected" in September, and read as "predicted" by a driver in October, with nobody in the chain having lied.

---

`Building this made me want to go further than description. Right now the board says whether today is normal; the next version should say what the next two hours look like, and this time I want the tripwires written before the thing ships rather than after it.`
