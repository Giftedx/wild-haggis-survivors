# Cloud-save Worker (P3 spike)

A Cloudflare Worker scaffold for the P3 cloud-save backend. **Spike, not
production.**

## What's here

```
server/worker/
├── src/
│   ├── index.ts       # Cloudflare `fetch` entrypoint
│   ├── handlers.ts    # Pure handler — takes Request + Storage
│   ├── storage.ts     # Storage interface, InMemoryStorage, D1Storage sketch
│   └── types.ts       # Envelope wire-format types
├── test/
│   └── handlers.test.ts  # Contract tests against InMemoryStorage
├── tsconfig.json
└── wrangler.toml.example
```

## Sibling project, not part of the game bundle

This directory is **not** under `src/`, so it is invisible to:

- The Vite production build (`vite.config.ts` only bundles what
  `index.html` imports).
- The game's `tsconfig.json` (which `include`s `src/**/*.ts`).

The only place this code is reached is the root Vitest runner, which
`include`s `server/worker/**/*.test.ts` (see `vite.config.ts` →
`test.include`).

## Running tests

```bash
npm test                                    # full repo suite
npm test -- server/worker/test/handlers     # only the Worker contract tests
```

## Running locally (no D1)

```bash
cd server/worker
npx wrangler dev   # uses InMemoryStorage fallback
```

Data resets on Worker restart. This is for client-integration
roundtrip-smoke only, not a long-lived store.

## Deploying

The spike is **not** ready for deploy. To take it to staging:

1. Copy `wrangler.toml.example` to `wrangler.toml`.
2. Fill in `account_id` and create a D1 database
   (`wrangler d1 create wild-haggis-saves`).
3. Apply the schema sketched in `src/storage.ts` (D1Storage docstring).
4. Add real auth (magic-link, OAuth, etc.) — the current bearer is a
   stand-in.
5. Add rate-limiting, logging, and an audit table per ADR 0006.

## Contract

```
GET    /v1/envelope/:userId   → 200 envelope | 404 missing | 401 auth | 403 wrong user
PUT    /v1/envelope/:userId   → 204 ok | 409 stale | 400 bad body | 413 oversize | 401 auth | 403 wrong user
DELETE /v1/account/:userId    → 204 ok | 401 auth | 403 wrong user
```

Auth: `Authorization: Bearer {userId}` matches what
`src/cloud/httpCloudSaveClient.ts` already sends.

The PUT body is the envelope shape from
`src/cloud/cloudSaveEnvelope.ts`. The Worker is **schema-blind** for
the inner save payload — server never parses it. Conflict detection
uses `envelope.lastModified`: a PUT whose lastModified is older than
the stored row is rejected with 409. Same-timestamp writes win as ties.

## What this spike does NOT prove

- Real D1 throughput, concurrency, or write durability.
- Real magic-link auth flow.
- Production deployment process.
- Privacy policy / GDPR-deletion soft-delete window.
- Bundle/cost economics under load.

See `docs/adr/0006-cloud-save-backend.draft.md` for the broader plan
and `docs/status/cloud/P3_BACKEND_DECISION_MATRIX.md` for the tradeoff
analysis.
