# Contract Changelog

Record any change to a shared interface here (state shape, API request/
response schema, exhibit JSON schema, persona IDs). Newest entries first.

## Format
\`\`\`
### YYYY-MM-DD — <short description>
Stream: <A|B|C|D>
Changed: <file(s)>
Reason: <why>
Migration: <what other streams need to do>
\`\`\`

---

### 2026-07-25 — Session store gains stop-progress setters (FEAT-013)
Stream: C
Changed: frontend/src/stores/useSessionStore.js
Reason: Screen 3 Live Navigation needs to advance the tour position on manual
"I'm here" checkpoint check-in. The store exposed `currentStopIndex` but had no
setter other than `setItinerary`, which resets progress to 0.
Migration: Additive only — no existing field or action changed. Two new actions
are available: `advanceStop()` moves to the next itinerary stop, and
`setCurrentStopIndex(index)` jumps to a specific stop. Both clamp to the
itinerary bounds, so they are safe to call on an empty or final-stop itinerary.

### 2026-07-23 — Initial contracts established
Stream: bootstrap
Changed: backend/routes/*.js, frontend/src/stores/*.js, frontend/public/exhibits/*.json
Reason: Initial scaffold
Migration: n/a
