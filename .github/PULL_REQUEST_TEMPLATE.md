# Pull Request

<!-- Title format: Conventional Commits, e.g. `feat(frontend): add camera QR scanner` or `fix(bff): resolve vision proxy timeout`. -->

## Description

<!-- Provide a clear, concise summary of the changes introduced in this PR. -->

## Linked Feature Lock

- **Feature Key from `feature_lock.json`:** `[e.g., qr_scanner_primary_access]`
- **PR Type:** [ ] Feature Claim / [ ] Feature Release / [ ] Bug Fix / [ ] Documentation

## Strict Contribution Checklist

Please review and check all items before requesting a review:

- [ ] **Feature Lock Updated:** I have updated `feature_lock.json` (status is `claimed` or `released`, with my ID and branch name).
- [ ] **Directory Boundaries Respected:** My code strictly stays within its intended path (`frontend/`, `backend/`, `shared/`, or `docs/`).
- [ ] **3D Asset Constraints:** If introducing 3D models (`.glb`), they use Draco compression and are strictly under 15 MB.
- [ ] **Docker Context Verified:** I have verified the affected stack builds and runs cleanly with `docker compose up --build`.
- [ ] **No Exposed Secrets:** I have confirmed no local `.env` variables or secret keys (Gemini, Groq, ElevenLabs) are included in this PR.
