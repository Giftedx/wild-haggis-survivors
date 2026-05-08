import * as Phaser from 'phaser';
import type { SettingsManager } from '../../core/SettingsManager';
import type { TimeManager } from '../TimeManager';
import {
  JUICE_EVOLUTION_GOLDS,
  JUICE_EVOLUTION_RING_GOLDS,
  JUICE_EVOLUTION_BEAM_COLOR,
  JUICE_EVOLUTION_BANNER_LINE_COLOR,
  JUICE_EVOLUTION_BANNER_BG_COLOR,
} from '../juiceGoldPalette';
import { RING_TIMING, FLASH_TIMING } from '../effectTimingPresets';

export interface EvolutionSpectacleDeps {
  scene: Phaser.Scene;
  settings: SettingsManager;
  time: TimeManager;
  flashWhite: (durationMs?: number) => void;
}

/** Weapon evolution spectacle — THE peak reward moment of the game.
 *  Legendary golden manifestation: radial beams, rings, particles, banner. */
export function playEvolutionSpectacle(
  x: number,
  y: number,
  legendaryName: string,
  deps: EvolutionSpectacleDeps,
): void {
  const { scene, settings, time } = deps;
  const lowFx = settings.load().reduceParticles;
  const shakeOn = settings.load().screenShake;

  // 1. Heavy white-to-gold flash (bigger than normal flashWhite)
  deps.flashWhite(FLASH_TIMING.epic);

  // 2. Hit-freeze for dramatic pause (50ms — longer than combat freeze)
  if (!lowFx) {
    time.requestForDuration('EVOLUTION_FREEZE', { pausePhysics: true }, 50);
  }

  // 3. Screen shake — proportional to the moment (bigger than boss death)
  if (shakeOn) {
    const amp = 0.02 * settings.load().motionScale;
    if (amp > 0) scene.cameras.main.shake(700, amp);
  }

  // 4. Camera zoom punch — brief zoom in then settle.
  // Two sequential tweens (not yoyo) so the return target is re-read at the
  // end of the punch. Without this, if GrowthSystem bumps zoom during the
  // 200ms punch (e.g. a second near-simultaneous level-up), the yoyo settles
  // on stale baseZoom and the camera is permanently wrong for the run.
  const cam = scene.cameras.main;
  const baseZoom = cam.zoom;
  scene.tweens.add({
    targets: cam,
    zoom: baseZoom * 1.08,
    duration: 200,
    ease: 'Quad.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: cam,
        zoom: cam.zoom / 1.08,
        duration: 200,
        ease: 'Quad.easeIn',
      });
    },
  });

  // 5. Radial golden beams (8 rays shooting outward from player)
  const beamCount = lowFx ? 6 : 12;
  for (let i = 0; i < beamCount; i++) {
    const angle = (i / beamCount) * Math.PI * 2;
    const beamLen = 220;
    // Draw beam as a long thin rectangle, rotated
    const beam = scene.add.rectangle(x, y, beamLen, 4, JUICE_EVOLUTION_BEAM_COLOR, 0.8)
      .setOrigin(0, 0.5).setDepth(100);
    beam.setRotation(angle);
    beam.setScale(0, 1);
    scene.tweens.add({
      targets: beam,
      scaleX: 1,
      alpha: 0,
      duration: 500 + i * 15,
      ease: 'Quad.easeOut',
      onComplete: () => beam.destroy(),
    });
  }

  // 6. Three expanding gold rings (layered spectacle)
  for (let r = 0; r < 3; r++) {
    const ring = scene.add.circle(x, y, 15, JUICE_EVOLUTION_RING_GOLDS[r], 0.7 - r * 0.15)
      .setDepth(99);
    scene.tweens.add({
      targets: ring,
      scale: 10 + r * 3,
      alpha: 0,
      duration: RING_TIMING.grand + r * 150,
      delay: r * 80,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  // 7. Golden particle explosion (24 particles, bigger than boss death)
  const particleCount = lowFx ? 12 : 24;
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 100 + Math.random() * 200;
    const color = JUICE_EVOLUTION_GOLDS[i % JUICE_EVOLUTION_GOLDS.length];
    const size = Phaser.Math.Between(3, 7);
    const particle = scene.add.circle(x, y, size, color, 0.95).setDepth(101);
    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed,
      alpha: 0,
      scale: 0.2,
      duration: 800 + Math.random() * 500,
      ease: 'Power2',
      onComplete: () => particle.destroy(),
    });
  }

  // 8. Legendary banner slams in from above (screen-centred)
  const cx = cam.scrollX + cam.width / (2 * cam.zoom);
  const cy = cam.scrollY + cam.height / (2 * cam.zoom) - 40;
  const bannerBg = scene.add.rectangle(cx, cy, cam.width / cam.zoom, 52, JUICE_EVOLUTION_BANNER_BG_COLOR, 0.85)
    .setScrollFactor(0).setDepth(200).setAlpha(0);
  // For screen-space banner, we need scroll factor 0 so use actual screen coords
  bannerBg.setPosition(cam.width / 2, cam.height / 2 - 40);
  bannerBg.setScrollFactor(0);
  const bannerTop = scene.add.rectangle(cam.width / 2, cam.height / 2 - 65, cam.width, 2, JUICE_EVOLUTION_BANNER_LINE_COLOR, 0)
    .setScrollFactor(0).setDepth(200);
  const bannerBot = scene.add.rectangle(cam.width / 2, cam.height / 2 - 15, cam.width, 2, JUICE_EVOLUTION_BANNER_LINE_COLOR, 0)
    .setScrollFactor(0).setDepth(200);
  const text = scene.add.text(cam.width / 2, cam.height / 2 - 40,
    `✦ LEGENDARY: ${legendaryName.toUpperCase()} ✦`,
    {
      fontFamily: 'monospace', fontSize: '22px',
      color: '#ffee88', fontStyle: 'bold',
      stroke: '#2a1a00', strokeThickness: 4,
    }
  ).setOrigin(0.5).setScrollFactor(0).setDepth(201).setAlpha(0).setScale(1.4);

  scene.tweens.add({
    targets: bannerBg, alpha: 0.9, duration: 200,
  });
  scene.tweens.add({
    targets: [bannerTop, bannerBot], alpha: 0.9, duration: 300,
  });
  scene.tweens.add({
    targets: text, alpha: 1, scale: 1, duration: 350, ease: 'Back.easeOut',
  });
  // Hold then fade
  scene.tweens.add({
    targets: [bannerBg, bannerTop, bannerBot, text],
    alpha: 0,
    delay: 1400,
    duration: 500,
    onComplete: () => {
      bannerBg.destroy();
      bannerTop.destroy();
      bannerBot.destroy();
      text.destroy();
    },
  });
}
