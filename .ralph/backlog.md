# Backlog

## High Priority
- [x] Kill scene reach-throughs (`this.scene as unknown`) — done 2026-04-13, ISceneContext covers all sites
- [x] Audit + eliminate production `as any` in WeaponSystem.ts — had 0 `as any` (backlog was wrong)
- [x] Audit + eliminate production `as any` in SpawnSystem.ts — 4 casts removed (pool teardown), types already correct via Enemy[]
- [x] Audit + eliminate production `as any` in XPSystem.ts — 2 casts removed (pool teardown), types already correct via XPGem[]
- [x] Add tests for WeaponSystem — 10 tests: stat scaling per level, evolution boosts, cooldown floors, pierce/count accumulation
- [x] Add tests for SpawnSystem — 11 tests: applyResumeTime (director sync, boss keys, finale state), getSpawnStallReason (4 priorities)

## Medium Priority
- [ ] Add tests for XPGem — drop/collect/magnetize/destroy are untested (coverage gap, entities review)
- [ ] Add tests for Projectile — fire(), pierce logic, range deactivation, bounce TTL, deactivate callback (coverage gap, entities review)
- [ ] Add Player tests beyond DI — recalcStats, bonus stacking, takeDamage, shield, net slow, dash (coverage gap, entities review)
- [ ] Enemy.fireNet stale-scene risk — callback chain creates physics objects; if enemy dies mid-fire, scene refs may be stale (potential bug, entities review)
- [ ] Enemy.applyPostBellScaling resets hp=maxHp — safe now (called at spawn only) but API permits misuse post-damage (code smell, entities review)
- [x] Audit `as any` in input.ts — 3 casts removed, InputPlugin satisfies MinimalEmitter natively
- [x] Audit `as any` in UpgradeCards.ts — 3 casts removed, typed array via structural interface
- [x] Audit `as any` in GameScene.ts — false positive, only in comment
- [x] Audit `as any` in LevelUpFlow.ts — false positive, only in comment
- [x] Audit `as any` in PickupSpawner.ts — false positive, only in comment
- [ ] Investigate Phaser vendor chunk 1.48MB — tree-shaking or dynamic import options (fix_plan, perf)
- [ ] Confirm PWA precache 1944 KiB acceptable (fix_plan, perf)
- [x] REVIEW: src/systems/ — done 2026-04-13, 8 tasks generated

## Low Priority
- [ ] Extend banter to weapon evolution moments (fix_plan, feature)
- [ ] DebugOverlay: surface pool sizes, tween count, active timers (fix_plan, feature)
- [ ] Ship telemetry toggle opt-in for run-completion distribution (fix_plan, feature)
- [ ] Document a11y matrix in DESIGN_SOUL.md (fix_plan, docs)
- [ ] Banter sub-pool schema validation test (fix_plan, test)
