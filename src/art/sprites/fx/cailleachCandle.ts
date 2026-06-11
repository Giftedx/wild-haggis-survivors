/**
 * Procedural candle sprite for the Cailleach Gauntlet (V2 of The Moor
 * Remembers). Three variants:
 *
 *   - 'lit'           — small upright flame on stone base (gauntlet armed)
 *   - 'wreathed'      — larger gold-tinted flame + halo (gauntlet WON)
 *   - 'extinguished'  — stone base, cold-slate, no flame (gauntlet LOST)
 *
 * Designed at 24 × 24 base. Spec:
 * `docs/superpowers/specs/2026-05-22-moor-remembers-v2-design.md`.
 */
import * as Phaser from 'phaser';

export type CandleVariant = 'lit' | 'wreathed' | 'extinguished';

export const CANDLE_SPRITE_SIZE = 24;

export function drawCailleachCandle(
  g: Phaser.GameObjects.Graphics,
  variant: CandleVariant,
): void {
  // Stone base — always present
  g.fillStyle(0x6a7280, 1);
  g.fillRect(7, 18, 10, 4);
  g.fillStyle(0x4a5260, 0.7);
  g.fillRect(7, 21, 10, 1);

  if (variant === 'extinguished') {
    // Cold slate over the base + thin smoke wisp
    g.fillStyle(0x4f5763, 0.85);
    g.fillRect(7, 18, 10, 4);
    g.fillStyle(0x8a929e, 0.45);
    g.fillCircle(12, 13, 1.5);
    g.fillStyle(0x8a929e, 0.25);
    g.fillCircle(11, 10, 1.0);
    return;
  }

  // Wax candle column (lit and wreathed)
  g.fillStyle(0xe6dfc6, 1);
  g.fillRect(11, 10, 2, 9);
  g.fillStyle(0xc8b890, 0.6);
  g.fillRect(11, 18, 2, 1);

  // Wick
  g.fillStyle(0x2a1a14, 1);
  g.fillRect(11.6, 8, 0.8, 2);

  // Flame
  const flameColour = variant === 'wreathed' ? 0xf5d04e : 0xffb868;
  const flameAlpha = variant === 'wreathed' ? 1.0 : 0.9;
  const flameSize = variant === 'wreathed' ? 5 : 4;
  g.fillStyle(flameColour, flameAlpha);
  g.fillCircle(12, 7, flameSize);
  // Flame core (brighter)
  g.fillStyle(0xfff4a0, 0.95);
  g.fillCircle(12, 7, flameSize - 2);

  // Wreathed gets a halo glow
  if (variant === 'wreathed') {
    g.fillStyle(0xf5d04e, 0.30);
    g.fillCircle(12, 7, 9);
    g.fillStyle(0xf5d04e, 0.15);
    g.fillCircle(12, 7, 12);
  } else {
    // Lit gets a smaller, warmer halo
    g.fillStyle(0xffb868, 0.18);
    g.fillCircle(12, 7, 6);
  }
}

export function bakeCailleachCandles(scene: Phaser.Scene): void {
  for (const variant of ['lit', 'wreathed', 'extinguished'] as const) {
    const g = scene.add.graphics();
    drawCailleachCandle(g, variant);
    g.generateTexture(`fx_cailleach_candle_${variant}`, CANDLE_SPRITE_SIZE, CANDLE_SPRITE_SIZE);
    g.destroy();
  }
}
