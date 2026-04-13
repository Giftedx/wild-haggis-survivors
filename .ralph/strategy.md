# Strategy — Wild Haggis Survivors

**Last updated:** 2026-04-13 (loop 37b REFLECT)

## Project Phase
Test coverage plateau. v2.1.0. 684 tests (+40% from baseline 488). All P1s complete. Only P2 polish + L features remain. Shift to feature work for player-visible value.

## Top 3 Priorities
1. **Feature completions** — banter weapon evolution moments, DebugOverlay. Player-visible value over more test scaffolding.
2. **Remaining P2 polish** — 8 items (doc fixes, code smells, low-ROI tests). Pick only when no feature work available.
3. **Second review rotation** — if features complete + P2 drains, start fresh cycle at scenes(1) to find new bugs/gaps after all the changes.

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

## Metrics Snapshot (2026-04-13, loop 37b)
- Source files: 105, Test files: 86
- Tests: 684 passing (was 488 at loop 1, +40%)
- `as any`: 0 production (was 17)
- TODO/FIXME: 0
- Biggest files: GameScene 1664, Enemy 1257, WeaponSystem 1032
- Build: ~5s clean, lint 0 errors
- Vendor chunk: 1482 KiB / 340gz, App: 507 KiB / 136gz
