# Strategy — Wild Haggis Survivors

**Last updated:** 2026-04-13 (loop 90 BUILD)

## Project Phase
**Steady state.** v2.1.0. Hardening campaign complete. 828 tests (Vitest) on clean `master`. All P1s resolved. Full review rotation done (9/9) + 2nd pass on scenes. Remaining backlog = P2 polish + optional features — diminishing returns. Project is healthy and well-tested.

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
- **Loop 75:** `ProceduralMusicEngine.test` stubs a minimal `update()` path and asserts `musicSfxDuck` after one tick matches `expApproach` (pairs with loop 74 pure formula regression in `musicMath.test.ts`).
- **Loop 76:** `audioContext.test.ts` exercises the real module (not the `AudioSystem` mock): ctor failure, singleton reuse, closed-context rebuild + compressor `disconnect`, and `getOutputNode` → compressor `connect(destination)`.
- **Loop 77:** `musicMath.test.ts` covers `smoothstep` (incl. degenerate edges), `expApproach` τ≤0 snap-to-target, and `logLerp` linear fallback when an endpoint ≤0.
- **Loop 78:** `musicMath.test.ts` — `logLerp` clamps `t` in geometric mode; `softKnee` hard step when `span ≤ 0`.
- **Loop 79:** `RunStatsTracker.test.ts` — `sortedWeaponDamageEntries` omits `damage ≤ 0` (Game Over weapon rows).
- **Loop 80 (autonomous discovery):** Scanned for untested wiring — `applyAudioFromUserSettings` had 0 tests while used from GameScene / menus / settings; added `applyAudioFromSettings.test.ts` (volume routing + `> 0.001` dead-zone + asymmetric SFX off / music on).
- **Loop 81:** `passiveEffects.test.ts` — `applyPassiveEffect` was only indirectly covered (mocked in `runStartModifiers.test`); direct contract tests for all 9 passive keys + unknown-key no-op.
- **Loop 82:** `StatComposer.test.ts` — `getPlayerStats` with `unlockedUpgrades: undefined` (simulated legacy/malformed JSON) matches pristine baseline via `?? []`.
- **Loop 83:** `enemies.test.ts` — `getEnemyDisplayName` (map + title-case fallback + `''`); `getEnemyConfigsByKeys` skips unknown keys, keeps order.
- **Loop 84:** `formatVariantModifierSummary` (classic baseline vs `moor_runner` multi-line); `getAvailableEnemyTypes` respects `appearsAt` (tourist @0, chef after 90s).
- **Loop 85:** `coerceVariantKeys` (non-array → `[]`, stable `VARIANT_KEYS` order); `meetsVariantUnlockCondition` (`classic` default, `moor_runner` best-time threshold); `isVariantUnlocked` + `unlockedVariants` override.
- **Loop 86:** `formatRunVariantLabel` (name-only vs `| ` summary); `formatVariantUnlockText` (`variant.unlock.ready` when met, progress pattern when `moor_runner` still locked).
- **Loop 87:** `save.test.ts` — `coerceSelectedVariant` rejects non-strings (null/undefined/number/object → classic); `evaluateVariantUnlocks` with `previouslyUnlocked === VARIANT_KEYS` yields empty `newlyUnlockedVariants`.
- **Loop 88:** `migrateSave` non-record payloads → `createDefaultSave()`; `bestEndlessSeconds` via `coerceInteger` (floor, clamp ≥0, reject non-finite).
- **Loop 89 (autonomous):** `save.test.ts` — `runHistory` tail cap (`slice(-MAX_RUN_HISTORY)`), row coercion (`weaponKeys` filter, `curseKey` omit when empty, `level` ≥1, strict `isVictory` boolean), non-array `runHistory` → `[]`.
- **Loop 90:** `save.test.ts` — `normalizeRunSummary` time path via `computeGoldReward` (fractional round-up, negative clamp); `applyRunSummary` history entry mirrors `RunHistoryContext`, empty `curseKey` not stored.
- **Next if bored:** Optional in-game listen pass; P2 scene/UI tests only on regression.

## Metrics Snapshot (2026-04-13, loop 90)
- Source files: 105+, Test files: 104+
- Tests: 828 passing; loop 62 baseline 769 on clean tree. **CI rule:** run `npm test` on a clean checkout after test-only commits — loop 61 shipped duck tests without `notifyGameplaySfxImpulse` impl (fixed loop 62).
- `as any`: 0 production (was 17)
- TODO/FIXME: 0
- Biggest files: GameScene 1664, Enemy 1257, WeaponSystem 1032
- Build: ~5s clean, lint 0 errors
- Vendor chunk: 1482 KiB / 340gz, App: 507 KiB / 136gz
