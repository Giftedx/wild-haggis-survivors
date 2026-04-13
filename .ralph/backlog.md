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
- [x] Add tests for Projectile — 7 tests: pierce exhaustion, bouncing immunity, zero-pierce death, range deactivation, TTL countdown, callback fire-once
- [x] Add Player tests — 16 tests: takeDamage (armor, shield, death), heal, bonus stacking (damage, drift, regen, cooldown, maxHp), tickRegen, onLevelUp stat recalc (speed, drift, pickup)
- [x] Enemy.fireNet stale-scene risk — NOT A BUG: try/catch in cleanup, activeNetCleanup called on spawn/die/destroy, hit flag prevents double-fire
- [ ] Enemy.applyPostBellScaling resets hp=maxHp — safe now (called at spawn only) but API permits misuse post-damage (code smell, entities review)
- [x] Audit `as any` in input.ts — 3 casts removed, InputPlugin satisfies MinimalEmitter natively
- [x] Audit `as any` in UpgradeCards.ts — 3 casts removed, typed array via structural interface
- [x] Audit `as any` in GameScene.ts — false positive, only in comment
- [x] Audit `as any` in LevelUpFlow.ts — false positive, only in comment
- [x] Audit `as any` in PickupSpawner.ts — false positive, only in comment
- [ ] **Implement vendor chunk split** — add `manualChunks` to vite.config.ts splitting Phaser into separate cacheable chunk. Phaser is 1197 KiB minified, not tree-shakeable. Arcade-only build saves ~10% but is CJS-only, not worth the risk. Vendor split improves cache hit rate for repeat visitors. (researched loop 11)
- [ ] Confirm PWA precache 1944 KiB acceptable (fix_plan, perf)
- [x] REVIEW: src/systems/ — done 2026-04-13, 8 tasks generated
- [x] REVIEW: src/core/ — done 2026-04-13, 0 bugs found. 24 test files / 20 source. SaveManager V6 migration correct. Area is healthy.

## Low Priority
- [ ] Extend banter to weapon evolution moments (fix_plan, feature)
- [ ] DebugOverlay: surface pool sizes, tween count, active timers (fix_plan, feature)
- [ ] Ship telemetry toggle opt-in for run-completion distribution (fix_plan, feature)
- [ ] Document a11y matrix in DESIGN_SOUL.md (fix_plan, docs)
- [ ] Banter sub-pool schema validation test (fix_plan, test)
