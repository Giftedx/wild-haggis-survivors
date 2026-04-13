# Strategy — Wild Haggis Survivors

**Last updated:** 2026-04-13 (loop 37 REFLECT)

## Project Phase
Post-hardening polish. v2.1.0. Core gameplay complete. Type safety done (0 `as any`). Test coverage strong (81/105 files, 631 tests). First full review rotation complete (9/9 areas). Entering diminishing-returns phase on testing — shift toward remaining P2 test gaps + feature completions.

## Top 3 Priorities
1. **Remaining P2 test gaps** — cameraViewport.ts + EdgeIndicators.ts (moderate value, pure-ish math). After those: only Phaser-dependent or low-ROI items remain.
2. **Feature completions** — banter weapon evolution moments, DebugOverlay pool/tween/timer surface. These add player-visible value vs more test scaffolding.
3. **SCOUT when P2 drains** — backlog nearing depletion. When open P2 items are done, SCOUT for fresh high-value work (gameplay bugs, perf opportunities, new content).

## Done Enough (don't revisit unless bugs surface)
- Type safety: 0 production `as any` (was 17)
- Scene reach-throughs: 0 remaining (ISceneContext)
- Scene lifecycle reset correctness
- Entity core: Player (16 tests), Enemy (status/elite tests), Projectile (9 tests)
- Weapon stat scaling (10 tests), SpawnSystem resume/stall (11 tests)
- Save/load system (well-tested)
- Procedural music engine: Conductor (15 tests), NoteScheduler (9 tests), euclidean (10 tests)
- BanterSystem, i18n, Boot textures
- Bundle: vendor chunk split done (1482/340gz + 507/136gz). Phaser not tree-shakeable.
- inputMath (18 tests), SubscriptionBag (8 tests), rotateVector (8 tests)
- a11y subsystem: CaptionManager (7 tests), a11yMotion (6 tests), a11yText (5 tests)

## Review Rotation Position
**Review rotation COMPLETE.** All 9 areas reviewed (loop 36).
Areas done: scenes(1), entities(2), systems(3), core(4), data(5), ui(6), utils(7), music(8), a11y(9).
Next cycle starts at scenes(1) if/when needed.

## Metrics Snapshot (2026-04-13, loop 37)
- Source files: 105, Test files: 81
- Tests: 631 passing (was 488 at loop 1, +29%)
- `as any`: 0 production (was 17)
- TODO/FIXME: 0
- Biggest files: GameScene 1664, Enemy 1257, WeaponSystem 1032
- Build: ~5s clean, lint 0 errors
- Vendor chunk: 1482 KiB / 340gz, App: 507 KiB / 136gz
