/**
 * HazardsSystem — biome-conditioned environmental hazards.
 *
 * Spawns one of four hazards in a ring around the player when the
 * current biome matches the hazard's `biome` field. Hazards damage
 * the player on overlap (NOT enemies) and despawn after a per-hazard
 * lifetime. A 1 s cooldown per hazard prevents the player from being
 * repeatedly hit while standing on it.
 *
 * Distinct from `src/scenes/game/HazardZones.ts` (lava + heal patches
 * placed at run start). HazardsSystem is dynamic and biome-aware;
 * HazardZones is static and run-scoped.
 *
 * Texture keys consumed (validator-locked, baked in BootScene):
 *   `hazard_peat_pit`, `hazard_falling_slate`, `hazard_burn_water`,
 *   `hazard_loose_scree`. Each `scene.add.image` call is texture-
 *   exists guarded so headless test stubs that skip BootScene baking
 *   don't crash.
 *
 * Settings:
 *   - `disableHazards` (optional, defaults false). If the field is
 *     missing from a save's settings JSON the system stays enabled.
 *
 * Lifetime is tied to a single run. GameScene constructs one in
 * `create()`, ticks it from `update()`, and calls `stop()` in the
 * scene `'shutdown'` listener so a recycled scene instance never
 * inherits the prior run's hazards or timers.
 */
import type * as Phaser from 'phaser';
import type { Player } from '../entities/Player';
import type { BiomeId } from '../data/biomes';
import type { RNG } from '../utils/rng';
import {
  HAZARDS,
  HAZARD_KEYS,
  type HazardKey,
  type HazardDef,
} from '../data/hazards';
import { getSettingsManager } from '../core/SettingsManager';

/** Depth slot for hazards — above ground tints, below gameplay sprites. */
const HAZARD_DEPTH = -50;

/** Per-hazard re-hit cooldown in ms. Prevents per-frame damage spam. */
const HIT_COOLDOWN_MS = 1000;

/** Spawn ring around the player (min..max distance, px). */
const SPAWN_RING_MIN_PX = 200;
const SPAWN_RING_MAX_PX = 400;

/** Visual fade durations. */
const FADE_IN_MS = 300;
const FADE_OUT_MS = 500;

/** Hard cap on simultaneous hazards (memory bound). */
const HAZARD_CAP = 12;

/**
 * Pure mapping from biome → hazard key. Exported for unit tests.
 * Returns `null` if no hazard targets the biome (defensive — current
 * catalog covers all four biomes 1:1, but a future biome would land
 * here without breaking the system).
 */
export function pickHazardForBiome(biome: BiomeId | null): HazardKey | null {
  if (!biome) return null;
  for (const key of HAZARD_KEYS) {
    if (HAZARDS[key].biome === biome) return key;
  }
  return null;
}

interface ActiveHazard {
  readonly def: HazardDef;
  readonly image: Phaser.GameObjects.Image;
  /** ms remaining until expire — independent of the fade-out tween. */
  remainingMs: number;
  /** ms remaining until next damage tick can fire (0 = ready). */
  hitCooldownMs: number;
  /** Telegraph window — ms remaining before damage can fire. Player
   *  sees the hazard fade in during this window without taking
   *  damage; matches the visual fade-in duration so the warning is
   *  exactly as long as the visual lead-in. Without this, a hazard
   *  spawning on top of a player would damage during fade-in alpha
   *  0 → 1, which reads as "I got hit by something invisible". */
  arrivalMs: number;
  /** Set true once the fade-out has been kicked off so we don't double-trigger. */
  expiring: boolean;
}

export class HazardsSystem {
  private readonly scene: Phaser.Scene;
  private readonly getPlayer: () => Player | null;
  private readonly getCurrentBiome: () => BiomeId | null;
  private readonly getRunRng?: () => RNG | null;
  /** Active hazards — swept on `stop()`. */
  private readonly active: Set<ActiveHazard> = new Set();
  /** Accumulator for the next-spawn timer (ms). */
  private spawnAccumMs = 0;
  /** Current spawn period (ms) — derived from the active biome's hazard. */
  private spawnPeriodMs = 0;
  private started = false;
  private disabled = false;

  constructor(
    scene: Phaser.Scene,
    getPlayer: () => Player | null,
    getCurrentBiome: () => BiomeId | null,
    getRunRng?: () => RNG | null,
  ) {
    this.scene = scene;
    this.getPlayer = getPlayer;
    this.getCurrentBiome = getCurrentBiome;
    this.getRunRng = getRunRng;
  }

  /** Pull a 0..1 random — uses the seeded run RNG when available so
   *  T1 replay determinism (`reference` ADR-0002) holds for the
   *  hazard spawn positions that drive damage events. Falls back to
   *  Math.random() for unit-test stubs that don't wire run RNG in. */
  private rand(): number {
    const rng = this.getRunRng?.();
    return rng ? rng.next() : Math.random();
  }

  /**
   * Begin spawning. Idempotent — second call is a no-op so create()
   * paths can call without checks. Honours `disableHazards` setting
   * if present in the save payload.
   */
  start(): void {
    if (this.started) return;
    this.started = true;

    const settings = getSettingsManager().load();
    if (settings.disableHazards) {
      this.disabled = true;
      return;
    }

    this.spawnAccumMs = 0;
    this.spawnPeriodMs = 0;
  }

  /**
   * Per-frame tick. Spawns when due, applies overlap damage, ages each
   * hazard, kicks fade-out + destroy when lifetime elapses.
   */
  update(delta: number): void {
    if (!this.started || this.disabled) return;
    if (!Number.isFinite(delta) || delta <= 0) return;

    const player = this.getPlayer();
    if (!player) return;

    // Tick active hazards: cooldowns, lifetime, overlap damage.
    for (const h of this.active) {
      if (h.hitCooldownMs > 0) h.hitCooldownMs = Math.max(0, h.hitCooldownMs - delta);
      if (h.arrivalMs > 0) h.arrivalMs = Math.max(0, h.arrivalMs - delta);
      h.remainingMs -= delta;

      if (!h.expiring) {
        // Telegraph window: skip damage while the hazard is still
        // fading in. Player needs to SEE the hazard before it can hit.
        if (h.arrivalMs <= 0 && h.hitCooldownMs <= 0 && this.overlapsPlayer(h, player)) {
          // Respect dash + Burn-Leap iframes — same gate the existing
          // HazardZones system uses (src/scenes/game/HazardZones.ts:301).
          // Without this, a Burn Leap meant to clear a peat pit / scree
          // slide would still take damage, breaking the iframe contract.
          const iframed = player.isDashInvincible() || player.isHazardLeaping();
          if (!iframed) {
            player.takeDamage(h.def.damage);
            h.hitCooldownMs = HIT_COOLDOWN_MS;
          }
        }
        if (h.remainingMs <= 0) this.beginExpire(h);
      }
    }

    // Resolve current biome → which hazard would spawn — drives the
    // cadence too. If no hazard matches, idle the spawn timer.
    const biome = this.getCurrentBiome();
    const key = pickHazardForBiome(biome);
    if (!key) {
      // Reset accumulator so a biome change doesn't immediately dump a
      // backlog of slates on the player's head.
      this.spawnAccumMs = 0;
      this.spawnPeriodMs = 0;
      return;
    }

    const def = HAZARDS[key];
    this.spawnPeriodMs = def.spawnIntervalMs;
    // Cap accum at 2 periods so a tab-backgrounded frame doesn't burst.
    this.spawnAccumMs = Math.min(this.spawnAccumMs + delta, this.spawnPeriodMs * 2);
    while (this.spawnAccumMs >= this.spawnPeriodMs) {
      this.spawnAccumMs -= this.spawnPeriodMs;
      if (this.active.size >= HAZARD_CAP) continue;
      this.spawnHazard(def, player);
    }
  }

  /**
   * Destroy every active hazard, kill their tweens, and clear state so
   * a future `start()` resumes cleanly.
   */
  stop(): void {
    for (const h of this.active) {
      this.scene.tweens.killTweensOf(h.image);
      h.image.destroy();
    }
    this.active.clear();
    this.spawnAccumMs = 0;
    this.spawnPeriodMs = 0;
    this.started = false;
    this.disabled = false;
  }

  // -------------------- internals --------------------

  private overlapsPlayer(h: ActiveHazard, player: Player): boolean {
    const dx = player.x - h.image.x;
    const dy = player.y - h.image.y;
    const r = h.def.hitboxRadius;
    return dx * dx + dy * dy <= r * r;
  }

  private spawnHazard(def: HazardDef, player: Player): void {
    if (!this.scene.textures?.exists(def.texture)) return;

    const angle = this.rand() * Math.PI * 2;
    const dist =
      SPAWN_RING_MIN_PX + this.rand() * (SPAWN_RING_MAX_PX - SPAWN_RING_MIN_PX);
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const image = this.scene.add.image(x, y, def.texture).setDepth(HAZARD_DEPTH);
    image.setAlpha(0);

    const hazard: ActiveHazard = {
      def,
      image,
      remainingMs: def.lifetimeMs,
      hitCooldownMs: 0,
      arrivalMs: FADE_IN_MS,
      expiring: false,
    };
    this.active.add(hazard);
    image.once('destroy', () => this.active.delete(hazard));

    // Fade-in.
    this.scene.tweens.add({
      targets: image,
      alpha: 1,
      duration: FADE_IN_MS,
    });
  }

  private beginExpire(h: ActiveHazard): void {
    h.expiring = true;
    if (!h.image.active) return;
    this.scene.tweens.add({
      targets: h.image,
      alpha: 0,
      duration: FADE_OUT_MS,
      onComplete: () => {
        if (h.image.active) h.image.destroy();
      },
    });
  }
}
