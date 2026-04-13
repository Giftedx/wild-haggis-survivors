# Strategy — Wild Haggis Survivors

**Last updated:** 2026-04-13 (loop 73 BUILD)

## Project Phase
**Steady state.** v2.1.0. Hardening campaign complete. 784 tests (Vitest) on clean `master`. All P1s resolved. Full review rotation done (9/9) + 2nd pass on scenes. Remaining backlog = P2 polish + optional features — diminishing returns. Project is healthy and well-tested.

## Remaining Work (all optional)
Open items are thin — none are crash/gameplay bugs. Pick only if motivated:
- **P2 code smells:** None flagged — `applyPostBellScaling` behavior is settled (see `Enemy.test.ts`); only minor cleanups if review notes surface
- **P2 low-ROI tests:** Extra Phaser-bound UI coverage only where regressions appear
- **P2 tech debt:** None blocking — Björklund + `musicMath` / `MOTION_TIMING` (duck τ + gameplay impulses) / music–SFX ducking landed; `AudioSystem` + `ProceduralMusicEngine` read `MOTION_TIMING` via `core/motionTiming` (`musicMath` remains definition + pure helper tests)
- **Low features:** DebugOverlay extras, docs-only polish

## Done Enough (don't revisit unless bugs surface)
- Type safety: 0 production `as any` (was 17)
- Scene reach-throughs: 0 remaining (ISceneContext)
- Scene lifecycle reset correctness (verified in 2nd review rotation)
- Entity core: Player (16 tests), Enemy (status/elite), Projectile (9 tests)
- Weapon stat scaling (10 tests), SpawnSystem resume/stall (11 tests)
- Save/load system (well-tested)
- Procedural music: Conductor (15), NoteScheduler (9), euclidean (10+), musicMath, SFX duck + smoothed master gains + `MOTION_TIMING` via `core/motionTiming` for engine + AudioSystem impulses (combat + level-up / achievement / purchase); Euclidean phrase pulse count drives kick/hat gain via `percussionKickHatGainScales`
- BanterSystem + weapon_evolve context, i18n, Boot textures
- Bundle: vendor chunk split (1482/340gz + 507/136gz)
- inputMath (18), SubscriptionBag (8), rotateVector (8), cameraShake (7), cameraViewport (9)
- a11y: CaptionManager (8 incl guard), a11yMotion (6), a11yText (5)
- spatialCull (14), GlobalEventBus (7), upgrades cardpool (29), runStartModifiers (12)

## Review Rotation Position
**Both rotations COMPLETE.** Cycle 1: all 9 areas. Cycle 2: scenes re-reviewed (loop 45). No new bugs found.

## REFLECT — music / SFX duck arc (loops 62–68, 2026-04-13)
- **What shipped:** `notifyGameplaySfxImpulse` + exponential duck recovery; `AudioSystem` routes all salient SFX through `MOTION_TIMING`; Euclidean phrase density scales rhythm kick/hat; `percussionKickHatGainScales` tested; `AudioSystem.test.ts` locks duck wiring; `core/motionTiming` re-exports timings for non-music layers.
- **Risks accepted:** Duck strengths are hand-tuned tables — no automated loudness measurement; phrase-boundary pulse snapshot is subtle but covered by integration behavior + percussion tests.
- **Process:** Loop 61 reminder: never commit test-only without running tests on clean tree. **Loop 70:** dropped `ralph-loop62-wip` + `autonomous-loop-wip` — both conflicted on current `master` (music duck + telemetry already landed); no unique clean hunks worth salvaging without manual merge.
- **Windows:** If `git status` shows hundreds of files “modified” with `old mode 100755 / new mode 100644` only, run `git config core.filemode false` in this repo (executable-bit noise). **Loop 71:** same note added to `CLAUDE.md` + `AGENTS.md` for discoverability.
- **Next if bored:** Optional in-game listen pass; P2 scene/UI tests only on regression.

## Metrics Snapshot (2026-04-13, loop 73)
- Source files: 105+, Test files: 101+
- Tests: 784 passing; loop 62 baseline 769 on clean tree. **CI rule:** run `npm test` on a clean checkout after test-only commits — loop 61 shipped duck tests without `notifyGameplaySfxImpulse` impl (fixed loop 62).
- `as any`: 0 production (was 17)
- TODO/FIXME: 0
- Biggest files: GameScene 1664, Enemy 1257, WeaponSystem 1032
- Build: ~5s clean, lint 0 errors
- Vendor chunk: 1482 KiB / 340gz, App: 507 KiB / 136gz
