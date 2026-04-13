# Backlog

## High Priority
- [x] Kill scene reach-throughs (`this.scene as unknown`) — done 2026-04-13, ISceneContext covers all sites
- [x] Audit + eliminate production `as any` in WeaponSystem.ts — had 0 `as any` (backlog was wrong)
- [x] Audit + eliminate production `as any` in SpawnSystem.ts — 4 casts removed (pool teardown), types already correct via Enemy[]
- [x] Audit + eliminate production `as any` in XPSystem.ts — 2 casts removed (pool teardown), types already correct via XPGem[]
- [x] Add tests for WeaponSystem — 10 tests: stat scaling per level, evolution boosts, cooldown floors, pierce/count accumulation
- [x] Add tests for SpawnSystem — 11 tests: applyResumeTime (director sync, boss keys, finale state), getSpawnStallReason (4 priorities)

## Medium Priority
- [x] Add tests for XPGem — 8 tests: drop (activation, value, scaling), collect (return + deactivate), updateMagnet (radius gate, distance check, skip inactive), forceCollect, destroy cleanup
- [x] Add tests for Projectile — 7 tests: pierce exhaustion, bouncing immunity, zero-pierce death, range deactivation, TTL countdown, callback fire-once
- [x] Add Player tests — 16 tests: takeDamage (armor, shield, death), heal, bonus stacking (damage, drift, regen, cooldown, maxHp), tickRegen, onLevelUp stat recalc (speed, drift, pickup)
- [x] Enemy.fireNet stale-scene risk — NOT A BUG: try/catch in cleanup, activeNetCleanup called on spawn/die/destroy, hit flag prevents double-fire
- [ ] Enemy.applyPostBellScaling resets hp=maxHp — safe now (called at spawn only) but API permits misuse post-damage (code smell, entities review)
- [x] Audit `as any` in input.ts — 3 casts removed, InputPlugin satisfies MinimalEmitter natively
- [x] Audit `as any` in UpgradeCards.ts — 3 casts removed, typed array via structural interface
- [x] Audit `as any` in GameScene.ts — false positive, only in comment
- [x] Audit `as any` in LevelUpFlow.ts — false positive, only in comment
- [x] Audit `as any` in PickupSpawner.ts — false positive, only in comment
- [x] **Implement vendor chunk split** — Phaser + eventemitter3 → `vendor-phaser` chunk (1482 KiB / 340 KiB gz). App chunk now 507 KiB / 136 KiB gz. Deploy cache hit: 340 KiB stays cached, only 136 KiB invalidated per release.
- [x] Confirm PWA precache 1943 KiB acceptable — vendor-phaser 1482 + app 507 + html/icons 4. No external assets. Vendor chunk hash stable across app deploys → SW updates only download ~507 KiB delta.
- [x] REVIEW: src/systems/ — done 2026-04-13, 8 tasks generated
- [x] REVIEW: src/core/ — done 2026-04-13, 0 bugs found. 24 test files / 20 source. SaveManager V6 migration correct. Area is healthy.
- [x] REVIEW: src/data/ — done 2026-04-13. 9/9 test coverage (except banter.ts). 3 findings: banter no test (P1), 4 enemies no biome weight mods (P1 — likely intentional), thistle_shot no WEAPON_CARD (P1 — intentional, starting weapon). No bugs. Healthy area.

- [x] **HUD.ts: pause button listeners** — NOT A BUG: Phaser's GameObject.destroy() calls removeInteractive() + removeAllListeners() internally. HUD.destroy() destroys all elements → listeners cleaned.
- [x] **HUD.ts: tween leak** — NOT A BUG: flash/glow tweens are one-shot (400-500ms) with onComplete→destroy(). Scene shutdown() → TweenManager.shutdown() kills all remaining tweens. No orphans.
- [ ] **Minimap.ts: triangle rotation sign error** — line 173 double-negates cy2 base vertex, possibly flipping player arrow at certain angles. Verify rotation matrix math (P1, ui review)
- [ ] Add tests for cameraViewport.ts — zoom-corrected viewport math, inset fallback, cache staleness (P2, ui review)
- [ ] Add tests for EdgeIndicators.ts — screen-edge geometry, off-screen detection, empty enemy list (P2, ui review)

## Low Priority
- [x] Add banter.ts structure validation test — 6 tests: context coverage, key count, priority uniqueness, boss tag completeness, sub-pool depth, i18n resolution
- [ ] Extend banter to weapon evolution moments (fix_plan, feature)
- [ ] DebugOverlay: surface pool sizes, tween count, active timers (fix_plan, feature)
- [ ] Ship telemetry toggle opt-in for run-completion distribution (fix_plan, feature)
- [ ] Document a11y matrix in DESIGN_SOUL.md (fix_plan, docs)
- [x] Banter sub-pool schema validation test — consolidated with banter.ts test above (6 tests cover structure + i18n)
