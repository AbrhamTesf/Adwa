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
