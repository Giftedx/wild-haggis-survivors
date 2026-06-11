# Next Session Prompt: Particle Budget & Scene Lifecycle Hardening

Copy everything below the line into a fresh Claude Code session in this project directory.

---

## Context

Read `CLAUDE.md` and `docs/DESIGN_SOUL.md` first. The game just completed two hardening passes: a 15-item visual art soul review (commit 3c3cabc) and a late-game performance + balance session (commit 8efacf1) that eliminated 31 `getChildren()` array copies per frame and rebalanced Claymore/bosses/Highland Cow. Build is green, 174/174 tests pass.

The `getChildren()` fix removed **array allocation churn** — the engine no longer copies 400-entry arrays 31 times per frame. But a deep code audit reveals the **second largest GC pressure source** is still active: **transient visual effect GameObjects** created and destroyed via tween callbacks across three hot systems.

## The Problem (Two Faces)

### Face 1: Unpooled Visual Effects = ~1,000 New GameObjects/Sec at Peak

The codebase creates visual effect circles with `scene.add.circle()` + tween + `onComplete: () => dot.destroy()` instead of pooling them. At late-game intensity (100+ kills/sec, 6 weapons firing, 10+ projectiles in flight):

**JuiceSystem.ts — worst offender:**

| Method | Line | Objects/call | Calls/sec at peak | Impact |
|--------|------|-------------|-------------------|--------|
| `spawnTrail()` | 205-213 | 1 circle | ~200 (every 3rd frame × 10 projectiles) | ~200 obj/sec |
| `showKillBurst()` | 217-264 | 6 dots + 1 ring = 7 | ~100 kills/sec | ~700 obj/sec |
| `bossDeathSpectacle()` | 406-457 | 30 particles + 2 rings = 32 | rare but heavy | burst of 32 |

Each object lives 200-800ms with a tween, then calls `.destroy()` — creating a constant stream of allocation + GC churn.

**WeaponSystem.ts — 8 unpooled visual effects per weapon fire:**

| Visual | Line | Type | Lifetime |
|--------|------|------|----------|
| AoE pulse ring (Bagpipe Blast) | 327 | `scene.add.circle()` | 300ms |
| Trail zone (Scotch Mist) | 367 | `scene.add.circle()` | 2000ms |
| Arc sweep graphic (Nessie/Claymore) | 419 | `scene.add.graphics()` | 250ms |
| Aura pulse ring (Bagpipes) | 542 | `scene.add.circle()` | 280ms |
| Expanding ring (Highland Fling) | 579 | `scene.add.circle()` | 850ms |
| Explosion blast (Highland Games) | 630 | `scene.add.circle()` | 300ms |
| Fog zone (The Haar) | 648 | `scene.add.circle()` | 2600ms |
| Full sweep fill (Nessie Unleashed) | 690 | `scene.add.graphics()` | 400ms |

With 6 weapons firing at evolved cooldowns (~200-400ms), this produces **50-100 new GameObjects/sec** on top of JuiceSystem's output.

**Enemy.ts — scattered unpooled particles:**

| Visual | Line | When |
|--------|------|------|
| Spawn puff | 161 | Every enemy spawn |
| Knockback trail dots | 399 | During knockback (every 50ms) |
| Phase toggle puff (Ghost) | 649 | Every 2 seconds per ghost |
| Chemical explosion blast | 752 | On burn+poison combo |
| Enrage ring (Boss 50% HP) | 978 | Boss enrage trigger |
| Enrage particles | 998 | Boss enrage trigger |

### Face 2: Scene Lifecycle Cleanup Gaps

GameScene's shutdown handler (`registerShutdownCleanup()`, line 521-551) **explicitly destroys** 6 systems but **silently orphans** 5 others:

| System | Has `destroy()` method? | Called in shutdown? |
|--------|------------------------|-------------------|
| `weaponSystem` | Yes | **Yes** (line 547) |
| `spawnSystem` | Yes | **Yes** (line 548) |
| `xpSystem` | Yes | **Yes** (line 550) |
| `timeManager` | Yes | **Yes** (line 546) |
| `tutorialSystem` | Yes (dispose) | **Yes** (line 549) |
| `debugOverlay` | Yes | **Yes** (line 542) |
| `juice` (JuiceSystem) | **No method exists** | **No** |
| `hud` (HUD) | Yes (line 664) | **No** |
| `minimap` (Minimap) | Yes (line 174) | **No** |
| `edgeIndicators` (EdgeIndicators) | Yes (line 128) | **No** |
| `upgradeUI` (UpgradeCardsUI) | No explicit destroy | **No** |

While Phaser auto-destroys GameObjects on scene shutdown, **not calling explicit destroy methods** means:
- HUD's weapon slot elements aren't cleaned up (HUD rebuilds them on every `updateWeaponSlots` call — line 547-548 in HUD.ts — so old slots from a prior `create()` leak if the scene restarts mid-update)
- JuiceSystem's 30 damage texts + 40 impact rings + vignette + flash overlay are never explicitly freed
- Any in-flight tweens targeting these objects may fire `onComplete` callbacks on stale references

### Bonus: Enemy.ts Has 2 Small Bugs

1. **`knockbackTrailAccum` not reset in `spawn()`** (line 210): This accumulator controls knockback particle emission timing (line 396-398). Pooled enemies retain stale trail state from their previous life — the first knockback after reuse has incorrect particle timing.

2. **Hardcoded `phaseTimer = 2000` during knockback** (line 418): Should be `BALANCE.enemy.phaseToggleMs`. Currently works by accident because both values are 2000ms, but will break silently if the balance config changes. Compare to line 220 and line 625 which correctly use the config constant.

## Your Mission

Eliminate the remaining GC churn from visual effects, close the scene lifecycle gaps, and fix the small bugs.

### Phase 1: Pool Visual Effects in JuiceSystem (Do First — Highest Impact)

#### 1.1 Pool trail particles

`spawnTrail()` (line 205-213) creates a new circle every call. Replace with a circular pool:

```typescript
// In constructor, after impact ring pool:
private trailPool: Phaser.GameObjects.Arc[] = [];
private trailPoolIdx: number = 0;

// Preallocate 60 trail dots (each lives ~200ms, 200/sec max = 40 in flight)
for (let i = 0; i < 60; i++) {
  const dot = scene.add.circle(0, 0, 2, 0x9966cc, 0.5)
    .setDepth(5).setVisible(false);
  this.trailPool.push(dot);
}
```

Then in `spawnTrail()`, use circular indexing instead of `find()`:
```typescript
spawnTrail(x: number, y: number, color: number = 0x9966cc): void {
  const dot = this.trailPool[this.trailPoolIdx];
  this.trailPoolIdx = (this.trailPoolIdx + 1) % this.trailPool.length;
  // Kill any active tween on this dot before reuse
  this.scene.tweens.killTweensOf(dot);
  dot.setPosition(x, y);
  dot.setFillStyle(color, 0.5);
  dot.setRadius(2);
  dot.setScale(1);
  dot.setAlpha(0.5);
  dot.setVisible(true);
  this.scene.tweens.add({
    targets: dot, alpha: 0, scale: 0.3, duration: 200,
    onComplete: () => dot.setVisible(false),
  });
}
```

Circular indexing means we never search for a free slot — O(1) per call, and old dots that haven't finished tweening get recycled immediately (the `killTweensOf` handles this).

#### 1.2 Pool kill burst particles

`showKillBurst()` (line 217-264) creates 6 dots + 1 ring per kill. Pool them:

- **Burst dot pool**: 50 circles (6 per kill × ~8 in flight = 48 max)
- **Burst ring pool**: 15 circles (1 per kill × ~8 in flight)

Use the same circular indexing pattern as trails.

#### 1.3 Increase damage text and impact ring pools

- Damage text pool: increase from **30 to 50** (line 83). At peak DPS with pierce weapons, 30 is exhausted and damage numbers silently drop — the player loses DPS feedback.
- Impact ring pool: increase from **40 to 80** (line 107). AoE weapons hitting 30+ enemies per pulse exhaust the pool, removing hit feedback.

#### 1.4 Add `destroy()` method to JuiceSystem

JuiceSystem has no cleanup method. Add one:

```typescript
destroy(): void {
  // Kill all tweens on pooled objects
  for (const t of this.dmgTextPool) {
    this.scene.tweens.killTweensOf(t);
    t.destroy();
  }
  for (const r of this.impactRingPool) {
    this.scene.tweens.killTweensOf(r);
    r.destroy();
  }
  for (const d of this.trailPool) {
    this.scene.tweens.killTweensOf(d);
    d.destroy();
  }
  // ... burst pools too
  this.scene.tweens.killTweensOf(this.comboText);
  this.comboText.destroy();
  this.vignette.destroy();
  this.flashRect.destroy();
  this.dmgTextPool = [];
  this.impactRingPool = [];
  this.trailPool = [];
}
```

### Phase 2: Pool Visual Effects in WeaponSystem

#### 2.1 Pool AoE/aura circles

The 6 `scene.add.circle()` calls (lines 327, 367, 542, 579, 630, 648) all create circles with a tween that fades them out. Create a shared VFX circle pool:

```typescript
private vfxCirclePool: Phaser.GameObjects.Arc[] = [];
private vfxCircleIdx: number = 0;

// In constructor, after projectile pool:
for (let i = 0; i < 25; i++) {
  const c = scene.add.circle(0, 0, 10, 0xffffff, 0.5)
    .setDepth(10).setVisible(false);
  this.vfxCirclePool.push(c);
}
```

Add a helper method:
```typescript
private acquireVfxCircle(x: number, y: number, radius: number, color: number, alpha: number): Phaser.GameObjects.Arc {
  const c = this.vfxCirclePool[this.vfxCircleIdx];
  this.vfxCircleIdx = (this.vfxCircleIdx + 1) % this.vfxCirclePool.length;
  this.scene.tweens.killTweensOf(c);
  c.setPosition(x, y);
  c.setRadius(radius);
  c.setFillStyle(color, alpha);
  c.setAlpha(alpha);
  c.setScale(1);
  c.setVisible(true);
  return c;
}
```

Then replace each `this.scene.add.circle(...)` call with `this.acquireVfxCircle(...)` and change `onComplete: () => ring.destroy()` to `onComplete: () => ring.setVisible(false)`.

#### 2.2 Pool arc sweep graphics

The 2 `scene.add.graphics()` calls (lines 419, 690) are harder to pool because Graphics objects need `clear()` before reuse. Create a small graphics pool (5 is enough — arc sweeps are brief):

```typescript
private vfxGfxPool: Phaser.GameObjects.Graphics[] = [];
private vfxGfxIdx: number = 0;
```

Helper:
```typescript
private acquireVfxGraphics(): Phaser.GameObjects.Graphics {
  const g = this.vfxGfxPool[this.vfxGfxIdx];
  this.vfxGfxIdx = (this.vfxGfxIdx + 1) % this.vfxGfxPool.length;
  this.scene.tweens.killTweensOf(g);
  g.clear();
  g.setAlpha(1);
  g.setVisible(true);
  return g;
}
```

Change `onComplete: () => gfx.destroy()` to `onComplete: () => { gfx.setVisible(false); gfx.clear(); }`.

### Phase 3: Scene Lifecycle Cleanup

#### 3.1 Call destroy on all systems in GameScene shutdown

Add to `registerShutdownCleanup()` (line 521-551), after the existing cleanup:

```typescript
try { this.juice?.destroy(); } catch { /* ignore */ }
try { this.hud?.destroy(); } catch { /* ignore */ }
try { this.minimap?.destroy(); } catch { /* ignore */ }
try { this.edgeIndicators?.destroy(); } catch { /* ignore */ }
try { this.upgradeUI?.hide?.(); } catch { /* ignore */ }
```

### Phase 4: Enemy.ts Bug Fixes

#### 4.1 Reset knockbackTrailAccum in spawn()

At line 210, after `this.knockbackTimer = 0;`, add:

```typescript
this.knockbackTrailAccum = 0;
```

#### 4.2 Use balance config for phaseTimer during knockback

At line 418, change:
```typescript
this.phaseTimer = 2000;
```
to:
```typescript
this.phaseTimer = BALANCE.enemy.phaseToggleMs;
```

### Phase 5: Verification

1. `npm run build` — type-check passes
2. `npm test` — 174/174 tests pass (or more if you add any)
3. `npm run dev` — play a 15-minute run with DevTools Performance tab open. Compare:
   - GC pause frequency should be visibly reduced vs. before
   - Heap allocation rate should be lower
   - No visual regressions (trails, kill bursts, AoE rings should look identical)
4. Rapid play-again cycle: play 3 quick runs (die fast), verify no console errors from stale callbacks and no visible memory growth in DevTools Memory tab

## Files You'll Touch

| File | Changes |
|------|---------|
| `src/systems/JuiceSystem.ts` | Pool trail dots, kill burst particles; increase dmg text + impact ring pools; add destroy() |
| `src/systems/WeaponSystem.ts` | Pool VFX circles and graphics objects |
| `src/scenes/GameScene.ts` | Add destroy() calls for juice, hud, minimap, edgeIndicators, upgradeUI in shutdown |
| `src/entities/Enemy.ts` | Reset knockbackTrailAccum in spawn(); use BALANCE config for phaseTimer |

## The Standard

The haggis fantasy at minute 20: 300+ enemies on screen, evolved weapons firing bursts, kill combos hitting 100+. The visual effects should feel **identical** to before — same trails, same bursts, same rings — but the engine shouldn't be creating and destroying 1,000 GameObjects per second to achieve it. Pool them, reuse them, and clean up after yourself when the run ends.
