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
