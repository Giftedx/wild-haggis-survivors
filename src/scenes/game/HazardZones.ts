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
import type { DeathCauseTracker } from '../../systems/DeathCauseTracker';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import { HAZARD_SOURCE_KEY } from '../../systems/DeathCauseTracker';

export interface HazardZonesHooks {
  getPlayer(): Player;
  getJuice(): JuiceSystem;
  getDeathCauseTracker(): DeathCauseTracker;
  getSpawnSystem(): SpawnSystem;
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
    const rng = new Phaser.Math.RandomDataGenerator(['zones']);
    const scene = this.scene;

    for (let i = 0; i < 4; i++) {
      const lx = rng.between(200, W - 200);
      const ly = rng.between(200, H - 200);
      const lr = rng.between(35, 55);

      scene.add.ellipse(lx, ly, lr * 2, lr * 1.5, 0xcc3300, 0.4).setDepth(-1);
      const lavaGlow = scene.add.ellipse(lx, ly, lr * 1.6, lr * 1.2, 0xff6600, 0.2).setDepth(-1);
      scene.tweens.add({
        targets: lavaGlow,
        alpha: { from: 0.15, to: 0.35 },
        scale: { from: 1, to: 1.1 },
        duration: 1500 + rng.between(0, 800),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      this.lavaZones.push({ x: lx, y: ly, r: lr, tickAccMs: 0 });
    }

    for (let i = 0; i < 3; i++) {
      this.addHealingCircle(
        rng.between(200, W - 200),
        rng.between(200, H - 200),
        rng.between(30, 45),
        rng.between(0, 1000),
      );
    }
  }

  /**
   * Drops an additional healing circle at random world coords. Used by
   * W2 route onResume (round_the_loch spawns two extra for act 2).
   */
  spawnHealingCircle(): void {
    const W = GAME.WORLD_WIDTH;
    const H = GAME.WORLD_HEIGHT;
    const x = Phaser.Math.Between(200, W - 200);
    const y = Phaser.Math.Between(200, H - 200);
    const r = Phaser.Math.Between(30, 45);
    this.addHealingCircle(x, y, r, Phaser.Math.Between(0, 1000));
  }

  private addHealingCircle(hx: number, hy: number, hr: number, jitterMs: number): void {
    const scene = this.scene;
    scene.add.ellipse(hx, hy, hr * 2, hr * 1.5, 0x22aa44, 0.2).setDepth(-1);
    const healGlow = scene.add.ellipse(hx, hy, hr * 1.4, hr * 1.0, 0x44dd66, 0.1).setDepth(-1);
    scene.tweens.add({
      targets: healGlow,
      alpha: { from: 0.08, to: 0.2 },
      duration: 2000 + jitterMs,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
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
          const hazardDmg = Math.max(1, Math.round(3 * this.hooks.getDamageTakenMult()));
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
        if (dx * dx + dy * dy < rSq) player.heal(2);
      }
    }
  }
}
