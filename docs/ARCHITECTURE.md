# Adwa Lens — Architecture Reference (for AI agents)

This file is the canonical reference for the system architecture, screen
walkthrough, and API integration blueprint. Every route, hook, and
component in this repo is commented with a `[N]` tag that maps back to the
"End-to-End Data Flow — Scan to Speech Pipeline" steps below. When adding
new AI-pipeline code, keep using this numbering convention so the codebase
stays traceable to spec.

## Data Flow — Scan to Speech
1. Camera frame capture (throttled, downscaled, base64 JPEG)
2. Gemini 2.0 Flash Vision call → strict JSON (`exhibit_id`, `confidence`)
3. Exhibit metadata lookup (IndexedDB / static JSON)
4. 3D model load (model-viewer / WebXR, Draco + KTX2)
5. Voice Q&A loop: Whisper STT → Llama 3.3 70B (persona RAG) → ElevenLabs
   streaming TTS (fallback: `window.speechSynthesis`)
6. Audio playback + haptic sync (`navigator.vibrate`, captions)

## Offline / Degraded-Network Contingency
- Online (full): full pipeline
- Online (throttled): cached glb + text-only Llama response, TTS skipped
- Offline: Service Worker serves top-20 pre-cached exhibits + static
  persona scripts read via browser TTS

## Screens (8 total)
1. Landing / Onboarding
2. Adaptive AI Itinerary Planner
3. Indoor Mapping & Live Navigation
4. Camera AI Vision Scanner
5. 3D WebGL Inspection & Deep Hotspot Hub
6. Multi-Sensory Audio & Haptic Interaction (instruments only)
7. Dynamic Voice AI Tour Guide / Q&A
8. Post-Tour Memory Deck & Engagement

## Design System
Imperial Gold `#D4AF37`, Adwa Emerald `#009A44`, Adwa Crimson `#E00000`,
Obsidian `#120E0C`, Wanza Wood `#3E2723`, Parchment `#F4E9D8`. Warm
metallic glassmorphism overlays, cultural geometry accents, no generic
dark/grey theming.

For the full narrative walkthrough, feature matrix, and hackathon demo
strategy, see the original architecture specification circulated with this
repository.
