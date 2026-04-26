# Prompt #3 — P3 Cloud Saves & Cross-Device

## Goal

Add a real account + cloud-save layer so player progression (gold, permanent upgrades, unlocks, run history, almanac discoveries, deeds, replays) survives device loss and syncs across devices. Today everything is `localStorage` only (`src/utils/save.ts`, `SaveManager`, key `whs_save`). Estimated 6–10 person-weeks including backend + auth + conflict handling + security review.

## Why this is #3

`docs/HUGE_INITIATIVES_MASTER_PLAN.md` flags P3 as S-tier infrastructure. Without cloud saves:
- Players who clear browser storage lose all progression (Almanac entries, gold, deeds, variant unlocks).
- Cross-device play impossible (start on desktop, finish a run on mobile is not possible).
- The Lineage Phase 0 + Chronicle data can't sync.
- Pre-requisite for any future leaderboard / community feature.

It's S-tier because it requires backend selection, OAuth or email auth, schema versioning, encryption at rest, and conflict resolution semantics — none of which exist yet.

## Source documents

1. `docs/HUGE_INITIATIVES_MASTER_PLAN.md` §P3.
2. `docs/HUGE_INITIATIVES_VERDICT.md` §32 (P3 verdict and trade-offs).
3. `docs/PRD.md` §P2 budget decisions.
4. `src/utils/save.ts` — current save shape.
5. `src/core/SaveManager.ts` (and `SaveManager.test.ts` if present) — current write paths.
6. `src/core/MetaProgressSystem.ts`, `src/core/MetaPurchase.ts` — meta progression that needs to sync.
7. `docs/adr/` — write a new ADR for backend choice.
8. `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md` — privacy / data-sovereignty implications for Scottish players + GDPR (UK + EU).

## Scope

### Phase 1 — Account layer
1. **Backend choice.** Pick one and ADR-it:
   - **Cloudflare Workers + KV/D1** (lowest friction; site already deploys to Cloudflare Pages per memory).
   - **Supabase** (Postgres + auth + RLS).
   - **Firebase** (Google auth + Firestore).
   - **Self-host** (worst).
   Recommend Cloudflare Workers + D1 unless a vetoing constraint surfaces. Single-cloud, GDPR-friendly EU pop, ties to existing deploy.
2. **Auth flow.** Email magic-link minimum; optional OAuth (Google/Apple). Don't build username/password — it's a footgun and unnecessary for a single-player game.
3. **Sign-in UX.** New menu entry on `MenuScene`. "Continue offline" path always present — cloud save is opt-in.

### Phase 2 — Sync engine
1. **Schema versioning.** Bump save schema to a versioned envelope: `{ version, lastModified, deviceId, payload }`. Existing local save is `version 17` per memory (after U1 Runes); cloud envelope sits *around* the existing payload, doesn't replace it.
2. **Conflict resolution.** Last-Writer-Wins is fine for v1 (single-player, single-account). Document the LWW rule explicitly + show user a "you have a newer save on another device, restore?" dialog if the cloud version is newer than local on sign-in.
3. **Sync triggers:**
   - On sign-in: pull cloud → diff vs local → resolve.
   - On run end: push delta.
   - On manual "sync now" button.
   - **Not** on every settings change — debounce.
4. **Offline-first.** All writes still hit `localStorage` first. Sync is best-effort. If offline, queue and flush on reconnect.

### Phase 3 — Encryption + privacy
1. **At-rest encryption.** D1/KV encrypt by default; nothing extra needed unless data leaks via API.
2. **In-transit.** HTTPS already.
3. **Account deletion.** GDPR Article 17 — must support full delete. Add "Delete my data" button.
4. **Privacy policy.** Short, plain-language, lives at `/privacy.html`. Mention what's stored (run stats, no PII other than email).
5. **Audit log** (server-side) — track sync attempts but no payload contents.

### Phase 4 — UI surfacing
1. **Settings → Account section.** Sign in / sign out / delete data / last sync time.
2. **Toast on sync events** — both success and failure (T131-style, save failure visibility per triple-audit).
3. **Status indicator** in MenuScene corner: cloud icon (synced / pending / offline / signed-out).

## Sub-tasks (suggested order)

1. ADR-0006 backend choice.
2. Stand up minimal Worker + D1 + email magic-link auth. Smoke-test from local dev.
3. Define `CloudSaveEnvelope` type + serialization round-trip tests.
4. Implement `CloudSaveClient.ts` (pure module, no Phaser imports — vitest covers it).
5. Wire into `SaveManager` write paths via observer pattern (don't couple).
6. MenuScene Account UI.
7. Settings Account section + delete-data flow.
8. Sync conflict UX (modal with timestamps).
9. End-to-end test: sign in → run → log out → sign in elsewhere → run resumes.
10. Privacy policy + Settings link to it.
11. Security review (read OWASP top 10, audit auth, validate payload size limits).
12. Bundle budget — auth + sync layer must add ≤30 KB gzip.

## Acceptance criteria

- Player can opt into cloud save with email magic-link.
- Run progress survives `localStorage.clear()` (test: clear, sign in, restored).
- Two devices stay in sync within 30 s of run end.
- Conflict UX shows on real conflict.
- Account deletion removes all data within 30 days.
- Privacy policy linked from Settings.
- Bundle budget ≤+30 KB gzip.
- `npm run ci:all` green; new e2e spec for sign-in + sync round-trip.
- Security review checklist green.
- ADR-0006 merged.

## Anti-patterns to avoid

- **Don't gate single-player on cloud.** Offline-first non-negotiable. The game must play unchanged with no account.
- **Don't store anything beyond the existing `whs_save` payload + email.** No analytics in v1. No telemetry. Memory note: `michael.mcmillan93@gmail.com` is the user — privacy-conscious context.
- **Don't write password auth.** Magic link or OAuth only.
- **Don't put the API key in the client.** Public Worker URL only; rate-limit by IP + per-account.
- **Don't fail loud on sync errors.** Toast + retry. Saving must never block the player.
- **Don't bump save version unnecessarily.** The envelope wraps existing v17; do not migrate the inner payload.
- **Don't treat Cloudflare-Pages deploy memory note as binding** — that's the static frontend host. Workers + D1 are a separate Cloudflare product.

## Verification path

```
npm run lint
npm run build
npm test                # CloudSaveClient tests, schema tests
npm run test:e2e        # new sign-in + sync spec
```

Plus manual:
- Sign in on Chrome → run → win → check cloud blob via Worker admin.
- `localStorage.clear()` → sign in → progress restored.
- Sign in on Firefox same account → cloud → local sync ok.
- Account-delete flow → re-sign-in → empty save (correct).
- Network offline → all writes still go to localStorage; reconnect → flush cleanly.

## CLAUDE.md gotchas relevant here

- `localStorage` quota / private-mode failures still occur — the toast-on-save-failure work (triple-audit T131, may be in-flight) covers local; cloud sync needs its own toast scheme on top.
- Save reuse on scene restart — cloud sync must not interfere with mid-run saves; only flush at run boundaries.
- AudioContext singleton — sync should never call `ctx.suspend()` (per memory + CLAUDE.md gotcha); auth UI should not impact audio.

## Soul checks

- Voice Card: account UI lives in Hearth register. "Sign in" → "Bring yer croft wi' ye"; "Delete data" → calm + factual, no Edge tone.
- Privacy promise must read true. Scottish players are GDPR-protected; lean into clarity over legalese.

## Risk + descope levers

If timeline slips:
- Drop OAuth, ship email magic-link only. (-2 weeks)
- Drop conflict UX modal — fall back to silent LWW. (-3 days)
- Drop "Delete my data" UI; serve via admin email request. (Don't do this; GDPR.)

If perf / bundle bloats:
- Lazy-load auth library only when player taps Sign In. Save 15+ KB until used.

Risk to manage:
- Backend cost. Estimate < $5/mo at 10k MAU on Cloudflare. Track from day one.
- Account security. Add rate-limiting from launch; don't wait for a breach to bolt it on.
