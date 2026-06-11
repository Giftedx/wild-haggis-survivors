# Charter #9 — U1 Runes M4 (offers + consumers) — SHIPPED

**Date marked shipped:** 2026-05-09
**Original charter:** `docs/top-10-tasks/09-u1-runes-m4-wire-consumers.md`
**Status:** Closed. Work landed 2026-04-26 onward; charter file is now stale.

## Why stale

The charter was drafted 2026-04-26 with explicit re-entry path "flip `RUNE_CARD_OFFERS_ENABLED` only after all consumers verified." Triple-audit T111 product decision = B (keep gated) was reversed and shipped same week. Today's tree shows the inverse of what the charter premised:

- `src/data/upgrades.ts:61` — `RUNE_CARD_OFFERS_ENABLED = true`.
- `src/data/upgrades.ts:587` — rune cards surfaced into `buildCardPool` post-boss kill.
- `src/data/runeCards.test.ts:51` — test asserts `expect(RUNE_CARD_OFFERS_ENABLED).toBe(true)`.
- `runeBag` is read by 11 src/ files including `Player.ts`, `WeaponSystem.ts`, `runeSystemController.ts`, `weaponMultiplierFold.ts`, `installCombatCollisions.ts`. Charter's "no consumer reads it" premise is invalid.
- `src/systems/runes/runeConsumer.ts` exists (effect application).
- `src/systems/runes/runeConditions.ts` + tests exist.

Memory `project_u1_runes_status` confirms: **"Full ship; B5 Phases 0+1a+1b+2 grounded ... 30/31 grounded; only `edinburgh_rune` ungrounded pending B5 Phase 3 cultural consultation"**.

## What's verifiably shipped

| Charter ask | Status | Evidence |
|---|---|---|
| Flip `RUNE_CARD_OFFERS_ENABLED` | Shipped | `src/data/upgrades.ts:61` |
| Rune cards in level-up pool | Shipped | `src/data/upgrades.ts:587-599` (boss-kill gate) |
| Player consumers | Shipped | `src/entities/Player.ts` reads `runeBag` |
| WeaponSystem consumers | Shipped | `src/systems/WeaponSystem.ts` + `weaponMultiplierFold.ts` reads `runeBag` |
| XPSystem consumers | Shipped | rune effects fold through condition system |
| SpawnSystem consumers | Shipped | rune effects fold through condition system |
| Cross-system effects | Shipped | `runeSystemController.ts` orchestrates |
| Rune condition system | Shipped (M4 wired 2026-04-26 `a86afe5`) | `src/systems/runes/runeConditions.ts` + test |
| 30 rune defs grounded in lore | Shipped | `src/data/runes.ts` + B5 Phase 0+1a+1b+2 |
| Replay round-trip | Shipped | rune state in T1 replay v3 |

## What remains (not blocking ship)

- `edinburgh_rune` — single rune still ungrounded, blocked on B5 Phase 3 Edinburgh cultural consultation. Tracked under B5 charter, not here.
- Balance pass cadence — ongoing telemetry surface (`?devRuneStats=1`), not a one-shot deliverable.

## Future work surface (if a Phase M5 ever lands)

From design spec scope §3.5 cross-system effects:

1. **HUD chip** for currently-equipped runes during run — not yet built.
2. **In-run rune summary panel** (pause / GameOver) — partial; runs through `pauseStats` but no dedicated rune card.
3. **Almanac rune entries** — present in C1 framework but not all 30 runes fully written.

These are polish, not the wire-up the charter described.

## What was actually shipped this session (2026-05-09)

This stub itself + `docs/superpowers/plans/INDEX.md` restructure-row truth-up + `docs/top-10-tasks/00-INDEX.md` row #9 update. No code change — the charter was stale, not the implementation.
