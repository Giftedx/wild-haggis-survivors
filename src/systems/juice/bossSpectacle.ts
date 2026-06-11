import * as Phaser from 'phaser';
import type { SettingsManager } from '../../core/SettingsManager';
import {
  resolveScreenShakeParams,
  BOSS_DEATH_SHAKE_BASE_AMP,
  BOSS_DEATH_SHAKE_DURATION_MS,
} from '../screenShakeParams';
import { scaledParticleCount } from '../../core/a11yMotion';
import {
  JUICE_BOSS_DEATH_GOLDS,
  JUICE_BOSS_DEATH_RING_PRIMARY,
  JUICE_BOSS_DEATH_RING_SECONDARY,
} from '../juiceGoldPalette';
import { FLASH_TIMING } from '../effectTimingPresets';

/**
 * Mutable pool-index state shared between JuiceSystem and the boss
 * spectacle helpers. Helpers read+write `idx` in place; JuiceSystem
 * holds the struct so destroy/init paths stay symmetrical.
 */
export interface BossSpectaclePools {
  particlePool: Phaser.GameObjects.Arc[];
  particleIdx: number;
  ringPool: Phaser.GameObjects.Arc[];
  ringIdx: number;
}

export interface BossSpectacleDeps {
  scene: Phaser.Scene;
  settings: SettingsManager;
  pools: BossSpectaclePools;
  flashWhite: (durationMs?: number) => void;
  /** Mirrors `tickers.addOnce('raw', delayMs, cb)` — wall-clock delay, no time-scale coupling. */
  scheduleRawOnce: (delayMs: number, cb: () => void) => void;
}

/** Boss kill celebration — gold particle shower + expanded kill burst.
 *  Count + shake both scale with motionScale. */
export function playBossDeathSpectacle(x: number, y: number, deps: BossSpectacleDeps): void {
  const { scene, settings, pools } = deps;
  const lowFx = settings.load().reduceParticles;
  const shakeOn = settings.load().screenShake;
  // Big white flash
  deps.flashWhite(FLASH_TIMING.long);

  const bossDeathShake = resolveScreenShakeParams(
    BOSS_DEATH_SHAKE_BASE_AMP,
    BOSS_DEATH_SHAKE_DURATION_MS,
    shakeOn,
    settings.load().motionScale,
  );
  if (bossDeathShake) {
    scene.cameras.main.shake(bossDeathShake.durationMs, bossDeathShake.amplitude);
  }

  const baseCount = lowFx ? 12 : 30;
  const particleCount = scaledParticleCount(baseCount, 6);
  // Gold particle shower — pooled
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 80 + Math.random() * 200;
    const size = Phaser.Math.Between(3, 8);
    const color = Phaser.Utils.Array.GetRandom(JUICE_BOSS_DEATH_GOLDS as number[]) as number;
    const particle = pools.particlePool[pools.particleIdx];
    pools.particleIdx = (pools.particleIdx + 1) % pools.particlePool.length;
    scene.tweens.killTweensOf(particle);
    particle.setPosition(x, y);
    particle.setRadius(size);
    particle.setFillStyle(color, 0.9);
    particle.setAlpha(0.9);
    particle.setScale(1);
    particle.setVisible(true);
    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed,
      alpha: 0,
      scale: 0,
      duration: 800 + Math.random() * 600,
      ease: 'Power2',
      onComplete: () => particle.setVisible(false),
    });
  }

  // Expanding ring — pooled
  const ring = pools.ringPool[pools.ringIdx];
  pools.ringIdx = (pools.ringIdx + 1) % pools.ringPool.length;
  scene.tweens.killTweensOf(ring);
  ring.setPosition(x, y);
  ring.setRadius(10);
  ring.setFillStyle(JUICE_BOSS_DEATH_RING_PRIMARY, 0.5);
  ring.setAlpha(0.5);
  ring.setScale(1);
  ring.setVisible(true);
  scene.tweens.add({
    targets: ring,
    radius: 80,
    alpha: 0,
    duration: 500,
    onComplete: () => ring.setVisible(false),
  });

  // Second delayed ring — pooled. Use 'raw' so the 150ms delay is wall-clock:
  // scaled mode freezes during HIT_FREEZE physics-pause and stretches to
  // ~500ms during slow-motion, breaking the intended layered animation.
  deps.scheduleRawOnce(150, () => {
    const ring2 = pools.ringPool[pools.ringIdx];
    pools.ringIdx = (pools.ringIdx + 1) % pools.ringPool.length;
    scene.tweens.killTweensOf(ring2);
    ring2.setPosition(x, y);
    ring2.setRadius(10);
    ring2.setFillStyle(JUICE_BOSS_DEATH_RING_SECONDARY, 0.3);
    ring2.setAlpha(0.3);
    ring2.setScale(1);
    ring2.setVisible(true);
    scene.tweens.add({
      targets: ring2,
      radius: 120,
      alpha: 0,
      duration: 600,
      onComplete: () => ring2.setVisible(false),
    });
  });
}

/** Mid-run boss kill — between regular killBurst and the full victory
 *  bossDeathSpectacle. 15 gold particles + 1 expanding ring + lighter shake. */
export function playMidRunBossDeathSpectacle(x: number, y: number, deps: BossSpectacleDeps): void {
  const { scene, settings, pools } = deps;
  const s = settings.load();

  // Sprite-based large burst — additive layer on top of the existing gold
  // particle/ring spectacle. Depth 22 sits above boss particles (20) so the
  // tartan-fleck radial reads as the boss-tier flourish.
  if (scene.textures.exists('fx_enemy_burst_large')) {
    const burst = scene.add.image(x, y, 'fx_enemy_burst_large')
      .setDepth(22)
      .setScale(0.8)
      .setAlpha(1);
    scene.tweens.add({
      targets: burst,
      scale: 1.8,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => burst.destroy(),
    });
  }

  const shake = resolveScreenShakeParams(
    BOSS_DEATH_SHAKE_BASE_AMP * 0.6,
    BOSS_DEATH_SHAKE_DURATION_MS,
    s.screenShake,
    s.motionScale,
  );
  if (shake) {
    scene.cameras.main.shake(shake.durationMs, shake.amplitude);
  }

  const baseCount = s.reduceParticles ? 6 : 15;
  const particleCount = scaledParticleCount(baseCount, 3);
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 100 + Math.random() * 160;
    const size = Phaser.Math.Between(2, 5);
    const color = Phaser.Utils.Array.GetRandom(JUICE_BOSS_DEATH_GOLDS as number[]) as number;
    const particle = pools.particlePool[pools.particleIdx];
    pools.particleIdx = (pools.particleIdx + 1) % pools.particlePool.length;
    scene.tweens.killTweensOf(particle);
    particle.setPosition(x, y);
    particle.setRadius(size);
    particle.setFillStyle(color, 0.9);
    particle.setAlpha(0.9);
    particle.setScale(1);
    particle.setVisible(true);
    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed,
      alpha: 0,
      scale: 0,
      duration: 600 + Math.random() * 400,
      ease: 'Power2',
      onComplete: () => particle.setVisible(false),
    });
  }

  // Single expanding ring
  const ring = pools.ringPool[pools.ringIdx];
  pools.ringIdx = (pools.ringIdx + 1) % pools.ringPool.length;
  scene.tweens.killTweensOf(ring);
  ring.setPosition(x, y);
  ring.setRadius(10);
  ring.setFillStyle(JUICE_BOSS_DEATH_RING_PRIMARY, 0.5);
  ring.setAlpha(0.5);
  ring.setScale(1);
  ring.setVisible(true);
  scene.tweens.add({
    targets: ring,
    radius: 60,
    alpha: 0,
    duration: 450,
    onComplete: () => ring.setVisible(false),
  });
}
