# P3 Cloud Saves — Backend Decision Matrix

**Status:** ✅ Accepted 2026-05-09 — Cloudflare Workers + D1 + magic-link via Resend ratified by lead dev. ADR-0006 promoted `.draft.md` → `.md`, Status flipped to Accepted. Per OPEN_QUESTIONS.md Q4. Legal/ops humans-in-the-loop work (privacy text, GDPR controller, account provisions) tracked in `docs/top-10-tasks/blocked/03-blocked-on-human.md` items 3–6.
**Date:** 2026-04-26 (matrix authored); 2026-05-09 (architectural decision ratified).
**Author:** Agent 3 of P3 charter execution.
**Charter:** `docs/top-10-tasks/03-p3-cloud-saves.md`

This document collects the constraints, options, and tradeoffs for the
P3 Cloud Saves backend selection. The choice is **a stakeholder decision**
because it commits the project to recurring cost, a privacy posture, and
an operational surface that the maintainer (one person) will own
indefinitely. This doc closes with a **recommendation** but does NOT
finalise the pick.

If you have not read the charter (`docs/top-10-tasks/03-p3-cloud-saves.md`)
read that first; it sets goals, anti-patterns, and acceptance criteria
this doc has to honour.

---

## 1. Project constraints (non-negotiable)

These are the inputs that shape the decision. They come from the charter,
existing repo memory, and the master plan.

| # | Constraint | Source | Implication |
|---|---|---|---|
| C1 | Offline-first. Game must remain fully playable with no account, no network. | `03-p3-cloud-saves.md §Anti-patterns`, `DESIGN_SOUL.md` warmth charter | Cloud is opt-in; `localStorage` remains the source of truth for offline play. |
| C2 | Solo indie maintainer; one developer-hour budget for ops. | Project memory (`feedback_finish_the_job.md`, `feedback_drive_the_project.md`). | Backend must be near-zero-ops. No 24/7 oncall; no manual scaling. |
| C3 | Browser-only frontend, deployed at `wild-haggis-survivors.pages.dev` (Cloudflare Pages, manual `wrangler` deploy). | Project memory `reference_deploy_cloudflare.md`. | Same-vendor backend lowers operational complexity. |
| C4 | GDPR (UK + EU) compliance — data controller is the maintainer. Right-to-delete (Article 17), right-to-access (Article 15), data minimisation (Article 5). | `CULTURAL_SENSITIVITIES_RESEARCH.md` privacy posture; charter §Phase 3. | Must support full account deletion within 30 days; minimal PII (email only). |
| C5 | Privacy-conscious user (the project owner is the primary daily user; email on file `michael.mcmillan93@gmail.com`). | Charter §Anti-patterns, project memory. | No telemetry beyond what's strictly needed. |
| C6 | Bundle budget: client auth + sync layer ≤30 KB gzip. | Charter §Phase 4 + acceptance criteria. | Heavy SDKs (Firebase JS) need lazy-load or rejection. |
| C7 | Save payload size: existing `whs_save` JSON is on the order of 5–50 KB depending on Almanac progress + replay blob. Worst case ≤200 KB. | Inspection of `src/utils/save/` module (post-2026-05-07 split: schema in `schema.ts`, types in `types.ts`, migrations in `migrations.ts`; barrel re-export at `src/utils/save.ts`; schema v17). | Per-row storage budget must comfortably fit; not a row-DB sweet spot but trivial for any modern KV/SQL. |
| C8 | Auth: magic-link minimum, no password (charter explicit). OAuth Google/Apple is optional. | Charter §Phase 1.2 + §Anti-patterns. | Provider must support email magic-link or we build it; SMTP/email service required. |
| C9 | Cost ceiling: <$5/mo at 10k MAU. | Charter §Risk. | Rules out always-on VM hosting; rules out per-row hot-path pricing at scale. |
| C10 | Data residency: prefer EU/UK pop. UK player base implied by Scottish theming; GDPR controller in UK. | `CULTURAL_SENSITIVITIES_RESEARCH.md`. | Vendor must let us pin to EU region, OR be globally-distributed enough that this is moot. |

---

## 2. Options under consideration

### 2.1 Cloudflare Workers + D1 (SQLite)

Workers = serverless edge JS runtime. D1 = SQLite at edge, with replication.

- **Auth pairing:** Cloudflare Access (OAuth via Google/Apple/Microsoft/email-otp), or roll-our-own magic-link via `crypto.randomUUID` tokens stored in KV/D1, sent via a transactional email provider (Resend, Postmark — ~$0/mo at this volume).
- **Storage shape:** one row per (user, save-version-envelope). PRIMARY KEY (user_id, schema_version). Periodic prune of old envelopes.
- **Edge case to know:** D1 is in GA but has had read-replication caveats; for a single-writer-per-user save, this is fine. No multi-writer concurrency.

### 2.2 Cloudflare Workers + KV

Workers = same. KV = eventually-consistent edge key/value store.

- **Auth:** same options as 2.1.
- **Storage shape:** key `save:{userId}:{schemaVersion}` → JSON blob. Last-Writer-Wins fits KV's model perfectly.
- **Edge case:** KV is eventually consistent (up to ~60s propagation between regions). For a single-user save, the read-after-write hazard is the same device writing then immediately reading via a different POP — vanishingly rare in our use case.

### 2.3 Supabase (Postgres + Auth + Row-Level Security)

Hosted Postgres with batteries-included auth, magic-link out of the box.

- **Auth:** built-in `supabase.auth.signInWithOtp({ email })` — magic link flow ready.
- **Storage shape:** `saves` table with RLS policy `auth.uid() = user_id`.
- **Bundle cost:** Supabase JS SDK is ~30 KB gzipped on its own — collides with charter §Bundle budget. Lazy-loading required.
- **Edge case:** EU region available (`eu-west-1` Frankfurt). Free tier: 500 MB DB, 50k MAU, paused after 7 days inactivity (project gets paused if zero traffic). Pro tier: $25/mo — over our $5 ceiling.

### 2.4 Firebase (Firestore + Firebase Auth)

Google's BaaS. Magic-link not native (email-link sign-in is, but flows through Firebase domains, not ours).

- **Auth:** `signInWithEmailLink` works, but the magic-link redirects through `firebaseapp.com` — UX cost.
- **Storage shape:** Firestore document per user.
- **Bundle cost:** Firebase modular JS SDK is ~50–80 KB gzipped including auth + firestore — fails charter §Bundle budget.
- **Privacy posture:** Google as data processor. Acceptable under GDPR with their DPA, but the Soul Charter / privacy-conscious user constraint (C5) leans against this.
- **Region:** `europe-west` available; per-read pricing favourable but adds up at scale.

### 2.5 Self-host (e.g., Hetzner VPS + Postgres)

A €4/mo VPS with our own Express+Postgres+Caddy stack.

- **Auth:** roll our own magic-link.
- **Cost:** €4/mo all-in.
- **Maintenance:** **disqualifying.** Patch management, TLS rotation, DB backup, oncall when the disk fills up. Constraint C2 alone vetoes this.
- **Mention only for completeness; do not pick.**

### 2.6 No backend — encrypted save export/import

Bypass cloud entirely; player exports a save blob (file download) and imports on the other device.

- **Cost:** zero.
- **UX:** poor — manual sync is what 1990s save-state emulators did. Charter §Phase 2 specifies automated cross-device sync.
- **Mention only as a fallback/descope lever.** If P3 gets blocked indefinitely, ship export/import as a stopgap so the GDPR right-to-portability is at least covered.

---

## 3. Tradeoff matrix

Score: ✓ = strong fit, ~ = acceptable, ✗ = poor fit / disqualifying.

| Criterion | CF Workers + D1 | CF Workers + KV | Supabase | Firebase | Self-host | Export/import |
|---|---|---|---|---|---|---|
| **C1 — Offline-first compatible** (server is opt-in only) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **C2 — Near-zero ops** | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| **C3 — Same-vendor as deploy** | ✓ | ✓ | ✗ | ✗ | ✗ | n/a |
| **C4 — GDPR right-to-delete tractable** | ✓ (DELETE row by user_id) | ✓ (delete keys by prefix) | ✓ (built-in) | ~ (Firebase Auth deletion + Firestore cascade is doable but multi-step) | ✓ | n/a |
| **C5 — Privacy posture (minimal third parties)** | ✓ (one vendor) | ✓ (one vendor) | ~ (Supabase + their underlying AWS) | ~ (Google) | ✓ | ✓ |
| **C6 — Bundle ≤30 KB gzip** | ✓ (custom thin client ~3 KB) | ✓ (custom thin client ~3 KB) | ✗ at default; ~ with lazy-load | ✗ at default; ~ with lazy-load | ✓ | ✓ |
| **C7 — Save payload fit** | ✓ (TEXT column, no issue) | ✓ (KV value up to 25 MB) | ✓ (jsonb column) | ✓ (1 MB doc limit, plenty) | ✓ | n/a |
| **C8 — Magic-link ready** | ~ (build it: ~50 lines + email service) | ~ (same) | ✓ (built-in) | ~ (works but redirects through firebaseapp.com) | ~ (build it) | n/a |
| **C9 — Cost <$5/mo at 10k MAU** | ✓ (Workers free up to 100k req/day; D1 free up to 5GB; well under) | ✓ (KV free tier covers easily) | ~ (free tier pauses on inactivity; Pro $25/mo) | ✓ (Spark free tier fine for 10k MAU) | ✓ | ✓ |
| **C10 — EU/UK data residency** | ✓ (D1 has region pinning; EU pop available) | ✓ (KV is global, accept-able) | ✓ (eu-west-1) | ✓ (europe-west) | ✓ (Hetzner DE) | n/a |

---

## 4. Recommendation

**Cloudflare Workers + D1**, paired with magic-link auth implemented in
~50 lines of Worker code and email delivery via Resend (~$0/mo at our
volume; first 3000 emails free, then $0.001 each).

### Why D1 over KV

- **Schema clarity.** D1 lets us model `users`, `saves`, `audit_log` as
  proper tables. KV's `key → JSON` model is fine for the save itself, but
  audit logging + magic-link tokens want a relational model anyway. Better
  to have one storage primitive than two.
- **Range queries.** "Show me all saves for user X with version ≥ Y" is
  a one-line SQL query in D1. In KV it's a key-prefix scan plus per-key
  fetch. Comes up for the conflict-resolution UX in charter §Phase 2.2.
- **D1 strong consistency for primary writes.** KV's eventual consistency
  is fine in practice for our use case but is a footgun if we ever expand
  to e.g. "delete account" → "re-sign-up" same email within propagation
  window.
- **Cost is identical at our scale.** Both free tiers comfortably cover
  10k MAU.

### Why not Supabase

Supabase is the strongest "if we already had it" option — the SDK is
nice and magic-link is one function call. But:

1. SDK bundle pressure (charter §C6) requires lazy-loading regardless.
2. Free tier auto-pauses on 7-day inactivity. Our use case has
   intermittent traffic; a Burns-Night-only player triggers a cold-start
   resume on Jan 25 every year. Acceptable, but adds latency on the
   exact rare event we want to feel polished.
3. Adds a second cloud vendor to the project. Constraint C3 favours
   single-vendor.

If a vetoing constraint emerges later (e.g. we want SQL replication, or
the maintainer is more comfortable with Postgres than D1's SQLite), this
recommendation falls back to Supabase — not Firebase.

### Why not Firebase

- Bundle cost.
- Magic-link redirects through Firebase domains — UX cost and a
  trust-signal cost (the Soul Charter cares about "feels like the game
  is on the player's side").
- Privacy posture leans against an additional Google-hosted touchpoint.

### Why not self-host

- Constraint C2 (one-developer-hour ops) vetoes anything that requires
  patch management or oncall.

### Auth provider sub-decision

**Roll our own magic-link in the Worker.** Code is ~50 lines:

```
POST /auth/magic { email }
  → generate UUID token
  → INSERT INTO auth_tokens (token, email, expires_at) VALUES (?, ?, NOW() + 15 min)
  → send email via Resend with link `https://wild-haggis-survivors.pages.dev/auth/verify?t={token}`

GET /auth/verify?t={token}
  → SELECT email FROM auth_tokens WHERE token = ? AND expires_at > NOW()
  → DELETE token (one-time use)
  → INSERT user if not exists
  → set HttpOnly cookie with signed session JWT (HS256, 30-day)
```

OAuth (Google, Apple) added in a v2 phase if user research shows
magic-link friction is unacceptable. Charter §Risk lever already lists
"drop OAuth, ship magic-link only" as a -2-week save.

---

## 5. Costs (rough)

At 10k MAU, ~5 round trips per active user per month (sign-in + run-end
pushes), ~50 KB save blob:

- **Workers requests:** ~50k/mo. Free tier: 100k/day. **$0.**
- **D1 reads/writes:** ~50k each. Free tier: 5M reads + 100k writes per day. **$0.**
- **D1 storage:** 10k users × 50 KB = 500 MB. Free tier: 5 GB. **$0.**
- **Resend emails:** ~1k magic-links per month. Free tier: 3k/mo. **$0.**
- **Cloudflare Pages bandwidth:** unchanged, already in use.

Total at 10k MAU: **$0/mo**. Headroom to 100k MAU before any bill arrives.

If audit logs grow unbounded, prune older than 90 days monthly via a
Cron Trigger (free).

---

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Resend account suspended / rate-limit hit | Add second SMTP provider (Postmark) as fallback. ~5-line config swap in the Worker. |
| Cloudflare D1 outage | Sync is best-effort; client-side `localStorage` remains source of truth (offline-first). Toast retries. |
| Auth token leakage via URL | Tokens are one-time-use, 15-minute expiry, deleted on first use. Mitigates. |
| GDPR data-subject request from non-EU | Process anyway; lower bar than EU-native, no extra effort. |
| Maintainer burnout (one human owning all ops) | Cloudflare alerts → email. Cron-cleaned audit log. Documented runbook in `/docs/runbook/cloud-save-ops.md` (write this when shipping Phase 1). |
| Worker logic bug nukes saves | Daily D1 backup via Cloudflare's snapshot feature. Restore is a CLI one-liner. |
| Schema migration server-side | The save-payload envelope (`{version, lastModified, deviceId, payload}`) wraps the inner v17 payload unchanged. Server doesn't need to understand inner shape — pure passthrough. Migrations remain client-side, where they already live. |

---

## 7. What this document does NOT decide

The following remain stakeholder calls. Use the "Open decisions" section
of `docs/top-10-tasks/blocked/03-blocked-on-human.md`:

1. **Approve the recommendation, or specify a different backend.**
2. **Approve the recommended auth flow (magic-link only at v1).**
3. **Resend vs Postmark vs other email-service** for transactional sends.
4. **Privacy policy text** — needs a human-written page at `/privacy.html`.
5. **GDPR controller details** (legal name + UK address) for the privacy
   policy.
6. **Acceptable account-deletion latency** — charter says "within 30
   days"; we can do real-time. Pick the simplest.

---

## 8. References

- `docs/top-10-tasks/03-p3-cloud-saves.md` — charter.
- `docs/HUGE_INITIATIVES_MASTER_PLAN.md §P3` — strategic context.
- `docs/HUGE_INITIATIVES_VERDICT.md §32` — verdict and trade-offs.
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md` — GDPR + Scottish-content privacy.
- `src/utils/save/` — current schema (`whs_save`, v17). Module split: `schema.ts` (version + helpers), `types.ts` (`SaveData` shape), `migrations.ts` (full chain), `bumpers.ts`/`history.ts`/`queries.ts`/`variants.ts`/`io.ts`. Barrel at `src/utils/save.ts`.
- `src/core/SaveManager.ts` — meta save (`whs_meta_save`, v9).
- `src/core/SettingsManager.ts` — settings save (`whs_game_settings`, v1).
- `src/utils/saveFailure.ts` — T131 emitter; cloud sync will route through here.

---

## 9. Status

- [ ] Stakeholder review of this matrix.
- [ ] Approval of backend pick (default: Cloudflare Workers + D1).
- [ ] Approval of auth pick (default: magic-link via Resend).
- [ ] Approval of privacy-policy boilerplate.
- [ ] Once approved → ADR-0006 written, Worker stub + magic-link flow built, `CloudSaveClient` lifted from preview-mode into production.

Until then, this branch ships **only** the non-backend-dependent
infrastructure (envelope type, conflict helpers, settings stub, opt-in
plumbing) so the integration is one connector swap away.
