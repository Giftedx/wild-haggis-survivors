# Strategy — Wild Haggis Survivors

**Last updated:** 2026-04-13 (loop 30 REFLECT)

## Project Phase
Post-feature hardening. v2.1.0. Core gameplay complete. Type safety done (0 `as any`). Test coverage strong (75/105 files). Now: code review rotation, remaining test gaps, backlog replenishment.

## Top 3 Priorities
1. **Code review rotation** — 6/9 areas reviewed. Next: `src/utils/` (area 7), then `src/systems/music/` (area 8), then `src/systems/a11y/` (area 9). Each review generates 3-8 backlog items. **Primary source of fresh work.**
2. **Remaining test gaps** — cameraViewport.ts (0 tests), EdgeIndicators.ts (0 tests), GameScene integration. Enemy.applyPostBellScaling API smell.
3. **Feature completions** — banter weapon evolution moments, DebugOverlay pool/tween/timer surface, a11y matrix docs.

## Done Enough (don't revisit unless bugs surface)
- Type safety: 0 production `as any` (was 17)
- Scene reach-throughs: 0 remaining (ISceneContext)
- Scene lifecycle reset correctness
- Entity core: Player (16 tests), Enemy (status/elite tests), Projectile (9 tests)
- Weapon stat scaling (10 tests), SpawnSystem resume/stall (11 tests)
- Save/load system (well-tested)
- Procedural music engine (functional, tested)
- BanterSystem, i18n, Boot textures

## Review Rotation Position
Last reviewed: `src/ui/` (2026-04-13, loop 16, 5 tasks — 2×P0 HUD false-pos, 1×P1 Minimap false-pos, 2×P2 tests)
Next up: `src/utils/` (area 7 in rotation)
Areas done: scenes(1), entities(2), systems(3), core(4), data(5), ui(6). Remaining: utils(7), music(8), a11y(9).

## Metrics Snapshot (2026-04-13, loop 15)
- Source files: 105, Test files: 75
- Tests: 563 passing (was 488 at loop 1)
- `as any`: 0 production (was 17)
- TODO/FIXME: 0
- Biggest files: GameScene 1664, Enemy 1257, WeaponSystem 1032
- Build: ~5s clean, lint 0 errors
- Vendor chunk: 1482 KiB / 340gz, App: 507 KiB / 136gz
