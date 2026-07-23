# Adwa Lens — AI-Powered WebAR Museum Companion
### Complete System Architecture, UX Walkthrough, and Hackathon Blueprint

---

## 1. System Architecture & API Data Flow Diagram

### 1.1 High-Level Component Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Mobile Browser)                          │
│                                                                                │
│  ┌────────────┐   ┌───────────────┐   ┌────────────────┐   ┌───────────────┐ │
│  │ Itinerary  │   │  Camera/AR    │   │  3D Inspection  │   │  Voice/Chat   │ │
│  │ Planner UI │   │  Scanner UI   │   │  Hub (WebXR)    │   │  Overlay UI   │ │
│  └─────┬──────┘   └──────┬────────┘   └────────┬────────┘   └───────┬───────┘ │
│        │                 │                     │                    │        │
│  ┌─────┴─────────────────┴─────────────────────┴────────────────────┴─────┐  │
│  │                    App State Manager (Zustand/Redux)                    │  │
│  │   - Session context (party type, time budget, persona, tour history)    │  │
│  │   - Offline queue + IndexedDB cache (glb assets, JSON metadata)          │  │
│  └───────────────────────────────┬───────────────────────────────────────-─┘  │
└──────────────────────────────────┼────────────────────────────────────────────┘
                                    │  (fetch/WebSocket, batched, retry-safe)
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          EDGE / SERVERLESS GATEWAY (BFF)                      │
│         (Cloudflare Worker / Vercel Edge Function — thin proxy layer)         │
│   - Hides API keys, rate-limits per session, normalizes error contracts       │
└───────┬───────────────┬────────────────┬────────────────┬────────────────────┘
        │                │                │                │
        ▼                ▼                ▼                ▼
 ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
 │ Gemini Flash│  │ Groq Whisper│  │ Groq Llama  │  │ ElevenLabs TTS  │
 │ Vision JSON │  │ STT (turbo) │  │ 3.3 70B     │  │ v1/text-to-     │
 │             │  │             │  │ (RAG/Persona│  │ speech          │
 └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘
```

### 1.2 End-to-End Data Flow — "Scan to Speech" Pipeline

```
[1] CAMERA FRAME CAPTURE
    User points phone at artifact (e.g., a Shotel sword)
        │  navigator.mediaDevices.getUserMedia() → <video> → <canvas>
        │  Frame throttled to 1 capture / 2s, downscaled to 512px, base64 JPEG
        ▼
[2] GEMINI 1.5/2.0 FLASH VISION CALL
    POST /v1beta/models/gemini-2.0-flash:generateContent
        │  inlineData: base64 image + system prompt forcing strict JSON schema
        ▼
    Response: {"exhibit_id": "shotel_sword", "confidence": 0.98,
               "material_guess": "hand-forged iron + wanza hardwood"}
        │
        ├── confidence ≥ 0.85 → proceed automatically
        └── confidence < 0.85 → trigger QR/NFC fallback UI (Section 3.2)
        ▼
[3] EXHIBIT METADATA LOOKUP
    exhibit_id → local IndexedDB / Firestore lookup
        │  returns: {glb_url, hotspot_json, audio_profile, persona_scripts}
        ▼
[4] 3D MODEL LOAD (WebGL/WebXR)
    <model-viewer src="shotel_sword.glb"> streamed progressively
        │  Draco-compressed mesh, KTX2 textures, auto-framed camera
        │  Hotspot pins injected from hotspot_json (material/history/usage)
        ▼
[5] VOICE Q&A LOOP (on user tap-to-talk or auto-narration)
    Mic → MediaRecorder → 16kHz mono PCM/WAV chunk
        │
        ▼
    Groq Whisper-large-v3-turbo (STT)
        │  returns transcript: "Why is this sword curved?"
        ▼
    Groq Llama-3.3-70B-versatile (persona-conditioned RAG prompt)
        │  system prompt = persona (Kids/Scholar/Royal) + exhibit context (hotspot_json)
        │  streamed token response
        ▼
    ElevenLabs v1/text-to-speech (streaming)
        │  fallback: window.speechSynthesis if ElevenLabs quota/network fails
        ▼
[6] AUDIO PLAYBACK + HAPTIC SYNC
    <audio> streamed via MediaSource Extensions, captions rendered in sync
    Navigator.vibrate() triggered on emphasis words (optional haptic beat)
```

### 1.3 Offline / Degraded-Network Contingency Flow

```
Network check (navigator.onLine + periodic ping)
     │
     ├── ONLINE (full bandwidth)      → Full pipeline above
     ├── ONLINE (throttled/spotty)    → Cached glb + text-only Llama response
     │                                   (TTS skipped, captions shown instead)
     └── OFFLINE                      → Service Worker serves pre-cached:
                                         - Top 20 "must-see" exhibit glbs
                                         - Pre-generated persona scripts (static JSON)
                                         - Browser speechSynthesis for narration
```

---

## 2. Complete Screen-by-Screen User Journey Walkthrough

### Screen 1 — Landing / Onboarding
- **UI State:** Full-bleed hero video loop of the museum interior fading into a stylized 3D Shotel sword rotating in `<model-viewer>`. Title "Adwa Lens" with subtitle "Your museum, brought to life."
- **Interactions:**
  - Primary CTA button: **"Start My Tour"** (large, thumb-reachable bottom third).
  - Secondary link: **"I have a ticket QR"** (skips planner, jumps to Screen 3 with pre-loaded party data from ticketing system).
  - Language toggle (Amharic / English / Tigrinya) — persists to session state.
- **Permissions Priming:** Before the OS permission dialogs fire, a soft in-app modal explains *why* camera/mic access is needed ("See exhibits come alive and ask questions by voice") — improves grant rates.

### Screen 2 — Adaptive AI Itinerary Planner
- **UI State:** A conversational card-stack wizard (swipeable), not a boring form.
  1. **Time budget** — segmented control: `20 min | 45 min | 2 hrs | No limit`.
  2. **Interest categories** — multi-select chips: `War Strategy`, `Metallurgy`, `Royal History`, `Music & Culture` (icons, tap to toggle, min 1 required).
  3. **Party type** — illustrated cards: `Individual`, `Family with Kids`, `Scholar` (changes downstream persona defaults).
  4. **Accessibility** — toggle: `Wheelchair/Elevator routes only`.
- **Behind the scenes:** On submit, client sends structured JSON to backend routing engine (constraint-satisfaction over exhibit graph + estimated dwell times + live crowd-density feed from simulated/IoT people-counters at doorways).
- **Output UI:** A generated itinerary card list ("Stop 1: Adwa War Room — 8 min", "Stop 2: Metallurgy Hall — 12 min"…) with a **"Start Walking Tour"** button and an **"Edit"** pencil icon per stop.

### Screen 3 — Indoor Mapping & Live Navigation
- **UI State:** 2D top-down museum floor map (SVG, not heavy 3D) with a pulsing blue dot for user position (estimated via BLE beacons/Wi-Fi RTT triangulation, or QR-checkpoint scanning as a fallback for beacon-less venues).
- **Interactions:**
  - Route line drawn stop-to-stop, color-coded by crowd density (green/amber/red) with a **"Reroute to avoid crowd"** suggestion chip if a corridor is congested.
  - Elevator/ramp icons highlighted if accessibility mode is on.
  - Bottom sheet shows the next stop's name, thumbnail, and a **"I'm here"** manual check-in button (for venues without beacons).

### Screen 4 — Camera AI Vision Scanner
- **UI State:** Full-screen live camera viewfinder with a soft rounded-corner scan frame overlay and subtle animated corner brackets (like a boarding-pass scanner, not a jarring AR overlay).
- **Interactions:**
  - Real-time low-confidence hint text: *"Move closer"* / *"Hold steady"* / *"Try more light"* — driven by simple client-side heuristics (brightness histogram, blur variance) *before* wasting a Gemini call.
  - On successful scan (confidence ≥ 0.85): frame freezes, a satisfying "capture" pulse animation, then a card slides up: exhibit name + thumbnail + **"View in 3D"** CTA.
  - On failure/low light/crowd occlusion: bottom sheet offers **"Scan QR code instead"** or **"Browse nearby exhibits list"** (NFC tap alternative for tagged displays).
- **Voice affordance:** A persistent floating mic button lets users say "What am I looking at?" as a redundant path if the camera scan is inconclusive (routes to Whisper → Llama with a "no visual match" fallback prompt asking the user to describe what they see).

### Screen 5 — 3D WebGL Inspection & Deep Hotspot Hub
- **UI State:** Full-screen `<model-viewer>`/Three.js canvas, artifact auto-framed and gently auto-rotating until the user touches it (then rotation stops and manual orbit/pinch-zoom takes over).
- **Interactions:**
  - Glowing pin-point hotspot dots on the model. Tapping one opens a bottom drawer with tabs: **Material | Craft & Method | Usage & Significance**, each with short text plus a relevant icon/photo.
  - **"Exploded View"** toggle button — animates the model separating into labeled layers (e.g., blade / hilt / sheath) using GSAP-driven transform interpolation on separate glb meshes or morph targets.
  - **Sensory mode icon** (drum/horn icon) appears contextually only for instrument exhibits, launching Screen 6 as a modal.
  - Persona avatar icon (bottom corner) always visible to switch narration voice without leaving the model view.

### Screen 6 — Multi-Sensory Audio & Haptic Interaction (contextual, instruments only)
- **UI State:** The 3D model of a drum or horn instrument fills the screen with tap zones highlighted directly on the mesh surface.
- **Interactions:**
  - **Drums:** Tapping different regions of the drum skin (mapped to UV coordinates → screen regions) plays layered Web Audio synth samples (center = deep tone, edge = sharp rim tone) + `navigator.vibrate()` pulse per hit.
  - **Wind instruments (Embilta/Meleket):** User taps **"Blow to Play"**, mic activates, client-side pitch/amplitude detection (autocorrelation on Web Audio `AnalyserNode` FFT data) maps breath intensity/pitch to a synthesized horn tone in real time.
  - **Blades:** Swipe-gesture across two crossed blade models triggers a metallic clash sample + a spark particle burst (lightweight SVG/canvas particles, not full physics).

### Screen 7 — Dynamic Voice AI Tour Guide / Q&A
- **UI State:** A chat-style overlay drawer (semi-transparent, doesn't fully hide the 3D model behind it) with a big central mic button, live waveform animation while listening, and streaming text captions appearing as ElevenLabs audio plays.
- **Interactions:**
  - **Persona switcher:** three avatar chips fixed at the top — 🧒 Kids Explorer, 📜 History Scholar, 👑 Royal Roleplay — tapping instantly changes system prompt + voice ID for all subsequent responses (with a short transition line, e.g., the Royal persona announcing itself in character).
  - Tap-and-hold mic (walkie-talkie style, safer against noisy crowd false triggers) → release to send.
  - Typed fallback: a text input under the mic for silent/noisy environments.
  - **Live captions** always shown beneath the avatar so the feature remains usable with sound off (crowded galleries, hearing-impaired visitors).

### Screen 8 — Post-Tour Memory Deck & Engagement
- **UI State:** A vertically scrolling "recap deck" styled like a story/album — one card per visited exhibit with the AR photo snapshot (Screen 5's camera + 3D composite), a one-line fact, and a small quiz question.
- **Interactions:**
  - **Quiz challenge:** 3–5 multiple-choice questions drawn from the exhibits actually visited, immediate feedback animation.
  - **Digital badge collection:** unlockable badges (e.g., "Metallurgy Master", "Royal Historian") displayed as a shelf grid, shareable as an image card.
  - **Share/Export:** "Save my tour" button generates a shareable link/QR + downloadable image collage, plus an optional **"Email me my recap"** field (no login wall required — session-token based).

---

## 3. Feature Matrix & Real-World Edge Case Handling Table

| Feature | User Benefit | API & Tech Implementation | Edge Case Handling |
|---|---|---|---|
| Adaptive Itinerary Planner | Personalized route matching time/interests/mobility | Client wizard → constraint-solver (weighted graph traversal) over exhibit metadata + live crowd feed | No crowd-sensor venue → falls back to static historical average dwell times; scholar mode allows "no time limit" unbounded graph walk |
| Indoor Live Navigation | No more wandering lost in galleries | BLE beacon/Wi-Fi RTT triangulation, SVG floor map | No beacons installed → QR checkpoint self check-in at each doorway; GPS-denied indoor fallback gracefully degrades to manual stop list |
| Camera AI Vision Scanner | Instant artifact ID, zero typing | Gemini Flash vision → structured JSON | Low light → client-side brightness heuristic prompts "try more light" before spending an API call; crowd occlusion/no match → QR/NFC manual selection; confidence < 0.85 → fallback UI instead of wrong ID |
| 3D WebGL Hotspot Inspection | Deep-dive material/craft/usage info visually | `.glb` + Draco/KTX2 compression, model-viewer/Three.js | Low-end device/older phone → auto-downgrade to compressed low-poly LOD variant; slow network → progressive mesh streaming with a low-res placeholder shown instantly |
| Exploded View / Layer Isolation | Understand construction (blade vs sheath) | Separate mesh nodes + GSAP transform tween or morph targets | Device with no WebGL2 → falls back to a pre-rendered layer-separation image sequence instead of live 3D |
| Multi-Sensory Audio/Haptics | Playful, memorable tactile learning | Web Audio API synth + AnalyserNode pitch detection, Navigator vibrate | Noisy museum ambient sound → mic gain normalization + noise gate before pitch detection; haptics unsupported (iOS Safari limits) → visual pulse animation substitutes for vibration |
| Voice Persona Engine | Tailored storytelling depth per visitor type | Groq Llama 3.3 70B, persona-specific system prompts, ElevenLabs voice IDs | Kids vs scholar tone auto-set from party type in planner but always manually overridable; inappropriate/off-topic question → persona politely redirects to exhibit context |
| Voice Q&A (STT→LLM→TTS) | Ask anything, hands-free, in natural language | Groq Whisper-large-v3-turbo → Groq Llama 3.3 → ElevenLabs TTS | Noisy environment → tap-and-hold walkie-talkie mic reduces false triggers + Whisper's built-in noise robustness; ElevenLabs quota/network failure → instant fallback to `window.speechSynthesis`; offline → cached pre-written persona scripts read via browser TTS |
| Post-Tour Memory Deck | Souvenir + reinforced learning + shareability | Client-side canvas compositing (photo + 3D snapshot), session-token based storage (no login) | User skipped exhibits → recap deck only includes visited stops; low storage device → recap images compressed/streamed rather than stored locally |

---

## 4. Technical API Integration Blueprint

### 4.1 Gemini Flash — Vision JSON (Exhibit Identification)

**Client-side capture & call:**
```javascript
async function scanArtifact(base64Frame) {
  const res = await fetch("/api/vision-scan", { // BFF proxy, hides Gemini key
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Frame })
  });
  return await res.json(); // { exhibit_id, confidence, material_guess }
}
```

**Edge function → Gemini call (system prompt forces strict JSON):**
```javascript
const geminiPayload = {
  contents: [{
    parts: [
      { text: SYSTEM_PROMPT_VISION },
      { inlineData: { mimeType: "image/jpeg", data: base64Frame } }
    ]
  }],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        exhibit_id: { type: "string" },
        confidence: { type: "number" },
        material_guess: { type: "string" }
      },
      required: ["exhibit_id", "confidence"]
    }
  }
};
```

```
SYSTEM_PROMPT_VISION =
"You are a museum artifact classifier for an Ethiopian history museum.
Given an image frame, identify the closest matching exhibit from this
known catalog: [shotel_sword, wanza_drum, embilta_horn, meleket_horn, ...].
Respond ONLY with the JSON schema provided. If no confident match exists,
set exhibit_id to 'unknown' and confidence below 0.5. Never include any
text outside the JSON object."
```

### 4.2 Groq Llama 3.3 70B — Persona-Conditioned RAG Response

```javascript
const personaPrompts = {
  kids: "You are a fun, energetic museum guide for children aged 6-12. Use simple words, playful analogies, and light humor. Keep answers under 60 words.",
  scholar: "You are an academic museum historian. Provide precise, well-sourced, technically rigorous explanations with correct historical terminology.",
  royal: "You are speaking in first-person as a historical Ethiopian royal figure connected to this artifact. Stay fully in character, using period-appropriate tone."
};

async function askGuide(transcript, exhibitContext, persona) {
  const systemPrompt = `${personaPrompts[persona]}
Exhibit context (ground your answer in this, do not invent facts):
${JSON.stringify(exhibitContext)}`;

  const stream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript }
      ],
      stream: true
    })
  });
  return stream; // consumed as SSE chunks, tokens piped straight to ElevenLabs streaming TTS
}
```

### 4.3 Groq Whisper — Speech-to-Text

```javascript
async function transcribeAudio(blob) {
  const form = new FormData();
  form.append("file", blob, "speech.webm");
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${GROQ_KEY}` },
    body: form
  });
  return (await res.json()).text;
}
```

### 4.4 Web Audio Pitch Detection (Wind Instrument Simulation)

```javascript
function startBreathDetection(stream, onPitchAmplitude) {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);

  function loop() {
    analyser.getFloatTimeDomainData(buffer);
    const amplitude = Math.sqrt(buffer.reduce((s, v) => s + v * v, 0) / buffer.length);
    const pitch = autoCorrelate(buffer, ctx.sampleRate); // custom autocorrelation fn
    onPitchAmplitude({ amplitude, pitch });
    requestAnimationFrame(loop);
  }
  loop();
}
```

### 4.5 ElevenLabs Streaming TTS with Browser Fallback

```javascript
async function speak(text, voiceId) {
  try {
    const res = await fetch(`/api/tts-stream`, { // BFF proxy hides ElevenLabs key
      method: "POST",
      body: JSON.stringify({ text, voiceId })
    });
    const audio = new Audio(URL.createObjectURL(await res.blob()));
    audio.play();
  } catch (e) {
    // Offline / quota fallback
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  }
}
```

---

## 5. Hackathon Demo Strategy & MVP Scope

### 5.1 What to Build for the Live Demo (Must-Have MVP)
- **1 fully working scan-to-3D loop:** a single hero artifact (the Shotel sword is ideal — visually striking, easy story) with Gemini Flash scan → glb load → hotspot tabs, demoed live on a real phone camera, not a video recording.
- **1 fully working voice Q&A round-trip:** Whisper → Llama (one persona, e.g., Kids Explorer, since it's the most demo-charming) → ElevenLabs playback, pre-tested on venue Wi-Fi or a hotspot to avoid live-network embarrassment.
- **1 sensory interaction:** the drum-tap Web Audio + haptic demo — highly tactile and visually impressive to judges in 15 seconds.
- **Itinerary planner:** fully clickable UI with 2–3 pre-canned realistic routes (doesn't need live crowd-sensor data — can be simulated/randomized convincingly).
- **Post-tour recap screen:** pre-populated with the demo session's actual visited exhibit for a satisfying "closing loop" moment.

### 5.2 What to Fake or Pre-Bake (Smart Shortcuts, Not Lies)
- **Crowd-density feed:** simulate with randomized/scripted values rather than real IoT sensors — say clearly in the pitch "designed to integrate with venue people-counters; simulated here for demo."
- **Indoor positioning (BLE/Wi-Fi RTT):** hardcode a walking path with manual "I'm here" QR check-ins rather than building real triangulation — perfectly acceptable and expected at hackathon scale.
- **Full exhibit catalog:** only fully populate 3–5 artifacts with real glb models + hotspot content; everything else can show a graceful "Coming soon to full catalog" card if scanned.
- **Exploded-view animation:** pre-author the separated mesh positions for just the hero artifact rather than a generic runtime algorithm.

### 5.3 What to Present as Future Roadmap (Slide, Not Code)
- Full accessibility-certified route engine with real elevator/ramp sensor integration.
- Multi-language persona voices (Amharic-native ElevenLabs voice cloning).
- Offline-first full museum download for zero-connectivity rural heritage sites.
- Server-side RAG over a full museum archive/curator knowledge base (currently using lightweight per-exhibit JSON context).
- Social/multiplayer tour mode (families splitting up, syncing recap decks).
- AR wayfinding overlays (arrows rendered directly in camera view via WebXR hit-testing) beyond the current 2D map.

### 5.4 Judging-Moment Narrative Arc
1. Open with the *problem*: static museum labels fail tourists, kids, and scholars alike.
2. Live-scan the Shotel sword on stage — instant "wow" via the 3D model appearing in hand.
3. Ask it a voice question in Kids mode, then switch persona live to Royal mode with the same question — show the tone shift.
4. Tap the drum in the sensory hub for a tactile/audio payoff.
5. Close on the recap deck with the actual just-completed demo tour and a badge unlock — ties the full loop together and signals product completeness beyond a tech demo.
