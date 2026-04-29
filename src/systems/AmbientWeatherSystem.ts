/**
 * AmbientWeatherSystem — purely cosmetic seasonal weather overlay.
 *
 * Reads `getActiveSeasonalEventKey(new Date())` once at `start()` and
 * picks one of four ambient modes (drizzle, rain, sun-shaft, aurora) or
 * stays idle when no event is active. No gameplay coupling — no slow,
 * no damage, no pickup magnet, no minimap presence. Particles sit at
 * `setDepth(-100)` so they always fall behind gameplay sprites.
 *
 * Lifetime is tied to a single run. GameScene constructs one in
 * `create()`, ticks it from `update()`, and calls `stop()` in the
 * scene `'shutdown'` listener so a recycled scene instance never
 * inherits the prior run's tweens.
 *
 * Caps simultaneous particles at 30 — drizzle is the only mode that
 * realistically approaches that ceiling, and at low alphas the cost
 * is dominated by the alpha tween rather than the texture draw.
 *
 * Respects two settings:
 *   - `disableSeasonalEvents` — system stays idle (mode = null).
 *   - `reduceParticles`       — system stays idle (mode = null).
 *
 * Texture keys consumed (validator-locked, baked in BootScene):
 *   `fx_drizzle`, `fx_rain_drop`, `fx_sun_shaft`, `fx_aurora_band`,
 *   `fx_lambing_mote`, `fx_harvest_sheaf`. Each `scene.add.image` call
 * is guarded with `textures.exists(key)` so headless test stubs that
 * skip BootScene baking don't crash.
 */
import type * as Phaser from 'phaser';
import { getActiveSeasonalEventKey } from './SeasonalEventManager';
import { getSettingsManager } from '../core/SettingsManager';

/** Ambient weather variants. `null` = idle (no event active / disabled). */
export type AmbientWeatherMode =
  | 'drizzle'
  | 'rain'
  | 'sun_shaft'
  | 'aurora'
  | 'lambing_motes'
  | 'harvest_drift'
  | 'stonehaven_fireballs'
  | null;

/** Depth slot for ambient weather — behind every gameplay sprite. */
const WEATHER_DEPTH = -100;

/** Hard ceiling on simultaneous particles (memory bound). */
const PARTICLE_CAP = 30;

/**
 * Pure mapping from seasonal event key → ambient weather mode. Exported
 * for unit tests; the system uses it internally via `start()`.
 */
export function pickWeatherMode(eventKey: string | null): AmbientWeatherMode {
  switch (eventKey) {
    case 'samhain':
      return 'drizzle';
    case 'beltane':
      return 'sun_shaft';
    case 'hogmanay':
      // Stonehaven Fireballs — the 1908+ Aberdeenshire Hogmanay
      // procession. Whirling fire-orbs drift across the moor as a
      // diegetic seasonal nod. More iconic than the generic
      // pewter-rain that previously voiced Hogmanay.
      return 'stonehaven_fireballs';
    case 'burns_night':
      return 'rain';
    case 'st_andrews':
      return 'aurora';
    case 'imbolc':
      // Brigid's mantle warmth — soft golden motes drifting upward.
      return 'lambing_motes';
    case 'lammas':
      // Harvest chaff drifting horizontally — wind-borne grain off
      // the first reaping at the cairn.
      return 'harvest_drift';
    default:
      return null;
  }
}

interface ModeConfig {
  /** ms between spawns (period, not rate). */
  spawnPeriodMs: number;
  /** Required texture key — `start()` skips the mode if missing. */
  textureKey: string;
}

const MODE_CONFIG: Record<Exclude<AmbientWeatherMode, null>, ModeConfig> = {
  // Smirr — fine wind-driven drizzle. ~4/sec → 250ms period.
  drizzle: { spawnPeriodMs: 250, textureKey: 'fx_drizzle' },
  // Pewter rain — ~10/sec → 100ms period.
  rain: { spawnPeriodMs: 100, textureKey: 'fx_rain_drop' },
  // Crepuscular shafts — slow cadence, long-lived. One every ~5s.
  sun_shaft: { spawnPeriodMs: 5000, textureKey: 'fx_sun_shaft' },
  // Mirrie Dancers — very slow cadence, very long-lived. One every ~10s.
  aurora: { spawnPeriodMs: 10000, textureKey: 'fx_aurora_band' },
  // Imbolc Brigid's-mantle motes — gentle gold motes rising from the
  // byre. Modest cadence so the screen never feels crowded; long-lived
  // particles do the heavy lifting visually. ~2/sec → 500ms period.
  lambing_motes: { spawnPeriodMs: 500, textureKey: 'fx_lambing_mote' },
  // Lammas wind-borne harvest chaff. Slower than drizzle, faster than
  // sun-shafts — the moor breathing across a finished field.
  // ~1.5/sec → 700ms period.
  harvest_drift: { spawnPeriodMs: 700, textureKey: 'fx_harvest_sheaf' },
  // Hogmanay Stonehaven fireballs — sparse cadence, long-lived spinning
  // orbs that arc across the moor. One every ~2.5 s; the visual is
  // load-bearing per fireball so we don't pile too many on screen at
  // once.
  stonehaven_fireballs: { spawnPeriodMs: 2500, textureKey: 'fx_stonehaven_fireball' },
};

export class AmbientWeatherSystem {
  private readonly scene: Phaser.Scene;
  private mode: AmbientWeatherMode = null;
  private spawnPeriodMs = 0;
  private accumMs = 0;
  private started = false;
  /** Live particles — sweep on `stop()` so no tween outlives the run. */
  private readonly active: Set<Phaser.GameObjects.Image> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Resolve season → mode and begin spawning. Idempotent — second call
   * is a no-op so the scene-create path can call this without checks.
   */
  start(): void {
    if (this.started) return;
    this.started = true;

    const settings = getSettingsManager().load();
    if (settings.disableSeasonalEvents || settings.reduceParticles) {
      this.mode = null;
      return;
    }

    const eventKey = getActiveSeasonalEventKey(new Date(), settings.disableSeasonalEvents);
    const mode = pickWeatherMode(eventKey);
    if (!mode) {
      this.mode = null;
      return;
    }

    const cfg = MODE_CONFIG[mode];
    // Texture-baked guard: if BootScene didn't run (test stub) the key
    // is absent and we'd silently spawn invisible images forever. Stay
    // idle instead.
    if (!this.scene.textures.exists(cfg.textureKey)) {
      this.mode = null;
      return;
    }

    this.mode = mode;
    this.spawnPeriodMs = cfg.spawnPeriodMs;
    this.accumMs = 0;
  }

  /**
   * Advance the spawn timer. Multiple particles can fire in one tick if
   * `delta` exceeds the period — important after a tab-backgrounded
   * frame, though `accumMs` is capped at 4 periods to avoid a stampede.
   */
  update(delta: number): void {
    if (!this.mode) return;
    if (!Number.isFinite(delta) || delta <= 0) return;

    this.accumMs = Math.min(this.accumMs + delta, this.spawnPeriodMs * 4);
    while (this.accumMs >= this.spawnPeriodMs) {
      this.accumMs -= this.spawnPeriodMs;
      if (this.active.size >= PARTICLE_CAP) continue;
      this.spawnOne();
    }
  }

  /**
   * Destroy every live particle, kill their tweens, and clear state so
   * a future `start()` re-resolves the season cleanly.
   */
  stop(): void {
    for (const img of this.active) {
      this.scene.tweens.killTweensOf(img);
      img.destroy();
    }
    this.active.clear();
    this.mode = null;
    this.spawnPeriodMs = 0;
    this.accumMs = 0;
    this.started = false;
  }

  // -------------------- internals --------------------

  private getViewport(): { x: number; y: number; w: number; h: number } {
    const cam = this.scene.cameras?.main;
    return {
      x: cam?.scrollX ?? 0,
      y: cam?.scrollY ?? 0,
      w: cam?.width ?? this.scene.scale?.width ?? 800,
      h: cam?.height ?? this.scene.scale?.height ?? 600,
    };
  }

  private spawnOne(): void {
    switch (this.mode) {
      case 'drizzle':
        this.spawnDrizzle();
        return;
      case 'rain':
        this.spawnRain();
        return;
      case 'sun_shaft':
        this.spawnSunShaft();
        return;
      case 'aurora':
        this.spawnAurora();
        return;
      case 'lambing_motes':
        this.spawnLambingMote();
        return;
      case 'harvest_drift':
        this.spawnHarvestSheaf();
        return;
      case 'stonehaven_fireballs':
        this.spawnStonehavenFireball();
        return;
      default:
        return;
    }
  }

  /** Adds image, registers it in the live set, auto-removes on destroy. */
  private addImage(x: number, y: number, key: string): Phaser.GameObjects.Image | null {
    if (!this.scene.textures.exists(key)) return null;
    const img = this.scene.add.image(x, y, key).setDepth(WEATHER_DEPTH);
    this.active.add(img);
    img.once('destroy', () => this.active.delete(img));
    return img;
  }

  private spawnDrizzle(): void {
    const v = this.getViewport();
    const x = v.x + Math.random() * v.w;
    const y = v.y + Math.random() * v.h;
    const img = this.addImage(x, y, 'fx_drizzle');
    if (!img) return;
    const startAlpha = 0.3 + Math.random() * 0.2; // 0.3..0.5
    img.setAlpha(0);
    const lifetimeMs = 2000 + Math.random() * 1000; // 2-3s
    const dx = (Math.random() - 0.5) * 12; // gentle sway
    const dy = 24 + Math.random() * 12;     // drift down
    this.scene.tweens.add({
      targets: img,
      x: img.x + dx,
      y: img.y + dy,
      alpha: { from: 0, to: startAlpha, duration: lifetimeMs * 0.3, yoyo: true, hold: lifetimeMs * 0.4 },
      duration: lifetimeMs,
      onComplete: () => img.destroy(),
    });
  }

  private spawnRain(): void {
    const v = this.getViewport();
    const x = v.x + Math.random() * v.w;
    const y = v.y - 12; // start above viewport so it drops in
    const img = this.addImage(x, y, 'fx_rain_drop');
    if (!img) return;
    const startAlpha = 0.45 + Math.random() * 0.25; // 0.45..0.7
    img.setAlpha(startAlpha);
    const lifetimeMs = 1500;
    const fallDist = v.h + 30;
    this.scene.tweens.add({
      targets: img,
      y: img.y + fallDist,
      duration: lifetimeMs,
      ease: 'Quad.easeIn',
      onComplete: () => img.destroy(),
    });
  }

  private spawnSunShaft(): void {
    const v = this.getViewport();
    const x = v.x + Math.random() * v.w;
    const y = v.y + Math.random() * (v.h * 0.25); // top quarter
    const img = this.addImage(x, y, 'fx_sun_shaft');
    if (!img) return;
    img.setOrigin(0.5, 0);
    img.setRotation((Math.random() * 0.4) - 0.2); // slight tilt ±0.2 rad
    const peakAlpha = 0.15 + Math.random() * 0.1; // 0.15..0.25
    img.setAlpha(0);
    const lifetimeMs = 8000 + Math.random() * 4000; // 8-12s
    const drift = (Math.random() - 0.5) * 60;
    // Pulse: in → hold (with gentle alpha sway) → out.
    this.scene.tweens.add({
      targets: img,
      x: img.x + drift,
      duration: lifetimeMs,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.25,
      yoyo: false,
    });
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha * 0.6,
      duration: lifetimeMs * 0.5,
      delay: lifetimeMs * 0.25,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
    // Final fade-out + cleanup.
    this.scene.time.delayedCall(lifetimeMs * 0.85, () => {
      if (!img.active) return;
      this.scene.tweens.add({
        targets: img,
        alpha: 0,
        duration: lifetimeMs * 0.15,
        onComplete: () => img.destroy(),
      });
    });
  }

  private spawnAurora(): void {
    const v = this.getViewport();
    const x = v.x + Math.random() * v.w;
    const y = v.y + Math.random() * (v.h / 3); // top third
    const img = this.addImage(x, y, 'fx_aurora_band');
    if (!img) return;
    const peakAlpha = 0.2 + Math.random() * 0.1; // 0.2..0.3
    img.setAlpha(0);
    const lifetimeMs = 15000 + Math.random() * 5000; // 15-20s
    const drift = (Math.random() < 0.5 ? -1 : 1) * 10 * (lifetimeMs / 1000); // ~10 px/s
    img.setScale(1 + Math.random() * 0.3); // 1.0..1.3
    // Slow horizontal drift.
    this.scene.tweens.add({
      targets: img,
      x: img.x + drift,
      duration: lifetimeMs,
      ease: 'Sine.easeInOut',
    });
    // Fade-in.
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.2,
    });
    // Gentle alpha pulse during the body.
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha * 0.7,
      duration: lifetimeMs * 0.4,
      delay: lifetimeMs * 0.2,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
    // Fade-out + cleanup.
    this.scene.time.delayedCall(lifetimeMs * 0.85, () => {
      if (!img.active) return;
      this.scene.tweens.add({
        targets: img,
        alpha: 0,
        duration: lifetimeMs * 0.15,
        onComplete: () => img.destroy(),
      });
    });
  }

  /**
   * Imbolc lambing-motes — soft warm-gold motes that drift slowly
   * UPWARD across the viewport. Brigid's first-of-spring breath rising
   * from the byre. Gentle horizontal sway makes the rise feel alive
   * rather than mechanical.
   */
  private spawnLambingMote(): void {
    const v = this.getViewport();
    const x = v.x + Math.random() * v.w;
    // Spawn near the bottom of the viewport so the upward drift covers
    // most of the screen before the particle fades.
    const y = v.y + v.h * 0.7 + Math.random() * (v.h * 0.3);
    const img = this.addImage(x, y, 'fx_lambing_mote');
    if (!img) return;
    const peakAlpha = 0.4 + Math.random() * 0.25; // 0.4..0.65
    img.setAlpha(0);
    const lifetimeMs = 4500 + Math.random() * 1500; // 4.5-6s
    const sway = (Math.random() - 0.5) * 24; // gentle horizontal drift
    const rise = -(60 + Math.random() * 40); // 60-100px upward
    this.scene.tweens.add({
      targets: img,
      x: img.x + sway,
      y: img.y + rise,
      duration: lifetimeMs,
      ease: 'Sine.easeOut',
    });
    // Fade-in early, hold, fade-out late.
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.25,
    });
    this.scene.time.delayedCall(lifetimeMs * 0.7, () => {
      if (!img.active) return;
      this.scene.tweens.add({
        targets: img,
        alpha: 0,
        duration: lifetimeMs * 0.3,
        onComplete: () => img.destroy(),
      });
    });
  }

  /**
   * Lammas harvest-drift — tan-amber wheat-grain wisps drifting
   * sideways across the moor. Wind direction picked per particle so
   * the field reads as breeze-driven, not bulk-conveyor. Slight
   * vertical wobble keeps the chaff feeling weightless.
   */
  private spawnHarvestSheaf(): void {
    const v = this.getViewport();
    // Wind direction: 50/50 left-to-right or right-to-left.
    const goingRight = Math.random() < 0.5;
    const startX = goingRight ? v.x - 16 : v.x + v.w + 16;
    const endX = goingRight ? v.x + v.w + 16 : v.x - 16;
    const y = v.y + Math.random() * v.h;
    const img = this.addImage(startX, y, 'fx_harvest_sheaf');
    if (!img) return;
    img.setAlpha(0);
    // Mirror the wisp horizontally when blowing right-to-left so the
    // bright tip leads the motion.
    if (!goingRight) img.setFlipX(true);
    const peakAlpha = 0.5 + Math.random() * 0.2; // 0.5..0.7
    const lifetimeMs = 3500 + Math.random() * 1500; // 3.5-5s
    const wobble = (Math.random() - 0.5) * 18;
    this.scene.tweens.add({
      targets: img,
      x: endX,
      y: img.y + wobble,
      duration: lifetimeMs,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.2,
    });
    this.scene.time.delayedCall(lifetimeMs * 0.75, () => {
      if (!img.active) return;
      this.scene.tweens.add({
        targets: img,
        alpha: 0,
        duration: lifetimeMs * 0.25,
        onComplete: () => img.destroy(),
      });
    });
  }

  /**
   * Hogmanay Stonehaven Fireballs — Aberdeenshire's 1908-onward New
   * Year procession. Whirling fire-orbs swung on chains arc across
   * the moor at high arc-angle; the haggis sees them flicker past.
   *
   * Each particle spawns at one screen edge, traces a high-arc
   * trajectory toward the opposite side with steady rotation, and
   * fades on arrival. Ember-orange tint pulses subtly mid-flight
   * (the chain swing). Diegetic + cosmetic — never damages or
   * obstructs the player.
   */
  private spawnStonehavenFireball(): void {
    const v = this.getViewport();
    // Pick which side enters from — 50/50.
    const goingRight = Math.random() < 0.5;
    const startX = goingRight ? v.x - 24 : v.x + v.w + 24;
    const endX = goingRight ? v.x + v.w + 24 : v.x - 24;
    // Arc height varies — top third to mid-screen.
    const startY = v.y + v.h * 0.15 + Math.random() * v.h * 0.25;
    const arcMidY = startY + 30 + Math.random() * 40;
    const img = this.addImage(startX, startY, 'fx_stonehaven_fireball');
    if (!img) return;
    img.setAlpha(0);
    img.setScale(0.85 + Math.random() * 0.3);
    const peakAlpha = 0.7 + Math.random() * 0.2;
    const lifetimeMs = 3500 + Math.random() * 1000; // 3.5-4.5s
    // Continuous rotation — the swinging-on-the-chain motion.
    this.scene.tweens.add({
      targets: img,
      rotation: goingRight ? Math.PI * 4 : -Math.PI * 4,
      duration: lifetimeMs,
      ease: 'Linear',
    });
    // Two-stage trajectory — rise to arc peak, fall to opposite edge.
    this.scene.tweens.add({
      targets: img,
      x: { value: (startX + endX) / 2, duration: lifetimeMs / 2, ease: 'Linear' },
      y: { value: arcMidY, duration: lifetimeMs / 2, ease: 'Sine.easeOut' },
    });
    this.scene.time.delayedCall(lifetimeMs / 2, () => {
      if (!img.active) return;
      this.scene.tweens.add({
        targets: img,
        x: endX,
        y: startY + 50,
        duration: lifetimeMs / 2,
        ease: 'Sine.easeIn',
      });
    });
    // Fade in fast, hold, fade out late.
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.15,
    });
    // Subtle alpha pulse mid-flight — the swing rhythm.
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha * 0.6,
      duration: lifetimeMs * 0.4,
      delay: lifetimeMs * 0.15,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
    this.scene.time.delayedCall(lifetimeMs * 0.85, () => {
      if (!img.active) return;
      this.scene.tweens.add({
        targets: img,
        alpha: 0,
        duration: lifetimeMs * 0.15,
        onComplete: () => img.destroy(),
      });
    });
  }
}
