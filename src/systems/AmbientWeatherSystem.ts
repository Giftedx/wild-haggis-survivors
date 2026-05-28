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
  | 'bracken_drift'
  | 'up_helly_aa_embers'
  | 'bannockburn_dust'
  | 'grouse_feather_drift'
  | 'tartan_thread_drift'
  | 'simmer_dim_gloam'
  | 'highland_games_sun'
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
    case 'bracken_turn':
      // Copper-bronze leaves spinning slowly down across the moor —
      // the autumn-cusp colour signature in motion.
      return 'bracken_drift';
    case 'culloden':
      // Cold grey smirr on Drumrossie — historically accurate (the
      // morning of 16 April 1746 was overcast and icy). Drizzle
      // mode is already the samhain overlay but shares no calendar
      // window with Culloden (samhain is Oct 28–Nov 3, Culloden
      // Apr 13–18). The muted visual keeps the grave tone.
      return 'drizzle';
    case 'up_helly_aa':
      // Wild Living World Initiative — Up Helly Aa embers. The Lerwick
      // fire festival's procession sends a slow rise of warm embers
      // drifting upward as the galley burns. Cosmetic-only; respects
      // `reduceParticles` and `reduceFlashing` like every other mode.
      return 'up_helly_aa_embers';
    case 'bannockburn':
      // Wild Living World Phase 2 — Bannockburn dust motes. Anniversary
      // of the 24 June 1314 battle. Ochre + cool-iron motes drift
      // horizontally across the moor with a slight downward bias —
      // "the air remembers the haugh", not gameplay-blocking haze.
      // Cosmetic-only; respects accessibility settings like every
      // other mode.
      return 'bannockburn_dust';
    case 'glorious_twelfth':
      // Wild Living World Phase 2 — Glorious Twelfth grouse-feather
      // drift. 12 August opens the grouse season; the moor wind
      // carries the leavings. Russet-and-white quill flecks tumble
      // down with slow rotation — visually distinct from bracken-turn
      // (smaller, striped quill instead of solid copper leaf).
      return 'grouse_feather_drift';
    case 'tartan_day':
      // Tartan Day (Apr 4–8) — diaspora warmth. Saltire-navy + white
      // + red tartan threads drift on the moor wind. Cultural anchor:
      // the Declaration of Arbroath (1320) — independence woven in cloth.
      // Visually distinct from harvest-drift (amber-cream, fast) by the
      // cooler navy palette and thread-end pip detail.
      return 'tartan_thread_drift';
    case 'simmer_dim':
      // Simmer Dim (Jun 18–21) — Shetland perpetual midsummer twilight.
      // Very faint gloam-stars drift barely upward; long-lived + very
      // low alpha so the overlay reads as a quality of light, not particles.
      // Visually distinct from aurora (fast, saturated ribbon) by the
      // near-stillness and warm-lilac palette.
      return 'simmer_dim_gloam';
    case 'highland_games':
      // Highland Games (Aug 25 – Sep 7) — soft golden sun-motes drifting
      // slowly downward, catching the late-summer showground light. Warm
      // gold palette reads as "bright clear day" — distinct from harvest
      // drift (amber-cream, faster horizontal) and from sun_shaft (tall
      // vertical cones). Hearth warmth without spectacle; the moor is
      // busy but not ablaze.
      return 'highland_games_sun';
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
  // Bracken-turn copper-leaf drift — slow rotational fall, mid-cadence
  // (one every ~600 ms) so the moor reads as a steady leaf-fall
  // without crowding the screen. Leaves are small + low-alpha so the
  // 30-particle cap leaves room for combat readability.
  bracken_drift: { spawnPeriodMs: 600, textureKey: 'fx_bracken_leaf' },
  // Up Helly Aa galley embers — warm sparks rising slowly from the
  // burning longship. Sparse cadence (~1.4/sec → 700ms period) so the
  // moor reads as ember-strewn without overwhelming the player's
  // combat readability. Embers travel upward with gentle horizontal
  // sway — the opposite vector to lambing motes' but visually warmer
  // and shorter-lived per particle.
  up_helly_aa_embers: { spawnPeriodMs: 700, textureKey: 'fx_ember_spark' },
  // Bannockburn-dust motes. Long-lived per particle (4-6s) so even
  // sparse cadence reads as continuous haze. ~1.1/sec spawn — quieter
  // than harvest drift, quieter still than bracken-turn, matching the
  // Grave register (history-cosy reverence, not visual noise).
  bannockburn_dust: { spawnPeriodMs: 900, textureKey: 'fx_bannockburn_dust' },
  // Grouse-feather drift. Mid-cadence (~1.5/sec → 650 ms period) and
  // medium-lived; the 30-particle cap keeps screen readable even
  // mid-feather-fall. Wild register — heather + feather, low-key.
  grouse_feather_drift: { spawnPeriodMs: 650, textureKey: 'fx_grouse_feather' },
  // Tartan-thread drift. Mid-cadence (~1.1/sec → 900 ms period) — slower
  // than harvest chaff (bright + fast) to keep the tone Hearth-warm
  // rather than Wild-energetic. Each thread lives 3.5-5 s so even at
  // 900 ms spawn the moor reads as thread-strewn without crowding.
  tartan_thread_drift: { spawnPeriodMs: 900, textureKey: 'fx_tartan_thread' },
  // Simmer-dim gloam-stars. Very sparse cadence (4000 ms) — the gloam
  // is a quality of light, not a particle storm. Each mote lives 6-9 s
  // so even at this cadence the overlay reads as continuous shimmer.
  simmer_dim_gloam: { spawnPeriodMs: 4000, textureKey: 'fx_simmer_dim_gloam' },
  // Highland Games sun-motes. Mid-sparse cadence (2200 ms) — the bright
  // August showground has a quality of light without particle noise.
  // Warm gold motes drift gently downward: late-summer afternoon light
  // through pipe-smoke over the caber pitch.
  highland_games_sun: { spawnPeriodMs: 2200, textureKey: 'fx_highland_games_sun' },
};

export class AmbientWeatherSystem {
  private readonly scene: Phaser.Scene;
  private mode: AmbientWeatherMode = null;
  private spawnPeriodMs = 0;
  private accumMs = 0;
  private started = false;
  /** Live particles — sweep on `stop()` so no tween outlives the run. */
  private readonly active: Set<Phaser.GameObjects.Image> = new Set();
  /**
   * Pending fade-out timers from `delayedCall`. Tracked so `stop()` can
   * cancel them — without this, a fade scheduled before run-end can fire
   * after `img.destroy()` and try to start a tween on a destroyed target
   * (the inner `if (!img.active) return` guard catches it in practice
   * but is one microtask-ordering assumption away from a stale-target
   * tween).
   */
  private readonly pendingTimers: Set<Phaser.Time.TimerEvent> = new Set();

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
    for (const timer of this.pendingTimers) timer.remove();
    this.pendingTimers.clear();
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

  /**
   * Schedule a fade-out callback whose timer is tracked in `pendingTimers`
   * so `stop()` can cancel it cleanly. Without tracking, a fade scheduled
   * just before run-end could fire after `img.destroy()` and start a
   * tween on a destroyed target.
   */
  private scheduleFade(delayMs: number, callback: () => void): void {
    const timer: Phaser.Time.TimerEvent = this.scene.time.delayedCall(delayMs, () => {
      this.pendingTimers.delete(timer);
      callback();
    });
    this.pendingTimers.add(timer);
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
      case 'bracken_drift':
        this.spawnBrackenLeaf();
        return;
      case 'up_helly_aa_embers':
        this.spawnUpHellyAaEmber();
        return;
      case 'bannockburn_dust':
        this.spawnBannockburnDust();
        return;
      case 'grouse_feather_drift':
        this.spawnGrouseFeather();
        return;
      case 'tartan_thread_drift':
        this.spawnTartanThread();
        return;
      case 'simmer_dim_gloam':
        this.spawnSimmerDimGloam();
        return;
      case 'highland_games_sun':
        this.spawnHighlandGamesSun();
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
    this.scheduleFade(lifetimeMs * 0.85, () => {
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
    this.scheduleFade(lifetimeMs * 0.85, () => {
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
    this.scheduleFade(lifetimeMs * 0.7, () => {
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
    this.scheduleFade(lifetimeMs * 0.75, () => {
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
    this.scheduleFade(lifetimeMs / 2, () => {
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
    this.scheduleFade(lifetimeMs * 0.85, () => {
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
   * Bracken-turn copper-leaf drift — small leaves spin gently as they
   * fall from the top of the viewport. Sideways sway picks a random
   * direction per leaf so the moor reads as wind-stirred, not
   * conveyor-belt. Slight scale jitter sells perspective. Tonal
   * palette: copper / bronze / autumn-rust per ART_STYLE_BIBLE.
   */
  private spawnBrackenLeaf(): void {
    const v = this.getViewport();
    const x = v.x + Math.random() * v.w;
    const startY = v.y - 12; // start above the viewport
    const img = this.addImage(x, startY, 'fx_bracken_leaf');
    if (!img) return;
    const peakAlpha = 0.55 + Math.random() * 0.25; // 0.55..0.80
    img.setAlpha(0);
    img.setScale(0.85 + Math.random() * 0.4); // 0.85..1.25
    const lifetimeMs = 4500 + Math.random() * 1500; // 4.5-6 s
    const sway = (Math.random() - 0.5) * 70; // gentle horizontal drift
    const fall = v.h + 30;
    // Slow rotation — half-turn per leaf, direction random.
    const spinDir = Math.random() < 0.5 ? -1 : 1;
    this.scene.tweens.add({
      targets: img,
      rotation: spinDir * Math.PI * (0.6 + Math.random() * 0.8),
      duration: lifetimeMs,
      ease: 'Linear',
    });
    // Falling trajectory with horizontal sway.
    this.scene.tweens.add({
      targets: img,
      x: img.x + sway,
      y: startY + fall,
      duration: lifetimeMs,
      ease: 'Sine.easeIn',
    });
    // Fade-in early, hold, fade-out late.
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.2,
    });
    this.scheduleFade(lifetimeMs * 0.78, () => {
      if (!img.active) return;
      this.scene.tweens.add({
        targets: img,
        alpha: 0,
        duration: lifetimeMs * 0.22,
        onComplete: () => img.destroy(),
      });
    });
  }

  /**
   * Up Helly Aa galley embers — warm sparks rise slowly from the
   * Lerwick fire-festival's burning longship. Spawns near the bottom
   * of the viewport, drifts UPWARD with gentle horizontal sway and a
   * very slow rotation. Diegetic + cosmetic: respects the same
   * accessibility gates as every other mode (system stays idle when
   * `reduceParticles` is set, and the per-particle peak alpha is
   * intentionally modest so `reduceFlashing` settings face no rapid
   * brightness spikes).
   *
   * Visually distinct from `stonehaven_fireballs`:
   *   - small + many vs. large + sparse
   *   - vertical rise vs. horizontal arc
   *   - short particle lifetime so frame budget stays low
   */
  private spawnUpHellyAaEmber(): void {
    const v = this.getViewport();
    const x = v.x + Math.random() * v.w;
    // Spawn in the lower third — embers rise from the procession.
    const y = v.y + v.h * 0.65 + Math.random() * (v.h * 0.35);
    const img = this.addImage(x, y, 'fx_ember_spark');
    if (!img) return;
    // Peak alpha is intentionally low — the screen ships dozens of
    // these across a run, and the bake already has a hot core. Keep
    // brightness mild so `reduceFlashing` users see no harsh strobing.
    const peakAlpha = 0.4 + Math.random() * 0.2; // 0.4..0.6
    img.setAlpha(0);
    img.setScale(0.7 + Math.random() * 0.5); // 0.7..1.2
    const lifetimeMs = 3500 + Math.random() * 1500; // 3.5-5s
    const sway = (Math.random() - 0.5) * 40; // gentle horizontal drift
    const rise = -(80 + Math.random() * 60); // 80-140px upward
    // Slow lazy rotation — the spark tumbling in updraft.
    const spinDir = Math.random() < 0.5 ? -1 : 1;
    this.scene.tweens.add({
      targets: img,
      rotation: spinDir * Math.PI * (0.4 + Math.random() * 0.5),
      duration: lifetimeMs,
      ease: 'Linear',
    });
    // Rising trajectory with horizontal sway.
    this.scene.tweens.add({
      targets: img,
      x: img.x + sway,
      y: img.y + rise,
      duration: lifetimeMs,
      ease: 'Sine.easeOut',
    });
    // Fade-in fast, hold steady, fade-out late.
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.2,
    });
    this.scheduleFade(lifetimeMs * 0.7, () => {
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
   * Bannockburn-dust motes — Wild Living World Phase 2.
   *
   * Anniversary of 24 June 1314. Ochre + cool-iron motes drift
   * horizontally across the moor with a slight downward bias —
   * "the air remembers the haugh".
   *
   * Visually distinct from `harvest_drift` (warm-amber, fast wind)
   * by being cooler / muddier and shorter horizontal travel with a
   * subtle vertical settle. Each mote lives 4-6 s so even at the
   * 900 ms cadence the screen reads as continuous haze.
   *
   * Tonal register: Grave (history-cosy reverence — see
   * `ART_STYLE_BIBLE.md`). Peak alpha intentionally modest so
   * `reduceFlashing` users see no harsh contrast.
   */
  private spawnBannockburnDust(): void {
    const v = this.getViewport();
    // Wind direction: 50/50 left-to-right or right-to-left so the
    // moor doesn't pattern-tile when several motes spawn close.
    const goingRight = Math.random() < 0.5;
    const startX = goingRight ? v.x - 18 : v.x + v.w + 18;
    const endX = goingRight ? v.x + v.w + 18 : v.x - 18;
    const y = v.y + Math.random() * v.h;
    const img = this.addImage(startX, y, 'fx_bannockburn_dust');
    if (!img) return;
    img.setAlpha(0);
    if (!goingRight) img.setFlipX(true);
    img.setScale(0.85 + Math.random() * 0.4); // 0.85..1.25
    const peakAlpha = 0.35 + Math.random() * 0.2; // 0.35..0.55
    const lifetimeMs = 4000 + Math.random() * 2000; // 4-6s
    // Slight downward settle as the dust travels — gravity nudge
    // without it feeling like falling. 18..36 px over lifetime.
    const settle = 18 + Math.random() * 18;
    this.scene.tweens.add({
      targets: img,
      x: endX,
      y: img.y + settle,
      duration: lifetimeMs,
      ease: 'Sine.easeIn',
    });
    // Fade in early, hold, fade-out late.
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.25,
    });
    this.scheduleFade(lifetimeMs * 0.7, () => {
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
   * Grouse-feather drift — Wild Living World Phase 2.
   *
   * Glorious Twelfth (12 August). Russet + white quill flecks tumble
   * down across the moor as the season opens. Slow rotation per
   * feather, mid-cadence falls so the moor reads as feather-strewn
   * without overwhelming the screen.
   *
   * Visually distinct from `bracken_drift` (copper-leaf, fall) by
   * the striped quill silhouette + smaller body + tighter alpha
   * range, and from `harvest_drift` (horizontal wind chaff) by the
   * vertical fall vector.
   *
   * Tonal register: Wild (heather + feather — see
   * `ART_STYLE_BIBLE.md`).
   */
  private spawnGrouseFeather(): void {
    const v = this.getViewport();
    const x = v.x + Math.random() * v.w;
    const startY = v.y - 14; // start above the viewport
    const img = this.addImage(x, startY, 'fx_grouse_feather');
    if (!img) return;
    const peakAlpha = 0.55 + Math.random() * 0.2; // 0.55..0.75
    img.setAlpha(0);
    img.setScale(0.85 + Math.random() * 0.35); // 0.85..1.20
    const lifetimeMs = 4200 + Math.random() * 1400; // 4.2-5.6s
    const sway = (Math.random() - 0.5) * 60; // gentle horizontal drift
    const fall = v.h + 30;
    // Slow rotation — feathers tumble lazily as they fall. Random
    // direction so the moor doesn't read as conveyor-belt.
    const spinDir = Math.random() < 0.5 ? -1 : 1;
    this.scene.tweens.add({
      targets: img,
      rotation: spinDir * Math.PI * (0.5 + Math.random() * 0.7),
      duration: lifetimeMs,
      ease: 'Linear',
    });
    this.scene.tweens.add({
      targets: img,
      x: img.x + sway,
      y: startY + fall,
      duration: lifetimeMs,
      ease: 'Sine.easeIn',
    });
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.2,
    });
    this.scheduleFade(lifetimeMs * 0.78, () => {
      if (!img.active) return;
      this.scene.tweens.add({
        targets: img,
        alpha: 0,
        duration: lifetimeMs * 0.22,
        onComplete: () => img.destroy(),
      });
    });
  }

  /**
   * Tartan-thread drift — Tartan Day (Apr 4–8).
   *
   * Saltire-navy + white + red thread strands drift on the moor wind
   * — the Declaration of Arbroath (1320) thread: independence woven in
   * cloth. Spawns off the left or right edge, crosses the screen
   * horizontally with a small vertical settle and ±10° tumble.
   *
   * Tonal register: Hearth (diaspora warmth — the moor reaches further).
   * Visually distinct from `harvest_drift` (amber-cream, fast) by the
   * cooler navy palette; distinct from `bannockburn_dust` (muddy ochre,
   * horizontal) by the bright navy + white signature.
   */
  private spawnTartanThread(): void {
    const v = this.getViewport();
    // 50/50 left-right so the threads don't all blow the same direction.
    const goingRight = Math.random() < 0.5;
    const startX = goingRight ? v.x - 16 : v.x + v.w + 16;
    const endX = goingRight ? v.x + v.w + 16 : v.x - 16;
    const y = v.y + Math.random() * v.h;
    const img = this.addImage(startX, y, 'fx_tartan_thread');
    if (!img) return;
    img.setAlpha(0);
    if (!goingRight) img.setFlipX(true);
    // Each thread tumbles slightly — ±10° random angle so the overlay
    // reads as textile in wind, not printed stripes.
    img.setAngle((Math.random() - 0.5) * 20);
    img.setScale(0.9 + Math.random() * 0.3); // 0.9..1.2
    const peakAlpha = 0.40 + Math.random() * 0.2; // 0.40..0.60
    const lifetimeMs = 3500 + Math.random() * 1500; // 3.5-5s
    // Slight vertical settle — the moor wind isn't perfectly horizontal.
    const settle = (Math.random() - 0.5) * 40;
    this.scene.tweens.add({
      targets: img,
      x: endX,
      y: img.y + settle,
      duration: lifetimeMs,
      ease: 'Sine.easeIn',
    });
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.2,
    });
    this.scheduleFade(lifetimeMs * 0.75, () => {
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
   * Simmer-dim gloam-stars — Simmer Dim (Jun 18–21).
   *
   * The star the Shetland gloaming holds — a pale lilac-gold mote
   * that drifts barely upward and fades so slowly the player isn't
   * sure if it was ever there. Simmer dim is the perpetual midsummer
   * twilight that never darkens past blue-hour.
   *
   * Tonal register: Hearth-edge (warm but edged with uncanny — you
   * could walk in this light forever). Very low peak alpha so the
   * overlay reads as a quality of light, not a particle storm. Long
   * lifetime (6-9 s) sustains the shimmer at the sparse 4 s cadence.
   *
   * Visually distinct from `lambing_motes` (spring gold, fast rise)
   * by the lilac cast and near-stillness; distinct from `aurora`
   * (fast, saturated ribbon) by the solitary soft mote format.
   */
  private spawnSimmerDimGloam(): void {
    const v = this.getViewport();
    // Appears anywhere on screen — the gloaming light isn't directional.
    const x = v.x + Math.random() * v.w;
    const y = v.y + Math.random() * v.h;
    const img = this.addImage(x, y, 'fx_simmer_dim_gloam');
    if (!img) return;
    img.setAlpha(0);
    img.setScale(0.8 + Math.random() * 0.5); // 0.8..1.3
    // Very low peak alpha — the gloam is a quality of light, not a
    // particle storm. The player should feel it rather than see it.
    const peakAlpha = 0.30 + Math.random() * 0.18; // 0.30..0.48
    const lifetimeMs = 6000 + Math.random() * 3000; // 6-9s
    // Barely-there drift — upward with a tiny lateral sway.
    const drift = (Math.random() - 0.5) * 20;
    const rise = -(15 + Math.random() * 15); // 15-30px upward
    this.scene.tweens.add({
      targets: img,
      x: img.x + drift,
      y: img.y + rise,
      duration: lifetimeMs,
      ease: 'Linear',
    });
    // Slow fade-in, hold a long beat, slow fade-out. The gloam holds.
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.25,
    });
    this.scheduleFade(lifetimeMs * 0.65, () => {
      if (!img.active) return;
      this.scene.tweens.add({
        targets: img,
        alpha: 0,
        duration: lifetimeMs * 0.35,
        onComplete: () => img.destroy(),
      });
    });
  }

  /**
   * Highland Games sun-motes — Highland Games (Aug 25 – Sep 7).
   *
   * Warm gold motes drift slowly downward from above the viewport —
   * the late-summer showground light through pipe-smoke over the caber
   * pitch. Low alpha so the moor stays readable; gentle downward settle
   * with a small lateral sway sells "still August afternoon."
   */
  private spawnHighlandGamesSun(): void {
    const v = this.getViewport();
    const x = v.x + Math.random() * v.w;
    const startY = v.y - 6; // drop in from just above
    const img = this.addImage(x, startY, 'fx_highland_games_sun');
    if (!img) return;
    img.setAlpha(0);
    img.setScale(0.9 + Math.random() * 0.5); // 0.9..1.4
    const peakAlpha = 0.28 + Math.random() * 0.16; // 0.28..0.44
    const lifetimeMs = 4500 + Math.random() * 2000; // 4.5-6.5s
    const sway = (Math.random() - 0.5) * 30; // gentle lateral drift
    const fall = v.h * 0.55 + Math.random() * v.h * 0.3;
    this.scene.tweens.add({
      targets: img,
      x: img.x + sway,
      y: startY + fall,
      duration: lifetimeMs,
      ease: 'Sine.easeIn',
    });
    this.scene.tweens.add({
      targets: img,
      alpha: peakAlpha,
      duration: lifetimeMs * 0.22,
    });
    this.scheduleFade(lifetimeMs * 0.72, () => {
      if (!img.active) return;
      this.scene.tweens.add({
        targets: img,
        alpha: 0,
        duration: lifetimeMs * 0.28,
        onComplete: () => img.destroy(),
      });
    });
  }
}
