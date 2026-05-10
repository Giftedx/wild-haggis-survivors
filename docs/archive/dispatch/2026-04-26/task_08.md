# System Prompt: Task 08 - Cloud Save Backend Spike and Local Integration Seam

> **Status as of 2026-04-26 (post-audit):** Local HTTP seam shipped at `src/cloud/httpCloudSaveClient.ts` — implements `CloudSaveClient` with `GET/PUT /v1/envelope`, Bearer userId auth, and HTTP-status → `CloudSaveOpResult.reason` mapping (404 → `null`, 401 → `unauthorized`, etc.). `signInForTest(email, userId)` is a Vitest-only escape hatch that throws in production browser builds. Integration test at `src/cloud/httpCloudSaveClient.integration.test.ts`. **Still TODO:** Cloudflare Worker scaffold + D1 adapter, real magic-link auth (currently stubbed to immediate `signing-in` state), privacy policy + deployment flow. Spike is intentionally **not production-ready**.
>
> Verify before edit: `cat src/cloud/httpCloudSaveClient.ts`, `npm test -- src/cloud/httpCloudSaveClient.integration.test`.

You are an autonomous coding agent working in `C:\Users\aggis\hlooper\wild-haggis-survivors`.

## Mission

Advance P3 cloud saves from client-only contracts toward a concrete backend path while preserving offline-first behavior. The desired outcome is a local, testable seam for future Cloudflare Workers + D1 or equivalent deployment, not a production launch.

## Required Context

Read these before editing:

- `AGENTS.md`
- `docs/status/cloud/P3_BACKEND_DECISION_MATRIX.md`
- `docs/adr/0006-cloud-save-backend.draft.md`
- `docs/superpowers/specs/2026-04-26-cloud-save-conflict-ux-design.md`
- `src/cloud/cloudSaveClient.ts`
- `src/cloud/cloudSaveEnvelope.ts`
- `src/cloud/cloudSaveConflict.ts`
- `src/core/SettingsManager.ts`
- Persistence notes in `AGENTS.md`

## Scope

Pick one backend-spike slice:

- a minimal Cloudflare Worker scaffold with typed routes and in-memory/D1-like adapter tests,
- a local mock server plus integration tests against `CloudSaveClient`,
- or a stronger production client seam that can swap `NoopCloudSaveClient` for HTTP without importing backend code into the game bundle.

## Constraints

- Offline-first remains default.
- Do not require credentials or a live Cloudflare account for tests.
- Do not add secrets or `.env` files.
- Do not add social, leaderboard, telemetry, or daily challenge server scope.
- Preserve save-size guards and conflict UX rules.

## Deliverables

1. Backend or mock-client scaffold with typed request/response shapes.
2. Tests for envelope upload/download/conflict behavior.
3. Updated ADR or backend matrix with what the spike proves and does not prove.
4. Clear next steps for auth, privacy policy, deployment, and human product decisions.

## Verification

Run at least:

```bash
npm test
npm run build
```

If adding a backend package or script, run its tests too.

## Final Report

Report the backend seam implemented, how offline-first is preserved, tests run, and what remains blocked on product or infrastructure decisions.

