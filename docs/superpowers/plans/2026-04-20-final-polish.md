# Final Art & Music Polish — Remaining Gaps

> **STATUS:** ✅ SHIPPED 2026-04-20 — biome VFX + wildlife + victory celebration (per `superpowers/plans/INDEX.md`).
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three targeted additions that fill the last genuine atmosphere gaps: biome-specific entry VFX, wildlife that makes the moor feel inhabited, and a dedicated victory celebration.

**Architecture:** Each section is independent. All hook into existing systems (JuiceSystem particles, AnimationController, Phaser tweens).

**Tech Stack:** Phaser 3, TypeScript, existing JuiceSystem particle pool patterns.

---

## What's already excellent (no changes needed)

After investigating the codebase, the following moments are already well-juiced:
- **Boss arrival**: vignette + red banner + sawtooth sting + camera shake + zoom punch ✅
- **Boss death**: white flash + shake + 30 gold particles + 2 expanding rings ✅
- **Weapon evolution**: 12 golden beams + 3 rings + 24 particles + legend banner — the PEAK reward ✅
- **Low-HP**: pulsing crimson/amber vignette (pulses 0.1–0.5 alpha) ✅
- **Menu**: ambient wind audio + floating enemy silhouettes + twinkling particles ✅
- **Film grain**: active overlay with breathing alpha + subtle drift ✅
- **Victory**: resolution music + white flash + camera shake + gold spectacle + fade overlay ✅

---

## Section A — Biome Entry VFX

### What exists
- Text toast on first biome entry: `juice.showToast(t(def.entryToastKey), def.toastColor)`
- Per-biome colors: bog=#9aa070, loch=#88bbdd, pine=#5a8a5a, heather=#c699ee
- BiomeController fires on crossing, tracks `toasted` Set
- JuiceSystem has particle pool patterns (impact rings, burst dots)

### What to add
A biome-colored particle bloom that fires alongside (not replacing) the toast. Each biome gets a distinct visual signature:
- **Heather**: 20 purple particles rising from the ground in a ring burst
- **Bog**: 12 green-brown particles oozing upward slowly (viscous feel)
- **Loch**: 16 blue particles in a horizontal shimmer wave
- **Pine**: 10 dark green particles drifting downward (falling needles)

### File map

| File | Action |
|------|--------|
| `src/systems/JuiceSystem.ts` | **Modify** — add `biomeEntryBurst(x, y, biomeId)` method |
| `src/scenes/game/BiomeController.ts` | **Modify** — call the burst after toast |

### Task A1: Biome entry burst in JuiceSystem

Add a new method that spawns biome-colored particles at the player's position:

```typescript
biomeEntryBurst(x: number, y: number, biomeId: string): void {
  if (this.reduceParticles) return;

  const palettes: Record<string, { color: number; count: number; speed: number; angle: string }> = {
    heather: { color: 0xc699ee, count: 20, speed: 180, angle: 'radial' },
    bog:     { color: 0x7a8a40, count: 12, speed: 80,  angle: 'up_slow' },
    loch:    { color: 0x88bbdd, count: 16, speed: 140, angle: 'horizontal' },
    pine:    { color: 0x4a7a4a, count: 10, speed: 60,  angle: 'down' },
  };
  const p = palettes[biomeId];
  if (!p) return;

  for (let i = 0; i < p.count; i++) {
    // Acquire from existing particle pool (impactDots or similar)
    // Set position, color, velocity based on angle type
    // Fade over 600-1000ms
  }
}
```

Use the existing `impactDotPool` or `burstDotPool` pattern already in JuiceSystem — DON'T create a new pool. Just reuse the general-purpose particle pool with biome colors.

### Task A2: Wire BiomeController to call burst

In BiomeController, after the toast call, add:
```typescript
this.juice.biomeEntryBurst(playerX, playerY, current);
```

Commit: `feat(juice): add biome entry particle burst — per-biome colored bloom`

---

## Section B — Hare Wildlife

### What exists
- Flora scatter system places 200 static decorations ✅
- AnimationController + frame drawer pattern proven for enemies
- BiomeManager voronoi provides biome-aware positioning
- `entity_shadow` texture available for grounding

### Design
A small hare sprite (24×24) that:
- Spawns 3-5 instances at run start (seeded)
- Idles (2-frame breathing) when player is far (>250px)
- Hops away (4-frame hop) when player approaches (<250px)
- Chooses a random flee direction, hops 80-120px, then idles again
- Non-interactive (no hitbox, no collision, purely decorative)
- Depth sorted by y-position (same as flora)
- Only spawns in heather/pine biomes (where hares live)

### File map

| File | Action |
|------|--------|
| `src/art/sprites/fx/hare.ts` | **Create** — bake 24×24 hare sprite (brown, long ears, white tail) |
| `src/animation/frameDrawers/wildlife/hareFrames.ts` | **Create** — idle (2f) + hop (4f) frame offsets |
| `src/systems/HareWildlife.ts` | **Create** — spawn, AI (idle/flee), frame tick |
| `src/art/sprites/fx/index.ts` | **Modify** — add bakeHare call |
| `src/scenes/GameScene.ts` | **Modify** — instantiate + update |

### Task B1: Hare sprite

Bake a 24×24 brown Scottish mountain hare:
- Compact oval body (brown, 8×6px)
- Long upright ears (2 tall narrow triangles)
- White tail puff (small circle)
- Tiny dark eye dot
- Subtle leg tucks underneath

Two textures: `hare_idle_0`, `hare_idle_1` (breathing), `hare_hop_0` through `hare_hop_3` (leg extension cycle).

Use the same `drawWithOffset` pattern — one `drawHareBody(g, frame)` function with breathY + bodyX for idle breathing and legY for hop extension.

### Task B2: Hare AI system

```typescript
export class HareWildlife {
  private hares: HareEntity[] = [];

  create(scene: Phaser.Scene, biomeManager: BiomeManager, worldW: number, worldH: number, seed: number): void {
    // Place 4 hares in heather/pine biome cells (seeded)
    // Each: Image sprite + shadow + AnimationController
  }

  update(delta: number, playerX: number, playerY: number): void {
    for (const h of this.hares) {
      const dist = Math.hypot(h.x - playerX, h.y - playerY);
      if (dist < 250 && h.state === 'idle') {
        // Flee: pick random direction away from player, set velocity
        h.state = 'fleeing';
        h.fleeTimer = 600; // hop for 600ms
      }
      if (h.state === 'fleeing') {
        h.fleeTimer -= delta;
        h.x += h.vx * delta / 1000;
        h.y += h.vy * delta / 1000;
        if (h.fleeTimer <= 0) h.state = 'idle';
      }
      // Tick animation controller with velocity-based signals
      h.controller.tick(delta, {
        velocityMag: h.state === 'fleeing' ? 150 : 0,
        hurtEdge: false, attackEdge: false, celebrateEdge: false, hp: 1,
      });
      h.sprite.setPosition(h.x, h.y);
      h.shadow.setPosition(h.x, h.y + 8);
    }
  }

  destroy(): void { /* cleanup */ }
}
```

Commit: `feat(world): add hare wildlife — idle/flee AI with hop animation`

---

## Section C — Victory Celebration Enhancement

### What exists
- Victory already has: white flash, camera shake, boss-death spectacle at player position, resolution music, fade overlay
- The spectacle reuses `bossDeathSpectacle()` — gold particles + rings

### What's missing
A dedicated ASCENDING celebration distinct from boss death (which is an explosion). Victory should feel like triumph rising, not destruction.

### What to add
After the existing boss-death spectacle, add a 2-second ascending sparkle rain:
- 40 gold/white sparkle dots spawning from the bottom of the screen
- Rising upward with slight lateral drift
- Staggered over 2 seconds (not all at once — continuous rain feel)
- Fades in alpha as they rise
- Camera-locked (scrollFactor 0) — follows the viewport, not the world

### Task C1: Victory sparkle rain in JuiceSystem

```typescript
victorySparkleRain(scene: Phaser.Scene): void {
  if (this.reduceParticles) return;
  const { width, height } = scene.scale;
  const count = 40;
  const interval = 2000 / count; // 50ms between each sparkle

  for (let i = 0; i < count; i++) {
    scene.time.delayedCall(i * interval, () => {
      const x = Math.random() * width;
      const y = height + 10;
      const dot = scene.add.circle(x, y, 2, Phaser.Math.RND.pick([0xffd700, 0xffffff, 0xffee88]), 0.8);
      dot.setScrollFactor(0).setDepth(50);
      scene.tweens.add({
        targets: dot, y: -20, alpha: 0,
        duration: 1800 + Math.random() * 600,
        ease: 'Sine.easeIn',
        onComplete: () => dot.destroy(),
      });
      // Slight lateral drift
      scene.tweens.add({
        targets: dot, x: x + (Math.random() - 0.5) * 60,
        duration: 2000, ease: 'Sine.easeInOut',
      });
    });
  }
}
```

Wire: Call from `handleVictory()` after the boss spectacle call, with a 500ms delay (let the explosion land first, then rain starts).

Commit: `feat(juice): add victory sparkle rain — ascending gold celebration`

---

## Execution Order

| # | Task | Commits | Effort |
|---|------|---------|--------|
| 1 | Biome entry burst | 1 | Low — extends existing JuiceSystem |
| 2 | Victory sparkle rain | 1 | Low — new method + wire call |
| 3 | Hare wildlife | 2 | Medium — new sprite + AI system |

Total: 4 commits.

---

## Quality gates

- Biome burst: particles should be visible but not distracting. Count and speed tuned so they feel atmospheric, not explosive.
- Victory rain: staggered spawning (not simultaneous burst) creates a "rain" feel distinct from the existing burst. Must not compete with the resolution music — complementary, not overwhelming.
- Hare: flee behavior should feel natural (not robotic). Random direction + speed variation. Hare should stop near terrain edges (world bounds check).
- All: respect `reduceParticles` setting. All: `npm run ci` green.
