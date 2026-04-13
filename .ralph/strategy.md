# Strategy — Wild Haggis Survivors

**Last updated:** 2026-04-13 (loop 10 REFLECT)

## Project Phase
Post-feature hardening. v2.1.0. Core gameplay complete. Type safety done (0 `as any`). Test coverage strong (73/105 files). Now: bundle optimization, code review rotation, remaining test gaps, content tooling.

## Top 3 Priorities
1. **Bundle budget** — Phaser vendor chunk 1.48MB ungz. Investigate `phaser-core.js` subset (no tilemaps, no matter physics). PWA precache 1945 KiB. **Untouched in 10 loops — forcing next.**
2. **Code review rotation** — 3 areas reviewed (scenes, entities, systems). Next: `src/core/`, then `src/data/`. Each review generates 3-8 backlog items.
3. **Remaining test gaps** — XPGem (0 tests), scene-level integration (GameScene untested). Enemy.applyPostBellScaling API smell.

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
Last reviewed: `src/data/` (2026-04-13, 1 finding — banter.ts missing tag validation test. 9/9 test coverage.)
Next up: `src/ui/` (area 6 in rotation)

## Metrics Snapshot (2026-04-13, loop 10)
- Source files: 105, Test files: 73
- Tests: 549 passing (was 488 at loop 1)
- `as any`: 0 production (was 17)
- TODO/FIXME: 0
- Biggest files: GameScene 1664, Enemy 1257, WeaponSystem 1032
- Build: ~5s clean, lint 0 errors
