# task_08 — Cloudflare Worker + D1 cloud-save backend

**Status:** Local-only spike. **NOT** production-ready. See "What's
intentionally not done" below.

## What is this

A minimal Cloudflare Worker that satisfies the contract in
`src/cloud/httpCloudSaveClient.ts`. It runs against a real D1 binding
(SQLite at edge) for storage and is exercised end-to-end by miniflare
in the integration test suite — no live Cloudflare account required.

This is the second iteration of the P3 cloud-save backend. The earlier
spike at `server/worker/` (April 2026) ran against an in-memory `Map`
and used a different URL shape (`/v1/envelope/:userId`); this one
matches the wire format the client *actually* sends (userId in the
Bearer header, not the path) and exercises real D1.

## Layout

```
cloudflare/
  wrangler.toml           # local-dev D1 binding (no real account_id, no secrets)
  package.json            # workspace package — vitest, miniflare, wrangler, @cloudflare/workers-types
  tsconfig.json           # ES2022 + WebWorker libs + workers-types
  vitest.config.ts        # scoped to test/**/*.test.ts (does not use root vite plugins)
  schema/
    0001_initial.sql      # CREATE TABLE envelopes (user_id PK, payload, updated_at)
  src/
    worker.ts             # default fetch entrypoint
    routes.ts             # GET/PUT /v1/envelope, DELETE /v1/account, dispatch + validation
    auth.ts               # parseBearerUserId — pulls `Bearer {userId}` out of Authorization
    d1Adapter.ts          # typed D1Database wrapper: getEnvelope / putEnvelope / deleteUser
    types.ts              # Env (D1 binding) + envelope wire shape + size limits
  test/
    routes.test.ts                # 18 unit tests against StubAdapter (no miniflare)
    worker.integration.test.ts    # 12 integration tests booting miniflare with bundled Worker + D1
    vite-env.d.ts                 # type shim for Vite-injected `import.meta.env` on the imported client
```

## Contract (what the Worker exposes)

```
GET    /v1/envelope    Bearer {userId}                         → 200 envelope-json | 404 (no row) | 401
PUT    /v1/envelope    Bearer {userId}, body: envelope-json    → 204 | 400 (bad body) | 413 (oversize) | 401
DELETE /v1/account     Bearer {userId}                         → 204 (idempotent) | 401
```

The envelope shape is `src/cloud/cloudSaveEnvelope.ts`. The Worker is
**schema-blind** for the inner save payload — it never parses the
inner JSON. `MAX_PAYLOAD_BYTES = 256 KiB` per `cloudSaveEnvelope.ts`.

The integration tests use the actual `HttpCloudSaveClient` against the
miniflare URL, so any drift in URL paths, header shape, or response
codes breaks the suite.

## Run

```bash
# From repo root:
npm run npm:test:cloud      # delegates to `cd cloudflare && npm test`

# From cloudflare/ directly:
npm install                 # one-time install of workers-types, miniflare, wrangler, vitest
npm test                    # 30 tests (18 routes + 12 integration), ~12s cold
npm run build               # tsc --noEmit type-check

# Local Worker dev (will use a local D1 SQLite file under .wrangler/):
npx wrangler d1 execute wild-haggis-saves --local --file=schema/0001_initial.sql
npm run dev                 # `wrangler dev --local`
```

## What's intentionally NOT done (production gates)

The spike proves the contract works. It does NOT do:

| What | Tracking |
|------|---|
| Real magic-link auth (the current bearer-equals-userId is a stand-in) | T421 — replace `signInForTest` with magic-link flow |
| Privacy policy text + opt-in flow | T422 — privacy policy + opt-in flow |
| Production deploy pipeline (`wrangler publish`, real `account_id`, secrets management, custom domain, monitoring) | T423 — deploy pipeline |
| Schema migration runner beyond `0001_initial.sql` | T424 — schema migration runner |

These are blocked on human/product decisions documented in
`docs/adr/0006-cloud-save-backend.md` and
`docs/P3_BACKEND_DECISION_MATRIX.md`. The spike's job is to prove
the local seam exists and the contract holds; everything above is
the work that turns the seam into a service.

## Why two backend dirs?

`server/worker/` (April 2026 spike) and `cloudflare/` (this spike)
co-exist on purpose:

- `server/worker/` proves the **handler logic** in pure isolation —
  fast unit tests against an in-memory `Map`, no Workers runtime
  involved. It uses `/v1/envelope/:userId` style routing.
- `cloudflare/` proves the **wire contract** end-to-end against the
  real Workers runtime + real D1, and matches what
  `httpCloudSaveClient.ts` actually sends (`/v1/envelope` with
  userId in the Bearer header). The integration test boots miniflare,
  applies the schema, and runs the actual production client class.

The eventual production wiring (T423) replaces both with one canonical
implementation; until then they overlap intentionally.

## Behaviour preserved (for the rest of the codebase)

- **Offline-first untouched.** Nothing in `src/cloud/`, `src/utils/save.ts`,
  `src/core/SaveManager.ts`, or any scene was modified. The game still
  defaults to `NoopCloudSaveClient` and `localStorage` remains the
  source of truth.
- **No production-leak surface.** `cloudflare/` is not in any
  `tsconfig.json`'s `include`, not in any vite import graph, and not
  in the root vitest's `include` glob. The game bundle never sees
  Worker code.
- **No new root deps.** All new packages (`@cloudflare/workers-types`,
  `miniflare`, `wrangler`, `vitest` — vitest is a dev convenience for
  scoping) live under `cloudflare/node_modules/`.
