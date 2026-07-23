# Phases & Roles — Adwa Lens Hackathon Build

Four parallel workstreams. Each owns a directory slice and a section of the
architecture so streams can run concurrently without stepping on each other.
See `AGENT_INSTRUCTIONS.md` for the rules every stream (human or AI agent)
must follow when touching shared contracts.

---

## Stream A — WebGL/3D Asset & WebXR Lead

**Owns:**
- `frontend/public/models/` (.glb assets, Draco/KTX2 compression pipeline)
- `frontend/src/components/screens/InspectionHub.jsx`
- `frontend/src/components/screens/SensoryHub.jsx` (3D/mesh-facing parts)
- `frontend/public/exhibits/*.json` — `hotspot_json` and `glb_url` fields

**Phase 1 (Hours 0–4):**
- Source or author the hero artifact (Shotel sword) as a Draco-compressed
  `.glb` with KTX2 textures, auto-framed camera defaults.
- Wire `<model-viewer>` into `InspectionHub.jsx` with hotspot pins reading
  from `hotspot_json`.

**Phase 2 (Hours 4–8):**
- Implement Exploded View (GSAP transform tween or morph targets) for the
  hero artifact only (pre-authored positions per Section 5.2).
- Add low-end device LOD fallback (compressed low-poly variant) and a
  no-WebGL2 pre-rendered image-sequence fallback.

**Phase 3 (Hours 8–12):**
- Populate 2–3 additional exhibit `.glb` files (drum, horn) for Stream D's
  sensory hub.
- Polish auto-rotate / manual-orbit handoff and loading placeholder states.

**Hands off to:** Stream B (exhibit_id from vision scan drives which glb
loads), Stream D (instrument meshes for tap-zone mapping).

---

## Stream B — Vision AI & Voice RAG Pipeline Lead

**Owns:**
- `backend/routes/vision-scan.js`, `backend/routes/stt.js`,
  `backend/routes/ask-guide.js`, `backend/routes/tts-stream.js`
- `backend/lib/personas.js`, `backend/lib/errors.js`
- `frontend/src/hooks/useCameraScanner.js`, `frontend/src/hooks/useVoiceGuide.js`
- `frontend/src/components/screens/CameraScanner.jsx`,
  `frontend/src/components/screens/VoiceGuideOverlay.jsx`

**Phase 1 (Hours 0–4):**
- Get Gemini Flash vision call returning strict JSON (`exhibit_id`,
  `confidence`, `material_guess`) through the BFF proxy.
- Implement client-side brightness/blur heuristic gate before every Gemini
  call (Screen 4 hint text).

**Phase 2 (Hours 4–8):**
- Wire the full STT → Llama (persona RAG) → TTS round trip for one persona
  (Kids Explorer per Section 5.1) with streaming captions.
- Implement ElevenLabs → `window.speechSynthesis` fallback.

**Phase 3 (Hours 8–12):**
- Add the remaining two personas (Scholar, Royal) with live persona
  switching mid-conversation.
- Add off-topic/inappropriate-question redirection to the system prompt.

**Hands off to:** Stream A (exhibit_id → glb lookup), Stream C
(confidence threshold UI states, persona chips).

---

## Stream C — Adwa UI/UX & Itinerary Planner Lead

**Owns:**
- `frontend/tailwind.config.js`, `frontend/src/styles/index.css`
- `frontend/src/components/ui/*`
- `frontend/src/components/screens/Landing.jsx`,
  `frontend/src/components/screens/ItineraryPlanner.jsx`,
  `frontend/src/components/screens/LiveNavigation.jsx`,
  `frontend/src/components/screens/MemoryDeck.jsx`
- `frontend/src/stores/useSessionStore.js`

**Phase 1 (Hours 0–4):**
- Lock the design system (Imperial Gold / Adwa Emerald / Crimson /
  Obsidian / Wanza Wood / Parchment tokens) — no generic dark/grey UI.
- Build Landing + onboarding permission-priming modal.

**Phase 2 (Hours 4–8):**
- Build the card-stack Itinerary Planner wizard with 2–3 pre-canned routes
  (simulated crowd data per Section 5.2).
- Build the 2D SVG floor map + hardcoded walking path with "I'm here"
  manual check-in.

**Phase 3 (Hours 8–12):**
- Build the Post-Tour Memory Deck (recap cards, quiz, badge shelf,
  save/export) pre-populated with the live demo session's visited
  exhibits.
- Full accessibility pass: contrast ratios, thumb-reachable CTAs, captions
  always visible under the voice avatar.

**Hands off to:** Stream D (badge/gamification hooks into Memory Deck),
Stream B (persona-aware copy).

---

## Stream D — Audio, Haptics & Gamification Lead

**Owns:**
- `frontend/src/lib/pitchDetection.js`, `frontend/src/lib/haptics.js`
- `frontend/src/components/screens/SensoryHub.jsx` (audio/haptic-facing parts)
- Quiz/badge logic feeding into `frontend/src/components/screens/MemoryDeck.jsx`

**Phase 1 (Hours 0–4):**
- Implement Web Audio synth drum-tap (center/edge tone split) with
  `navigator.vibrate()` and a visual-pulse fallback for iOS Safari.

**Phase 2 (Hours 4–8):**
- Implement wind-instrument breath detection (autocorrelation pitch +
  amplitude off `AnalyserNode`) with mic gain normalization / noise gate
  for noisy museum ambient sound.
- Blade swipe-gesture clash sample + lightweight particle burst.

**Phase 3 (Hours 8–12):**
- Build the quiz engine (3–5 questions drawn from visited exhibits) and
  digital badge unlock logic, feeding Stream C's Memory Deck.

**Hands off to:** Stream A (instrument mesh tap-zone UV mapping), Stream C
(badge/quiz data into recap deck).

---

## Sync Points (all streams)

- **Hour 4:** Contract freeze check — confirm `frontend/public/exhibits/*.json`
  schema, persona IDs, and store shapes are stable before deeper work.
- **Hour 8:** Integration rehearsal — run the full demo path end-to-end.
- **Hour 11:** Feature freeze — Section 5.1 MVP scope only from here on.
- **Hour 12:** Final demo rehearsal per Section 5.4 narrative arc.
