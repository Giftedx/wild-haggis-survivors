# Backlog

## High Priority
- [x] Kill scene reach-throughs (`this.scene as unknown`) — done 2026-04-13, ISceneContext covers all sites
- [x] Audit + eliminate production `as any` in WeaponSystem.ts — had 0 `as any` (backlog was wrong)
- [x] Audit + eliminate production `as any` in SpawnSystem.ts — 4 casts removed (pool teardown), types already correct via Enemy[]
- [x] Audit + eliminate production `as any` in XPSystem.ts — 2 casts removed (pool teardown), types already correct via XPGem[]
- [ ] Add tests for WeaponSystem — weapon behavior, evolution, projectile pool (coverage gap)
- [ ] Add tests for SpawnSystem director logic beyond existing stall/pause/timetravel tests (coverage gap)

## Medium Priority
- [ ] Audit `as any` in input.ts (3 occurrences) (type-safety)
- [ ] Audit `as any` in UpgradeCards.ts (1 occurrence) (type-safety)
- [ ] Audit `as any` in GameScene.ts (1 occurrence) (type-safety)
- [ ] Audit `as any` in LevelUpFlow.ts (1 occurrence) (type-safety)
- [ ] Audit `as any` in PickupSpawner.ts (1 occurrence) (type-safety)
- [ ] Investigate Phaser vendor chunk 1.48MB — tree-shaking or dynamic import options (fix_plan, perf)
- [ ] Confirm PWA precache 1944 KiB acceptable (fix_plan, perf)
- [x] REVIEW: src/systems/ — done 2026-04-13, 8 tasks generated

## Low Priority
- [ ] Extend banter to weapon evolution moments (fix_plan, feature)
- [ ] DebugOverlay: surface pool sizes, tween count, active timers (fix_plan, feature)
- [ ] Ship telemetry toggle opt-in for run-completion distribution (fix_plan, feature)
- [ ] Document a11y matrix in DESIGN_SOUL.md (fix_plan, docs)
- [ ] Banter sub-pool schema validation test (fix_plan, test)
