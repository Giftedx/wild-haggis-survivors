# Continuity Polish — Handcrafted Feel Across the Whole Game

> **Shipped 2026-04-21** — verified 2026-04-22 against repo state. Checkboxes below remain unticked because superpowers:subagent-driven-development commits code without editing plan files. File retained in-tree as scope-vs-shipped record.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thirteen targeted improvements that close every remaining gap where the game's atmosphere breaks continuity — from silent shop screens to generic boss deaths to invisible magnetism.

**Architecture:** Sections are independent. All hook into existing systems (AudioSystem synthesis, JuiceSystem pools, ProceduralMusicEngine layers, comboDisplay pure functions). No new dependencies.

**Tech Stack:** Phaser 3, Web Audio API, TypeScript, existing JuiceSystem/AudioSystem/ProceduralMusicEngine patterns.

---

## Section A — Shop Music Loop

### What exists
- ShopScene has `audio.startAmbientWind()` (brown-noise wind) and `stopAmbientWindOnShutdown()`
- ShopScene has purchase SFX (`playClick`, `playPurchase`, `playPurchaseBurst`)
- ProceduralMusicEngine is a singleton (`musicEngine`) with `start()/stop()/update(delta, state)`
- Music engine requires `GameMusicState` per frame — but shop has no gameplay state

### What's missing
Shop is completely silent except wind + button clicks. Player transitions from rich procedural music → dead silence. Jarring.

### Design
Don't reuse ProceduralMusicEngine (it's tightly coupled to gameplay state). Instead, create a lightweight **ShopAmbientLoop** that synthesizes a warm, contemplative drone — like sitting by a fire after a run. Uses 2 detuned triangle oscillators (same pattern as AmbientBedLayer) at D3 + a sub-bass sine at D2, with slow LFO breathing. Fades in on scene create, fades out on transition.

### File map

| File | Action |
|------|--------|
| `src/systems/music/ShopAmbientLoop.ts` | **Create** — warm drone for shop scene |
| `src/systems/music/ShopAmbientLoop.test.ts` | **Create** — parameter computation tests |
| `src/scenes/ShopScene.ts` | **Modify** — start/stop shop music |

### Task A1: ShopAmbientLoop

Create a self-contained audio loop for the shop:

```typescript
// src/systems/music/ShopAmbientLoop.ts
import { getOrCreateAudioContext } from '../audioContext';

export class ShopAmbientLoop {
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private sub: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private playing = false;

  private static readonly BASE_FREQ = 146.83; // D3
  private static readonly SUB_FREQ = 73.42;   // D2
  private static readonly DETUNE_HZ = 0.7;
  private static readonly LFO_RATE = 0.18;    // Very slow breathing
  private static readonly MAX_VOL = 0.08;     // Subtle — underneath the wind

  start(): void {
    if (this.playing) return;
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    // Two detuned triangles for warmth
    this.osc1 = ctx.createOscillator();
    this.osc1.type = 'triangle';
    this.osc1.frequency.value = ShopAmbientLoop.BASE_FREQ;
    this.osc2 = ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.value = ShopAmbientLoop.BASE_FREQ + ShopAmbientLoop.DETUNE_HZ;

    // Sub-bass sine for depth
    this.sub = ctx.createOscillator();
    this.sub.type = 'sine';
    this.sub.frequency.value = ShopAmbientLoop.SUB_FREQ;

    // LFO on master gain — slow breathing
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = ShopAmbientLoop.LFO_RATE;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = ShopAmbientLoop.MAX_VOL * 0.3; // ±30% modulation depth
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.masterGain.gain);

    // Wire oscillators → master
    this.osc1.connect(this.masterGain);
    this.osc2.connect(this.masterGain);
    this.sub.connect(this.masterGain);

    this.osc1.start();
    this.osc2.start();
    this.sub.start();
    this.lfo.start();

    // Fade in over 2s
    this.masterGain.gain.linearRampToValueAtTime(
      ShopAmbientLoop.MAX_VOL, ctx.currentTime + 2.0,
    );
    this.playing = true;
  }

  stop(): void {
    if (!this.playing) return;
    const ctx = getOrCreateAudioContext();
    if (!ctx || !this.masterGain) {
      this.teardown();
      return;
    }
    // Fade out over 0.8s then teardown
    this.masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    setTimeout(() => this.teardown(), 900);
  }

  private teardown(): void {
    try {
      this.osc1?.stop(); this.osc2?.stop();
      this.sub?.stop(); this.lfo?.stop();
    } catch { /* already stopped */ }
    this.osc1?.disconnect(); this.osc2?.disconnect();
    this.sub?.disconnect(); this.lfo?.disconnect();
    this.lfoGain?.disconnect(); this.masterGain?.disconnect();
    this.osc1 = this.osc2 = this.sub = this.lfo = null;
    this.lfoGain = this.masterGain = null;
    this.playing = false;
  }

  /** Apply user volume setting — call from ShopScene when settings change. */
  applyVolume(masterVol: number, musicVol: number): void {
    if (!this.masterGain) return;
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;
    const vol = ShopAmbientLoop.MAX_VOL * masterVol * musicVol;
    this.masterGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.3);
  }
}
```

### Task A2: Wire ShopScene

In `ShopScene.ts`, add:
```typescript
import { ShopAmbientLoop } from '../systems/music/ShopAmbientLoop';

// Field
private shopMusic = new ShopAmbientLoop();

// In create(), after installShopBackdrop:
this.shopMusic.start();

// In shutdown/destroy:
this.shopMusic.stop();
```

Also apply user volume settings from SettingsManager on create.

### Task A3: Test ShopAmbientLoop parameter computation

Test the pure aspects — `MAX_VOL`, `LFO_RATE`, `BASE_FREQ` constants, and that `applyVolume` scales correctly. Mock AudioContext nodes.

Commit: `feat(audio): add shop ambient drone — warm D3 pad with LFO breathing`

---

## Section B — Level-Up Celebration Audio

### What exists
- `UpgradeCards.show()` stagger-reveals cards at `i * 120ms` intervals via raw tickers
- `createCard()` renders card with glow, sparkles (legendary), hover scale
- Legendary cards get `spawnLegendaryTrail()` on selection
- `audio.playLevelUp()` exists — 3-note arpeggio (C5 E5 G5) — but is NOT called from UpgradeCards
- `audio.playClick()` exists for UI feedback

### What's missing
- No sound when cards appear
- No sound when card is selected
- No "fanfare" building as each card reveals

### Design
- **Card reveal**: Play a rising tone per card (pitch increases with index). Use existing `playClick` pattern but with sine oscillator at ascending pitches.
- **Card selection**: Play `audio.playLevelUp()` (already exists, just not wired).
- **Legendary selection**: Play a longer, more dramatic 4-note arpeggio distinct from regular level-up.

### File map

| File | Action |
|------|--------|
| `src/systems/AudioSystem.ts` | **Modify** — add `playCardReveal(index)` and `playLegendarySelect()` |
| `src/ui/UpgradeCards.ts` | **Modify** — wire audio calls into card reveal + selection |

### Task B1: Card reveal & selection SFX in AudioSystem

```typescript
// In AudioSystem — add two new methods

/** Rising tone per card slot — creates anticipation as cards fan out. */
playCardReveal(index: number): void {
  if (!this.enabled) return;
  const ctx = this.ensureContext();
  if (!ctx || !this.masterGain) return;

  const t = ctx.currentTime;
  // Ascending pitch: G4, B4, D5 for cards 0, 1, 2
  const freqs = [392.0, 493.88, 587.33];
  const freq = freqs[Math.min(index, freqs.length - 1)];

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  applySfxDetune(osc);
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  osc.connect(gain);
  gain.connect(this.masterGain);
  osc.start(t);
  osc.stop(t + 0.15);
  this.duckMusicForGameplaySfx(0.15);
}

/** Dramatic arpeggio for legendary weapon evolution selection. */
playLegendarySelect(): void {
  if (!this.enabled) return;
  const ctx = this.ensureContext();
  if (!ctx || !this.masterGain) return;

  const t = ctx.currentTime;
  // Ascending D major: D4 → F#4 → A4 → D5 → F#5 (triumph)
  const freqs = [293.66, 369.99, 440.0, 587.33, 739.99];
  const offsets = [0, 0.06, 0.12, 0.2, 0.3];
  const vols = [0.14, 0.14, 0.14, 0.16, 0.12];

  for (let i = 0; i < freqs.length; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    applySfxDetune(osc);
    osc.frequency.value = freqs[i];
    gain.gain.setValueAtTime(vols[i], t + offsets[i]);
    gain.gain.exponentialRampToValueAtTime(0.001, t + offsets[i] + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t + offsets[i]);
    osc.stop(t + offsets[i] + 0.25);
  }
  this.duckMusicForGameplaySfx(0.35);
}
```

### Task B2: Wire UpgradeCards audio

In `UpgradeCards.ts`:
- In the stagger reveal ticker callback (where `createCard` is called), add `audio.playCardReveal(i)` before `createCard`.
- In the card click handler, add `audio.playLevelUp()` for normal cards.
- For legendary cards, replace with `audio.playLegendarySelect()`.

Commit: `feat(audio): add level-up card reveal + selection SFX — rising tones build anticipation`

---

## Section C — Boss Arrival Fanfare

### What exists
- `SpawnSystem.spawnBoss()` already has: warning banner (vignette + dark red BG + glow lines + text), `audio.playBossWarning()` (sawtooth 60→200Hz, 1s), camera shake + zoom, vignette flash
- `PianoLayer.playNote(freq, time, velocity, release)` — proven stinger pattern
- `PianoLayer.playMoorFlourish()` — 5-note pentatonic arpeggio pattern (precedent)

### What's missing
- `playBossWarning()` is a generic low rumble — same sound for all 5 bosses
- No musical stinger that gives the boss arrival a "theme"
- Boss warning feels ominous but not DRAMATIC

### Design
Add `playBossFanfare()` to PianoLayer — a short descending 4-note brass-like phrase (minor key, heavy). Different from moorFlourish (ascending, bright) — this one descends and darkens. Call from SpawnSystem after the warning banner appears.

NOT per-boss unique — one universal boss fanfare is better than 5 mediocre variants. The warning TEXT already identifies which boss.

### File map

| File | Action |
|------|--------|
| `src/systems/music/PianoLayer.ts` | **Modify** — add `playBossFanfare(time)` |
| `src/systems/music/ProceduralMusicEngine.ts` | **Modify** — expose `playBossFanfare()` public method |
| `src/systems/SpawnSystem.ts` | **Modify** — call fanfare after warning |

### Task C1: Boss fanfare in PianoLayer

```typescript
// In PianoLayer — add method after playMoorFlourish

/**
 * Descending minor fanfare for boss arrival — 4 heavy notes, D minor.
 * Contrasts with moorFlourish (ascending, bright) — this one is ominous,
 * weighty, demands attention. Think brass stab → descending.
 */
playBossFanfare(time: number): void {
  if (!this.ctx || !this.filter) return;
  // Briefly open the filter for clarity
  if (this.filter) {
    const f = this.filter.frequency;
    f.linearRampToValueAtTime(5000, time + 0.05);
    f.linearRampToValueAtTime(3000, time + 1.2);
  }
  // D minor descending: D4 → C4 → A3 → D3 (octave drop = weight)
  const freqs = [293.66, 261.63, 220.0, 146.83];
  const offsets = [0, 0.15, 0.32, 0.55];
  const releases = [0.4, 0.4, 0.5, 0.9]; // Last note rings longest
  const vels = [0.28, 0.24, 0.22, 0.3];   // First and last strongest
  for (let i = 0; i < freqs.length; i++) {
    this.playNote(freqs[i], time + offsets[i], vels[i], releases[i]);
  }
}
```

### Task C2: Expose on ProceduralMusicEngine

```typescript
// In ProceduralMusicEngine — add public method
playBossFanfare(): void {
  if (!this.ctx || !this.playing) return;
  this.piano.playBossFanfare(this.ctx.currentTime);
}
```

### Task C3: Wire in SpawnSystem

In `SpawnSystem.spawnBoss()`, after the `audio.playBossWarning()` call:
```typescript
musicEngine.playBossFanfare();
```

Commit: `feat(audio): add boss arrival fanfare — descending D minor brass stab via PianoLayer`

---

## Section D — Mid-Run Boss Death Spectacle

### What exists
- `die()` sets `active=false`, `visible=false` instantly for ALL enemies (including bosses)
- Kill events emit `GLOBAL_ENEMY_KILLED` with `wasBoss: true`
- JuiceSystem's `showKillBurst()` is called for all kills (generic 6 particles + ring)
- `bossDeathSpectacle()` exists (30 gold particles + 2 rings + shake) but is ONLY called from `RunLifecycle.handleVictory()` — not on mid-run boss kills

### What's missing
Mid-run boss deaths (gordon, tour_bus, laird, hunter_general) die with the same tiny kill burst as a regular ned. No ceremony.

### Design
Add `midRunBossDeathSpectacle(x, y)` to JuiceSystem — a scaled-down version of `bossDeathSpectacle` (fewer particles, smaller rings, no white flash). Call it from GameScene's boss kill handler. Distinct from victory spectacle (which is grander + sparkle rain).

### File map

| File | Action |
|------|--------|
| `src/systems/JuiceSystem.ts` | **Modify** — add `midRunBossDeathSpectacle(x, y)` |
| `src/scenes/GameScene.ts` | **Modify** — call on mid-run boss kill |

### Task D1: midRunBossDeathSpectacle in JuiceSystem

```typescript
/** Medium spectacle for mid-run boss kills — between regular killBurst and
 *  the full victory bossDeathSpectacle. 15 gold particles + 1 ring + shake. */
midRunBossDeathSpectacle(x: number, y: number): void {
  if (this.reduceParticles) {
    // Even reduced-particles gets a single ring
    this.spawnSingleRing(x, y, COLORS.WHISKY_GOLD, 0.5, 400);
    return;
  }

  // Shake — lighter than full boss death
  const s = this.settings.load();
  tryCameraShake(this.camera, 400, BOSS_DEATH_SHAKE_BASE_AMP * 0.6, s);

  // 15 gold particles (half of victory spectacle)
  for (let i = 0; i < 15; i++) {
    const dot = this.acquireBossDot();
    if (!dot) break;
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 160;
    dot.setPosition(x, y);
    dot.setFillStyle(
      Phaser.Utils.Array.GetRandom(JUICE_BOSS_DEATH_GOLDS), 0.9,
    );
    dot.setRadius(Phaser.Math.Between(2, 5));
    dot.setVisible(true);
    this.scene.tweens.add({
      targets: dot,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed,
      alpha: 0, scale: 0,
      duration: 600 + Math.random() * 400,
      ease: 'Cubic.easeOut',
      onComplete: () => dot.setVisible(false),
    });
  }

  // Single expanding ring
  this.spawnSingleRing(x, y, JUICE_BOSS_DEATH_RING_PRIMARY, 0.6, 400);
}
```

Use existing `bossParticlePool` and `bossRingPool` (shared with victory — pools are big enough).

### Task D2: Wire in GameScene

Listen for `GLOBAL_ENEMY_KILLED` where `wasBoss === true`. Call `juice.midRunBossDeathSpectacle(killX, killY)`. Guard: don't fire if victory is pending (avoid doubling with victory spectacle).

Commit: `feat(juice): add mid-run boss death spectacle — 15 gold particles + ring + shake`

---

## Section E — Combo Visual Escalation

### What exists
- `resolveComboDisplay()` in `comboDisplay.ts` returns `{ visible, color, text }` — pure function
- 3 color tiers: orange (5+), amber (20+), fire/gold (50+)
- Combo text is fixed 30px monospace, positioned at screen center-top
- Pulse on milestone: scale 1→1.2 for 100ms (yoyo) — subtle
- Ceilidh chain (every 8th kill): green ring + toast + SFX

### What's missing
- Counter text stays same size at 5 kills and 100 kills — no escalation
- Milestones (11, 50, 100, 200) all get the same 1.2× pulse — no visual distinction
- No screen-edge glow or vignette at high combos
- No particle burst on major milestones

### Design
Extend `resolveComboDisplay` to also return a `scale` factor based on combo tier. Add `resolveComboMilestoneVfx()` — returns what effects to play at specific milestones. Keep the pure function pattern — JuiceSystem reads the returned values and applies them.

### File map

| File | Action |
|------|--------|
| `src/systems/comboDisplay.ts` | **Modify** — add `scale` to ComboDisplayState |
| `src/systems/comboDisplay.test.ts` | **Modify** — test scale tiers |
| `src/systems/comboMilestoneVfx.ts` | **Create** — pure function returning milestone VFX config |
| `src/systems/comboMilestoneVfx.test.ts` | **Create** — tests |
| `src/systems/JuiceSystem.ts` | **Modify** — apply scale from display state, fire milestone VFX |

### Task E1: Add scale to comboDisplay

Add a `scale` field to `ComboDisplayState`:

```typescript
export interface ComboDisplayState {
  visible: boolean;
  color: string;
  text: string;
  scale: number; // 1.0 at threshold, grows with tier
}

// In resolveComboDisplay:
let scale = 1.0;
if (comboCount >= COMBO_FIRE_TIER) scale = 1.3;        // 50+: big and bold
else if (comboCount >= COMBO_AMBER_TIER) scale = 1.15;  // 20+: medium emphasis
// hidden state: scale 1.0
return { visible: true, color, text, scale };
```

### Task E2: comboMilestoneVfx pure function

```typescript
// src/systems/comboMilestoneVfx.ts

export interface ComboMilestoneVfx {
  /** Pulse scale multiplier (applied on top of base scale). */
  pulseScale: number;
  /** Flash color if screen flash should fire, else null. */
  flashColor: number | null;
  /** Duration of flash in ms. */
  flashDurationMs: number;
  /** Number of burst particles (0 = none). */
  burstParticles: number;
}

const NO_VFX: ComboMilestoneVfx = {
  pulseScale: 1.2, flashColor: null, flashDurationMs: 0, burstParticles: 0,
};

/**
 * Returns milestone VFX config for a given combo count.
 * Only returns non-default for milestone thresholds (not every kill).
 */
export function resolveComboMilestoneVfx(count: number): ComboMilestoneVfx | null {
  switch (count) {
    case 11: return { pulseScale: 1.3, flashColor: null, flashDurationMs: 0, burstParticles: 0 };
    case 50: return { pulseScale: 1.5, flashColor: 0xffe088, flashDurationMs: 80, burstParticles: 8 };
    case 100: return { pulseScale: 1.8, flashColor: 0xffd700, flashDurationMs: 120, burstParticles: 16 };
    case 200: return { pulseScale: 2.0, flashColor: 0xffd700, flashDurationMs: 150, burstParticles: 24 };
    default: return null;
  }
}
```

### Task E3: Apply in JuiceSystem

In `syncComboText()`, apply `state.scale`:
```typescript
this.comboText.setScale(state.scale);
```

In `showKillBurst()`, after the existing milestone pulse code, check for milestone VFX:
```typescript
const milestoneVfx = resolveComboMilestoneVfx(this.comboCount);
if (milestoneVfx) {
  // Override pulse scale
  this.scene.tweens.add({
    targets: this.comboText,
    scale: state.scale * milestoneVfx.pulseScale,
    duration: 150,
    yoyo: true,
  });
  // Flash
  if (milestoneVfx.flashColor !== null) {
    this.flashColor(milestoneVfx.flashColor, milestoneVfx.flashDurationMs);
  }
  // Burst particles around combo text
  if (milestoneVfx.burstParticles > 0) {
    this.comboMilestoneBurst(milestoneVfx.burstParticles);
  }
}
```

Add `comboMilestoneBurst(count)` — spawns gold particles radiating from combo text position (camera-locked, scrollFactor 0). Reuse `burstDotPool`.

Commit: `feat(juice): combo visual escalation — scaling text + milestone VFX tiers`

---

## Section F — Weapon Type Visual Identity

### What exists
- `muzzleFlashColors.ts` maps 4 behaviors to 4 colors: projectile→purple, piercing→amber, bouncing→brown, arc_sweep→steel blue
- `aoe_pulse`, `trail`, `aura_pulse` return `null` (no muzzle flash — they have their own ring VFX)
- But their ring VFX use hardcoded generic colors: aoe_pulse=`0x4488ff`, trail=`0x88aacc`, aura_pulse=`0x339955`

### What's missing
The 3 non-muzzle behaviors have hardcoded generic colors that don't match their weapon identity. Bagpipe Blast should feel different from Scotch Mist. Also, impact rings from JuiceSystem are always whisky gold regardless of which weapon dealt the damage.

### Design
Extend `muzzleFlashColors.ts` to also export `resolveWeaponVfxColor()` — maps ALL 7 behaviors to their identity color. Use these in `fireAoePulse`, `fireTrail`, `fireAuraPulse` ring VFX. Also pass weapon color to JuiceSystem impact rings.

### File map

| File | Action |
|------|--------|
| `src/systems/muzzleFlashColors.ts` | **Modify** — add `resolveWeaponVfxColor(behavior)` returning color for ALL behaviors |
| `src/systems/muzzleFlashColors.test.ts` | **Modify** — test all 7 behaviors return non-null |
| `src/systems/WeaponSystem.ts` | **Modify** — use `resolveWeaponVfxColor` for aoe/trail/aura ring colors |

### Task F1: Expand weapon color table

```typescript
// In muzzleFlashColors.ts — add new color constants

/** Bagpipe blast (aoe_pulse) — highland blue. */
export const VFX_COLOR_BAGPIPE = 0x4488cc;
/** Scotch Mist (trail) — misty silver-blue. */
export const VFX_COLOR_MIST = 0x99bbcc;
/** Ceòl Mòr bagpipes (aura_pulse) — forest drone green. */
export const VFX_COLOR_AURA = 0x44aa66;

/**
 * Returns the visual identity color for ANY weapon behavior.
 * Unlike resolveMuzzleFlashColor (which returns null for self-rendering behaviors),
 * this always returns a color — used for ring VFX, impact tints, etc.
 */
export function resolveWeaponVfxColor(behavior: WeaponBehavior): number {
  switch (behavior) {
    case 'projectile': return MUZZLE_FLASH_THISTLE;
    case 'piercing':   return MUZZLE_FLASH_CABER;
    case 'bouncing':   return MUZZLE_FLASH_HAGGIS;
    case 'arc_sweep':  return MUZZLE_FLASH_CLAYMORE;
    case 'aoe_pulse':  return VFX_COLOR_BAGPIPE;
    case 'trail':      return VFX_COLOR_MIST;
    case 'aura_pulse': return VFX_COLOR_AURA;
  }
}
```

### Task F2: Apply weapon colors in WeaponSystem

Replace hardcoded ring colors:

```typescript
// fireAoePulse — line 459: replace 0x4488ff with resolveWeaponVfxColor(w.config.behavior)
const vfxColor = resolveWeaponVfxColor(w.config.behavior);
const ring = this.acquireVfxCircle(px, py, 10, vfxColor, 0.4);

// fireTrail — line 507: replace 0x88aacc
const vfxColor = resolveWeaponVfxColor(w.config.behavior);
const zone = this.acquireVfxCircle(px, py, radius, vfxColor, 0.3);

// fireAuraPulse — line 697: replace 0x339955
const vfxColor = resolveWeaponVfxColor(w.config.behavior);
const ring = this.acquireVfxCircle(px, py, radius, vfxColor, 0.38);
```

Commit: `feat(weapons): per-weapon VFX colors — all 7 behaviors get identity-matched ring tints`

---

## Section G — XP Magnet Trail

### What exists
- `XPGem.updateMagnet()` checks distance, sets `this.magnetized = true` when in range
- When magnetized: velocity toward player, gem slides smoothly
- Gem has idle animations: spin (2.5s rotation), pulse (±15% scale breathe), aura (high-value only)
- No visual change when magnetism activates

### What's missing
Magnetized gems have zero visual feedback — they silently accelerate toward the player. No trail, no glow, no tint. Player can't tell if their pickup radius is working.

### Design
When `magnetized` transitions from false to true, apply a subtle gold tint + alpha boost. No trail particles (too many gems = too many particles). Just a tint change + brightness bump that says "I'm being collected."

### File map

| File | Action |
|------|--------|
| `src/entities/XPGem.ts` | **Modify** — apply tint on magnetize, clear on deactivate |

### Task G1: Magnet tint on XPGem

In `updateMagnet()`, when `this.magnetized` transitions to `true`:

```typescript
if (distSq < pickupRadius * pickupRadius) {
  if (!this.magnetized) {
    this.magnetized = true;
    // Visual: gold tint + alpha boost
    this.setTint(0xffdd44);
    this.setAlpha(1.0); // Override any breathe alpha
  }
}
```

In `deactivate()` or when gem is collected, clear tint:
```typescript
this.clearTint();
```

Keep it minimal — no particles, no trails. Just the tint change is enough to show "this gem is being pulled."

Commit: `feat(xp): gold tint on magnetized gems — visual feedback for pickup radius`

---

## Section H — Passive Item Pickup Feedback

### What exists
- HUD `updatePassiveSlots()` rebuilds all passive pill texts when count changes
- No animation, no sound — items appear instantly
- `audio.playAchievement()` exists (2-note fifth) — appropriate weight for passive pickup
- `audio.playStoneGrant()` exists (3-note bell) — could also work

### What's missing
Equipping a new accessory is a meaningful power-up moment with zero celebration.

### Design
When a new passive appears in the HUD:
1. Play `audio.playStoneGrant()` (warm 3-note bell — fits the "you got something" feel)
2. Scale-in animation on the new pill (scale 0→1 over 200ms with Back.easeOut bounce)
3. Brief glow flash on the pill

### File map

| File | Action |
|------|--------|
| `src/ui/HUD.ts` | **Modify** — detect NEW passive vs existing, animate + play SFX on new |

### Task H1: Passive pickup animation in HUD

In `updatePassiveSlots()`:

```typescript
// Track which passives we already rendered
// Compare incoming passives with this.lastPassiveKeys
const newKeys = passives.filter(k => !this.lastPassiveKeys.has(k));

// After creating the text for a new passive:
if (newKeys.includes(key)) {
  // Scale-in bounce
  text.setScale(0);
  this.scene.tweens.add({
    targets: text,
    scale: 1,
    duration: 250,
    ease: 'Back.easeOut',
  });
  // Brief gold flash background
  const flash = this.scene.add.rectangle(text.x, text.y, text.width + 8, text.height + 4, 0xffdd44, 0.6)
    .setDepth(text.depth - 1);
  this.scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 400,
    onComplete: () => flash.destroy(),
  });
  // SFX (only once, even if multiple passives added at once — debounce)
  if (newKeys.indexOf(key) === 0) {
    audio.playStoneGrant();
  }
}

this.lastPassiveKeys = new Set(passives);
```

Add `private lastPassiveKeys = new Set<string>()` field to HUD. Reset on scene create.

Commit: `feat(ui): passive item pickup feedback — scale-in bounce + gold flash + bell SFX`

---

## Section I — Biome Audio Accent

### What exists
- `BiomeController.tick()` fires toast + `biomeEntryBurst()` on first entry per biome
- Music engine has `biomeTimbre` axis (0-1) that smoothly shifts drone/filter character
- `PianoLayer.playMoorFlourish()` — 5-note pentatonic stinger (precedent for one-shot accents)
- No audio fires on biome entry

### What's missing
Visual burst fires, toast fires, but zero audio cue. Player doesn't "hear" the biome change.

### Design
Add `playBiomeAccent(biomeTimbre)` to ProceduralMusicEngine — a 2-note interval played through the PianoLayer at the biome's timbre frequency. Quick (under 400ms), subtle, just enough to say "something changed." Pitch matches the biome: bog=low, heather=high.

### File map

| File | Action |
|------|--------|
| `src/systems/music/PianoLayer.ts` | **Modify** — add `playBiomeAccent(time, biomeTimbre)` |
| `src/systems/music/ProceduralMusicEngine.ts` | **Modify** — expose `playBiomeAccent(biomeTimbre)` |
| `src/scenes/game/BiomeController.ts` | **Modify** — call on entry |

### Task I1: Biome accent in PianoLayer

```typescript
/**
 * Short 2-note interval on biome entry — pitch follows biome timbre.
 * Bog (timbre 0): low root+fifth (D3-A3). Heather (timbre 1): high (D4-A4).
 * Quick and subtle — just enough to feel the shift.
 */
playBiomeAccent(time: number, biomeTimbre: number): void {
  if (!this.ctx || !this.filter) return;
  // Root frequency: 146.83 (D3) → 293.66 (D4) based on timbre
  const root = 146.83 + biomeTimbre * 146.83;
  const fifth = root * 1.5; // Perfect fifth
  this.playNote(root, time, 0.14, 0.6);
  this.playNote(fifth, time + 0.08, 0.1, 0.5);
}
```

### Task I2: Wire BiomeController

In `BiomeController.tick()`, after `biomeEntryBurst`:
```typescript
musicEngine.playBiomeAccent(BIOMES[current].moodTimbre);
```

Commit: `feat(audio): biome entry accent — 2-note interval pitched to biome timbre`

---

## Section J — Death Slow-Mo Ramp

### What exists
- `handleDeath()` calls `timeManager.request('RUN_END')` which instantly sets `timeScale = 0`
- All enemies and projectiles freeze immediately
- Music fades over 2s, death SFX plays, red flash + shake

### What's missing
Instant freeze is jarring. A 300ms slow-motion ramp (timeScale 1 → 0) would create a cinematic "final moment" feel.

### Design
Before requesting RUN_END, do a brief timeScale ramp using `scene.time.timeScale`:
1. Set `scene.time.timeScale = 0.15` (extreme slow-mo)
2. After 300ms (real time), request RUN_END (full stop)

This creates a brief "dying breath" where everything slows to a crawl before freezing.

### File map

| File | Action |
|------|--------|
| `src/scenes/game/RunLifecycle.ts` | **Modify** — add slow-mo ramp before death freeze |

### Task J1: Death slow-mo ramp

In `handleDeath()`, before the `timeManager.request('RUN_END')` call:

```typescript
// Brief cinematic slow-mo before full freeze
this.scene.time.timeScale = 0.15;
this.scene.physics.world.timeScale = 6.67; // Inverse of 0.15 — slows physics proportionally

// After 300ms real time, fully freeze
setTimeout(() => {
  this.scene.time.timeScale = 1; // Reset before timeManager takes over
  this.scene.physics.world.timeScale = 1;
  timeManager.request('RUN_END', { pausePhysics: true, timeScale: 0 });
  // ... existing death sequence continues here
}, 300);
```

Move the existing death sequence (flash, shake, particles, fade, save) into the setTimeout callback, so it fires after the slow-mo window.

**Important:** `audio.playDeath()` should fire immediately (not delayed) — the death sound starts during slow-mo, then the visual freeze follows.

Commit: `feat(juice): death slow-mo ramp — 300ms cinematic crawl before full freeze`

---

## Section K — Damage Number Combo Scaling

### What exists
- JuiceSystem `showDamageNumber()` uses `damageNumberStyle(damage, isCrit)` for scale + color
- Combo count tracked in JuiceSystem (`this.comboCount`)
- `comboDamageMultiplier()` exists for gameplay damage — but not for visual display

### What's missing
Damage numbers look identical at combo 0 and combo 100. No visual feedback that combo amplifies damage.

### Design
Add combo-based scale boost to damage numbers. At high combos, numbers render slightly larger. Pure function — extend `damageNumberStyle` to accept optional combo count.

### File map

| File | Action |
|------|--------|
| `src/systems/damageNumberStyle.ts` | **Modify** — add combo scale boost |
| `src/systems/damageNumberStyle.test.ts` | **Modify** — test combo scaling |
| `src/systems/JuiceSystem.ts` | **Modify** — pass combo count to style function |

### Task K1: Combo scale boost in damageNumberStyle

```typescript
// In damageNumberStyle — add combo parameter

export function damageNumberStyle(
  damage: number,
  isCrit: boolean,
  comboCount: number = 0,
): DamageNumberStyle {
  // ... existing scale/color from damage + crit ...

  // Combo boost: +0 at combo 0, +0.1 at combo 20, +0.2 at combo 50+
  const comboBoost = Math.min(0.2, comboCount * 0.005);
  scale += comboBoost;

  return { scale, color, ... };
}
```

### Task K2: Pass combo in JuiceSystem

In `showDamageNumber()`, pass `this.comboCount`:
```typescript
const style = damageNumberStyle(damage, isCrit, this.comboCount);
```

Commit: `feat(juice): damage numbers scale with combo — subtle size boost at high streaks`

---

## Section L — Enemy-Type Death Tint

### What exists
- Kill burst uses `COLORS.WHISKY_GOLD` for all enemies
- Enemy has `config.key` identifying its type
- Enemies have unique visual themes (buckfast ned=green/brown, bagpiper=tartan red, etc.)
- `showKillBurst(x, y, color?)` already accepts optional color parameter

### What's missing
All enemies die with identical gold particles. Per-enemy color would add variety without complexity.

### Design
Add `resolveEnemyDeathColor(enemyKey)` — maps enemy keys to their primary visual color. Fall back to whisky gold for unmapped enemies. Pass from GameScene's kill handler.

### File map

| File | Action |
|------|--------|
| `src/systems/enemyDeathColors.ts` | **Create** — pure lookup table |
| `src/systems/enemyDeathColors.test.ts` | **Create** — tests |
| `src/scenes/GameScene.ts` | **Modify** — pass enemy color to showKillBurst |

### Task L1: Enemy death color table

```typescript
// src/systems/enemyDeathColors.ts
import { COLORS } from '../config';

const ENEMY_DEATH_COLORS: Record<string, number> = {
  buckfast_ned: 0x44aa44,        // Buckfast green
  bagpiper: 0xcc4444,            // Tartan red
  tourist: 0xcc2020,             // Red cagoule
  highland_cow: 0x8b6b3a,       // Brown hide
  midgie: 0x555555,              // Dark grey
  seagull: 0xcccccc,             // White
  caber_tosser: 0xddbb66,       // Wood amber
  whisky_barrel: 0xcc8844,      // Amber whisky
  nessie: 0x3366aa,             // Deep blue
  golf_ball: 0xeeeeee,          // White
  haggis_poacher: 0x556633,     // Olive
  piper_skeleton: 0xaa88cc,     // Spectral purple
  rain_cloud: 0x8899aa,         // Grey-blue
  deep_fried_mars: 0xcc6622,    // Batter orange
  ceilidh_caller: 0xbb5555,     // Warm red
  auditor_priest: 0x333355,     // Dark navy
  thistle_crown: 0x9966cc,      // Purple
  sheep: 0xdddddd,              // White wool
  eagle: 0x886633,              // Brown feathers
  will_o_wisp: 0x88ffaa,        // Spectral green
  stone_golem: 0x777788,        // Grey stone
  gale_wraith: 0x99aacc,        // Windswept blue
  bog_horror: 0x556622,         // Bog green
  loch_serpent: 0x4488aa,       // Water blue
  tax_collector: 0x222244,      // Dark suit
};

export function resolveEnemyDeathColor(enemyKey: string): number {
  return ENEMY_DEATH_COLORS[enemyKey] ?? COLORS.WHISKY_GOLD;
}
```

### Task L2: Wire in GameScene

In the kill handler where `showKillBurst` is called, pass the enemy's death color:
```typescript
import { resolveEnemyDeathColor } from '../systems/enemyDeathColors';

// In kill event handler:
const deathColor = resolveEnemyDeathColor(enemyKey);
juice.showKillBurst(killX, killY, deathColor);
```

Commit: `feat(juice): per-enemy death particle tint — kill bursts match enemy visual theme`

---

## Section M — Scene Transition Polish

### What exists
- `addSceneFadeIn()` — uniform dark navy rectangle fade-in (360ms default)
- `startSceneFadeOut()` — same dark navy fade-out
- All scenes use identical transition styling

### What's missing
No variety or scene-specific flavor. Game launch could use a slower reveal. Shop transition could have a warmer tint.

### Design
Add optional `color` and `duration` overrides to the existing fade utilities. Apply scene-specific styling:
- Menu → Game: 500ms fade (longer, builds anticipation)
- Game → Shop: warm brown tint (0x1a1008) instead of navy (transition to "fireside" shop)
- Shop → Menu: same warm brown

### File map

| File | Action |
|------|--------|
| `src/scenes/sceneFade.ts` | **Modify** — add optional `color` parameter to both functions |
| `src/scenes/ShopScene.ts` | **Modify** — use warm brown fade |
| `src/scenes/MenuScene.ts` | **Modify** — use 500ms fade to game |

### Task M1: Add color param to sceneFade

```typescript
export function addSceneFadeIn(
  scene: Phaser.Scene,
  durationMs: number = 360,
  color: number = SCENE_FADE_COLOR,
): void {
  const { width, height } = scene.scale;
  const fade = scene.add.rectangle(width / 2, height / 2, width, height, color, 1)
    .setDepth(SCENE_FADE_DEPTH);
  scene.tweens.add({
    targets: fade, alpha: 0, duration: durationMs,
    onComplete: () => fade.destroy(),
  });
}

export function startSceneFadeOut(
  scene: Phaser.Scene,
  durationMs: number,
  onComplete: () => void,
  color: number = SCENE_FADE_COLOR,
): void {
  // ... same pattern, use color param
}
```

### Task M2: Scene-specific styling

- `ShopScene.create()`: `addSceneFadeIn(this, 400, 0x1a1008)` (warm brown)
- Shop back button: `startSceneFadeOut(this, 260, cb, 0x1a1008)`
- `MenuScene` transition to Game: use `startSceneFadeOut(this, 500, cb)`

Commit: `feat(scenes): scene-specific fade colors + durations — warm brown shop, slower game entry`

---

## Execution Order

| # | Section | Commits | Risk | Why this order |
|---|---------|---------|------|----------------|
| 1 | **F: Weapon VFX colors** | 1 | Trivial | 3 constants + 3 line changes. Instant visual impact |
| 2 | **G: XP magnet tint** | 1 | Trivial | 2-line change. Immediate feel improvement |
| 3 | **L: Enemy death tint** | 1 | Low | Pure lookup table + 1 wire. Visual variety |
| 4 | **M: Scene transitions** | 1 | Low | Param addition + 3 callsite changes |
| 5 | **B: Level-up audio** | 1 | Low | 2 new SFX methods + 3 wire points |
| 6 | **I: Biome audio accent** | 1 | Low | 1 PianoLayer method + 1 wire |
| 7 | **H: Passive pickup feedback** | 1 | Low | HUD animation + SFX |
| 8 | **E: Combo escalation** | 1 | Low | Pure functions + JuiceSystem integration |
| 9 | **K: Damage number scaling** | 1 | Low | Pure function extension + 1 wire |
| 10 | **C: Boss fanfare** | 1 | Low | PianoLayer method + SpawnSystem wire |
| 11 | **D: Boss death spectacle** | 1 | Low | JuiceSystem method + GameScene wire |
| 12 | **A: Shop music** | 1 | Medium | New audio synthesis loop |
| 13 | **J: Death slow-mo** | 1 | Medium | Timing-sensitive — rearranges death sequence |

Total: 13 commits across 13 sections.

---

## Quality gates

- **All audio additions**: Test in-browser with headphones. Verify no clipping, verify music duck works, verify volume respects user settings.
- **Shop music**: Must not conflict with ambient wind. Both should coexist (drone under wind).
- **Level-up audio**: Card reveal tones must not overlap/clash. Each card's tone should be clearly distinct.
- **Boss fanfare**: Must not drown out the warning sawtooth — play AFTER it, not simultaneously.
- **Combo escalation**: Scale values must not make text too large to read. Cap at 2× base.
- **Death slow-mo**: Verify physics slow-mo doesn't cause enemies to teleport or miss collision. Test with many enemies on screen.
- **Weapon colors**: Verify all 7 behaviors have visually distinct, thematically appropriate colors.
- **Enemy death tints**: Spot-check 5+ enemy types visually. Colors should feel "right" for each enemy.
- **All**: `npm run ci` green after each section.
