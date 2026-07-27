# Adwa AI Companion & Heritage Platform

> **Adwa is not only a place to visit; it is a story we are responsible for carrying forward.**

Ethiopian and global open-source developers: help make the history of the Victory of Adwa accessible, accurate, and alive for the next generation. This project turns technology into public-memory infrastructure—serving a visitor at the Adwa Victory Memorial Park today and growing into a national virtual heritage platform tomorrow.

## Status and vision

The core MVP is built and operational: a mobile-first museum companion with a React experience, Fastify BFF, exhibit experiences, and containerised local development. We are opening the project to scale it into a resilient digital heritage and tourism platform for on-site discovery, remote exploration, and responsible preservation of community knowledge.

## Access architecture and cost resilience

| Access path | Experience | Cost-resilience design |
| --- | --- | --- |
| **Primary: QR scanner** | Instant exhibit metadata lookup from a camera-scanned QR code. | The exhibit identifier resolves locally or from catalogued metadata; normal high-density traffic needs no AI call. |
| **Photo scanner** | Artifact recognition when a QR code is unavailable. | Server-side perceptual hashing and cached matches avoid repeated Gemini Vision inference. |
| **Virtual tours** | Remote 3D inspection and WebXR-ready walkthroughs. | Three.js and \`@google/model-viewer\` progressively load interactive models. |
| **Offline-first fallback** | Essential guide functionality in poor-connectivity zones. | IndexedDB retains metadata and local assets; \`window.speechSynthesis\` provides speech when streaming audio or network access fails. |

## Technology stack

- **Frontend:** React 18, Vite, Tailwind CSS, Zustand, Three.js, \`@google/model-viewer\`, GSAP.
- **Backend BFF:** Node.js and Fastify, proxying Gemini Vision, Groq Llama/Whisper, and ElevenLabs TTS.
- **RAG service:** Python 3.11, FastAPI, \`sentence-transformers\`, and ChromaDB.
- **Infrastructure:** Multi-container Docker Compose; the current local stack includes PostgreSQL for identity, tours, CMS content, and analytics.

## System architecture

~~~mermaid
flowchart LR
  V[Visitor browser / PWA] --> F[React 18 + Vite frontend]
  F -->|QR exhibit ID| C[Local metadata / IndexedDB]
  F -->|Photo, voice, audio requests| B[Fastify BFF]
  F -->|Guide question| R[FastAPI RAG service]
  B -->|Perceptual hash lookup| VC[(ChromaDB vision cache)]
  B -->|Cache miss: structured recognition| G[Gemini Vision]
  B -->|Speech-to-text and dialogue| GR[Groq Whisper + Llama]
  B -->|Audio stream| E[ElevenLabs TTS]
  R -->|Embed/query| VS[(ChromaDB vector store)]
  R -->|Grounded context| B
  F -->|Offline fallback| S[Browser SpeechSynthesis]
~~~

The BFF is the only browser-facing path to paid AI providers: it owns credentials, rate limits, structured-output validation, and cache policy. The RAG service owns retrieval and vector-store interactions.

## Repository layout

~~~text
.
├── frontend/                 # React/Vite application, UI, assets, client state
├── backend/                  # Fastify BFF, routes, Prisma, and RAG-service boundary
│   ├── index.js              # Fastify entrypoint
│   └── rag-service/          # FastAPI RAG service (Python 3.11 target)
├── shared/                   # Versioned contracts, schemas, and cross-service types
├── docs/                     # Architecture decisions, RFCs, and contributor documentation
├── Dockerfile                # Application container entrypoint
├── docker-compose.yml        # Local multi-container orchestration entrypoint
└── feature-lock.json         # Canonical feature-ownership register
~~~

Do not create additional product directories at the repository root. See [CONTRIBUTING.md](CONTRIBUTING.md) before changing shared contracts or claiming work.

## Quick start with Docker

~~~bash
cp backend/.env.example backend/.env
docker compose up --build
~~~

Set only needed provider credentials in \`backend/.env\`; never commit it. Open the frontend at \`http://localhost:5173\` and BFF at \`http://localhost:8787\`. For a fresh database, run \`npm --prefix backend run db:migrate\` and optionally \`npm --prefix backend run db:seed\`.

## Manual local development

Prerequisites: Node.js 20+ and npm. The expanded RAG service targets Python 3.11.

~~~bash
npm run install:all
cp backend/.env.example backend/.env
npm run dev:all
~~~

This starts Vite and Fastify. In a separate terminal, when the RAG service dependency manifest is present:

~~~bash
cd backend/rag-service
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
~~~

## Contributing

Every code contribution begins with an approved claim in [\`feature-lock.json\`](feature-lock.json). Read [CONTRIBUTING.md](CONTRIBUTING.md) for the mandatory claim, branch, asset, and pull-request rules.

## License and stewardship

License and governance details will be published before the first public release. Source historical claims, distinguish interpretation from evidence, and seek review for changes that affect cultural representation.