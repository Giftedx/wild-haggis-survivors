# Strategy — Wild Haggis Survivors

## Project Phase
Post-MVP hardening. v2.1.0, feature-rich, 488 tests passing. Core gameplay loop complete. Now: robustness, type safety, test coverage gaps, finishing half-done systems.

## Top 3 Priorities
1. **Type safety** — Kill production `as any` (76 total, ~15 in prod code) and `as unknown` scene reach-throughs (7 remaining per fix_plan)
2. **Test coverage on critical gameplay paths** — WeaponSystem, SpawnSystem, XPSystem have thin test coverage relative to complexity
3. **System completeness** — Banter system, DebugOverlay, a11y panel need finishing touches per fix_plan

## Done Enough (don't revisit unless bugs surface)
- Scene lifecycle reset correctness (reviewed + fixed in recent loops)
- Entity basics: Player, Enemy, Projectile core behavior
- Save/load system (well-tested)
- Procedural music engine (functional, tested)
- Boot texture generation

## Review Rotation Position
Scenes (1) and Entities (2) done recently → next review = **Systems (3)**

## Metrics Snapshot (2026-04-13)
- Source files: 105, Test files: 70
- Tests: 488 passing
- `as any` count: 76 (21 files), ~15 in production code
- Build: clean, PWA precache 1944 KiB
