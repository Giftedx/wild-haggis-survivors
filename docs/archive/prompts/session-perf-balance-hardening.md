# Next Session Prompt: Late-Game Performance & Balance Hardening

Copy everything below the line into a fresh Claude Code session in this project directory.

---

## Context

Read `CLAUDE.md` and `docs/DESIGN_SOUL.md` first. The game just completed a 15-item visual art soul review (commit 3c3cabc). Build is green, 174/174 tests pass. The visuals are polished. Now the *feel* under pressure needs attention.

This session targets the point where the game is weakest: **minutes 15-25**, when 300-400 enemies are on screen, multiple evolved weapons are firing, and the haggis fantasy should feel its most triumphant — but instead, frame drops stutter the combat and balance either trivializes or walls the player.

## The Problem (Two Faces)

### Face 1: Performance Degrades Under Late-Game Load

The codebase has **29 `getChildren()` calls per frame** across hot-path systems. Each call creates a fresh array copy from Phaser's internal data structure. With 400 active enemies + 200 projectiles + 100 XP gems, this produces **~900+ garbage-collected array allocations per second**.

**Worst offenders (measured by call count × collection size):**

| File | `getChildren()` calls/frame | Collection size | Impact |
|------|---------------------------|-----------------|--------|
| `src/systems/WeaponSystem.ts` | 12 calls (lines 337, 377, 444, 508, 553, 591, 636, 654, 699, 751, etc.) | 200-400 enemies | ~7,200 array copies/sec |
| `src/systems/SpawnSystem.ts` | 4 calls (lines 93, 138, 317, 439) | 200-400 enemies | ~1,600 array copies/sec |
| `src/systems/XPSystem.ts` | 5 calls (lines 51, 61, 70, 101, 161) | 50-150 gems | ~500 array copies/sec |
| `src/entities/Enemy.ts` | ~3 calls (Piper orbit at line 602, phase2 at 927, chemical explosion at 701) | 200-400 enemies | ~600 array copies/sec |

**Additionally**, WeaponSystem creates **8 non-pooled visual GameObjects per weapon fire** for AoE rings, arc sweep graphics, and expanding circles (lines 327, 367, 419, 542, 579, 630, 648, 690). With 6 weapons firing at reduced cooldowns, this is **50-100+ new GameObjects per second**, each with a tween + destroy callback. These should be pooled like projectiles already are.

**The Piper orbit behavior** (Enemy.ts:602-609) iterates ALL enemies every frame to apply speed buffs within 120px radius. With 2-3 Pipers active, this is O(n*m) = 800-1200 distance calculations per frame.

### Face 2: Balance Breaks Down After Minute 15

**Projectile pool starvation**: Pool is capped at 200 (`BalanceConfig.ts:70`). Evolved Thistle Storm fires 8-projectile bursts. With cooldown reduction stacking (50ms minimum at `BalanceConfig.ts:72`), players can exhaust the pool. When this happens, `WeaponSystem.ts:739` silently returns null — the weapon *appears* to fire but produces no projectiles. The player feels cheated with no feedback.

**Highland Cow is a ghost enemy**: `data/enemies.ts:76-84` defines a complete tank enemy (40 HP, chase behavior, pack size 1, `appearsAt: 300`). It has a full 64x64 texture in BootScene (line 923), hitbox setup in Enemy.ts (line 176), and appears as ambient decoration in MainMenuScene and MenuScene. But `BalanceConfig.ts:10-25` — the wave timeline — **never adds it**. The game lacks a tank-type enemy in mid-game when one is fully implemented and ready to spawn.

**Boss HP doesn't scale**: Boss definitions in `data/enemies.ts` have hardcoded HP values (e.g., `boss_gordon: 500`, `boss_taxman: 10000`). If a player encounters Gordon at minute 5 vs. minute 20 (from a save resume), the boss is identically easy/hard regardless of the player's power level. There's no time-based HP scaling for bosses.

**Claymore is under-tuned**: `data/weapons.ts:219-240` — Claymore has the highest cooldown (3400ms) but mediocre effective DPS (~8.2 baseline). Compare to Bagpipe Blast at 2400ms cooldown doing ~50 effective DPS with added freeze+knockback. Claymore is rarely worth picking.

## Your Mission

Fix the late-game experience from both angles — make it **run smooth** and **play fair**.

### Phase 1: Performance (Do First)

#### 1.1 Eliminate `getChildren()` allocation churn
The fix pattern: instead of `group.getChildren() as Enemy[]` (which creates a new array), access the internal backing store directly. Phaser Groups expose `children.entries` as a `Set` — iterate it without copying.

```typescript
// BEFORE (allocates new array every call):
const enemies = this.enemyGroup.getChildren() as Enemy[];
for (const e of enemies) { ... }

// AFTER (zero allocation):
const entries = this.enemyGroup.children.entries;
for (const e of entries) {
  if (!(e as Enemy).active) continue;
  // ... use (e as Enemy)
}
```

Apply this to ALL 29 call sites across WeaponSystem.ts, SpawnSystem.ts, XPSystem.ts, Enemy.ts, and any other hot paths. **Do NOT change test files** — only production code.

**Verification**: Before and after, run the game for 15+ minutes with the browser DevTools Performance tab open. Compare GC pause frequency and total heap allocation rate.

#### 1.2 Pool visual effects in WeaponSystem
The 8 `this.scene.add.circle()` / `this.scene.add.graphics()` calls in WeaponSystem (lines 327, 367, 419, 542, 579, 630, 648, 690) create new GameObjects on every weapon fire. Create a small VFX pool (similar to how JuiceSystem pools impact rings at line 114-130) for:
- AoE pulse rings (bagpipe blast, highland fling)
- Trail zone circles (scotch mist, the haar)
- Arc sweep graphics (nessie tentacle, claymore)
- Expanding rings (evolution effects)

Pool size of 20-30 should be sufficient since each effect lives only 200-600ms.

#### 1.3 Optimize Piper orbit behavior
The O(n) enemy scan in `behaviorOrbit` (Enemy.ts:602-609) should use a distance-squared check (skip `Math.sqrt`) and early-exit when the Piper itself is far from the player (enemies cluster near the player, so if the Piper is 500px away from the player, most enemies within 120px of the Piper are irrelevant).

### Phase 2: Balance Hardening

#### 2.1 Add Highland Cow to the wave timeline
Add `{ t: 360, add: 'highland_cow' }` to the milestones array in `BalanceConfig.ts:10-25`. This slots the tank enemy at 6 minutes — after terriers and sheep, before eagles. The highland cow (40 HP, slow speed 30) creates a natural mid-game pressure point where players must have upgraded weapons to handle tanky enemies, breaking the pure-kite strategy.

#### 2.2 Increase projectile pool to 350
Change `projectilePoolMax: 200` to `projectilePoolMax: 350` in `BalanceConfig.ts:70`. Also add a visible warning when pool is >80% full — a brief console.warn in dev mode and a subtle UI indicator (e.g., weapon slot cooldown bar flashes red when shots are being dropped).

#### 2.3 Scale boss HP with game time
In SpawnSystem where bosses are spawned, apply a time-based HP multiplier:
```typescript
const timeScale = 1 + Math.max(0, (gameTimeSec - 300) * 0.002); // +0.2% per second after 5 min
boss.maxHp = Math.ceil(boss.maxHp * timeScale);
boss.hp = boss.maxHp;
```
This means a boss at minute 5 has 1.0x HP, at minute 10 has 1.6x, at minute 15 has 2.2x. It keeps bosses challenging as the player's damage scales.

#### 2.4 Tune Claymore
In `data/weapons.ts`, reduce Claymore base cooldown from 3400ms to 2600ms and increase base damage from 28 to 34. This brings its effective DPS in line with other weapons while preserving its identity as the slow, heavy-hitting melee option. Also adjust its level scaling to feel rewarding:
- Level 2: +arcDegrees (wider sweep)
- Level 3: +damage
- Level 4: +aoeRadius (longer reach)
- Level 5: +damage + reduced cooldown

### Phase 3: Verification

1. `npm run build` — type-check passes
2. `npm test` — 174/174 tests pass (or more if you add any)
3. `npm run dev` — play a full 15-minute run. Observe:
   - Frame rate stays above 55fps at minute 15 with 300+ enemies
   - Highland Cows appear at ~6 minutes and feel like meaningful threats
   - Projectiles never silently drop (watch Thistle Storm bursts closely)
   - Bosses feel appropriately challenging at their spawn time
   - Claymore feels worth picking (compare DPS against Bagpipe Blast)
4. Check DevTools Performance tab — GC pauses should be reduced vs. before

## Files You'll Touch

| File | Changes |
|------|---------|
| `src/systems/WeaponSystem.ts` | Replace 12 `getChildren()` calls + pool visual effects |
| `src/systems/SpawnSystem.ts` | Replace 4 `getChildren()` calls + boss HP scaling |
| `src/systems/XPSystem.ts` | Replace 5 `getChildren()` calls |
| `src/entities/Enemy.ts` | Replace ~3 `getChildren()` calls + optimize Piper orbit |
| `src/core/BalanceConfig.ts` | Add highland_cow to timeline, increase pool to 350 |
| `src/data/weapons.ts` | Claymore rebalance (cooldown, damage, level scaling) |
| `src/scenes/GameScene.ts` | Any remaining `getChildren()` calls |

## The Standard

Late-game should feel like the haggis fantasy at full power — triumphant, fast, responsive, fair. Not stuttery, not trivial, not silently broken. The player who reaches minute 20 has earned a smooth, challenging, rewarding experience. Give it to them.
