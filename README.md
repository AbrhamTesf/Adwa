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

## Database & Accounts

Identity, tours, CMS content and analytics live in PostgreSQL, accessed through
Prisma. From a clean checkout:

\`\`\`bash
docker compose up -d postgres    # PostgreSQL 16 on localhost:5432
cd backend
npm run db:migrate               # applies prisma/migrations
npm run db:seed                  # roles, badge catalogue, optional bootstrap admin
\`\`\`

\`DATABASE_URL\` is read from \`backend/.env\` by both the Prisma CLI
(\`prisma.config.js\`) and the runtime client. Useful extras: \`npm run db:studio\`
to browse the data, and \`npm run db:deploy\` to apply migrations in production
without generating new ones.

Visitors can still use the whole experience without an account — the profile
icon in the app shell is optional. Signing in adds cross-device persistence, and
an existing accountless recovery link can be imported into an account without
being invalidated.

Museum staff cannot self-register: staff sign-up requires an invitation code and
the account stays \`pending\` until an administrator approves it. Set
\`BOOTSTRAP_ADMIN_EMAIL\` and \`BOOTSTRAP_ADMIN_PASSWORD\` before seeding to create
the first \`super_admin\`.

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
