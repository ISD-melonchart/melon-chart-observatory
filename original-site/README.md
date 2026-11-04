# CHART ROOM

Owner-private Melon chart dashboard, hosted as a Worker with R2 binding `BUCKET`.

- POST `/api/update`: fetch hourly TOP100, 5-minute HOT100 top-five graph and ten-minute per-song listener counts plus 30/40/50-minute forecasts; validate source times and persist snapshots. Retry missing per-song records on the next request.
- GET `/api/state`: latest records with exact previous-day/same-time comparisons; first successful read each KST date saves a daily review snapshot.
- GET `/api/state?at=YYYY-MM-DDTHH:mm`: exact historical slot records, missing slots remain missing.
- GET `/api/history?kind=top|hot|listeners|predictions|reviews&date=YYYY-MM-DD`: dated record inventory.
- GET `/api/export`: latest full dashboard JSON.

Snapshots live under `top/`, `hot/`, `listeners/`, `predictions/`, and `reviews/`; source timestamps form keys. No simulated records are seeded. The current public HOT100 source exposes five songs, not 100 graph series. HOT100 scores are not listener counts. Ten-minute counts must never be summed as daily unique listeners.

Forecasts use the point labelled `예측` after validating the current-hour graph and HTTP Date. Each source round is stored independently with its next-hour target; actual ranks and the current-rank anchor are never used as fallback forecasts. Missing forecasts are retried even when listener counts are complete. Historical views omit rounds that had not yet been announced at the selected time. Forecasts are collected only while the dashboard is open, sharing each song report request with the listener collector.

An enabled Site-linked hourly task calls the updater with Sites service authorization obtained fresh from get_site, then reads back persisted state. Cloud tasks have a minimum interval of one hour; five-/ten-minute unattended scheduling is not available. An open dashboard requests collection at each five-minute boundary and polls stored records every thirty seconds; browser background throttling may miss intervals. Daily unique-listener source is not connected and is deliberately absent.

Service credentials must stay in process memory and be sent only to this Site's origin through OAI-Sites-Authorization. Owner-private dispatch is the write authorization boundary. Do not change audience without adding updater authorization.

Build: `bash scripts/build.sh` and `node scripts/validate-artifact.mjs`. Local preview: `node scripts/dev.mjs --port 3000` (in-memory data only).

Validation: `node --test tests/predictions.test.mjs` exercises a recorded public forecast fixture, slot/date/graph checks, history isolation, partial retries, and forecast collection after listeners are complete.
