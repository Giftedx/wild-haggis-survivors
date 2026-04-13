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
- [x] **Minimap.ts: triangle rotation sign** — NOT A BUG: `- ca * -size * 0.7` = `+ ca * size * 0.7` is correct mirror of b-point across heading axis. Standard 2D rotation matrix, symmetric base vertices verified.
- [ ] Add tests for cameraViewport.ts — zoom-corrected viewport math, inset fallback, cache staleness (P2, ui review)
- [ ] Add tests for EdgeIndicators.ts — screen-edge geometry, off-screen detection, empty enemy list (P2, ui review)

- [x] Add tests for inputMath.ts — 18 tests: clampVectorLength (zero, sub-eps, passthrough, diagonal, custom max, direction), mergeMoveVectors (clamp, sum, cancel, custom maxLen), gamepadStickToMove (deadzone, boundary, past-dz, corner, full-tilt, negative, custom-dz, magnitude sweep). 563→581 tests.
- [x] Add tests for SubscriptionBag.ts — 8 tests: add+dispose, LIFO order, error swallow, listen+dispose, bad emitter.off, add-after-dispose, post-dispose error, double-dispose idempotent. 579→589 tests.
- [x] Add tests for math.ts rotateVectorIntoPrecomputed — 8 tests: identity, 90/180/neg angles, length preservation, zero vec, out-param contract. 589→597 tests.
- [ ] Add tests for cameraShake.ts tryCameraShake — screenShake off skips, motionScale=0 skips, normal path (P2, utils review)
- [ ] GamepadMenuNav.ts has 0 tests — Phaser scene-dependent, would need mocking (P2, utils review, low ROI)
- [ ] inputMath.gamepadStickToMove: redundant clampVectorLength — mag already ≤1, clamp is no-op (P2, code smell, utils review)

- [x] Add tests for NoteScheduler — 9 tests: start delay, melody 0.3s offset, multi-note scheduling, no-callback safety, 3 min-interval floors (melody/rhythm/heartbeat), tab-recovery skip, reset. 589→616 tests (includes prior rotateVector tests).
- [ ] Add tests for Conductor — updateMood lerp (intensity/danger/chaos/triumph targets), resolution mode (enterResolution, isResolutionComplete, descent walk), kill rate calc, phrase contours (P1, music review)
- [x] Add tests for euclidean() — 10 tests: edge cases E(0/8,8), known patterns E(1-5,8), length invariant, hit count, non-8 slots. Note: impl ≠ classic Bjorklund. 607→616 tests.
- [ ] euclidean() produces front-weighted patterns, not classic Bjorklund even spacing — E(3,8)=10101000 vs expected 10010010 (P2, potential music bug, investigate)
- [ ] PianoLayer.findVoiceSlot comment says "quietest voice replaced" but impl steals oldest by startTime (P2, doc mismatch, music review)
- [ ] ProceduralMusicEngine.test.ts uses `as any` for private field access — fragile test (P2, music review)

## Low Priority
- [x] Add banter.ts structure validation test — 6 tests: context coverage, key count, priority uniqueness, boss tag completeness, sub-pool depth, i18n resolution
- [ ] Extend banter to weapon evolution moments (fix_plan, feature)
- [ ] DebugOverlay: surface pool sizes, tween count, active timers (fix_plan, feature)
- [ ] Ship telemetry toggle opt-in for run-completion distribution (fix_plan, feature)
- [ ] Document a11y matrix in DESIGN_SOUL.md (fix_plan, docs)
- [x] Banter sub-pool schema validation test — consolidated with banter.ts test above (6 tests cover structure + i18n)
