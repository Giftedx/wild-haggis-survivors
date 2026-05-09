# Art & Music Polish Pass — Unified Plan

> **STATUS:** ✅ SHIPPED 2026-04-20 — atmosphere-shift batch (per `superpowers/plans/INDEX.md` "Soul + voice + art canon").
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Five targeted improvements that together transform the game's atmosphere: ambient music beds that shift per biome, animated boss encounters, a living world with flora and mist, spinning projectiles, and accessory celebrating/dying frames.

**Architecture:** Each section is independent — no ordering dependencies between sections. Can be executed in parallel or serial.

**Tech Stack:** Phaser 3, Web Audio API, TypeScript, existing animation + music infrastructure.

---

## Section A — Music Phase 4: Biome Ambient Beds + buildDensity Axis

### What exists
- ProceduralMusicEngine with 4 layers: DroneLayer, PianoLayer, PercussionLayer, FogDelay
- Conductor with 4 mood axes: intensity, danger, chaos, triumph
- `GameMusicState` already passes `biomeTimbre` (0=bog, 0.8=heather), `killCount`, `comboCount`
- BiomeManager voronoi exists; `biomeTimbre` smoothed over ~10s in Conductor
- DroneLayer/MasterFilter already modulate brightness from `biomeTimbre`

### What's missing
- No dedicated ambient pad layer (drone is always the same harmonic; no biome-specific character)
- No `buildDensity` axis (music doesn't respond to item collection / build richness)
- No curse-start shimmer signal

### File map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/systems/music/AmbientBedLayer.ts` | **Create** | Biome-reactive pad synthesis (2 detuned oscillators + filter + LFO) |
| `src/systems/music/Conductor.ts` | **Modify** | Add `buildDensity` axis, smooth it, expose in getMood() |
| `src/systems/music/ProceduralMusicEngine.ts` | **Modify** | Wire AmbientBedLayer lifecycle, pass buildDensity + biomeTimbre |
| `src/scenes/game/updateMusicStateScratch.ts` | **Modify** | Compute buildDensity from player accessory/weapon count |
| `src/systems/music/AmbientBedLayer.test.ts` | **Create** | Unit test for the bed's parameter computation |

### Task A1: AmbientBedLayer

Create a new audio layer that synthesizes a warm harmonic pad with biome-reactive timbre.

**Design:**
- 2 detuned triangle oscillators (warm analog pad character)
- Bandpass filter whose center frequency shifts with biomeTimbre (200Hz bog → 600Hz heather)
- LFO on gain (slow breathing, 0.3 Hz)
- Volume driven by `buildDensity` (silent at 0, full at 1) × `intensity` attenuation
- Filter Q tightens under danger (narrower = more anxious)

```typescript
// src/systems/music/AmbientBedLayer.ts
export class AmbientBedLayer {
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private bandpass: BiquadFilterNode | null = null;
  private padGain: GainNode | null = null;

  private readonly BASE_FREQ = 146.83; // D3 — warm register
  private readonly DETUNE_HZ = 0.8;    // gentle beating

  start(ctx: AudioContext, output: AudioNode): void { /* wire graph */ }

  applyMood(
    ctx: AudioContext,
    biomeTimbre: number,   // 0–1
    buildDensity: number,  // 0–1
    intensity: number,     // 0–1
    danger: number,        // 0–1
    transitionSec: number = 2.0,
  ): void {
    // Volume: buildDensity drives presence, attenuated by danger
    const vol = buildDensity * 0.12 * (1 - danger * 0.5);
    // Filter: bog=200Hz (dark), heather=600Hz (bright)
    const freq = 200 + biomeTimbre * 400;
    // Q: tighter under danger (more anxious)
    const q = 1.5 + danger * 2;
    // Apply with ramps...
  }

  stop(): void { /* disconnect all */ }
}
```

### Task A2: buildDensity axis in Conductor

Add a 5th mood axis: `buildDensity`. Computed from the number of collected accessories + weapons divided by max possible (17 total: 9 accessories + 8 weapons). Smoothed at 0.001 rate (very slow — build accumulates over minutes).

```typescript
// In Conductor.ts, add field:
buildDensity = 0;

// In updateMood():
const targetBuild = state.buildDensity ?? 0;
this.buildDensity = lerp(this.buildDensity, targetBuild, delta * 0.001);

// In getMood():
return { intensity, danger, chaos, triumph, buildDensity: this.buildDensity };
```

### Task A3: Compute buildDensity in GameScene

In `updateMusicStateScratch.ts`, compute buildDensity from player state:

```typescript
// buildDensity = (weaponCount + accessoryCount) / 17
// weaponCount: player.getWeaponCount() (0-8)
// accessoryCount: player.getAccessoryCount() (0-9)
scratch.buildDensity = (weaponCount + accessoryCount) / 17;
```

### Task A4: Wire into ProceduralMusicEngine

Add `private ambientBed = new AmbientBedLayer()` field. Call `start/applyMood/stop` in the lifecycle. In `update()`:

```typescript
this.ambientBed.applyMood(
  this.ctx, mood.biomeTimbre, mood.buildDensity, mood.intensity, mood.danger
);
```

### Task A5: Curse-start shimmer

On `globalEventBus.emit('CURSE_STARTED')`, trigger a short (500ms) dissonance shimmer:
- Create transient oscillator at 1/4 tone above current drone pitch
- Rapid volume envelope: 0→0.15→0 over 500ms
- Filtered through narrow bandpass for metallic ring

Wire via existing `globalEventBus` subscription pattern in ProceduralMusicEngine.

---

## Section B — Boss Animation (5 bosses)

### What exists
- All 5 bosses use the Enemy class with `animController` field already wired
- All use 80×80 canvas, chase behavior
- `isEnemyAnimated(config.key)` check already runs on boss spawn
- Boss drawers in `src/art/sprites/bosses/` (gordon, tourBus, hunterGeneral, laird, taxman)
- Enrage tint + phase 2 effects are orthogonal to texture-swap (tint survives setTexture)

### What's needed
- Refactor each boss drawer to extract `draw<Boss>Body(g, frame)`
- Create frame drawers + register
- Same pattern as enemy animation (proven 25 times)

### Bosses are bigger sprites — use LARGER offsets

Boss sprites are 80×80 (vs 44-64 for enemies) and displayed at 2-3× scale. Offsets should be proportionally larger to be visible:
- breathY: ±2 (not ±1) for idle
- Walking leg offsets: ±3 (not ±2)
- Hurt bodyX: -3 to -4 (not -2)
- Dying breathY ramp: up to 8-10

### Task B1-B5: One task per boss

Each follows the exact enemy animation pattern:
1. Refactor `src/art/sprites/bosses/<name>.ts` — extract `draw<Name>Body(g, frame)`, export `<NAME>_CANVAS_SIZE = 80`
2. Create `src/animation/frameDrawers/enemies/<name>Frames.ts` — frame table + self-register
3. Create test
4. Add side-effect import in BootScene

**Boss-specific animation character:**
- **Gordon** (celebrity chef): aggressive forward lean on walk, big flinch on hurt
- **Tour Bus** (vehicle): NO legs. Whole body rocks (breathY only). Hurt = bounce back. Dying = tilt + sink.
- **Laird** (aristocrat): stately walk, minimal flinch (too proud), dramatic collapse on death
- **Hunter General** (military): march-step walk, rigid hurt, disciplined fall
- **Taxman** (reaper): floating/gliding (no legs visible under robes), ethereal bob

---

## Section C — Accessory Celebrating + Dying Frames

### What exists
- All 9 accessories already have `idle`, `walking`, `attacking`, `hurt` authored
- `celebrating` and `dying` fall back to idle_0 via BootScene bakeAccessoryAtlas()
- AccessoryDrawer interface + draw context already support state+frame

### What's needed
- Author `celebrating` frames (4 per accessory) — items bounce/swing with the haggis hop
- Author `dying` frames (3 per accessory) — items drop/collapse with the body
- Add these states to each drawer's `authoredStates` array

### Task C1-C9: One per accessory

Each accessory's celebrating/dying frames follow the body's motion:
- **Celebrating (4 frames):** Squash on frame 0, apex lift on frame 1, land frame 2-3 with lateral sway
- **Dying (3 frames):** Stagger frame 0, buckle frame 1 (item tilts), flat frame 2 (item on ground)

The offsets per accessory type:
- **tam_o_shanter** (above): flies up on celebrate apex, slides off on dying
- **sporran** (body): swings forward on celebrate, crumples under on dying
- **kilt** (front+behind): flares on celebrate hop, puddles on dying
- **highland_shield** (front): bounces on celebrate, drops forward on dying
- **thistle_crown** (above): similar to tam
- **tartan_sash** (body): whips on celebrate, drapes on dying
- **whisky_flask** (body): jostles on celebrate, rolls on dying
- **irn_bru** (body): same as flask
- **loch_water** (body): same as flask

---

## Section D — World Depth: Flora Scatter + Mist

### What exists
- Decoration textures baked: `deco_thistle`, `deco_heather`, `deco_rock_*`, `deco_glasgow_kite`, etc.
- BiomeManager voronoi cells exist with `biomeAt(x, y)` O(1) lookup
- Biome-specific decoration assignment is natural (heather in heather zone, thistle in bog)
- NO placement system — textures exist but are never spawned in the world
- Terrain rendered at depth -4, biome overlay at -3.5

### What's needed

**Flora scatter system:**
- At run start, seed-deterministically scatter 150-300 decoration sprites across the world
- Per-biome variant selection (heather clumps in heather zone, thistles in bog, rocks everywhere)
- Depth sort by y-position (lower = further from camera = lower depth)
- Only render sprites within camera viewport + margin (spatial culling for performance)

**Flora sway animation (simple approach):**
- Don't use full AnimationController — too heavy for 300 decorations
- Instead: per-sprite sin-wave offset on x/y per frame
- Each sprite gets a random phase offset (no sync pulse)
- Sway amplitude: 1-2px, period: 2-4s
- Rocks don't sway (static). Heather/thistle/kite sway.

**Mist particle system:**
- 10-20 large, soft ellipse sprites (semi-transparent white)
- Slow horizontal drift (20-40 px/s)
- Wrap around world edges
- Alpha oscillates (0.03-0.08) — barely visible, subliminal
- Only in bog/loch biome regions (check biomeAt for mist sprite position)
- Depth: -3.2 (between biome overlay and decorations)

### File map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/systems/FloraScatter.ts` | **Create** | Seed-deterministic placement, culling, sway tick |
| `src/systems/MistLayer.ts` | **Create** | Particle pool, drift, alpha oscillation, biome gating |
| `src/scenes/GameScene.ts` | **Modify** | Instantiate FloraScatter + MistLayer, call update |

### Task D1: FloraScatter system

```typescript
export class FloraScatter {
  private sprites: { sprite: Phaser.GameObjects.Image; phase: number; swayable: boolean }[] = [];

  create(scene: Phaser.Scene, biomeManager: BiomeManager, rng: SeededRNG): void {
    // Place 200 decorations across the world
    // Per-biome selection: heather→deco_heather, bog→deco_thistle, all→deco_rock_*
    // Random position within world bounds, seeded from rng
    // Set depth based on y position: depth = -3 + (y / worldHeight) * 0.5
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, delta: number): void {
    // For each sprite:
    //   Skip if outside camera + 100px margin (don't update invisible sprites)
    //   If swayable: x += sin(time + phase) * 1.5, y += cos(time * 0.7 + phase) * 0.5
  }

  destroy(): void { /* kill all sprites */ }
}
```

### Task D2: MistLayer

```typescript
export class MistLayer {
  private wisps: { sprite: Phaser.GameObjects.Ellipse; vx: number; phase: number }[] = [];

  create(scene: Phaser.Scene, biomeManager: BiomeManager, rng: SeededRNG): void {
    // Create 15 large semi-transparent ellipses
    // Position scattered across world
    // Each gets random vx (20-40 px/s), random phase
    // Depth -3.2, alpha 0.04
  }

  update(delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    // Drift each wisp by vx * delta
    // Wrap x when past world edge
    // Alpha = 0.03 + sin(time + phase) * 0.03
    // Visibility: only if biomeAt(wisp.x, wisp.y) is bog or loch
  }

  destroy(): void { /* kill all */ }
}
```

---

## Section E — Projectile Animation

### What exists
- 3 projectile textures: `proj_thistle`, `proj_caber`, `proj_haggis_ball`
- Projectiles are Phaser Sprites with velocity — no rotation or scale animation
- `Projectile.fire()` in WeaponSystem activates from pool with texture + velocity

### What's needed
- **Caber**: angular velocity (spinning log). Set `body.setAngularVelocity(720)` in fire().
- **Thistle**: scale pulse tween (breathing glow). Add `scene.tweens.add({ targets: sprite, scaleX/Y: [0.9, 1.1], yoyo, repeat: -1, duration: 200 })` in fire().
- **Haggis ball**: angular velocity (tumbling ball). `body.setAngularVelocity(540)` in fire().

### Task E1: Projectile visual motion

One commit. In `WeaponSystem.ts` (or wherever `Projectile.fire()` is called), after setting velocity:

```typescript
// After setting velocity on the projectile sprite:
if (textureKey === 'proj_caber') {
  (sprite.body as Phaser.Physics.Arcade.Body).setAngularVelocity(720);
} else if (textureKey === 'proj_thistle') {
  scene.tweens.add({
    targets: sprite, scaleX: 1.1, scaleY: 1.1,
    duration: 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  });
} else if (textureKey === 'proj_haggis_ball') {
  (sprite.body as Phaser.Physics.Arcade.Body).setAngularVelocity(540);
}
```

Also: on deactivate/pool-return, kill tweens and reset rotation/scale:
```typescript
sprite.setRotation(0);
sprite.setScale(1);
scene.tweens.killTweensOf(sprite);
```

---

## Execution Order (recommended)

| # | Section | Commits | Risk | Why this order |
|---|---------|---------|------|----------------|
| 1 | **E: Projectiles** | 1 | Trivial | Quick win, immediate feel improvement, <10 lines |
| 2 | **B: Boss animation** | 5 | Low | Same proven pipeline, high-visibility moments |
| 3 | **A: Music Phase 4** | 5 | Medium | New audio synthesis, needs ear-testing |
| 4 | **C: Accessory frames** | 9 | Low | Pattern proven, moderate authoring effort |
| 5 | **D: World depth** | 3 | Medium | New systems (scatter, mist), needs visual tuning |

Total: ~23 commits across 5 sections.

---

## Quality gates

- Every new audio layer: test in-browser with headphones, verify no clipping, verify smooth transitions
- Every boss animation: verify enrage tint + scale pulse don't fight frame-swap
- Flora scatter: verify no FPS regression at 200+ decoration sprites (spatial culling critical)
- Mist: verify alpha range is subliminal (too visible = distracting, too faint = invisible)
- Projectiles: verify pool return resets rotation/scale cleanly (no stale state on reuse)
- All: `npm run ci` green after each section
