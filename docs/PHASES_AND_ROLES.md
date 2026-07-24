# Phases & Roles — Adwa Lens Hackathon Build

Four parallel workstreams. Each owns a directory slice and a section of the architecture so streams can run concurrently without stepping on each other. See `AGENT_INSTRUCTIONS.md` and `GOVERNANCE.md` for the non-negotiable rules every stream (human or AI agent) must follow when touching shared contracts.

---

## 1. Complete Artifact Roster & Ownership Matrix

Every exhibit in the catalog has dedicated assets, metadata contracts, and stream ownership:

| Exhibit ID | Exhibit Name | Category | 3D Model Path | JSON Metadata Path | Stream A Ownership | Stream B Ownership | Stream D Mechanics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `shotel_sword` | Shotel Sword (Hero) | Weapon | `public/models/shotel_sword.glb` | `public/exhibits/shotel_sword.json` | Curved blade geometry, hilt, sheath, hotspots, exploded view | Hero RAG facts & persona scripts | Blade swipe gesture clash SFX & canvas particle burst |
| `menelik_taytu_statue` | Emperor Menelik II & Empress Taytu Monument | Statue | `public/models/menelik_taytu_statue.glb` | `public/exhibits/menelik_taytu_statue.json` | Velvet Kaba, Crown, Weaponry, & Taytu Banner multi-hotspots | Royal & Scholar persona historical context | High-detail mesh inspection & material highlights |
| `negarit_drum` | Negarit Ceremonial Royal Drum | Instrument | `public/models/negarit_drum.glb` | `public/exhibits/negarit_drum.json` | Hide skin, leather tension ropes, wooden base mesh & hotspots | War proclamation & ceremonial RAG facts | Direct 3D mesh tap, Strike UI button, haptic vibrate |
| `embilta` | Embilta Ceremonial Wind Instrument | Instrument | `public/models/embilta.glb` | `public/exhibits/embilta.json` | Bamboo/metal flute, blowhole, acoustic chamber hotspots | Traditional acoustic & ceremonial facts | Mic blow pitch detection, Blow button, visual airflow overlay |
| `meleket` | Meleket Royal Trumpet | Instrument | `public/models/meleket.glb` | `public/exhibits/meleket.json` | Long horn shaft, mouth opening, bell flare hotspots | Military mobilization & royal proclamation facts | Mic blow/volume detection, Blow button, airflow particle overlay |

---

## 2. Workstream Breakdown

### Stream A — WebGL/3D Asset & WebXR Lead

**Owns:**
- `frontend/public/models/` (`shotel_sword.glb`, `menelik_taytu_statue.glb`, `negarit_drum.glb`, `embilta.glb`, `meleket.glb`)
- `frontend/src/components/screens/InspectionHub.jsx`
- `frontend/src/components/screens/SensoryHub.jsx` (3D/mesh-facing parts & raycasting)
- `frontend/public/exhibits/*.json` — `hotspot_json` and `glb_url` fields

**Phase 1 (Hours 0–4):**
- Author/source the hero artifact (`shotel_sword.glb`) as a Draco-compressed `.glb` with KTX2 textures and auto-framed camera defaults.
- Wire `<model-viewer>` into `InspectionHub.jsx` with interactive hotspot pins reading from `hotspot_json` for all 5 exhibits.

**Phase 2 (Hours 4–8):**
- Implement Exploded View (GSAP transform tween / morph targets) for `shotel_sword.glb` (separated blade, hilt, sheath).
- Add 3D mesh raycasting targets on `negarit_drum.glb` hide skin, `embilta.glb` blowhole, and `meleket.glb` mouthpiece.
- Add low-end device LOD fallback and no-WebGL2 pre-rendered image sequence fallback.

**Phase 3 (Hours 8–12):**
- Finalize all 5 exhibit `.glb` models (`shotel_sword`, `menelik_taytu_statue`, `negarit_drum`, `embilta`, `meleket`).
- Polish auto-rotate / manual-orbit handoff and loading placeholder states.

**Hands off to:** Stream B (`exhibit_id` from vision scan drives model lookup), Stream D (mesh surface hit targets for audio triggers).

---

### Stream B — Vision AI & Voice RAG Pipeline Lead

**Owns:**
- `backend/routes/vision-scan.js`, `backend/routes/stt.js`, `backend/routes/ask-guide.js`, `backend/routes/tts-stream.js`
- `backend/lib/personas.js`, `backend/lib/errors.js`
- `frontend/src/hooks/useCameraScanner.js`, `frontend/src/hooks/useVoiceGuide.js`
- `frontend/src/components/screens/CameraScanner.jsx`, `frontend/src/components/screens/VoiceGuideOverlay.jsx`

**Phase 1 (Hours 0–4):**
- Gemini Flash vision call returning strict JSON (`exhibit_id`, `confidence`, `material_guess`) supporting all 5 catalog IDs.
- Client-side brightness/blur heuristic gate before Gemini API call in `CameraScanner.jsx`.

**Phase 2 (Hours 4–8):**
- Wire STT → Llama 3.3 (persona RAG) → ElevenLabs TTS round trip for Kids Explorer persona with streaming captions.
- Implement ElevenLabs → `window.speechSynthesis` client fallback.

**Phase 3 (Hours 8–12):**
- Add History Scholar and Royal Roleplay personas with live mid-tour persona switching.
- Add safety guardrails and off-topic question redirection prompts.

**Hands off to:** Stream A (`exhibit_id` → model lookup), Stream C (confidence UI states, persona selector chips).

---

### Stream C — Adwa UI/UX & Itinerary Planner Lead

**Owns:**
- `frontend/tailwind.config.js`, `frontend/src/styles/index.css`
- `frontend/src/components/ui/*`
- `frontend/src/components/screens/Landing.jsx`, `frontend/src/components/screens/ItineraryPlanner.jsx`, `frontend/src/components/screens/LiveNavigation.jsx`, `frontend/src/components/screens/MemoryDeck.jsx`
- `frontend/src/stores/useSessionStore.js`

**Phase 1 (Hours 0–4):**
- Lock design system tokens (Imperial Gold, Adwa Emerald, Adwa Crimson, Obsidian, Wanza Wood, Parchment).
- Build Landing screen & camera/mic permission priming modal.

**Phase 2 (Hours 4–8):**
- Build card-stack Itinerary Planner wizard with 2–3 pre-canned routes & crowd density feed simulation.
- Build 2D SVG floor map + hardcoded walking path with "I'm here" manual check-in in `LiveNavigation.jsx`.

**Phase 3 (Hours 8–12):**
- Build Post-Tour Memory Deck (recap cards, quiz trigger, badge shelf, export/save) pre-populated with visited exhibit data.
- Full accessibility pass: contrast ratios, thumb-reachable CTAs, sticky voice captions.

**Hands off to:** Stream D (badge/quiz hooks into Memory Deck), Stream B (persona-aware copy).

---

### Stream D — Audio, Haptics & Gamification Lead

**Owns:**
- `frontend/src/lib/pitchDetection.js`, `frontend/src/lib/haptics.js`
- `frontend/src/components/screens/SensoryHub.jsx` (audio/haptic mechanics)
- Quiz/badge logic feeding into `frontend/src/components/screens/MemoryDeck.jsx`

**Phase 1 (Hours 0–4):**
- **Negarit Drum Mechanics:** Web Audio synth drum-tap (center vs rim tone split), direct 3D mesh tap raycasting listener, dedicated "Strike" UI button, `navigator.vibrate()` pulse, visual canvas wave pulse.

**Phase 2 (Hours 4–8):**
- **Embilta & Meleket Blowing Mechanics:** Mic breath & autocorrelation pitch/amplitude detection in `pitchDetection.js`, interactive "Blow / Play Sound" button, visual airflow particle overlay.
- **Blade Swipe Mechanics:** Blade swipe gesture metallic clash SFX + particle canvas burst.

**Phase 3 (Hours 8–12):**
- Interactive Quiz engine (3–5 questions drawn from visited exhibits) and digital badge unlock shelf for Memory Deck.

**Hands off to:** Stream A (mesh UV tap-zone mapping), Stream C (badge/quiz data into recap deck).

---

## 3. Workstream Sync Points

- **Hour 4:** Contract Freeze — verify `public/exhibits/*.json` schema for all 5 exhibits, persona IDs, and store state shapes.
- **Hour 8:** Integration Rehearsal — test full hero path end-to-end (Landing → Planner → LiveNav → Camera Scan Shotel → 3D Inspection → Voice Q&A → Sensory Hub drum tap/blow → Memory Deck).
- **Hour 11:** Feature Freeze — lock Section 5.1 MVP scope.
- **Hour 12:** Final Demo Rehearsal per Section 5.4 narrative arc.
