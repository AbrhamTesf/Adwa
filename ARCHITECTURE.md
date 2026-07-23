# Adwa AI Companion — Architecture

Voice-first & WebXR AR tour guide OS for the Battle of Adwa heritage experience.

## System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                        shared/                              │
│  types/api.ts  ◄──►  schemas/schemas.py  +  data/*.json    │
│              (Single Source of Truth)                       │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
    ┌──────────▼──────────┐    ┌──────────▼──────────┐
    │     frontend/       │    │      backend/       │
    │  Next.js 14 + R3F   │───►│  FastAPI + ChromaDB │
    │  WebXR / Voice UI   │    │  OpenAI / ElevenLabs│
    └─────────────────────┘    └─────────────────────┘
         localhost:3000              localhost:8000
```

| Layer    | Responsibility                                      | Tech                          |
|----------|-----------------------------------------------------|-------------------------------|
| Frontend | Voice UI, AR canvas, itinerary display, dev tools   | Next.js 14, Tailwind, R3F     |
| Backend  | RAG chat, TTS, vision analysis, artifact metadata   | FastAPI, ChromaDB, OpenAI     |
| Shared   | API contracts, seed data, persona definitions       | TypeScript + Pydantic v2      |

## Folder Structure

```
Adwa/
├── .cursorrules                 # AI/editor coding guidelines
├── .env.example                 # Environment variable template
├── ARCHITECTURE.md              # This file
│
├── shared/
│   ├── types/
│   │   └── api.ts               # TypeScript API interfaces
│   ├── schemas/
│   │   └── schemas.py           # Pydantic v2 models (mirror of api.ts)
│   └── data/
│       ├── verified_history.json # Curated historical facts (RAG seed)
│       └── personas.json         # Tour guide persona definitions
│
├── frontend/
│   ├── app/                     # Next.js App Router pages & layouts
│   ├── components/
│   │   ├── ar/                  # Three.js / WebXR components
│   │   └── dev/                 # Development-only utilities
│   ├── lib/                     # Client utilities, mock data
│   ├── public/
│   │   ├── models/              # .glb 3D assets
│   │   └── audio/fallback/      # Pre-rendered .mp3 clips
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
└── backend/
    ├── main.py                  # FastAPI app entry + CORS
    ├── config.py                # pydantic-settings env loader
    ├── requirements.txt
    ├── routers/
    │   ├── itinerary.py         # POST /api/itinerary
    │   ├── chat.py              # POST /api/chat
    │   ├── artifacts.py         # GET  /api/artifacts/{id}
    │   └── vision.py            # POST /api/vision/analyze
    └── scripts/
        └── seed_vector_db.py    # ChromaDB seeding script
```

## API Contract Locations

| Endpoint                    | TypeScript (shared/types/api.ts)     | Pydantic (shared/schemas/schemas.py)   |
|-----------------------------|--------------------------------------|----------------------------------------|
| POST /api/itinerary         | `ItineraryRequest`, `ItineraryResponse` | `ItineraryRequest`, `ItineraryResponse` |
| POST /api/chat              | `ChatQueryRequest`, `ChatQueryResponse` | `ChatQueryRequest`, `ChatQueryResponse` |
| GET  /api/artifacts/{id}    | `ARArtifactResponse`                 | `ARArtifactResponse`                   |
| POST /api/vision/analyze    | `VisionAnalyzeRequest`, `VisionAnalyzeResponse` | `VisionAnalyzeRequest`, `VisionAnalyzeResponse` |

## Data Flow

1. **Itinerary**: Frontend sends location + persona → Backend queries RAG → returns ordered stop list.
2. **Chat**: Frontend sends voice/text query + persona → Backend retrieves context from ChromaDB → OpenAI generates response → ElevenLabs TTS (optional).
3. **Artifacts**: Frontend requests artifact by ID at a geofenced location → Backend returns 3D model URL + narration metadata.
4. **Vision**: Frontend sends camera frame → Backend analyzes with vision model → returns identified artifact + historical context.

## Environment Variables

See `.env.example`. Backend reads from project root `.env`; frontend reads `NEXT_PUBLIC_*` vars at build time.

## Local Development

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install
npm run dev
```
