import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_stat_drift` — drift-reduction stat icon. Design pivot: old
 * spiral+arrow read as generic "motion" without anchoring the "steer
 * your haggis" concept. New pitch — SHIP'S STEERING WHEEL with six
 * spokes + visible handle-nubs around the rim. The universal
 * control/steering icon. The haggis drift is a steering-correction
 * mechanic, so the wheel IS the mechanic.
 */
export function drawStatDrift(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2744);
  const cx = 16, cy = 16;

  // Outer dark wood rim
  g.fillStyle(0x2a1a0a, 1);
  g.fillCircle(cx, cy, 12);
  // Main wood rim
  g.fillStyle(0x6a3818, 1);
  g.fillCircle(cx, cy, 11);
  // Inner dark ring (cutout)
  g.fillStyle(0x1a0e04, 1);
  g.fillCircle(cx, cy, 8.5);
  // Inner ring wood
  g.fillStyle(0x6a3818, 1);
  g.fillCircle(cx, cy, 7.5);
  // Centre hub cutout
  g.fillStyle(0x1a0e04, 1);
  g.fillCircle(cx, cy, 4);

  // Six spokes — thick radial bars from hub to rim
  const spokeAngles = [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3];
  for (const a of spokeAngles) {
    // Spoke body
    g.fillStyle(0x6a3818, 1);
    const sx1 = cx + Math.cos(a) * 3;
    const sy1 = cy + Math.sin(a) * 3;
    const sx2 = cx + Math.cos(a) * 8;
    const sy2 = cy + Math.sin(a) * 8;
    // Draw thick spoke as two overlapping triangles for a rectangle
    const perpX = -Math.sin(a) * 1.2;
    const perpY = Math.cos(a) * 1.2;
    g.fillTriangle(sx1 + perpX, sy1 + perpY, sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY);
    g.fillTriangle(sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY, sx2 - perpX, sy2 - perpY);
    // Spoke highlight
    g.fillStyle(0x8a5028, 1);
    const perpX2 = -Math.sin(a) * 0.5;
    const perpY2 = Math.cos(a) * 0.5;
    g.fillTriangle(sx1 + perpX2, sy1 + perpY2, sx2 + perpX2, sy2 + perpY2, sx2 - perpX2, sy2 - perpY2);
  }

  // Handle nubs — six knobs sticking out beyond the rim
  g.fillStyle(0x4a2810, 1);
  for (const a of spokeAngles) {
    const hx = cx + Math.cos(a) * 13;
    const hy = cy + Math.sin(a) * 13;
    g.fillCircle(hx, hy, 1.8);
  }
  g.fillStyle(0x8a5028, 1);
  for (const a of spokeAngles) {
    const hx = cx + Math.cos(a) * 13;
    const hy = cy + Math.sin(a) * 13;
    g.fillCircle(hx, hy, 1.2);
  }
  g.fillStyle(0xba7848, 0.9);
  for (const a of spokeAngles) {
    const hx = cx + Math.cos(a) * 13;
    const hy = cy + Math.sin(a) * 13;
    g.fillCircle(hx - 0.3, hy - 0.3, 0.5);
  }

  // Centre hub — brass knob with rivet
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy, 3);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(cx, cy, 2);
  g.fillStyle(0x6a4818, 1);
  g.fillCircle(cx, cy, 0.8);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 0.7, cy - 0.7, 0.5);

  // Rim wood-grain highlight on top
  g.fillStyle(0x8a5028, 0.85);
  g.fillEllipse(cx, cy - 11, 6, 1);

  g.generateTexture('ucard_stat_drift', s, s);
  g.destroy();
}
