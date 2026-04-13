# Fix Plan

## P0 — Critical (cross-run state bleed / crashes)

### 1. [x] SpawnSystem: tween cleanup missing on destroy
- **Files:** `src/systems/SpawnSystem.ts`
- **Rationale:** `destroy()` does not kill tweens from `spawnBoss()` / `showBossWarning()`. If scene restarts mid-tween, stale `onComplete` callbacks fire on new scene instance → visual artifacts or errors.
- **Acceptance:** `destroy()` kills all active tweens on boss warning objects (vignette, bg, glowTop, glowBot, label) before nulling refs.

### 2. [x] WeaponSystem: VFX pool tweens not killed on destroy (already implemented)
- **Files:** `src/systems/WeaponSystem.ts`
- **Rationale:** `destroy()` doesn't kill tweens on `vfxCirclePool` / `vfxGfxPool` objects. Pool reuse + orphaned tweens → VFX corruption or crashes when same slot reused while old tween animating.
- **Acceptance:** `destroy()` iterates both VFX pools and calls `scene.tweens.killTweensOf()` on each object.

### 3. [x] StatusFxPool: tween cleanup on destroy
- **Files:** `src/systems/StatusFxPool.ts`
- **Rationale:** Pool objects get tweens from callers (enemy status FX). No tween cleanup on destroy → status FX leak across runs.
- **Acceptance:** `destroy()` kills tweens on all pooled circles and sprites before destroying them.

## P1 — Correctness (state leaks between runs)

### 4. [x] BanterSystem: no reset on scene restart (already implemented)
- **Files:** `src/systems/BanterSystem.ts`, `src/scenes/GameScene.ts`
- **Rationale:** `lastFireMs`, `lastContext`, `recent` ring buffer carry over between runs. Second run's first banter rate-limited by first run's cooldown.
- **Acceptance:** BanterSystem has `reset()` method clearing transient state. GameScene calls it during scene reset.

### 5. [x] SpawnSystem: enemy chase loop runs during pause
- **Files:** `src/systems/SpawnSystem.ts`
- **Rationale:** `update()` calls `chaseTarget()` on all enemies unconditionally. With 400 enemies during level-up overlay (physics paused), 24k pathfinding calls/sec wasted.
- **Acceptance:** Chase loop guarded by gameplay pause check. No enemy chase calls when game paused.

### 6. [ ] TutorialSystem: fragile tween cleanup on dispose
- **Files:** `src/systems/TutorialSystem.ts`
- **Rationale:** `dispose()` nulls drift banner/arrow without killing active tweens. Mid-animation dispose → tween callbacks on destroyed objects.
- **Acceptance:** `dispose()` kills tweens on driftBanner/driftArrow before nulling.

## P2 — Architecture / Config

### 7. [ ] WeaponSystem: enemy cache rebuilt every frame unconditionally
- **Files:** `src/systems/WeaponSystem.ts`
- **Rationale:** `buildEnemyCache()` sorts all active enemies every frame. With 400 enemies at 60fps = 24k sorts/sec. Cache only needed when weapons query it.
- **Acceptance:** Cache only rebuilt when at least one weapon fires this frame, or on demand when `findClosestEnemy()` called with stale cache.

### 8. [ ] Move hard-coded VFX pool sizes + boss warning timing to config
- **Files:** `src/systems/JuiceSystem.ts`, `src/systems/SpawnSystem.ts`, `src/config.ts`
- **Rationale:** Pool sizes (80/60/50) and boss warning duration (1500ms/1200ms) scattered as magic numbers. Hard to tune balance.
- **Acceptance:** Constants moved to `BALANCE` config object. Systems reference config instead of inline numbers.
