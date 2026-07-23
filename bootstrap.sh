#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Adwa Lens — AI-Powered WebAR Museum Companion
# One-shot project bootstrap script
# =============================================================================

# Designed to run in a completely empty folder: it creates the
# frontend/, backend/, shared/, docs/ layout from scratch and populates it.
# It is also idempotent — if those directories already exist (e.g. you're
# re-running after a partial run), it will not delete or overwrite anything
# outside of the files this script itself manages.
REPO_ROOT="$(pwd)"
echo "==> Bootstrapping Adwa Lens into ${REPO_ROOT} ..."

if [ -n "$(ls -A . 2>/dev/null)" ]; then
  echo "==> Note: this folder is not empty. Existing files will be left alone;"
  echo "    only frontend/, backend/, shared/, docs/ (and the root config files"
  echo "    below) will be created or added to."
fi

echo "==> Creating top-level frontend/, backend/, shared/, docs/ ..."
mkdir -p frontend backend shared docs

# -----------------------------------------------------------------------------
# Directory tree (created *inside* frontend/ and backend/)
# -----------------------------------------------------------------------------
echo "==> Creating subdirectories inside frontend/ and backend/ ..."
mkdir -p \
  frontend/public/models \
  frontend/public/audio/persona-scripts \
  frontend/public/icons \
  frontend/public/exhibits \
  frontend/src/components/screens \
  frontend/src/components/ui \
  frontend/src/components/ar \
  frontend/src/hooks \
  frontend/src/stores \
  frontend/src/lib \
  frontend/src/personas \
  frontend/src/styles \
  backend/routes \
  backend/lib \
  shared/scripts

# =============================================================================
# ROOT ORCHESTRATION CONFIG (thin — only wires frontend/ and backend/ together)
# =============================================================================

cat << 'EOF' > package.json
{
  "name": "adwa-lens",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev:frontend": "npm --prefix frontend run dev",
    "dev:backend": "npm --prefix backend run dev",
    "dev:all": "concurrently \"npm:dev:frontend\" \"npm:dev:backend\"",
    "build": "npm --prefix frontend run build",
    "install:all": "npm --prefix frontend install && npm --prefix backend install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF

# -----------------------------------------------------------------------------
# frontend/ package.json — client-only deps, all commands run from frontend/
# -----------------------------------------------------------------------------
cat << 'EOF' > frontend/package.json
{
  "name": "adwa-lens-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx"
  },
  "dependencies": {
    "@google/model-viewer": "^3.5.0",
    "zustand": "^4.5.2",
    "three": "^0.160.0",
    "gsap": "^3.12.5",
    "idb-keyval": "^6.2.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.2.0"
  }
}
EOF

# -----------------------------------------------------------------------------
# backend/ package.json — BFF-only deps, all commands run from backend/
# -----------------------------------------------------------------------------
cat << 'EOF' > backend/package.json
{
  "name": "adwa-lens-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node index.js"
  },
  "dependencies": {
    "fastify": "^4.28.1",
    "@fastify/cors": "^9.0.1",
    "@fastify/static": "^7.0.4",
    "node-fetch": "^3.3.2",
    "dotenv": "^16.4.5"
  }
}
EOF

cat << 'EOF' > frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true
      }
    }
  }
});
EOF

cat << 'EOF' > frontend/postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
EOF

# -----------------------------------------------------------------------------
# Tailwind Theme — Adwa Museum Design System
# -----------------------------------------------------------------------------
cat << 'EOF' > frontend/tailwind.config.js
/** Adwa Lens Design System
 *  Inspired by the Victory of Adwa & Ethiopian heritage motifs.
 *  NOT a generic dark/grey theme — warm metallic + earthen palette.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "imperial-gold": {
          DEFAULT: "#D4AF37",
          light: "#E9CC6B",
          dark: "#9C7F22"
        },
        "adwa-emerald": {
          DEFAULT: "#009A44",
          light: "#2FBE68",
          dark: "#00622C"
        },
        "adwa-crimson": {
          DEFAULT: "#E00000",
          light: "#FF3B3B",
          dark: "#960000"
        },
        "obsidian": {
          DEFAULT: "#120E0C",
          raised: "#1C1613",
          overlay: "#241C18"
        },
        "wanza-wood": {
          DEFAULT: "#3E2723",
          light: "#5D4037"
        },
        "parchment": "#F4E9D8"
      },
      fontFamily: {
        display: ["'Noto Serif Ethiopic'", "'Playfair Display'", "serif"],
        body: ["'Inter'", "'Noto Sans Ethiopic'", "sans-serif"]
      },
      backgroundImage: {
        "adwa-geometry":
          "radial-gradient(circle at 20% 20%, rgba(212,175,55,0.10) 0%, transparent 45%), radial-gradient(circle at 80% 0%, rgba(0,154,68,0.10) 0%, transparent 40%), radial-gradient(circle at 50% 100%, rgba(224,0,0,0.08) 0%, transparent 45%)",
        "metallic-glass":
          "linear-gradient(135deg, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.02) 60%)"
      },
      boxShadow: {
        "gold-glow": "0 0 24px rgba(212,175,55,0.35)",
        "emerald-glow": "0 0 24px rgba(0,154,68,0.30)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};
EOF

cat << 'EOF' > backend/.env.example
# ---- Gemini Vision (exhibit ID) ----
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# ---- Groq (Whisper STT + Llama persona RAG) ----
GROQ_API_KEY=your_groq_api_key_here
GROQ_STT_MODEL=whisper-large-v3-turbo
GROQ_LLM_MODEL=llama-3.3-70b-versatile

# ---- ElevenLabs (streaming TTS) ----
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID_KIDS=voice_id_kids
ELEVENLABS_VOICE_ID_SCHOLAR=voice_id_scholar
ELEVENLABS_VOICE_ID_ROYAL=voice_id_royal

# ---- Server ----
PORT=8787
CORS_ORIGIN=http://localhost:5173

# ---- Confidence thresholds ----
VISION_CONFIDENCE_THRESHOLD=0.85
EOF

cp backend/.env.example backend/.env

cat << 'EOF' > .gitignore
node_modules
frontend/dist
backend/.env
*.local
.DS_Store
frontend/public/models/*.glb.tmp
EOF

cat << 'EOF' > frontend/index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Adwa Lens — Your museum, brought to life</title>
    <meta name="theme-color" content="#120E0C" />
    <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
  </head>
  <body class="bg-obsidian text-parchment">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# =============================================================================
# DOCKER
# =============================================================================

cat << 'EOF' > Dockerfile
# ---- Base — installs root (orchestration), frontend/, and backend/ deps ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN npm install
RUN npm --prefix frontend install
RUN npm --prefix backend install

# ---- Dev image (client + server via concurrently, respects frontend/backend/) ----
FROM base AS dev
COPY . .
EXPOSE 5173 8787
CMD ["npm", "run", "dev:all"]

# ---- Build (client only, output stays inside frontend/dist) ----
FROM base AS build
COPY . .
RUN npm run build

# ---- Production (static client served by fastify from backend/) ----
FROM node:20-alpine AS prod
WORKDIR /app
COPY backend/package.json ./backend/package.json
RUN npm --prefix backend install --omit=dev
COPY backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist
COPY frontend/public ./frontend/public
EXPOSE 8787
ENV NODE_ENV=production
CMD ["node", "backend/index.js"]
EOF

cat << 'EOF' > docker-compose.yml
version: "3.9"

services:
  adwa-lens:
    build:
      context: .
      target: dev
    container_name: adwa-lens-dev
    ports:
      - "5173:5173"   # Vite client
      - "8787:8787"   # Fastify BFF (Gemini/Groq/ElevenLabs proxy)
    env_file:
      - backend/.env
    volumes:
      - .:/app
      - /app/node_modules
      - /app/frontend/node_modules
      - /app/backend/node_modules
    command: ["npm", "run", "dev:all"]
EOF

# =============================================================================
# SERVER (BFF — hides API keys, proxies Gemini / Groq / ElevenLabs)
# =============================================================================

cat << 'EOF' > backend/index.js
import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import visionScanRoute from "./routes/vision-scan.js";
import sttRoute from "./routes/stt.js";
import askGuideRoute from "./routes/ask-guide.js";
import ttsStreamRoute from "./routes/tts-stream.js";

dotenv.config();

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173"
});

// Simple per-session rate limiting could be added here (Section: EDGE / SERVERLESS GATEWAY)
app.register(visionScanRoute, { prefix: "/api" });
app.register(sttRoute, { prefix: "/api" });
app.register(askGuideRoute, { prefix: "/api" });
app.register(ttsStreamRoute, { prefix: "/api" });

app.get("/api/health", async () => ({ status: "ok", service: "adwa-lens-bff" }));

const port = process.env.PORT || 8787;
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`Adwa Lens BFF listening on :${port}`);
});
EOF

cat << 'EOF' > backend/lib/errors.js
/**
 * Normalizes error contracts across all AI provider proxies so the
 * client never has to branch on provider-specific error shapes.
 */
export function normalizeError(res, err) {
  const status = err.status || 502;
  return res.code(status).send({
    error: true,
    message: err.message || "Upstream AI provider error",
    provider: err.provider || "unknown",
    retryable: status >= 500
  });
}
EOF

cat << 'EOF' > backend/routes/vision-scan.js
/**
 * [1]-[2] CAMERA FRAME CAPTURE -> GEMINI FLASH VISION CALL
 * Client sends a base64 JPEG frame. This proxy forces strict JSON schema
 * output from Gemini so the client can trust exhibit_id/confidence shape.
 */
import { normalizeError } from "../lib/errors.js";

const SYSTEM_PROMPT_VISION = `You are a museum artifact classifier for an Ethiopian history museum.
Given an image frame, identify the closest matching exhibit from this
known catalog: [shotel_sword, wanza_drum, embilta_horn, meleket_horn, adwa_war_map, royal_regalia].
Respond ONLY with the JSON schema provided. If no confident match exists,
set exhibit_id to 'unknown' and confidence below 0.5. Never include any
text outside the JSON object.`;

export default async function visionScanRoute(app) {
  app.post("/vision-scan", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.code(400).send({ error: true, message: "Missing 'image' (base64 JPEG)" });

      const apiKey = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

      const payload = {
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT_VISION },
              { inlineData: { mimeType: "image/jpeg", data: image } }
            ]
          }
        ],
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

      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!upstream.ok) {
        const errText = await upstream.text();
        throw { status: upstream.status, message: errText, provider: "gemini" };
      }

      const data = await upstream.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      const parsed = JSON.parse(text);

      const threshold = parseFloat(process.env.VISION_CONFIDENCE_THRESHOLD || "0.85");
      return res.send({ ...parsed, threshold, aboveThreshold: parsed.confidence >= threshold });
    } catch (err) {
      return normalizeError(res, err);
    }
  });
}
EOF

cat << 'EOF' > backend/routes/stt.js
/**
 * [5] VOICE Q&A LOOP — Groq Whisper-large-v3-turbo speech-to-text.
 * Accepts a multipart audio blob and returns { text }.
 */
import { normalizeError } from "../lib/errors.js";

export default async function sttRoute(app) {
  app.post("/stt", async (req, res) => {
    try {
      const data = await req.file();
      if (!data) return res.code(400).send({ error: true, message: "Missing audio file" });

      const form = new FormData();
      const buffer = await data.toBuffer();
      form.append("file", new Blob([buffer]), "speech.webm");
      form.append("model", process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo");
      form.append("response_format", "json");

      const upstream = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: form
      });

      if (!upstream.ok) {
        const errText = await upstream.text();
        throw { status: upstream.status, message: errText, provider: "groq-whisper" };
      }

      const json = await upstream.json();
      return res.send({ text: json.text });
    } catch (err) {
      return normalizeError(res, err);
    }
  });
}
EOF

cat << 'EOF' > backend/routes/ask-guide.js
/**
 * [5] Persona-conditioned RAG response via Groq Llama 3.3 70B.
 * Streams SSE chunks straight through to the client, which pipes
 * tokens into ElevenLabs streaming TTS as they arrive.
 */
import { normalizeError } from "../lib/errors.js";
import { PERSONA_PROMPTS } from "../lib/personas.js";

export default async function askGuideRoute(app) {
  app.post("/ask-guide", async (req, res) => {
    try {
      const { transcript, exhibitContext, persona = "scholar" } = req.body;
      if (!transcript) return res.code(400).send({ error: true, message: "Missing 'transcript'" });

      const systemPrompt = `${PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.scholar}
Exhibit context (ground your answer in this, do not invent facts):
${JSON.stringify(exhibitContext || {})}
If the visitor asks something unrelated or inappropriate, politely redirect
back to the exhibit's history, material, or cultural significance.`;

      const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.GROQ_LLM_MODEL || "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcript }
          ],
          stream: true
        })
      });

      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text();
        throw { status: upstream.status, message: errText, provider: "groq-llama" };
      }

      res.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });

      for await (const chunk of upstream.body) {
        res.raw.write(chunk);
      }
      res.raw.end();
    } catch (err) {
      return normalizeError(res, err);
    }
  });
}
EOF

cat << 'EOF' > backend/lib/personas.js
/**
 * Three narration personas selectable live from Screen 7 (Voice AI Tour Guide).
 * Kept server-side so voice IDs / prompt tuning can change without a client redeploy.
 */
export const PERSONA_PROMPTS = {
  kids: "You are a fun, energetic museum guide for children aged 6-12. Use simple words, playful analogies, and light humor. Keep answers under 60 words.",
  scholar: "You are an academic museum historian. Provide precise, well-sourced, technically rigorous explanations with correct historical terminology.",
  royal: "You are speaking in first-person as a historical Ethiopian royal figure connected to this artifact. Stay fully in character, using period-appropriate tone."
};

export const PERSONA_VOICE_IDS = {
  kids: process.env.ELEVENLABS_VOICE_ID_KIDS,
  scholar: process.env.ELEVENLABS_VOICE_ID_SCHOLAR,
  royal: process.env.ELEVENLABS_VOICE_ID_ROYAL
};
EOF

cat << 'EOF' > backend/routes/tts-stream.js
/**
 * ElevenLabs streaming TTS proxy. Client falls back to
 * window.speechSynthesis if this call fails (offline/quota).
 */
import { normalizeError } from "../lib/errors.js";
import { PERSONA_VOICE_IDS } from "../lib/personas.js";

export default async function ttsStreamRoute(app) {
  app.post("/tts-stream", async (req, res) => {
    try {
      const { text, persona = "scholar", voiceId } = req.body;
      if (!text) return res.code(400).send({ error: true, message: "Missing 'text'" });

      const resolvedVoiceId = voiceId || PERSONA_VOICE_IDS[persona] || PERSONA_VOICE_IDS.scholar;

      const upstream = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}/stream`,
        {
          method: "POST",
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_turbo_v2",
            voice_settings: { stability: 0.4, similarity_boost: 0.8 }
          })
        }
      );

      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text();
        throw { status: upstream.status, message: errText, provider: "elevenlabs" };
      }

      res.header("Content-Type", "audio/mpeg");
      for await (const chunk of upstream.body) {
        res.raw.write(chunk);
      }
      res.raw.end();
    } catch (err) {
      return normalizeError(res, err);
    }
  });
}
EOF

# =============================================================================
# CLIENT — Zustand stores
# =============================================================================

cat << 'EOF' > frontend/src/stores/useSessionStore.js
import { create } from "zustand";

/**
 * App State Manager — session context, tour history, offline queue.
 * (mirrors "App State Manager (Zustand/Redux)" in the architecture diagram)
 */
export const useSessionStore = create((set, get) => ({
  language: "en", // en | am | ti
  partyType: null, // individual | family | scholar
  timeBudgetMinutes: null, // 20 | 45 | 120 | null (no limit)
  interests: [],
  accessibilityOnly: false,

  persona: "scholar", // kids | scholar | royal
  itinerary: [],
  currentStopIndex: 0,
  visitedExhibitIds: [],

  networkStatus: "online", // online | throttled | offline

  setLanguage: (language) => set({ language }),
  setOnboarding: (partial) => set(partial),
  setPersona: (persona) => set({ persona }),
  setItinerary: (itinerary) => set({ itinerary, currentStopIndex: 0 }),
  markVisited: (exhibitId) =>
    set((s) => ({
      visitedExhibitIds: s.visitedExhibitIds.includes(exhibitId)
        ? s.visitedExhibitIds
        : [...s.visitedExhibitIds, exhibitId]
    })),
  setNetworkStatus: (networkStatus) => set({ networkStatus }),
  resetSession: () =>
    set({
      partyType: null,
      timeBudgetMinutes: null,
      interests: [],
      accessibilityOnly: false,
      itinerary: [],
      currentStopIndex: 0,
      visitedExhibitIds: []
    })
}));
EOF

cat << 'EOF' > frontend/src/stores/useExhibitStore.js
import { create } from "zustand";
import { get as idbGet, set as idbSet } from "idb-keyval";

/**
 * Exhibit metadata cache — IndexedDB-backed for offline glb/JSON access.
 * (mirrors "Offline queue + IndexedDB cache" in the architecture diagram)
 */
export const useExhibitStore = create((set, get) => ({
  activeExhibit: null, // { exhibit_id, glb_url, hotspot_json, audio_profile, persona_scripts }
  isLoading: false,
  scanError: null,

  async loadExhibit(exhibitId) {
    set({ isLoading: true, scanError: null });
    try {
      const cached = await idbGet(`exhibit:${exhibitId}`);
      if (cached) {
        set({ activeExhibit: cached, isLoading: false });
        return cached;
      }
      const res = await fetch(`/exhibits/${exhibitId}.json`);
      if (!res.ok) throw new Error("Exhibit metadata not found");
      const data = await res.json();
      await idbSet(`exhibit:${exhibitId}`, data);
      set({ activeExhibit: data, isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false, scanError: err.message });
      return null;
    }
  },

  clearActiveExhibit: () => set({ activeExhibit: null })
}));
EOF

# =============================================================================
# CLIENT — hooks
# =============================================================================

cat << 'EOF' > frontend/src/hooks/useCameraScanner.js
import { useCallback, useRef, useState } from "react";

/**
 * [1] CAMERA FRAME CAPTURE
 * Throttled to 1 capture / 2s, downscaled to 512px, base64 JPEG,
 * plus a cheap client-side brightness/blur heuristic so we don't
 * waste a Gemini call on a bad frame (Screen 4 hint text).
 */
export function useCameraScanner({ onFrameReady, intervalMs = 2000, targetSize = 512 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement("canvas"));
  const [hint, setHint] = useState(null); // "move_closer" | "hold_steady" | "more_light" | null

  const startStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    return stream;
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = canvasRef.current;
    canvas.width = targetSize;
    canvas.height = targetSize * (video.videoHeight / video.videoWidth || 1);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const brightness = estimateBrightness(imageData.data);

    if (brightness < 60) {
      setHint("more_light");
      return null;
    }
    setHint(null);

    const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
    return base64;
  }, [targetSize]);

  const startLoop = useCallback(() => {
    const id = setInterval(() => {
      const frame = captureFrame();
      if (frame) onFrameReady(frame);
    }, intervalMs);
    return () => clearInterval(id);
  }, [captureFrame, intervalMs, onFrameReady]);

  return { videoRef, hint, startStream, startLoop, captureFrame };
}

function estimateBrightness(pixels) {
  let sum = 0;
  const sampleStep = 40; // sparse sample for speed
  let count = 0;
  for (let i = 0; i < pixels.length; i += sampleStep) {
    sum += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    count++;
  }
  return sum / count;
}
EOF

cat << 'EOF' > frontend/src/hooks/useVoiceGuide.js
import { useCallback, useRef, useState } from "react";
import { useSessionStore } from "../stores/useSessionStore";

/**
 * [5] VOICE Q&A LOOP orchestration:
 * Mic -> /api/stt -> /api/ask-guide (SSE) -> /api/tts-stream (audio)
 * with window.speechSynthesis fallback on TTS failure.
 */
export function useVoiceGuide(exhibitContext) {
  const persona = useSessionStore((s) => s.persona);
  const [status, setStatus] = useState("idle"); // idle | listening | thinking | speaking
  const [captions, setCaptions] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startListening = useCallback(async () => {
    setStatus("listening");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.start();
    mediaRecorderRef.current = recorder;
  }, []);

  const stopListeningAndSend = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    const stopped = new Promise((resolve) => {
      recorder.onstop = resolve;
    });
    recorder.stop();
    await stopped;

    setStatus("thinking");
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });

    const sttForm = new FormData();
    sttForm.append("file", blob, "speech.webm");
    const sttRes = await fetch("/api/stt", { method: "POST", body: sttForm });
    const { text: transcript } = await sttRes.json();

    const guideRes = await fetch("/api/ask-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, exhibitContext, persona })
    });

    const reader = guideRes.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      fullText += chunk;
      setCaptions(fullText);
    }

    setStatus("speaking");
    await speak(fullText, persona);
    setStatus("idle");
  }, [exhibitContext, persona]);

  return { status, captions, startListening, stopListeningAndSend };
}

async function speak(text, persona) {
  try {
    const res = await fetch("/api/tts-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, persona })
    });
    if (!res.ok) throw new Error("TTS upstream failed");
    const audio = new Audio(URL.createObjectURL(await res.blob()));
    await audio.play();
  } catch (e) {
    // Offline / quota fallback -> browser speech synthesis
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  }
}
EOF

cat << 'EOF' > frontend/src/hooks/useNetworkStatus.js
import { useEffect } from "react";
import { useSessionStore } from "../stores/useSessionStore";

/**
 * [Section 1.3] Offline / Degraded-Network Contingency Flow.
 * Periodic ping + navigator.onLine to classify: online / throttled / offline.
 */
export function useNetworkStatus() {
  const setNetworkStatus = useSessionStore((s) => s.setNetworkStatus);

  useEffect(() => {
    async function check() {
      if (!navigator.onLine) {
        setNetworkStatus("offline");
        return;
      }
      const start = performance.now();
      try {
        await fetch("/api/health", { cache: "no-store" });
        const elapsed = performance.now() - start;
        setNetworkStatus(elapsed > 1200 ? "throttled" : "online");
      } catch {
        setNetworkStatus("offline");
      }
    }
    check();
    const id = setInterval(check, 15000);
    window.addEventListener("online", check);
    window.addEventListener("offline", check);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", check);
      window.removeEventListener("offline", check);
    };
  }, [setNetworkStatus]);
}
EOF

# =============================================================================
# CLIENT — lib
# =============================================================================

cat << 'EOF' > frontend/src/lib/pitchDetection.js
/**
 * [Screen 6] Wind instrument breath detection —
 * autocorrelation-based pitch tracking off an AnalyserNode buffer.
 */
export function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  const rms = Math.sqrt(buffer.reduce((s, v) => s + v * v, 0) / SIZE);
  if (rms < 0.01) return -1; // too quiet, treat as silence

  let bestOffset = -1;
  let bestCorrelation = 0;
  const MIN_SAMPLES = Math.floor(sampleRate / 1000);
  const MAX_SAMPLES = Math.floor(sampleRate / 60);

  for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;
    for (let i = 0; i < SIZE - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    correlation = correlation / (SIZE - offset);
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation > 0.01 && bestOffset > 0) {
    return sampleRate / bestOffset;
  }
  return -1;
}

export function startBreathDetection(stream, onPitchAmplitude) {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  let rafId;

  function loop() {
    analyser.getFloatTimeDomainData(buffer);
    const amplitude = Math.sqrt(buffer.reduce((s, v) => s + v * v, 0) / buffer.length);
    const pitch = autoCorrelate(buffer, ctx.sampleRate);
    onPitchAmplitude({ amplitude, pitch });
    rafId = requestAnimationFrame(loop);
  }
  loop();

  return () => {
    cancelAnimationFrame(rafId);
    ctx.close();
  };
}
EOF

cat << 'EOF' > frontend/src/lib/haptics.js
/**
 * navigator.vibrate() wrapper with a visual-pulse fallback for
 * platforms without haptics support (iOS Safari).
 */
export function pulse(patternMs = 40, onNoSupport) {
  if (navigator.vibrate) {
    navigator.vibrate(patternMs);
  } else if (onNoSupport) {
    onNoSupport(); // caller triggers a CSS pulse animation instead
  }
}
EOF

cat << 'EOF' > frontend/src/personas/personas.js
/**
 * Client-side mirror of backend/lib/personas.js display metadata
 * (icons/labels only — prompts stay server-side).
 */
export const PERSONAS = [
  { id: "kids", label: "Kids Explorer", icon: "🧒" },
  { id: "scholar", label: "History Scholar", icon: "📜" },
  { id: "royal", label: "Royal Roleplay", icon: "👑" }
];
EOF

# =============================================================================
# CLIENT — styles
# =============================================================================

cat << 'EOF' > frontend/src/styles/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body, #root {
    height: 100%;
  }
  body {
    @apply bg-obsidian bg-adwa-geometry font-body text-parchment antialiased;
  }
  h1, h2, h3 {
    @apply font-display;
  }
}

@layer components {
  /* Warm metallic glassmorphism overlay — used for chat/voice drawers, bottom sheets */
  .adwa-glass {
    @apply bg-metallic-glass backdrop-blur-xl border border-imperial-gold/20 rounded-xl2 shadow-gold-glow;
  }

  .adwa-card {
    @apply bg-obsidian-raised/80 border border-wanza-wood rounded-xl2 p-4;
  }

  .adwa-btn-primary {
    @apply bg-imperial-gold text-obsidian font-semibold rounded-full px-6 py-3
           shadow-gold-glow active:scale-95 transition-transform;
  }

  .adwa-btn-secondary {
    @apply bg-transparent border border-adwa-emerald text-adwa-emerald font-semibold
           rounded-full px-6 py-3 active:scale-95 transition-transform;
  }

  .adwa-chip {
    @apply bg-obsidian-overlay border border-imperial-gold/30 rounded-full px-4 py-2 text-sm;
  }
  .adwa-chip[data-active="true"] {
    @apply bg-imperial-gold/20 border-imperial-gold text-imperial-gold-light;
  }

  /* Cultural geometry accent — subtle triangular motif divider */
  .adwa-divider {
    height: 3px;
    background: linear-gradient(90deg, #D4AF37 0%, #009A44 50%, #E00000 100%);
    border-radius: 999px;
  }
}
EOF

# =============================================================================
# CLIENT — entry points
# =============================================================================

cat << 'EOF' > frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat << 'EOF' > frontend/src/App.jsx
import React, { useState } from "react";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import Landing from "./components/screens/Landing.jsx";
import ItineraryPlanner from "./components/screens/ItineraryPlanner.jsx";
import LiveNavigation from "./components/screens/LiveNavigation.jsx";
import CameraScanner from "./components/screens/CameraScanner.jsx";
import InspectionHub from "./components/screens/InspectionHub.jsx";
import SensoryHub from "./components/screens/SensoryHub.jsx";
import VoiceGuideOverlay from "./components/screens/VoiceGuideOverlay.jsx";
import MemoryDeck from "./components/screens/MemoryDeck.jsx";

/**
 * Screen router — deliberately simple (no external router dep) so the
 * hackathon build stays easy for 4 parallel streams to touch without
 * merge conflicts. Swap for react-router post-hackathon if needed.
 */
const SCREENS = {
  landing: Landing,
  planner: ItineraryPlanner,
  navigation: LiveNavigation,
  scanner: CameraScanner,
  inspection: InspectionHub,
  sensory: SensoryHub,
  voiceGuide: VoiceGuideOverlay,
  memoryDeck: MemoryDeck
};

export default function App() {
  useNetworkStatus();
  const [screen, setScreen] = useState("landing");
  const ScreenComponent = SCREENS[screen] || Landing;

  return (
    <div className="min-h-screen w-full">
      <ScreenComponent navigate={setScreen} />
    </div>
  );
}
EOF

# =============================================================================
# CLIENT — UI primitives
# =============================================================================

cat << 'EOF' > frontend/src/components/ui/AdwaDivider.jsx
import React from "react";
export default function AdwaDivider({ className = "" }) {
  return <div className={`adwa-divider ${className}`} />;
}
EOF

cat << 'EOF' > frontend/src/components/ui/Chip.jsx
import React from "react";
export default function Chip({ label, active, onClick, icon }) {
  return (
    <button className="adwa-chip" data-active={active} onClick={onClick}>
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
}
EOF

cat << 'EOF' > frontend/src/components/ui/PrimaryButton.jsx
import React from "react";
export default function PrimaryButton({ children, ...props }) {
  return (
    <button className="adwa-btn-primary" {...props}>
      {children}
    </button>
  );
}
EOF

# =============================================================================
# CLIENT — Screens (one file per screen, matches the 8-screen UX walkthrough)
# =============================================================================

cat << 'EOF' > frontend/src/components/screens/Landing.jsx
import React from "react";
import PrimaryButton from "../ui/PrimaryButton.jsx";
import { useSessionStore } from "../../stores/useSessionStore";

/** Screen 1 — Landing / Onboarding */
export default function Landing({ navigate }) {
  const language = useSessionStore((s) => s.language);
  const setLanguage = useSessionStore((s) => s.setLanguage);

  return (
    <div className="relative flex flex-col items-center justify-end min-h-screen px-6 pb-16 overflow-hidden">
      <model-viewer
        src="/models/shotel_sword.glb"
        auto-rotate
        camera-controls
        disable-zoom
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          "--poster-color": "transparent"
        }}
      />

      <div className="relative z-10 text-center adwa-glass p-6 w-full max-w-md">
        <h1 className="text-4xl mb-1 text-imperial-gold">Adwa Lens</h1>
        <p className="text-parchment/80 mb-6">Your museum, brought to life.</p>

        <PrimaryButton onClick={() => navigate("planner")} className="w-full mb-3">
          Start My Tour
        </PrimaryButton>

        <button
          className="text-adwa-emerald underline text-sm"
          onClick={() => navigate("navigation")}
        >
          I have a ticket QR
        </button>

        <div className="flex justify-center gap-2 mt-6">
          {["en", "am", "ti"].map((lng) => (
            <button
              key={lng}
              onClick={() => setLanguage(lng)}
              className={`adwa-chip ${language === lng ? "border-imperial-gold" : ""}`}
              data-active={language === lng}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
EOF

cat << 'EOF' > frontend/src/components/screens/ItineraryPlanner.jsx
import React, { useState } from "react";
import Chip from "../ui/Chip.jsx";
import PrimaryButton from "../ui/PrimaryButton.jsx";
import AdwaDivider from "../ui/AdwaDivider.jsx";
import { useSessionStore } from "../../stores/useSessionStore";

const INTEREST_OPTIONS = ["War Strategy", "Metallurgy", "Royal History", "Music & Culture"];
const PARTY_OPTIONS = [
  { id: "individual", label: "Individual" },
  { id: "family", label: "Family with Kids" },
  { id: "scholar", label: "Scholar" }
];
const TIME_OPTIONS = [
  { label: "20 min", value: 20 },
  { label: "45 min", value: 45 },
  { label: "2 hrs", value: 120 },
  { label: "No limit", value: null }
];

/** Screen 2 — Adaptive AI Itinerary Planner (card-stack wizard) */
export default function ItineraryPlanner({ navigate }) {
  const [step, setStep] = useState(0);
  const setOnboarding = useSessionStore((s) => s.setOnboarding);
  const setItinerary = useSessionStore((s) => s.setItinerary);

  const [timeBudgetMinutes, setTimeBudgetMinutes] = useState(45);
  const [interests, setInterests] = useState([]);
  const [partyType, setPartyType] = useState(null);
  const [accessibilityOnly, setAccessibilityOnly] = useState(false);

  function toggleInterest(i) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  async function submitPlanner() {
    setOnboarding({ timeBudgetMinutes, interests, partyType, accessibilityOnly });

    // Behind the scenes: constraint-satisfaction over exhibit graph +
    // estimated dwell times + live crowd-density feed. Simulated for demo.
    const generated = await generateItinerary({ timeBudgetMinutes, interests, partyType, accessibilityOnly });
    setItinerary(generated);
    navigate("navigation");
  }

  const steps = [
    <TimeBudgetStep key="time" value={timeBudgetMinutes} onChange={setTimeBudgetMinutes} />,
    <InterestsStep key="interests" selected={interests} onToggle={toggleInterest} />,
    <PartyStep key="party" value={partyType} onChange={setPartyType} />,
    <AccessibilityStep key="access" value={accessibilityOnly} onChange={setAccessibilityOnly} />
  ];

  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen flex flex-col justify-between p-6">
      <div>
        <h2 className="text-2xl text-imperial-gold mb-2">Plan Your Visit</h2>
        <AdwaDivider className="mb-6" />
        {steps[step]}
      </div>

      <div className="flex justify-between mt-6">
        <button
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="text-parchment/60 disabled:opacity-30"
        >
          Back
        </button>
        <PrimaryButton
          disabled={step === 1 && interests.length === 0}
          onClick={() => (isLast ? submitPlanner() : setStep((s) => s + 1))}
        >
          {isLast ? "Generate Itinerary" : "Next"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function TimeBudgetStep({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {[20, 45, 120, null].map((v) => (
        <Chip key={v ?? "none"} label={v ? `${v} min` : "No limit"} active={value === v} onClick={() => onChange(v)} />
      ))}
    </div>
  );
}

function InterestsStep({ selected, onToggle }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {INTEREST_OPTIONS.map((i) => (
        <Chip key={i} label={i} active={selected.includes(i)} onClick={() => onToggle(i)} />
      ))}
    </div>
  );
}

function PartyStep({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {PARTY_OPTIONS.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`adwa-card text-left ${value === p.id ? "border-imperial-gold" : ""}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function AccessibilityStep({ value, onChange }) {
  return (
    <label className="flex items-center gap-3 adwa-card">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      Wheelchair / Elevator routes only
    </label>
  );
}

/**
 * Constraint-satisfaction stub. Section 5.2: crowd-density is simulated
 * for the demo; swap this for a real weighted graph traversal + live
 * IoT people-counter feed post-hackathon (see PHASES_AND_ROLES.md, Stream C).
 */
async function generateItinerary({ interests }) {
  const CATALOG = [
    { exhibit_id: "adwa_war_map", name: "Adwa War Room", minutes: 8, tags: ["War Strategy"] },
    { exhibit_id: "shotel_sword", name: "Metallurgy Hall", minutes: 12, tags: ["Metallurgy", "War Strategy"] },
    { exhibit_id: "royal_regalia", name: "Royal History Wing", minutes: 10, tags: ["Royal History"] },
    { exhibit_id: "wanza_drum", name: "Music & Culture Gallery", minutes: 9, tags: ["Music & Culture"] }
  ];
  const matched = CATALOG.filter((c) => interests.length === 0 || c.tags.some((t) => interests.includes(t)));
  return (matched.length ? matched : CATALOG).map((c, i) => ({ ...c, stopNumber: i + 1 }));
}
EOF

cat << 'EOF' > frontend/src/components/screens/LiveNavigation.jsx
import React from "react";
import PrimaryButton from "../ui/PrimaryButton.jsx";
import { useSessionStore } from "../../stores/useSessionStore";

/**
 * Screen 3 — Indoor Mapping & Live Navigation.
 * Hackathon MVP: hardcoded walking path + manual "I'm here" QR
 * check-in rather than real BLE/Wi-Fi RTT triangulation (Section 5.2).
 */
export default function LiveNavigation({ navigate }) {
  const itinerary = useSessionStore((s) => s.itinerary);
  const currentStopIndex = useSessionStore((s) => s.currentStopIndex);
  const stop = itinerary[currentStopIndex];

  return (
    <div className="min-h-screen flex flex-col p-6">
      <h2 className="text-2xl text-imperial-gold mb-4">Your Route</h2>

      <div className="adwa-card flex-1 flex items-center justify-center mb-4">
        {/* SVG 2D floor map placeholder — swap for real venue SVG (Stream C) */}
        <svg viewBox="0 0 200 200" className="w-full h-64">
          <rect x="10" y="10" width="180" height="180" rx="12" fill="none" stroke="#D4AF37" strokeWidth="1" />
          <circle cx="100" cy="150" r="6" fill="#009A44" />
          <text x="100" y="30" textAnchor="middle" fill="#F4E9D8" fontSize="10">
            {stop ? stop.name : "Museum Floor"}
          </text>
        </svg>
      </div>

      <div className="adwa-glass p-4 mb-4">
        <p className="text-sm text-parchment/70 mb-1">Next stop</p>
        <p className="text-lg">{stop ? stop.name : "No itinerary yet"}</p>
      </div>

      <PrimaryButton onClick={() => navigate("scanner")}>I'm here — Scan Exhibit</PrimaryButton>
    </div>
  );
}
EOF

cat << 'EOF' > frontend/src/components/screens/CameraScanner.jsx
import React, { useEffect, useState } from "react";
import { useCameraScanner } from "../../hooks/useCameraScanner";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { useSessionStore } from "../../stores/useSessionStore";

const HINT_TEXT = {
  more_light: "Try more light",
  move_closer: "Move closer",
  hold_steady: "Hold steady"
};

/** Screen 4 — Camera AI Vision Scanner ([1]-[2] of the data flow pipeline) */
export default function CameraScanner({ navigate }) {
  const loadExhibit = useExhibitStore((s) => s.loadExhibit);
  const markVisited = useSessionStore((s) => s.markVisited);
  const [matched, setMatched] = useState(null);
  const [scanning, setScanning] = useState(true);

  const { videoRef, hint, startStream, startLoop } = useCameraScanner({
    onFrameReady: handleFrame
  });

  async function handleFrame(base64) {
    if (!scanning) return;
    const res = await fetch("/api/vision-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 })
    });
    const data = await res.json();

    if (data.aboveThreshold && data.exhibit_id !== "unknown") {
      setScanning(false);
      const exhibit = await loadExhibit(data.exhibit_id);
      markVisited(data.exhibit_id);
      setMatched({ ...data, exhibit });
    }
  }

  useEffect(() => {
    let stopLoop = () => {};
    (async () => {
      await startStream();
      stopLoop = startLoop();
    })();
    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-screen bg-black">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />

      {!matched && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-64 h-64 border-4 border-imperial-gold rounded-xl2 shadow-gold-glow" />
          {hint && <p className="mt-4 text-parchment adwa-glass px-4 py-2">{HINT_TEXT[hint]}</p>}
          <button
            className="absolute bottom-10 adwa-btn-secondary"
            onClick={() => navigate("navigation")}
          >
            Scan QR code instead
          </button>
        </div>
      )}

      {matched && (
        <div className="absolute bottom-0 inset-x-0 adwa-glass p-6 rounded-t-xl2 rounded-b-none">
          <p className="text-imperial-gold text-lg mb-1">{matched.exhibit_id.replace(/_/g, " ")}</p>
          <p className="text-sm text-parchment/70 mb-4">{matched.material_guess}</p>
          <button className="adwa-btn-primary w-full" onClick={() => navigate("inspection")}>
            View in 3D
          </button>
        </div>
      )}
    </div>
  );
}
EOF

cat << 'EOF' > frontend/src/components/screens/InspectionHub.jsx
import React, { useState } from "react";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { PERSONAS } from "../../personas/personas";
import { useSessionStore } from "../../stores/useSessionStore";

/** Screen 5 — 3D WebGL Inspection & Deep Hotspot Hub */
export default function InspectionHub({ navigate }) {
  const exhibit = useExhibitStore((s) => s.activeExhibit);
  const persona = useSessionStore((s) => s.persona);
  const setPersona = useSessionStore((s) => s.setPersona);
  const [activeTab, setActiveTab] = useState("material");
  const [exploded, setExploded] = useState(false);

  const hotspots = exhibit?.hotspot_json ?? {};
  const isInstrument = exhibit?.category === "instrument";

  return (
    <div className="relative min-h-screen">
      <model-viewer
        src={exhibit?.glb_url || "/models/shotel_sword.glb"}
        camera-controls
        auto-rotate={!exploded}
        style={{ width: "100%", height: "70vh" }}
      >
        {/* Hotspot pins injected from hotspot_json — glowing pin-point markers */}
        {Object.entries(hotspots).map(([key, hs]) => (
          <button
            key={key}
            slot={`hotspot-${key}`}
            data-position={hs.position}
            data-normal={hs.normal}
            className="w-3 h-3 rounded-full bg-imperial-gold shadow-gold-glow"
            onClick={() => setActiveTab(hs.tab)}
          />
        ))}
      </model-viewer>

      <div className="absolute top-4 right-4 flex gap-2">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            className={`adwa-chip ${persona === p.id ? "border-imperial-gold" : ""}`}
            data-active={persona === p.id}
            onClick={() => setPersona(p.id)}
            title={p.label}
          >
            {p.icon}
          </button>
        ))}
      </div>

      <div className="absolute bottom-0 inset-x-0 adwa-glass rounded-b-none p-4">
        <div className="flex gap-4 mb-3">
          {["material", "craft", "usage"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize pb-1 border-b-2 ${
                activeTab === tab ? "border-imperial-gold text-imperial-gold" : "border-transparent"
              }`}
            >
              {tab === "craft" ? "Craft & Method" : tab === "usage" ? "Usage & Significance" : tab}
            </button>
          ))}
        </div>
        <p className="text-sm text-parchment/80 mb-4">
          {exhibit?.persona_scripts?.[activeTab] || "Exhibit detail unavailable."}
        </p>

        <div className="flex gap-3">
          <button className="adwa-btn-secondary flex-1" onClick={() => setExploded((v) => !v)}>
            {exploded ? "Collapse View" : "Exploded View"}
          </button>
          {isInstrument && (
            <button className="adwa-btn-secondary flex-1" onClick={() => navigate("sensory")}>
              🥁 Sensory Mode
            </button>
          )}
          <button className="adwa-btn-primary flex-1" onClick={() => navigate("voiceGuide")}>
            Ask a Question
          </button>
        </div>
      </div>
    </div>
  );
}
EOF

cat << 'EOF' > frontend/src/components/screens/SensoryHub.jsx
import React, { useEffect, useState } from "react";
import { pulse } from "../../lib/haptics";
import { startBreathDetection } from "../../lib/pitchDetection";

/** Screen 6 — Multi-Sensory Audio & Haptic Interaction (instruments only) */
export default function SensoryHub({ navigate }) {
  const [mode, setMode] = useState("drum"); // drum | wind | blade
  const [breath, setBreath] = useState({ amplitude: 0, pitch: -1 });
  const [visualPulse, setVisualPulse] = useState(false);

  useEffect(() => {
    if (mode !== "wind") return;
    let stop = () => {};
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stop = startBreathDetection(stream, setBreath);
    })();
    return () => stop();
  }, [mode]);

  function playDrumZone(zone) {
    playSynthTone(zone === "center" ? 90 : 440);
    pulse(zone === "center" ? 60 : 25, () => {
      setVisualPulse(true);
      setTimeout(() => setVisualPulse(false), 150);
    });
  }

  return (
    <div className="min-h-screen p-6 flex flex-col">
      <div className="flex gap-2 mb-6">
        {["drum", "wind", "blade"].map((m) => (
          <button
            key={m}
            className={`adwa-chip ${mode === m ? "border-imperial-gold" : ""}`}
            data-active={mode === m}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "drum" && (
        <div className={`flex-1 grid place-items-center ${visualPulse ? "animate-pulse" : ""}`}>
          <div
            className="w-64 h-64 rounded-full bg-wanza-wood-light border-8 border-wanza-wood grid place-items-center cursor-pointer"
            onClick={() => playDrumZone("center")}
          >
            <div
              className="w-24 h-24 rounded-full bg-imperial-gold/30"
              onClick={(e) => {
                e.stopPropagation();
                playDrumZone("edge");
              }}
            />
          </div>
        </div>
      )}

      {mode === "wind" && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="mb-4 text-parchment/70">Blow into the mic to play the Embilta</p>
          <div
            className="w-40 h-40 rounded-full bg-adwa-emerald/30 border-4 border-adwa-emerald"
            style={{ transform: `scale(${1 + Math.min(breath.amplitude * 4, 0.6)})` }}
          />
        </div>
      )}

      {mode === "blade" && (
        <div className="flex-1 grid place-items-center text-parchment/70">
          Swipe across the crossed blades (gesture demo placeholder)
        </div>
      )}

      <button className="adwa-btn-secondary mt-6" onClick={() => navigate("inspection")}>
        Back to Inspection
      </button>
    </div>
  );
}

function playSynthTone(freq) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}
EOF

cat << 'EOF' > frontend/src/components/screens/VoiceGuideOverlay.jsx
import React from "react";
import { useVoiceGuide } from "../../hooks/useVoiceGuide";
import { useExhibitStore } from "../../stores/useExhibitStore";
import { PERSONAS } from "../../personas/personas";
import { useSessionStore } from "../../stores/useSessionStore";

/** Screen 7 — Dynamic Voice AI Tour Guide / Q&A */
export default function VoiceGuideOverlay({ navigate }) {
  const exhibit = useExhibitStore((s) => s.activeExhibit);
  const persona = useSessionStore((s) => s.persona);
  const setPersona = useSessionStore((s) => s.setPersona);
  const { status, captions, startListening, stopListeningAndSend } = useVoiceGuide(exhibit?.hotspot_json);

  return (
    <div className="min-h-screen flex flex-col justify-end">
      <div className="adwa-glass rounded-b-none p-6">
        <div className="flex justify-center gap-3 mb-4">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              className={`adwa-chip ${persona === p.id ? "border-imperial-gold" : ""}`}
              data-active={persona === p.id}
              onClick={() => setPersona(p.id)}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <p className="min-h-[3em] text-center text-parchment/90 mb-4">{captions || "Ask me anything about this exhibit."}</p>

        <div className="flex justify-center mb-4">
          <button
            className={`w-20 h-20 rounded-full adwa-btn-primary flex items-center justify-center text-2xl ${
              status === "listening" ? "shadow-gold-glow animate-pulse" : ""
            }`}
            onMouseDown={startListening}
            onMouseUp={stopListeningAndSend}
            onTouchStart={startListening}
            onTouchEnd={stopListeningAndSend}
          >
            🎙️
          </button>
        </div>
        <p className="text-center text-xs text-parchment/50 mb-4">Hold to talk, release to send</p>

        <input
          type="text"
          placeholder="Or type your question..."
          className="w-full bg-obsidian-overlay rounded-full px-4 py-2 border border-wanza-wood"
        />

        <button className="mt-4 text-sm text-adwa-emerald underline mx-auto block" onClick={() => navigate("inspection")}>
          Back to exhibit
        </button>
      </div>
    </div>
  );
}
EOF

cat << 'EOF' > frontend/src/components/screens/MemoryDeck.jsx
import React from "react";
import { useSessionStore } from "../../stores/useSessionStore";

/** Screen 8 — Post-Tour Memory Deck & Engagement */
export default function MemoryDeck({ navigate }) {
  const visitedExhibitIds = useSessionStore((s) => s.visitedExhibitIds);

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-2xl text-imperial-gold mb-6 text-center">Your Adwa Recap</h2>

      <div className="flex flex-col gap-4">
        {visitedExhibitIds.length === 0 && (
          <p className="text-center text-parchment/60">No exhibits visited yet this tour.</p>
        )}
        {visitedExhibitIds.map((id) => (
          <div key={id} className="adwa-card">
            <p className="text-lg capitalize">{id.replace(/_/g, " ")}</p>
            <p className="text-sm text-parchment/60">Tap to review the quiz question</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-8">
        <button className="adwa-btn-secondary flex-1">Save my tour</button>
        <button className="adwa-btn-primary flex-1">Email me my recap</button>
      </div>

      <button className="mt-6 text-sm text-adwa-emerald underline mx-auto block" onClick={() => navigate("landing")}>
        Start a new tour
      </button>
    </div>
  );
}
EOF

# =============================================================================
# Sample exhibit metadata (served statically for the demo)
# =============================================================================

mkdir -p frontend/public/exhibits
cat << 'EOF' > frontend/public/exhibits/shotel_sword.json
{
  "exhibit_id": "shotel_sword",
  "category": "weapon",
  "glb_url": "/models/shotel_sword.glb",
  "hotspot_json": {
    "hilt": { "position": "0 0.1 0", "normal": "0 1 0", "tab": "craft" },
    "blade": { "position": "0 0.4 0", "normal": "0 1 0", "tab": "material" }
  },
  "persona_scripts": {
    "material": "Hand-forged iron blade paired with a wanza hardwood hilt.",
    "craft": "The curved blade was shaped through repeated forging and quenching by highland smiths.",
    "usage": "Its crescent curve let warriors strike around an opponent's shield in close formation."
  },
  "audio_profile": { "ambient": "/audio/forge-ambience.mp3" }
}
EOF

cat << 'EOF' > frontend/public/exhibits/wanza_drum.json
{
  "exhibit_id": "wanza_drum",
  "category": "instrument",
  "glb_url": "/models/wanza_drum.glb",
  "hotspot_json": {
    "skin": { "position": "0 0.3 0", "normal": "0 1 0", "tab": "material" }
  },
  "persona_scripts": {
    "material": "A hollowed wanza wood body topped with a stretched hide drumhead.",
    "craft": "Carved from a single log, then fitted and tensioned with rawhide lacing.",
    "usage": "Played at ceremonial gatherings to set rhythm for communal dance."
  }
}
EOF

touch frontend/public/models/.gitkeep

# =============================================================================
# DOCS — AGENT_INSTRUCTIONS.md (for autonomous coding agents: Cursor, Windsurf, Antigravity)
# =============================================================================

cat << 'EOF' > docs/AGENT_INSTRUCTIONS.md
# Antigravity Agent Instruction Set — Adwa Lens

These rules govern any autonomous AI coding agent (Cursor, Windsurf,
Antigravity, or similar) operating on this repository. They exist because
four parallel workstreams (see `PHASES_AND_ROLES.md`) touch this codebase
concurrently — a single agent breaking a contract can block three other
streams.

## 1. Non-Negotiable Rules

1. **Never mutate a shared contract interface without a version bump and a
   note in `docs/CHANGELOG_CONTRACTS.md`.** Contracts include:
   - `backend/routes/*.js` request/response JSON shapes
   - `frontend/src/stores/useSessionStore.js` and `useExhibitStore.js` state shape
   - `frontend/public/exhibits/*.json` schema (`exhibit_id`, `glb_url`,
     `hotspot_json`, `persona_scripts`, `audio_profile`)
   - Persona IDs (`kids`, `scholar`, `royal`) used across client and server
2. **Work only inside your assigned stream's directories** unless a change
   to a shared file is explicitly required — and if so, flag it in the PR
   description and tag the owning stream.
3. **Never remove or rename an exported function/component** that other
   streams import. Add a new export and deprecate the old one instead.
4. **Never delete `.env.example` keys.** Add new keys with sane placeholder
   defaults; document them inline with a comment.
5. **All new server routes must go through `backend/lib/errors.js`
   `normalizeError()`** — no ad hoc error shapes.
6. **All new API keys must be read from `process.env`, never hardcoded**,
   and must be proxied through `backend/` — the client must never hold a
   provider API key.
7. **Every new component must be self-contained and importable** without
   requiring changes to `App.jsx`'s screen map beyond adding one line.
8. **Do not introduce a routing library** (react-router, etc.) without team
   sign-off — the flat `SCREENS` map in `App.jsx` is intentional for
   hackathon-speed parallel editing.
9. **Respect the design tokens in `tailwind.config.js`.** No raw hex colors
   in components — use the `imperial-gold`, `adwa-emerald`, `adwa-crimson`,
   `obsidian`, `wanza-wood`, `parchment` token names.
10. **Write graceful degradation for every AI call** you add (timeout,
    try/catch, and a user-visible fallback state) — mirroring the existing
    `useVoiceGuide.js` TTS fallback pattern.

## 2. Before You Start a Task

- Read `PHASES_AND_ROLES.md` and confirm which stream owns the file(s) you
  are about to touch.
- Read the relevant section of the architecture doc (`docs/ARCHITECTURE.md`)
  so your implementation matches the intended data flow.
- Check `docs/CHANGELOG_CONTRACTS.md` for any contract changes made by
  other streams since your last sync.

## 3. While Coding

- Keep functions small and single-purpose; prefer composition over deeply
  nested conditionals, especially in the AI pipeline routes.
- Add a one-line comment above any function that maps to a numbered step
  in the architecture doc's data-flow diagram (e.g. `// [2] Gemini Flash
  vision call`) so future agents can trace code back to spec instantly.
- Never block the main thread with synchronous heavy computation (pitch
  detection, image downscaling) — use `requestAnimationFrame` or workers.
- Match existing naming conventions: `camelCase` for JS, `snake_case` only
  for JSON payload keys that mirror external API contracts (Gemini, Groq).

## 4. Before You Finish a Task

- Run `npm run lint`.
- Confirm you have not modified any file outside your stream without a
  flagged, justified exception.
- Update `docs/CHANGELOG_CONTRACTS.md` if you touched a shared contract.
- Leave the demo path (Shotel sword scan → 3D → voice Q&A → drum tap →
  recap) working end-to-end — this is the hackathon judging path and must
  never be broken by a partial task.

## 5. Parallel-Safety Checklist (run before opening a PR)

- [ ] No shared contract changed without version bump + changelog entry
- [ ] No file outside my stream's directory touched without flag
- [ ] All new AI calls have a fallback path
- [ ] All new colors use design tokens, not raw hex
- [ ] `npm run dev:all` still boots cleanly
- [ ] Demo path still works end-to-end
EOF

cat << 'EOF' > docs/CHANGELOG_CONTRACTS.md
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

### 2026-07-23 — Initial contracts established
Stream: bootstrap
Changed: backend/routes/*.js, frontend/src/stores/*.js, frontend/public/exhibits/*.json
Reason: Initial scaffold
Migration: n/a
EOF

# =============================================================================
# DOCS — PHASES_AND_ROLES.md
# =============================================================================

cat << 'EOF' > docs/PHASES_AND_ROLES.md
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
EOF

# =============================================================================
# DOCS — ARCHITECTURE.md (verbatim reference copy for agents)
# =============================================================================

cat << 'EOF' > docs/ARCHITECTURE.md
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
EOF

# =============================================================================
# README
# =============================================================================

cat << 'EOF' > README.md
# Adwa Lens — AI-Powered WebAR Museum Companion

A hackathon-ready WebAR museum companion: point your phone at an artifact,
watch it come alive in 3D, and talk to it in the voice of a Kids Explorer,
History Scholar, or Royal persona.

## Project Layout

This project lives inside the existing repo's \`frontend/\`, \`backend/\`,
\`shared/\`, and \`docs/\` directories — nothing is scaffolded into a separate
project root.

- \`frontend/\` — Vite + React client (components, hooks, stores, public assets)
- \`backend/\` — Fastify BFF that proxies Gemini / Groq / ElevenLabs
- \`shared/\` — tooling/scripts shared across frontend and backend
- \`docs/\` — architecture & contributor docs

## Quick Start

\`\`\`bash
cp backend/.env.example backend/.env   # fill in Gemini / Groq / ElevenLabs keys
docker compose up
\`\`\`

Client: http://localhost:5173
BFF API: http://localhost:8787

## Without Docker

\`\`\`bash
npm run install:all   # installs frontend/ and backend/ deps
npm run dev:all       # runs the Vite client and Fastify BFF together
\`\`\`

## Project Docs

- \`docs/ARCHITECTURE.md\` — full data-flow & screen spec
- \`docs/PHASES_AND_ROLES.md\` — 4-stream parallel work breakdown
- \`docs/AGENT_INSTRUCTIONS.md\` — rules for AI coding agents (Cursor,
  Windsurf, Antigravity) working in this repo
- \`docs/CHANGELOG_CONTRACTS.md\` — log of any shared-contract changes

## Demo Path (hackathon MVP)

Landing → Itinerary Planner → Live Navigation → Camera Scan (Shotel sword)
→ 3D Inspection Hub → Voice Q&A (persona switch live) → Sensory Hub (drum
tap) → Memory Deck recap.
EOF

echo "==> Installing root orchestration dependencies..."
npm install --silent || echo "!! npm install failed at repo root — run 'npm install' manually."

echo "==> Installing frontend/ dependencies..."
(cd frontend && npm install --silent) || echo "!! npm install failed — run 'npm install' manually inside frontend/"

echo "==> Installing backend/ dependencies..."
(cd backend && npm install --silent) || echo "!! npm install failed — run 'npm install' manually inside backend/"

echo ""
echo "=================================================================="
echo " Adwa Lens bootstrap complete — frontend/, backend/, shared/, and"
echo " docs/ have been created and populated."
echo ""
echo " Next steps:"
echo "   cp backend/.env.example backend/.env   # add your Gemini / Groq / ElevenLabs keys"
echo "   docker compose up                      # or: npm run dev:all"
echo "=================================================================="