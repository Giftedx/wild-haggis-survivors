# Strategy — Wild Haggis Survivors

**Last updated:** 2026-04-13

## Project Phase
Post-feature hardening. v2.1.0. Core gameplay loop complete. All major systems shipped (biomes, curses, meta shop, achievements, banter, a11y, tutorials). GameScene dropped 3088→1656 LOC (-46%). Now: type safety, test coverage, bundle budget, content tooling.

## Top 3 Priorities
1. **Type safety** — 17 production `as any` in 8 files. Biggest cluster: pool teardown in SpawnSystem/WeaponSystem/XPSystem (9 sites). Typed `disposePoolMember()` helper would collapse them.
2. **Test coverage on critical paths** — 70 test files / 105 source. Scenes (GameScene, ShopScene, MetaShopScene) and WeaponSystem have zero/minimal tests despite high complexity.
3. **Bundle budget** — Phaser vendor chunk 1.48MB ungz. Investigate `phaser-core.js` subset (no tilemaps, no matter physics used). PWA precache 1945 KiB.

## Done Enough (don't revisit unless bugs surface)
- Scene reach-throughs: 0 remaining (ISceneContext fully covers all 7 former sites)
- Scene lifecycle reset correctness (reviewed + fixed in recent loops)
- Entity basics: Player, Enemy, Projectile core behavior
- Save/load system (well-tested)
- Procedural music engine (functional, tested)
- Boot texture generation
- BanterSystem (recently shipped, working)
- i18n (functional with t() helper)

## Review Rotation Position
Last reviewed: `src/entities/` (2026-04-13, 5 tasks generated)
Next up: `src/core/` (area 4 in rotation)

## Metrics Snapshot (2026-04-13)
- Source files: 105, Test files: 72
- Tests: 526 passing
- `as any`: 0 production casts (was 17) — all eliminated across 6 loops
- `as unknown`: 12 files
- TODO/FIXME: 0
- Biggest files: GameScene 1664, Enemy 1257, WeaponSystem 1032
- Build: ~4.9s clean, lint 0 errors
