# Fix Plan

## P1 — Correctness

### 1. [x] Enemy.fireNet(): physics collider leaks on scene restart
- **Files:** `src/entities/Enemy.ts` (lines 619-654)
- **Rationale:** `fireNet()` creates a circle game object + overlap collider. Cleanup only fires on hit or after 2s raw ticker. If scene restarts while net is in flight, overlap collider persists in `physics.world.colliders` — leaked memory + potential stale callback. The `try/catch` at line 634 swallows errors but doesn't prevent the collider from lingering if `cleanup()` never fires.
- **Acceptance:** Register net cleanup in scene's shutdown event listener, or use a scene-scoped collider tracking mechanism. Net circle + collider must be cleaned on scene shutdown.

### 2. [x] Projectile.deactivate(): onDeactivateCallback exception leaves stale state
- **Files:** `src/entities/Projectile.ts` (lines 138-146)
- **Rationale:** If `onDeactivateCallback` throws, execution skips the rest of `deactivate()` — sprite remains active+visible, body stays enabled, hitTargets not cleared. Next pool cycle gets a zombie projectile. The null-before-call pattern (line 144) is correct for re-fire prevention, but the whole deactivate body needs to complete regardless.
- **Acceptance:** Wrap callback invocation in try/catch. Rest of deactivate() always executes.

## P1 — Test Coverage

### 3. [x] Enemy entity: zero unit tests for combat behaviors
- **Files:** `src/entities/Enemy.ts`, new `src/entities/Enemy.test.ts`
- **Rationale:** Enemy has 700+ lines of behavior logic (orbit, phase, ranged, charge, dive, flee, buff) with no tests. Key testable pure-ish logic: `recomputeSpeed()` with buff multipliers, `applySpeedBuff()` expiry, elite stat scaling, `die()` state transitions.
- **Acceptance:** Extract `recomputeSpeed` logic or test via mock. Add 5+ tests for speed buff stacking/expiry, elite multipliers, die() state.

## P2 — Performance

### 4. [x] Piper behaviorOrbit: O(n) enemy scan every frame per active Piper
- **Files:** `src/entities/Enemy.ts` (lines 675-693)
- **Rationale:** Each active Piper iterates ALL enemies every frame to apply speed buff. With 3 Pipers + 300 enemies = 900 iterations/frame. Early exit helps when Piper far from player, but `applySpeedBuff()` is called repeatedly on already-buffed enemies (redundant).
- **Acceptance:** Add frame-throttle (every 250ms instead of every frame) or skip if enemy already has active buff. Buff lasts 500ms so 250ms check interval is sufficient.

## P2 — Architecture

### 5. [x] Player.ts: netSlowTimersMs array grows unbounded under rapid net hits
- **Files:** `src/entities/Player.ts` (lines 255-275)
- **Rationale:** Each `applyNetSlow()` pushes to `netSlowTimersMs`. If many nets hit before timers expire, array grows. `tickNetSlow()` splices expired entries but during a swarm of net-throwing enemies, could accumulate 20+ entries with per-frame iteration + splice overhead.
- **Acceptance:** Cap `netSlowTimersMs` at reasonable max (e.g. 5) — reject new slows while at cap, or replace shortest-remaining entry.

### 6. [x] Projectile.ts: hitTargets WeakSet prevents GC of dead enemies
- **Files:** `src/entities/Projectile.ts`
- **Rationale:** `hitTargets` is a `Set` (not WeakSet). Piercing projectiles accumulate enemy refs in `hitTargets` over their lifetime. Dead enemies in the set prevent GC until the projectile deactivates and `hitTargets.clear()` fires. For long-lived piercing/bouncing projectiles, this holds refs to dozens of dead enemies.
- **Acceptance:** Change `hitTargets` from `Set` to `WeakSet`. Replace `.clear()` calls with `this.hitTargets = new WeakSet()`. WeakSet lacks `.clear()` but assignment achieves same effect.
