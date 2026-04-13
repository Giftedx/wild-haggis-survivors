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
- [x] Enemy.applyPostBellScaling resets hp=maxHp — fixed: scales maxHp but preserves HP fraction (spawn still full); tests in Enemy.test.ts (entities review)
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
- [x] Add tests for cameraViewport.ts — 9 tests: zoom=1, zoom=2 offset+scale, zoom=0 falsy fallback, zoom=0.0001 clamp, cache hit (same frame), cache miss (new frame), cache miss (different scene), resetCache, camera-null fallback. 631→640 tests.
- [x] Add tests for EdgeIndicators.ts — pure helpers in `edgeIndicatorMath.ts`: viewport inclusive bounds, screen-edge projection, insertion sort by dist (+ `EdgeIndicators` wired to helpers) (P2, ui review)

- [x] Add tests for inputMath.ts — 18 tests: clampVectorLength (zero, sub-eps, passthrough, diagonal, custom max, direction), mergeMoveVectors (clamp, sum, cancel, custom maxLen), gamepadStickToMove (deadzone, boundary, past-dz, corner, full-tilt, negative, custom-dz, magnitude sweep). 563→581 tests.
- [x] Add tests for SubscriptionBag.ts — 8 tests: add+dispose, LIFO order, error swallow, listen+dispose, bad emitter.off, add-after-dispose, post-dispose error, double-dispose idempotent. 579→589 tests.
- [x] Add tests for math.ts rotateVectorIntoPrecomputed — 8 tests: identity, 90/180/neg angles, length preservation, zero vec, out-param contract. 589→597 tests.
- [x] Add tests for cameraShake.ts tryCameraShake — 7 tests: scaled intensity, motionScale multiply, screenShake off, motionScale 0, null/undef cam, duration unscaled. 631→647 tests.
- [x] GamepadMenuNav.ts — `stepGamepadMenuIndex` extracted + unit tests; class still scene-bound (P2, utils review)
- [x] inputMath.gamepadStickToMove: redundant clampVectorLength — removed; direction is unit × `min(1,len)` so length ≤ 1 (P2, utils review)

- [x] Add tests for NoteScheduler — 9 tests: start delay, melody 0.3s offset, multi-note scheduling, no-callback safety, 3 min-interval floors (melody/rhythm/heartbeat), tab-recovery skip, reset. 589→616 tests (includes prior rotateVector tests).
- [x] Add tests for Conductor — 15 tests: updateMood (intensity rise, danger rise/decay, chaos, resolution skip, zero-maxHp), kill rate (sliding window, low-combo guard), resolution (state set, descent complete, pre-enter false), nextNote (shape, Dorian freqs, intensity-interval, deterministic w/ mock), getMood. 616→631 tests.
- [x] Add tests for euclidean() — Bjorklund bit patterns, invariants, E(3,16); `percussionGainScales` for density gains.
- [x] euclidean() true Bjorklund — standard block-merge + EUCLIDEAN_8 cache; tests updated for canonical patterns. (P2 music — former defer closed.)
- [x] PianoLayer.findVoiceSlot comment says "quietest voice replaced" but impl steals oldest by startTime — fixed: "oldest voice replaced"
- [x] ProceduralMusicEngine.test.ts uses `as any` for private field access — replaced with `EngineTestHooks` / `FadeOutCapable` casts (P2, music review)
- [x] CaptionOverlay tests — pure layout in `captionOverlayLayout.ts` (fade alpha + stack Y); Phaser class unchanged behaviour (P2, a11y review)
- [x] a11yText.contrastColor uses falsy check (`!hcOverride`) — fixed: `hcOverride === undefined` only; empty-string override honored when HC on + test (P2, a11y review)
- [x] CaptionManager.enqueue accepts durationMs ≤ 0 — fixed: early return guard + test. 647→648 tests.
- [x] REVIEW: src/systems/a11y/ — done 2026-04-13. 3 findings (CaptionOverlay no tests, contrastColor falsy, durationMs guard). 5 files, 23 tests, area healthy.

- [x] Add tests for spatialCull.ts — 14 tests: zone inclusion (inside/edge/outside), margin expansion (all sides, corners), culling (inside/outside, boss/hazard/immune immunity, edge boundary). 648→661 tests.
- [x] Add tests for upgrades.ts buildCardPool/drawCards — 16 new tests (upgrades.test.ts) + 13 existing (cardpool.test.ts). New: luck bonus probability, deterministic RNG, common weight floor, legendary rarity lv4→5. 661→684 tests.
- [x] Add tests for GlobalEventBus.ts — 7 tests: emit payload, multi-listener, unsub fn, off specific, off-unregistered safety, emit-no-listeners, event isolation. 661→684 tests (includes inter-session additions).

- [x] Add tests for runStartModifiers.ts — 12 tests: variant speed/multi-mod/skip-zero, permanent thick_hide/weapon_training/revival/treasure_magnet/lucky_start/lucky_start_full/drift_control/double_dash/defaults. 684→696 tests.

## Medium Priority (new)
- [x] Wire `AudioSystem` heavy SFX → `musicEngine.notifyGameplaySfxImpulse(...)` (death, boss, player hit, kill) — loop 63; strengths tuned for frequency (kill < hit < boss < death).

## Low Priority
- [x] Add banter.ts structure validation test — 6 tests: context coverage, key count, priority uniqueness, boss tag completeness, sub-pool depth, i18n resolution
- [x] Extend banter to weapon evolution moments — done: BanterContext 'weapon_evolve' + pool (pri 65, 3 keys) + LevelUpFlow trigger + GameScene.requestBanter hook. 5 files modified.
- [x] DebugOverlay: surface pool sizes, tween count, active timers — gems line + `tweens`/`timers` counts (Phaser Clock `_active`/`_pendingInsertion`) (fix_plan, feature)
- [x] Ship telemetry toggle opt-in for run-completion distribution — `telemetryOptIn` + Settings row; gates `run_start`/`run_end` only (fix_plan, feature)
- [x] Document a11y matrix in DESIGN_SOUL.md — "Comfort & accessibility matrix" section (fix_plan, docs)
- [x] Banter sub-pool schema validation test — consolidated with banter.ts test above (6 tests cover structure + i18n)
- [x] Main menu + pause menu i18n smoke — `hearthUi.i18n.smoke.test.ts` mirrors `settingsComfort.smoke.test.ts` for `MainMenuScene` + `PauseMenu` keys. 726→728 tests.
- [x] Shop, meta shop, curse, loadout, game-over + run toasts i18n smoke — `economyRunUi.i18n.smoke.test.ts` (Shop/MetaShop/Curse/Menu loadout strings, `RunLifecycle` toasts, full `GameOver` + whit_* lines). 728→735 tests.
- [x] Chronicle + Deeds i18n smoke — `chronicleDeeds.i18n.smoke.test.ts` (mood subtitles, milestones, run rows, `ACHIEVEMENT_DEFS` title/description keys). 735→739 tests.
- [x] In-run HUD / game / juice i18n smoke — `gameHudJuice.i18n.smoke.test.ts` (`ui.hud.*`, `ui.game.*` incl. kill thresholds + level-up toasts, `ui.run.*`, `boss_killed_*` + `warningKey` from `BOSSES`). 739→743 tests.
- [x] Caption i18n path fix + auxiliary run UI smoke — `RunLifecycle`/`GameTickers` used non-existent `ui.captions.*`; now `captions.*` (matches `EN_STRINGS`). `auxiliaryRunUi.i18n.smoke.test.ts`: `captions.*`, `ui.pause.quip_1–6`, `ui.upgradeCards.*`. 743→746 tests.
- [x] Biome name + entry toast i18n smoke — `biomeI18n.smoke.test.ts` walks `BIOMES` `nameKey` / `entryToastKey` (SCOUT: backlog thin; gameplay toast path). 746→747 tests.
- [x] i18n regression: `ui.passive.pause_short.*` + `tutorial.move|gem|drift` — `i18n.test.ts` (PauseMenu + TutorialSystem paths; DRY `PASSIVE_UI_KEYS`). 747→748 tests.
- [x] TimeManager tests — min `timeScale` when stacked; `reset()` clears tokens + restores adapter defaults (`TimeManager.test.ts`). 748→750 tests.
- [x] UpdateTickers tests — `addInterval` + `repeats`, cancel once/interval, `clear()`, non-positive delta guard (`UpdateTickers.test.ts`). 750→755 tests.
- [x] TimeManager release + ScaledTimer edges — `release` idempotent (unknown key, double-release, empty stack → timeScale 1); `ScaledTimer.stop` clears countdown; `start` clamps non-positive duration inactive. 755→758 tests.
- [x] TimeManager.update + ScaledTimer.tick guards — `update` skips `deltaMs ≤ 0` and empty token map; `getActiveTokenKeys` sorted; `ScaledTimer.tick` no-op when inactive, frozen when `timeScale < 0`. 758→763 tests.
- [x] Git: track scene i18n smoke tests + `GamepadMenuNav.test.ts` — were on disk but untracked (`settingsComfort`, `hearthUi`, `economyRunUi`, `chronicleDeeds`, `gameHudJuice`, `auxiliaryRunUi`, `GamepadMenuNav`). CI / fresh clone parity.
- [x] Extract `edgeIndicatorMath` + `captionOverlayLayout` — pure helpers + 9 + 7 tests; `EdgeIndicators` / `CaptionOverlay` import them (behavior unchanged). Closes deferred split from loop 53.
- [x] Comfort smoke alignment — `ISettingsData.telemetryOptIn` (default false, coerced on load) + `ui.settings.telemetry_opt_in` i18n; export `stepGamepadMenuIndex` from `GamepadMenuNav` (class uses same helper). Fixes test/prod drift after smoke commits.
- [x] TimeManager edge tests — `destroy()` clears like `reset()`, `request` overwrites same key, negative `durationMs` clamped to 0 then expires on first `update`.
- [x] Telemetry UX + analytics gate — `SettingsScene` accessibility row toggles `telemetryOptIn`; `AnalyticsManager` emits `run_start` / `run_end` only when opt-in (portal `triggerGameplayStart`/`Stop` unchanged). 759→760 tests.
- [x] AnalyticsManager regression tests — `boss_kill` + `tutorial_completed` still log when `telemetryOptIn` false (documents gate scope). Class doc notes same. 760→762 tests.
- [x] `captionFadeAlpha` negative `fadeWindowMs` — test covers `fadeWindowMs <= 0` branch with negative window (binary on/off). 762→763 tests.
- [x] TimeManager.update multi-expiry — two duration tokens removed in one tick; `timeScale` recomputes to default when stack empties. 763→764 tests.
- [x] TimeManager getters — `getEffectiveTimeScale`, `isPhysicsPaused`, `isGameplayPaused` match adapter after request/release. 764→765 tests.
