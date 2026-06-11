import * as Phaser from 'phaser';

/** Draw the danger vignette — warm ember glow, not cold alarm red.
 *  Two layers: deep crimson base + amber outer edge for a hearthfire-dying feel.
 *
 *  Pure draw — caller owns the Graphics object and the layout dimensions.
 *  Re-call whenever layout changes (resize) so the vignette refits. */
export function drawDangerVignette(
  gfx: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void {
  gfx.clear();

  // Deep crimson base layer — the danger signal
  const steps = 8;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const inset = (1 - t) * 80;
    const alpha = t * t * 0.5;
    gfx.fillStyle(0x881111, alpha);
    gfx.fillRect(0, 0, width, inset);
    gfx.fillRect(0, height - inset, width, inset);
    gfx.fillRect(0, 0, inset, height);
    gfx.fillRect(width - inset, 0, inset, height);
  }
  // Warm amber outer fringe — like embers at the edge of the hearth
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    const inset = (1 - t) * 30;
    const alpha = t * t * 0.25;
    gfx.fillStyle(0xcc6622, alpha);
    gfx.fillRect(0, 0, width, inset);
    gfx.fillRect(0, height - inset, width, inset);
    gfx.fillRect(0, 0, inset, height);
    gfx.fillRect(width - inset, 0, inset, height);
  }
}
