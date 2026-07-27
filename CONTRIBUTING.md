# Contributing to the Adwa AI Companion & Heritage Platform

This is heritage infrastructure. Contributions must be deliberate, attributable, and safe for other contributors to build upon. These rules are mandatory.

## 1. Feature Lock Protocol — mandatory

**Do not write or submit feature code until the feature is claimed and the claim PR is approved.** The canonical register is [\`/feature-lock.json\`](feature-lock.json).

1. Find the feature key in the lock file. If it is not listed, open a planning/RFC issue before proposing a new entry.
2. Create a claim-only PR that changes its \`status\` from \`unclaimed\` to \`claimed\`, sets your stable \`agent_id\`, branch name, and ISO 8601 \`claimed_at\` timestamp, and leaves \`released_at\` as \`null\`.
3. Wait for approval. Start implementation only after the claim PR is merged.
4. In the implementation PR, retain the same ownership fields and update the feature to \`released\` with an ISO 8601 \`released_at\` timestamp when it is ready to merge.

Any PR introducing feature code without an active, approved feature-lock claim will be closed automatically. Do not claim a feature on another contributor's branch, overwrite ownership, or batch unrelated claims.

## 2. Directory isolation

The repository has four product folders. Keep work inside its owning boundary.

- \`/frontend\` — React UI, browser APIs, client state, and public client assets only.
- \`/backend\` — Fastify BFF, API routes, provider integrations, persistence, and server-side RAG boundary only.
- \`/shared\` — versioned contracts, schemas, and cross-service types only.
- \`/docs\` — RFCs, architecture records, runbooks, and contributor documentation only.

Changes to \`/shared\` require an architectural RFC review before editing. Link the approved RFC in the PR description and in the relevant feature's \`plan_ref\`. A frontend or backend implementation must not silently redefine a shared contract.

## 3. 3D and audio asset constraints

Every \`.glb\` asset submitted for a virtual tour **must**:

- use Draco compression;
- be no larger than **15 MB**; and
- include its source/provenance and licence in the PR description.

Do not commit uncompressed source meshes, raw audio recordings, or generated build output. Store only approved, production-ready derivative assets in the appropriate existing product folder.

## 4. Branches and commits

Use a clean, single-purpose branch:

- \`feat/<feature-key>\` for a claimed feature, for example \`feat/qr_scanner_primary_access\`.
- \`fix/<issue-id>\` for a defect tied to an issue.

Use Conventional Commits. Allowed primary types include \`feat:\`, \`fix:\`, \`docs:\`, and \`chore:\`. Write imperative, scoped messages, for example: \`feat(qr): add exhibit ID resolver\`.

Do not mix refactors, dependency upgrades, formatting churn, or unrelated documentation into a feature PR.

## 5. Pull-request checklist

Authors must complete every applicable item before requesting review:

- [ ] I have an active, approved claim for this feature in \`feature-lock.json\`.
- [ ] My branch name and commits follow the required standards.
- [ ] \`docker compose up --build\` completes successfully for the affected stack.
- [ ] Relevant frontend, backend, and/or RAG checks pass locally.
- [ ] No API keys, tokens, \`.env\` files, private data, or secrets are committed.
- [ ] I updated \`feature-lock.json\` accurately, including release fields when appropriate.
- [ ] I kept changes within the correct directory boundary.
- [ ] If I changed \`/shared\`, the PR links to an approved architectural RFC.
- [ ] Every submitted \`.glb\` is Draco-compressed, under 15 MB, and has provenance/licence information.
- [ ] I documented user-visible behaviour, migrations, and operational changes in \`/docs\` when needed.

Maintainers may close or request changes to any PR that violates these rules. This protects contributor time, the visitor experience, and the integrity of the heritage material entrusted to the project.