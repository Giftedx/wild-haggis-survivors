# Strategy — Wild Haggis Survivors

**Last updated:** 2026-04-13 (loop 49 REFLECT)

## Project Phase
**Steady state.** v2.1.0. Hardening campaign complete. 696 tests (+43% from baseline 488). All P1s resolved. Full review rotation done (9/9) + 2nd pass on scenes. Remaining backlog = P2 polish + Low features — all diminishing returns. Project is healthy and well-tested.

## Remaining Work (all optional)
11 open items. None are crash/gameplay bugs. Pick only if motivated:
- **P2 code smells:** Enemy.applyPostBellScaling API, inputMath redundant clamp, contrastColor falsy (dead code)
- **P2 low-ROI tests:** EdgeIndicators, GamepadMenuNav, CaptionOverlay (all Phaser-dependent)
- **P2 tech debt:** ProceduralMusicEngine fragile test, euclidean Bjorklund divergence (design decision)
- **Low features:** DebugOverlay pool surfacing, telemetry toggle, a11y docs

## Done Enough (don't revisit unless bugs surface)
- Type safety: 0 production `as any` (was 17)
- Scene reach-throughs: 0 remaining (ISceneContext)
- Scene lifecycle reset correctness (verified in 2nd review rotation)
- Entity core: Player (16 tests), Enemy (status/elite), Projectile (9 tests)
- Weapon stat scaling (10 tests), SpawnSystem resume/stall (11 tests)
- Save/load system (well-tested)
- Procedural music: Conductor (15), NoteScheduler (9), euclidean (10)
- BanterSystem + weapon_evolve context, i18n, Boot textures
- Bundle: vendor chunk split (1482/340gz + 507/136gz)
- inputMath (18), SubscriptionBag (8), rotateVector (8), cameraShake (7), cameraViewport (9)
- a11y: CaptionManager (8 incl guard), a11yMotion (6), a11yText (5)
- spatialCull (14), GlobalEventBus (7), upgrades cardpool (29), runStartModifiers (12)

## Review Rotation Position
**Both rotations COMPLETE.** Cycle 1: all 9 areas. Cycle 2: scenes re-reviewed (loop 45). No new bugs found.

## Metrics Snapshot (2026-04-13, loop 49)
- Source files: 105, Test files: 87
- Tests: 696 passing (was 488 at loop 1, +43%)
- `as any`: 0 production (was 17)
- TODO/FIXME: 0
- Biggest files: GameScene 1664, Enemy 1257, WeaponSystem 1032
- Build: ~5s clean, lint 0 errors
- Vendor chunk: 1482 KiB / 340gz, App: 507 KiB / 136gz
