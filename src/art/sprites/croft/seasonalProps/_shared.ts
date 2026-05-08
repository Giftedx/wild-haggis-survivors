import * as Phaser from 'phaser';

/**
 * Draw a thin segment between two points. Used by the bracken-frond
 * spine renderer; the small width is provided for future tuning.
 */
export function drawSegment(
  g: Phaser.GameObjects.Graphics,
  x0: number, y0: number,
  x1: number, y1: number,
  w: number,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(2, Math.ceil(Math.sqrt(dx * dx + dy * dy)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    g.fillCircle(x0 + dx * t, y0 + dy * t, w / 2);
  }
}
