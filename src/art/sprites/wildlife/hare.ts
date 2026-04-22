/**
 * Scottish mountain hare — 24x24 procedural sprite with idle breathing
 * and hop animation frames. Compact brown oval body, tall pointed ears,
 * white tail puff, tiny dark eye.
 */
import Phaser from 'phaser';

export const HARE_CANVAS_SIZE = 24;

interface HareFrame {
  /** Vertical offset for breathing animation (positive = down). */
  breathY?: number;
  /** Vertical offset for hop arc (negative = up). */
  hopY?: number;
}

export function drawHareBody(g: Phaser.GameObjects.Graphics, frame: HareFrame): void {
  const cx = 12;
  const baseY = 16;
  const offY = (frame.breathY ?? 0) + (frame.hopY ?? 0);
  const bodyY = baseY + offY;

  // Body — warm brown oval
  g.fillStyle(0x8b6c4a, 1);
  g.fillEllipse(cx, bodyY, 14, 9);

  // Lighter belly highlight
  g.fillStyle(0xa88860, 1);
  g.fillEllipse(cx, bodyY + 1, 10, 5);

  // Left ear
  g.fillStyle(0x8b6c4a, 1);
  g.fillEllipse(cx - 3, bodyY - 9, 3, 8);
  // Inner ear pink
  g.fillStyle(0xc89888, 1);
  g.fillEllipse(cx - 3, bodyY - 9, 1.5, 5);

  // Right ear
  g.fillStyle(0x8b6c4a, 1);
  g.fillEllipse(cx + 3, bodyY - 9, 3, 8);
  // Inner ear pink
  g.fillStyle(0xc89888, 1);
  g.fillEllipse(cx + 3, bodyY - 9, 1.5, 5);

  // Eye — tiny dark dot (right-facing default)
  g.fillStyle(0x1a1008, 1);
  g.fillCircle(cx + 3, bodyY - 3, 1.2);

  // Eye shine
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(cx + 3.5, bodyY - 3.5, 0.5);

  // White tail puff (left side = behind)
  g.fillStyle(0xeee8dd, 1);
  g.fillCircle(cx - 7, bodyY - 1, 2.5);

  // Nose
  g.fillStyle(0x5a3a2a, 1);
  g.fillCircle(cx + 7, bodyY - 2, 1);
}

export function bakeHare(scene: Phaser.Scene): void {
  const s = HARE_CANVAS_SIZE;

  // Idle frames (breathing) — used by legacy HareWildlife system
  for (let i = 0; i < 2; i++) {
    const g = scene.add.graphics();
    drawHareBody(g, { breathY: i === 0 ? 1 : -1 });
    g.generateTexture(`hare_idle_${i}`, s, s);
    g.destroy();
  }

  // Hop frames (4-frame arc) — used by legacy HareWildlife system
  const hopYs = [0, -3, -5, -2];
  for (let i = 0; i < 4; i++) {
    const g = scene.add.graphics();
    drawHareBody(g, { hopY: hopYs[i] });
    g.generateTexture(`hare_hop_${i}`, s, s);
    g.destroy();
  }

  // T9 WildlifeSystem keys — two-frame (idle / move) interface
  const gIdle = scene.add.graphics();
  drawHareBody(gIdle, { breathY: 1 });
  gIdle.generateTexture('wildlife_hare_idle', s, s);
  gIdle.destroy();

  const gMove = scene.add.graphics();
  drawHareBody(gMove, { hopY: -3 });
  gMove.generateTexture('wildlife_hare_move', s, s);
  gMove.destroy();
}
