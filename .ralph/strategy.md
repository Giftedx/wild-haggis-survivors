# Strategy — Wild Haggis Survivors

**Last updated:** 2026-04-13 (loop 63 BUILD)

## Project Phase
**Steady state.** v2.1.0. Hardening campaign complete. 769 tests (Vitest) on clean `master`. All P1s resolved. Full review rotation done (9/9) + 2nd pass on scenes. Remaining backlog = P2 polish + optional features — diminishing returns. Project is healthy and well-tested.

## Remaining Work (all optional)
Open items are thin — none are crash/gameplay bugs. Pick only if motivated:
- **P2 code smells:** Enemy.applyPostBellScaling API (if any remain), minor cleanups from review notes
- **P2 low-ROI tests:** Extra Phaser-bound UI coverage only where regressions appear
- **P2 tech debt:** None blocking — Björklund + `musicMath` / `MOTION_TIMING` / music–SFX ducking landed
- **Low features:** DebugOverlay extras, docs-only polish

## Done Enough (don't revisit unless bugs surface)
- Type safety: 0 production `as any` (was 17)
- Scene reach-throughs: 0 remaining (ISceneContext)
- Scene lifecycle reset correctness (verified in 2nd review rotation)
- Entity core: Player (16 tests), Enemy (status/elite), Projectile (9 tests)
- Weapon stat scaling (10 tests), SpawnSystem resume/stall (11 tests)
- Save/load system (well-tested)
- Procedural music: Conductor (15), NoteScheduler (9), euclidean (10+), musicMath, SFX duck + smoothed master gains + AudioSystem impulses on heavy SFX
- BanterSystem + weapon_evolve context, i18n, Boot textures
- Bundle: vendor chunk split (1482/340gz + 507/136gz)
- inputMath (18), SubscriptionBag (8), rotateVector (8), cameraShake (7), cameraViewport (9)
- a11y: CaptionManager (8 incl guard), a11yMotion (6), a11yText (5)
- spatialCull (14), GlobalEventBus (7), upgrades cardpool (29), runStartModifiers (12)

## Review Rotation Position
**Both rotations COMPLETE.** Cycle 1: all 9 areas. Cycle 2: scenes re-reviewed (loop 45). No new bugs found.

## Metrics Snapshot (2026-04-13, loop 63)
- Source files: 105+, Test files: 90+
- Tests: 779 passing (includes `percussionGainScales` once tracked); loop 62 baseline 769 on clean tree. **CI rule:** run `npm test` on a clean checkout after test-only commits — loop 61 shipped duck tests without `notifyGameplaySfxImpulse` impl (fixed loop 62).
- `as any`: 0 production (was 17)
- TODO/FIXME: 0
- Biggest files: GameScene 1664, Enemy 1257, WeaponSystem 1032
- Build: ~5s clean, lint 0 errors
- Vendor chunk: 1482 KiB / 340gz, App: 507 KiB / 136gz
