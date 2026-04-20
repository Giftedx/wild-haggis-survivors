/**
 * MistLayer — slow-drifting semi-transparent ellipses that create
 * atmospheric depth. Barely visible (alpha 0.02–0.06), subliminal.
 *
 * Gated by the `reduceParticles` user setting — skips creation entirely
 * when enabled, or reduces count to 5 wisps.
 */
import Phaser from 'phaser';
import type { RNG } from '../utils/rng';

interface MistWisp {
  ellipse: Phaser.GameObjects.Ellipse;
  vx: number;
  phase: number;
}

const FULL_COUNT = 15;
const REDUCED_COUNT = 5;

export class MistLayer {
  private wisps: MistWisp[] = [];
  private time = 0;

  create(
    scene: Phaser.Scene,
    worldW: number,
    worldH: number,
    rng: RNG,
    reduceParticles: boolean,
  ): void {
    // Clean up previous run.
    this.destroy();

    const count = reduceParticles ? REDUCED_COUNT : FULL_COUNT;

    for (let i = 0; i < count; i++) {
      const x = rng.float(0, worldW);
      const y = rng.float(0, worldH);
      const w = rng.float(150, 250);
      const h = rng.float(30, 60);
      const vx = rng.float(15, 35) * (rng.bool() ? 1 : -1);
      const phase = rng.next() * Math.PI * 2;

      const ellipse = scene.add.ellipse(x, y, w, h, 0xcccccc, 0.04);
      ellipse.setDepth(-3.3);

      this.wisps.push({ ellipse, vx, phase });
    }
  }

  update(delta: number, worldW: number): void {
    this.time += delta * 0.001;
    const dt = delta / 1000;

    for (const w of this.wisps) {
      w.ellipse.x += w.vx * dt;

      // Wrap at world edges with generous offscreen margin.
      if (w.ellipse.x > worldW + 200) w.ellipse.x = -200;
      if (w.ellipse.x < -200) w.ellipse.x = worldW + 200;

      const alpha = 0.03 + Math.sin(this.time * 0.4 + w.phase) * 0.02;
      w.ellipse.setAlpha(alpha);
    }
  }

  destroy(): void {
    for (const w of this.wisps) w.ellipse.destroy();
    this.wisps = [];
    this.time = 0;
  }
}
