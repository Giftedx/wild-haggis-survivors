/**
 * HazardZones — spawns and ticks the 4 lava patches + 3 healing circles
 * placed at the start of every run. Lava deals 3 damage per 500ms,
 * healing circles restore 2 HP per 1000ms (both respect curse modifiers
 * via damageTakenMult for lava).
 *
 * Previously 80 lines inline in GameScene (spawnMapZones + tickMapZones
 * + lavaZones/healZones fields). Extracted because the tick loop is
 * self-contained: given a player position and hazard state, it knows
 * what to do.
 */
import Phaser from 'phaser';
import { GAME } from '../../config';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import { HAZARD_ZONE_LAVA, HAZARD_ZONE_HEAL } from './hazardZonePalette';
import type { DeathCauseTracker } from '../../systems/DeathCauseTracker';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import { HAZARD_SOURCE_KEY } from '../../systems/DeathCauseTracker';
import { computeHazardDamage, HEAL_ZONE_HEAL_AMOUNT, LAVA_BASE_DAMAGE } from './hazardDamage';
import { TWEEN_INFINITE_BREATHE } from '../../utils/tweenPresets';
import { computeExtraHealingPlacement, computeHazardPlacements } from './hazardPlacement';
import type { RNG } from '../../utils/rng';

export interface HazardZonesHooks {
  getPlayer(): Player;
  getJuice(): JuiceSystem;
  getDeathCauseTracker(): DeathCauseTracker;
  getSpawnSystem(): SpawnSystem;
  /**
   * Run-scoped seeded RNG. Zone positions are drawn from it so the same
   * seed produces the same hazard layout across runs (foundation for T1
   * deterministic replay + for daily-challenge fairness).
   */
  getRunRng(): RNG;
  isIFrames(): boolean;
  isVictoryPending(): boolean;
  getDamageTakenMult(): number;
  onPlayerKilled(): void;
  /** Lava damage only — for run-wide mechanics that care about HP thresholds. */
  onAfterPlayerDamaged?(hpBefore: number): void;
}

interface Zone {
  x: number;
  y: number;
  r: number;
  tickAccMs: number;
}

export class HazardZones {
  private lavaZones: Zone[] = [];
  private healZones: Zone[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hooks: HazardZonesHooks,
  ) {}

  reset(): void {
    this.lavaZones = [];
    this.healZones = [];
  }

  spawn(): void {
    const W = GAME.WORLD_WIDTH;
    const H = GAME.WORLD_HEIGHT;
    const scene = this.scene;
    const placements = computeHazardPlacements(this.hooks.getRunRng(), W, H);

    for (const z of placements.lava) {
      scene.add.ellipse(z.x, z.y, z.r * 2, z.r * 1.5, HAZARD_ZONE_LAVA.baseColor, HAZARD_ZONE_LAVA.baseAlpha).setDepth(-1);
      const lavaGlow = scene.add.ellipse(z.x, z.y, z.r * 1.6, z.r * 1.2, HAZARD_ZONE_LAVA.glowColor, HAZARD_ZONE_LAVA.glowAlpha).setDepth(-1);
      scene.tweens.add({
        targets: lavaGlow,
        alpha: { from: 0.15, to: 0.35 },
        scale: { from: 1, to: 1.1 },
        duration: 1500 + z.tweenJitterMs,
        ...TWEEN_INFINITE_BREATHE,
      });
      this.lavaZones.push({ x: z.x, y: z.y, r: z.r, tickAccMs: 0 });
    }

    for (const z of placements.heal) {
      this.addHealingCircle(z.x, z.y, z.r, z.tweenJitterMs);
    }
  }

  /**
   * Drops an additional healing circle at random world coords. Used by
   * W2 route onResume (round_the_loch spawns two extra for act 2).
   * Routed through the run RNG so the route's side-effect reproduces
   * under the same seed.
   */
  spawnHealingCircle(): void {
    const W = GAME.WORLD_WIDTH;
    const H = GAME.WORLD_HEIGHT;
    const p = computeExtraHealingPlacement(this.hooks.getRunRng(), W, H);
    this.addHealingCircle(p.x, p.y, p.r, p.tweenJitterMs);
  }

  private addHealingCircle(hx: number, hy: number, hr: number, jitterMs: number): void {
    const scene = this.scene;
    scene.add.ellipse(hx, hy, hr * 2, hr * 1.5, HAZARD_ZONE_HEAL.baseColor, HAZARD_ZONE_HEAL.baseAlpha).setDepth(-1);
    const healGlow = scene.add.ellipse(hx, hy, hr * 1.4, hr * 1.0, HAZARD_ZONE_HEAL.glowColor, HAZARD_ZONE_HEAL.glowAlpha).setDepth(-1);
    scene.tweens.add({
      targets: healGlow,
      alpha: { from: 0.08, to: 0.2 },
      duration: 2000 + jitterMs,
      ...TWEEN_INFINITE_BREATHE,
    });
    this.healZones.push({ x: hx, y: hy, r: hr, tickAccMs: 0 });
  }

  tick(scaledDelta: number): void {
    if (scaledDelta <= 0) return;

    const player = this.hooks.getPlayer();

    // Lava damage tick every 500ms — squared compare avoids sqrt per zone × tick.
    for (const z of this.lavaZones) {
      z.tickAccMs += scaledDelta;
      const rSq = z.r * z.r;
      while (z.tickAccMs >= 500) {
        z.tickAccMs -= 500;
        if (!player.active || this.hooks.isVictoryPending()) continue;
        if (this.hooks.isIFrames() || player.isDashInvincible()) continue;
        const dx = player.x - z.x;
        const dy = player.y - z.y;
        if (dx * dx + dy * dy < rSq) {
          const hazardDmg = computeHazardDamage(LAVA_BASE_DAMAGE, this.hooks.getDamageTakenMult());
          const hpBefore = player.getHp();
          const dead = player.takeDamage(hazardDmg);
          if (!dead) {
            this.hooks.onAfterPlayerDamaged?.(hpBefore);
          }
          this.hooks.getDeathCauseTracker().recordDamage({
            gameTimeSec: this.hooks.getSpawnSystem().getGameTimeSec(),
            sourceKey: HAZARD_SOURCE_KEY,
            amount: hazardDmg,
            sourceIsBoss: false,
            sourceIsElite: false,
            sourceIsHazard: true,
            hpAfter: player.getHp(),
            maxHpAfter: player.getMaxHp(),
          });
          this.hooks.getJuice().flashRed(80);
          if (dead) this.hooks.onPlayerKilled();
        }
      }
    }

    // Healing tick every 1000ms — same squared-compare elegance.
    for (const z of this.healZones) {
      z.tickAccMs += scaledDelta;
      const rSq = z.r * z.r;
      while (z.tickAccMs >= 1000) {
        z.tickAccMs -= 1000;
        if (!player.active) continue;
        const dx = player.x - z.x;
        const dy = player.y - z.y;
        if (dx * dx + dy * dy < rSq) player.heal(HEAL_ZONE_HEAL_AMOUNT);
      }
    }
  }
}
