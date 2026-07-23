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
