# Fix Plan

## P1 — Correctness

### 1. [x] GameScene: pauseMenu not closed in shutdown handler
- **Files:** `src/scenes/GameScene.ts`
- **Rationale:** `registerShutdownCleanup()` destroys hud, minimap, upgradeUI, etc. but doesn't close/destroy `pauseMenu`. It's only handled in `resetTransientRunState()` (called from create()). If scene.stop() fires without subsequent create() (e.g. `scene.stop('Game'); scene.start('GameOver')`), PauseMenu's interactive elements and overlays orphan.
- **Acceptance:** Shutdown handler adds `try { this.pauseMenu?.close(); } catch { /* ignore */ }` alongside the other system teardowns.

### 2. [x] GameScene: activeChestSprites graphics not destroyed on shutdown
- **Files:** `src/scenes/GameScene.ts`
- **Rationale:** `activeChestSprites` array is cleared to `[]` in `resetTransientRunState()` but the sprites inside aren't explicitly destroyed. Scene teardown handles this for normal flow, but the chest glow tweens running on those sprites aren't killed — potential stale tween callbacks on scene restart.
- **Acceptance:** Shutdown handler iterates `activeChestSprites`, kills tweens, destroys sprites.

### 3. [ ] GameScene: musicStateScratch object allocated once — stale bossActive flag if boss dies then scene restarts
- **Files:** `src/scenes/GameScene.ts`
- **Rationale:** `musicStateScratch` is a readonly field initialized once at construction (line 164). Its fields are written every frame in update(), but if the scene restarts, old values persist until the first update() runs. The music engine reads stale `bossActive: true` for one frame → brief boss music spike on new run.
- **Acceptance:** `resetTransientRunState()` zeroes out musicStateScratch fields (hp, maxHp, gameTimeSec, enemyCount, comboCount, killCount, bossActive).

## P2 — Architecture / Polish

### 4. [ ] GameScene: extract tick helpers (tickBanter, tickBiome, tickLowHpCaption, updateBoundaryWarning, updateDashIndicator) to reduce 1758-line god object
- **Files:** `src/scenes/GameScene.ts`, new `src/scenes/game/GameTickers.ts`
- **Rationale:** GameScene has 117 members and 1758 lines. 5+ self-contained tick methods (~200 lines total) could move to a helper following the established LevelUpFlow/RunLifecycle/PickupSpawner extraction pattern.
- **Acceptance:** Extract 3+ tick methods to GameTickers helper. GameScene drops below 1600 lines. Build + tests green.

### 5. [ ] MainMenuScene: cozyTweenTargets cleanup could miss dynamically-added targets
- **Files:** `src/scenes/MainMenuScene.ts`
- **Rationale:** `cozyTweenTargets` is populated during create() and cleaned in shutdown. But if any decoration tween creates sub-objects (e.g. campfire flame particles), those won't be tracked. Currently safe because all decoration is static, but fragile for future additions.
- **Acceptance:** Add defensive `this.tweens.killAll()` in shutdown handler after the per-target cleanup loop.

### 6. [ ] Scene test coverage: zero tests for GameOverScene stat formatting
- **Files:** `src/scenes/GameOverScene.ts`, new test file
- **Rationale:** GameOverScene has complex time formatting (`formatClockTime`), gold breakdown calculation, and stat display logic. All untested. The formatting helpers are pure functions extractable for unit testing.
- **Acceptance:** Extract `formatClockTime` + gold breakdown calc to testable pure functions. Add 5+ unit tests covering edge cases (0 seconds, 60+ minutes, fractional gold).
