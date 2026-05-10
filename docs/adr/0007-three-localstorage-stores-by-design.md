# ADR 0007 — Three `localStorage` stores by design (no consolidation)

**Status:** Accepted — 2026-05-10
**Date:** 2026-05-10
**Supersedes:** —
**Superseded by:** —

## Context

The repo persists state to **three** independent `localStorage` keys, each owned by one module:

- `whs_save` — `src/utils/save/` module, schema **v18**. Combined save: meta progression (gold, unlocks, deeds), run history (last 20), replay blobs, run-specific bookkeeping (`lemmingsSeenForVariant`, `seenRunes`, etc.).
- `whs_meta_save` — `src/core/SaveManager.ts`, schema **v9**. Kills, achievements, mid-run resume (`activeRun: IRunState | null`).
- `whs_game_settings` — `src/core/SettingsManager.ts`, settings v1. Audio / motion / accessibility / keybindings / locale / first-launch flags (`photosensitivityWarningSeen`, `culturalContentSplashSeen`).

The two save stores overlap on a small number of fields by design:
- Achievements / unlocks live in both for historic reasons (achievements migrated from `whs_save` to `whs_meta_save`; the old fields persist defensively).
- Run-related counters appear in `whs_meta_save.activeRun` snapshot for resume + in `whs_save.runHistory[]` post-mortem.

The 2026-05-10 review ([`docs/REVIEW.md`](../REVIEW.md) S1) flagged the duplication as deferred indefinitely. This ADR closes that deferral by ratifying the existing structure.

## Decision

**Keep the three stores. Do not consolidate.**

Rationale:

1. **Each store has a distinct ownership boundary.** `SettingsManager` reads + writes from anywhere (it's a singleton); `SaveManager` is owned by the lifecycle hook layer; the legacy `whs_save` module is owned by the run-recorder + chronicle UI. Merging them into one store would either re-introduce reach-through (every system writes to one giant blob) or require a facade with the same boundary semantics — net-zero on architecture, net-positive on migration risk.

2. **Failure isolation.** Settings corruption can't take down save state. Save corruption can't take down settings. Three storage quotas means a saturated `whs_save` (replay blobs at FIFO cap) doesn't block settings writes. The `emitSaveFailure(path, err)` event bus already routes per-store failures to the toast surface ([`src/utils/saveFailure.ts`](../../src/utils/saveFailure.ts) + `GLOBAL_SAVE_FAILED` listener in `GameScene`). One store would lose this granularity.

3. **Migration cost is real.** Each store has its own version chain — `whs_save` v1→v18 (18 steps), `whs_meta_save` v1→v9 (9 steps), `whs_game_settings` v1 (single version). A coupled migration would need to traverse all three in lockstep, with rollback semantics for partial-failure cases. The current chains are independent — an `whs_save` migration failing doesn't risk `whs_meta_save` data.

4. **The "overlap" is small + bounded.** Reviewing the schemas (verified 2026-05-10):
   - `unlockedVariants` exists only in `whs_save`.
   - Achievements live in `whs_meta_save.unlockedAchievements`; legacy fields in `whs_save` are no longer written but still readable for backwards-compat with pre-v6 saves.
   - `activeRun` lives only in `whs_meta_save`; `runHistory` lives only in `whs_save`.
   The "overlap" is a single class of field: legacy achievement readers in the old store. Removing them would break pre-v6 save migration.

5. **The cloud-save layer ([ADR-0006](0006-cloud-save-backend.md)) handles the trinity already.** The Worker envelope is schema-blind and accepts a `{ save, metaSave, settings }` triple. Consolidation buys nothing for cloud sync.

## Alternatives considered

- **Merge `whs_meta_save` into `whs_save`** with a coupled v18→v19 + v9→v10 migration. Rejected: failure isolation loss; rollback semantics need an ADR of their own; migration risk on a working solo-deployed product.
- **Adopt IndexedDB for the larger store.** Rejected: localStorage is fine at our scale; switching introduces async-IO surface across every save read; offline-from-first-visit guarantee complicates with IDB upgrade events.
- **Persist via the cloud-save layer end-to-end.** Rejected: violates ADR-0006's offline-first constraint; the Worker is opt-in for users who choose cloud sync.

## Consequences

- **Pros.**
  - Failure isolation between settings / progression / replay-blob storage.
  - Independent migration chains; new fields land in the most semantically appropriate store without coupling.
  - Cloud-sync surface unchanged ([ADR-0006](0006-cloud-save-backend.md) envelope).
  - The CONTRIBUTING.md "Save state chain" stays as-written: bump one store's schema, add one migration step.

- **Cons.**
  - Three places to look for "where does field X live". Documentation burden borne by [`README.md`](../../README.md) Persistence + [`CLAUDE.md`](../../CLAUDE.md) Persistence + [`AGENTS.md`](../../AGENTS.md) Persistence (already reflects the trinity).
  - The legacy achievement-fields-in-old-store carry-over is ugly. Cleaning it would need a v19 migration that drops the unused fields after a quarter of player exposure to v18+.

- **Follow-ups (trigger → action):**
  1. Pre-v6 saves drop below 1% of population → drop the legacy achievement fields from `whs_save` types in a v19 cleanup migration.
  2. Cloud-save (P3) ships → re-evaluate whether the trinity envelope makes sense or if the Worker should normalise.
  3. Storage quota becomes a real concern (>3 MB total persisted) → evaluate IDB migration as a per-store upgrade, not a consolidation.

## Rollback

This ADR is documentation-only — no code changes. Rollback is simply removing the file; the existing three-store architecture is unaffected.
