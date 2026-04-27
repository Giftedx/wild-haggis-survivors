# ADR 0006 — Cloud-save backend (DRAFT)

**Status:** **DRAFT** — awaiting stakeholder approval per
`docs/top-10-tasks/blocked/03-blocked-on-human.md`. Rename to
`0006-cloud-save-backend.md` (drop `.draft`) once approved.
**Date:** 2026-04-26
**Supersedes:** —
**Superseded by:** —

## Context

WHS currently persists everything to `localStorage`:
- `whs_save` — `src/utils/save.ts`, schema v17, biggest payload
- `whs_meta_save` — `src/core/SaveManager.ts`, schema v9
- `whs_game_settings` — `src/core/SettingsManager.ts`, settings v1

A player who clears browser storage loses all progression: gold,
permanent upgrades, Almanac discoveries, deeds, variant unlocks, run
history. Cross-device play is impossible. P3 in
`docs/HUGE_INITIATIVES_MASTER_PLAN.md` flags this as S-tier
infrastructure.

Constraints (full set in `docs/P3_BACKEND_DECISION_MATRIX.md §1`):

- C1: Offline-first — game must remain fully playable without account.
- C2: Solo maintainer — backend must be near-zero-ops.
- C3: Site already deploys via `wrangler` to Cloudflare Pages.
- C4: GDPR — full account deletion within 30 days; minimal PII.
- C5: Privacy-conscious user; minimal third parties.
- C6: ≤30 KB gzip bundle budget for client auth + sync.
- C9: <$5/mo at 10k MAU.
- C10: Prefer EU/UK data residency.

## Decision

**Cloudflare Workers + D1 (SQLite at edge).** Magic-link auth
implemented in the Worker (~50 lines). Email delivery via Resend
(transactional, free tier covers projected volume).

The save-payload envelope is `{version, lastModified, deviceId, payload}`
where `payload` is the existing `whs_save` JSON unchanged. Server is
schema-blind passthrough; migrations remain client-side where they
already live.

Conflict resolution: Last-Writer-Wins, surfaced via a dialog when truly
ambiguous. Spec: `docs/superpowers/specs/2026-04-26-cloud-save-conflict-ux-design.md`.

## Alternatives considered

Full matrix in `docs/P3_BACKEND_DECISION_MATRIX.md §3`. Summary:

- **Cloudflare Workers + KV** — strong second. KV is eventually
  consistent (~60s) and lacks SQL range queries we want for audit log
  + magic-link tokens. Dropped to avoid mixing two storage primitives.
- **Supabase** — strongest "if we already had it" option. Built-in
  magic-link + Postgres + RLS. Rejected on bundle (~30 KB SDK
  collides with charter §C6) + free-tier auto-pause + adds a second
  cloud vendor (charter §C3 favours single-vendor).
- **Firebase** — rejected on bundle (~50–80 KB SDK), magic-link
  redirect through `firebaseapp.com` UX cost, and privacy posture
  (constraint C5).
- **Self-host (VPS)** — rejected on ops (constraint C2).
- **No backend / save-export-import** — kept as descope fallback if
  P3 stays blocked indefinitely. Doesn't satisfy charter §Phase 2
  acceptance criteria.

## Consequences

### Pros

- **Single vendor** with our existing deploy. One bill, one dashboard,
  one mental model.
- **$0/mo** at 10k MAU. Real headroom — 100k MAU before any bill.
- **EU pop available** for D1; addresses C10.
- **Strong consistency** for primary writes (D1's promise; KV's would
  be eventual).
- **Schema-blind server.** Inner v17 payload migrates client-side
  unchanged; future v18/v19 don't require Worker changes.
- **Bundle headroom.** Custom thin client weighs ~3 KB gzipped vs
  ~30 KB Supabase / ~50–80 KB Firebase.

### Cons

- **D1 GA-recent.** Less battle-tested than Postgres or Firestore.
  Acceptable for our load (one writer per user, at most a few writes
  per minute).
- **Auth code is ours to maintain.** ~50 lines now, but if magic-link
  has subtle bugs (token reuse, replay attacks) we own them. Mitigated
  by tests + the recommended OWASP-driven security review (charter
  §sub-tasks 11).
- **No native OAuth** at v1. Players must enter email; some will
  abandon. Charter accepts this as the v2 add.
- **Resend dependency.** Email-provider-pinned. Mitigated by 5-line
  swap to Postmark fallback documented in matrix §6.

### Follow-ups

- **OAuth (Google/Apple) in v2** if magic-link friction shows up in
  user research.
- **Audit log retention policy** — currently sketched as 90-day
  retention via Cloudflare Cron Trigger. Tune once real volume is
  observable.
- **Backup cadence** — D1 daily snapshot is enough; revisit if user
  base grows past 10k.
- **Cost alerts** — set at $5 / $10 / $20 per matrix §5.
- **Privacy policy** at `/privacy.html`. Stakeholder owns the legal
  text; agent provides plain-language skeleton on request.

## Spike status (2026-04-26)

A Cloudflare Worker scaffold lives at `server/worker/`:

- `server/worker/src/handlers.ts` — pure handler `(Request, Storage) →
  Response`. No Cloudflare globals, so it tests directly under Vitest.
- `server/worker/src/storage.ts` — `Storage` interface plus
  `InMemoryStorage` (used by tests) and a `D1Storage` sketch
  (production binding shape; not exercised by tests).
- `server/worker/src/index.ts` — Cloudflare `fetch` entrypoint that
  picks `D1Storage` when `env.DB` is bound, falls back to
  `InMemoryStorage` for `wrangler dev` without D1.
- `server/worker/test/handlers.test.ts` — 23 contract tests covering
  envelope round-trip, stale-write conflict (409), auth (401/403),
  body validation (400/413), routing (404/405), account deletion.
- `server/worker/wrangler.toml.example` — template config, no live
  account_id or database_id. Real `wrangler.toml` is gitignored
  per `.gitignore` policy.

The Worker is a sibling project — not in `tsconfig.json`'s `include`
glob, not imported from any `src/` file, so it does not enter the
game bundle. Vitest's `test.include` was extended to discover
`server/worker/test/**/*.test.ts`; the production `vite build` chunk
sizes for `dist/assets/*.js` are unchanged.

### What the spike proves

- **Envelope wire contract round-trips.** PUT then GET yields the
  same envelope payload, schema version, deviceId, and lastModified.
- **Stale-write conflict policy is enforceable server-side** without
  client changes, by comparing the body's `envelope.lastModified`
  against the stored row's. Stale writes → 409 with `current` body
  for the client to feed into `detectCloudSaveConflict`.
- **Auth shape is consistent with `httpCloudSaveClient.ts`.** Bearer
  must equal the URL's `:userId`; missing → 401, mismatch → 403.
- **Adapter abstraction is real.** `D1Storage` and `InMemoryStorage`
  share the same `Storage` interface; the handler doesn't know which
  one it has.
- **Schema-blind passthrough holds.** The Worker never JSON.parses
  the inner save payload; the inner schema can change client-side
  without Worker redeploy, matching the ADR-recommended split.

### What the spike does NOT prove

- **Real D1 throughput, durability, or contention behaviour.** The
  contract tests exercise an in-memory `Map`. D1's `INSERT … ON
  CONFLICT … DO UPDATE` pattern is in `D1Storage` but not run.
- **Real magic-link auth.** The bearer-equals-userId scheme is a
  spike stand-in. The production auth flow (charter §sub-tasks 11)
  still owes us: token issuance, single-use enforcement, replay
  defence, rate-limit on `/auth/request`, OWASP review.
- **Production deployment.** No live `wrangler.toml`, no Cloudflare
  account_id, no D1 database_id. `wrangler deploy` has not been run.
- **Privacy policy / GDPR soft-delete.** The current `DELETE` is
  immediate, not soft with 7-day undo. The audit log table is
  sketched in code comments only.
- **Resend / email-delivery integration.** Not wired; auth is
  out of scope for the spike.
- **Cost economics under load.** The matrix's $0/mo claim is from
  Cloudflare's published free tier, not from observed usage.
- **Bundle/cost regression from real auth-client code.** The
  `httpCloudSaveClient` already shipped at ~1.5 KB; adding
  magic-link request/verify is the v1 cost to budget against §C6.

### Next steps blocked on humans

- Stakeholder approval of the ADR (rename `0006-…draft.md` →
  `0006-…md`).
- Privacy policy text at `/privacy.html` (charter blocked-on-human
  list).
- Real auth design pick (magic-link via Resend, OAuth, or scoped
  expansion of the current bearer for testing).
- Cloudflare account creation + D1 database provision + cost-alert
  thresholds.
- Decision on data residency: confirm the Cloudflare account targets
  EU/UK per §C10 before any real data lands.

## Rollback

If D1 turns out wrong:

1. **Migration cost is bounded.** Worker handlers are <200 lines total;
   the `CloudSaveClient` interface (already shipped in this branch as
   non-backend infra) means swapping to Supabase or KV is a one-file
   reimplementation behind the same contract.
2. **No client-side schema changes** are coupled to the backend
   choice — the envelope wraps `whs_save` unchanged.
3. **Player-side data preservation** survives any rollback because
   `localStorage` always remains the source of truth (offline-first).
   Worst case: cloud feature goes dark; players keep playing offline.
4. **Cost rollback:** if alarms fire, the Worker has a feature-flag
   kill-switch in D1 that pauses writes (toast: "Cloud sync paused —
   please update the game"). One SQL UPDATE to flip.

The biggest risk to walking this back is operational fatigue if the
Worker has a long-tail bug. The backstop is the kill-switch — pause
writes, revert to offline-only mode, ship a fix or a Supabase migration
on the agent's own timeline.

## References

- `docs/top-10-tasks/03-p3-cloud-saves.md` — charter.
- `docs/P3_BACKEND_DECISION_MATRIX.md` — full tradeoff analysis.
- `docs/top-10-tasks/blocked/03-blocked-on-human.md` — open decisions.
- `docs/superpowers/specs/2026-04-26-cloud-save-conflict-ux-design.md` — conflict UX spec.
- `docs/HUGE_INITIATIVES_MASTER_PLAN.md §P3` — strategic context.
- `docs/HUGE_INITIATIVES_VERDICT.md §32` — verdict and trade-offs.
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md` — GDPR + Scottish
  privacy posture.
- `src/cloud/cloudSaveEnvelope.ts` — envelope shape (this branch).
- `src/cloud/cloudSaveClient.ts` — client contract (this branch).
- `src/cloud/cloudSaveConflict.ts` — conflict-detection helper (this
  branch).
- `src/cloud/httpCloudSaveClient.ts` — local HTTP `CloudSaveClient`
  implementation (this branch).
- `server/worker/` — Cloudflare Worker scaffold + contract tests
  (this branch). README at `server/worker/README.md`.
- `cloudflare/` — task_08 Cloudflare Worker + D1 + miniflare
  integration (this branch). README at `cloudflare/README.md`.

## Spike outcome — 2026-04-27 (task_08)

A second Cloudflare Worker scaffold landed at `cloudflare/`. Where the
April-26 spike at `server/worker/` proved the **handler logic** in pure
isolation (in-memory `Map`, `/v1/envelope/:userId` URL shape), this
spike proves the **wire contract end-to-end** against the real Workers
runtime + a real D1 binding via miniflare. Crucially, it uses the URL
shape `httpCloudSaveClient.ts` actually sends — `/v1/envelope` (no
userId in path; userId rides in the Bearer header).

### What this spike proves

- **End-to-end contract round-trip via miniflare + D1.** The
  integration test (`cloudflare/test/worker.integration.test.ts`)
  bundles `cloudflare/src/worker.ts` with esbuild, boots miniflare with
  an in-memory D1 binding, applies `cloudflare/schema/0001_initial.sql`
  per test, and runs the actual `HttpCloudSaveClient` from
  `src/cloud/httpCloudSaveClient.ts` against the miniflare URL.
- **D1 schema is sufficient for the v1 envelope.** A single `envelopes`
  table (PK `user_id`, opaque `payload TEXT`, `updated_at INTEGER`)
  round-trips the envelope JSON byte-for-byte including multi-byte
  UTF-8 sequences. The Worker never parses the inner save payload.
- **HttpCloudSaveClient method coverage.** Each of the six contract
  methods (`pullEnvelope`, `pushEnvelope`, `requestAccountDeletion`,
  `getAuthState`, `signOut`, `signInForTest`) is exercised against the
  live miniflare backend; the auth-state-change paths (sign-out on
  account deletion, unauthorized when no sign-in) hold.
- **Server-side payload guard works.** A 257 KiB inner payload (one
  byte over `MAX_PAYLOAD_BYTES`) hand-constructed past the
  client-side guard is rejected with 413; the client correctly maps
  to `{ ok: false, reason: 'payload-too-large' }`.
- **Adapter contract holds for D1.** `D1Adapter.getEnvelope`,
  `putEnvelope`, `deleteUser` map cleanly to one prepared statement
  each; the `INSERT ... ON CONFLICT(user_id) DO UPDATE` pattern works
  in miniflare's SQLite-backed D1.
- **The Worker code stays small.** `worker.ts` + `routes.ts` +
  `auth.ts` + `d1Adapter.ts` + `types.ts` total ~280 LOC, well under
  the 500-LOC ceiling the charter set for the spike.
- **Sibling-project isolation holds.** `cloudflare/` has its own
  `package.json`, `tsconfig.json`, and `vitest.config.ts`; nothing in
  it leaks into the game bundle. Root `npm test` and `npm run build`
  are unaffected (4471 tests pass; `vendor-phaser` chunk size
  unchanged at 1656.88 KB raw / 374.43 KB gzip).

### What this spike does NOT prove

- **Real D1 throughput, replication lag, or cross-region behaviour.**
  Miniflare's D1 implementation is local SQLite; production D1's
  replication caveats are not exercised.
- **Real magic-link auth.** The bearer-equals-userId scheme is the
  same spike stand-in as the April-26 worker. Production auth
  (token issuance, single-use enforcement, replay defence,
  rate-limit on `/auth/request`, OWASP review) is **T421** in the
  follow-up backlog. `signInForTest` continues to throw outside
  Vitest contexts.
- **Production deployment.** No live `account_id`, no real
  `database_id` (the placeholder in `cloudflare/wrangler.toml` is
  `00000000-0000-0000-0000-000000000000`), no `wrangler deploy` run.
  Tracked as **T423**.
- **Privacy policy text + opt-in flow.** `DELETE /v1/account` is
  immediate, not soft-delete with a 7-day undo window. Tracked as
  **T422**.
- **Schema migration runner beyond `0001_initial.sql`.** The schema
  is applied with raw `db.exec` per test; production deploy needs a
  proper migration runner (wrangler's built-in handles forward-only,
  but no rollback story). Tracked as **T424**.
- **Cost economics under load.** Same as the April-26 spike: $0/mo
  claim is from Cloudflare's published free tier, not observed.

### What's intentionally NOT in this branch

- No changes to `src/cloud/*` (the Worker conforms to the existing
  client contract; not the other way around).
- No new root `package.json` deps (everything new lives under
  `cloudflare/node_modules/`; root `npm install` is unchanged).
- No `.env`, no secrets, no real Cloudflare account.
- No game-side wiring of `HttpCloudSaveClient` into `MenuScene` or
  Settings — the production default is still `NoopCloudSaveClient`,
  so offline-first behaviour is unchanged.

### Coexistence with `server/worker/`

Both spikes ship in this branch. They're not contradictory: the
April-26 worker proves the handler logic with a different route
shape; the April-27 worker proves the live wire contract with the
shape the client actually uses. T423 will replace both with one
canonical Worker; until then the duplication is intentional and
documented in `cloudflare/README.md` (§ "Why two backend dirs").

### Next steps blocked on humans

Same as the April-26 spike, plus:

- Pick which of the two scaffolds to graduate (the `cloudflare/`
  shape matches the client; the `server/worker/` shape matches the
  earlier ADR draft sketch).
- Decide whether the eventual Worker reads userId from the URL
  (server/worker style) or from the Bearer (cloudflare style). The
  cloudflare style requires real auth before deploy — a URL with
  userId is at least cacheable; an opaque bearer is not.
