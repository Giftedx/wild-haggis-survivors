/**
 * `fx_snowflake` — snow particle at 10px. Design pivot: old 6-arm
 * stroke-line crystal collapsed into illegible scribble at gameplay
 * scale because 0.8px branches can't render cleanly on most
 * displays. New pitch — bold plus-cross (4 main arms as solid
 * rects) with a bright centre diamond. Reads as "snow" in motion
 * without relying on fine line-rendering. Accepted trade: gives up
 * the hexagonal fidelity for silhouette clarity at 10px.
 */

import * as Phaser from 'phaser';

export function bakeSnowflake(scene: Phaser.Scene): void {
  const snow = 10;
  const gs = scene.add.graphics();
  const cx = snow / 2;
  const cy = snow / 2;

  // ── Outer glow — soft halo so the flake pops against dark moor. ──
  gs.fillStyle(0xaaddff, 0.22);
  gs.fillCircle(cx, cy, 4.5);
  gs.fillStyle(0xccecff, 0.14);
  gs.fillCircle(cx, cy, 5);

  // ── SIX-ARM SYMMETRY — proper hexagonal flake. Arms at 0°, 60°,
  // 120°, 180°, 240°, 300° around the centre. Arm lengths vary
  // (long/short alternating) so the flake reads detailed even at
  // 10px without fine lines. ──
  // Arm endpoints (precomputed) — long primary 4px, short 3.2px.
  // angle 0°  : (cx+4, cy)        long
  // angle 60° : (cx+2, cy+3.46)   short
  // angle 120°: (cx-2, cy+3.46)   long
  // angle 180°: (cx-4, cy)        short
  // angle 240°: (cx-2, cy-3.46)   long
  // angle 300°: (cx+2, cy-3.46)   short
  const armColor = 0xeaf4ff;
  gs.fillStyle(armColor, 1);
  // Long arms — wider trunk
  // 0° (right)
  gs.fillRect(cx, cy - 0.5, 4, 1);
  // 120° (down-left)
  gs.fillRect(cx - 0.4, cy + 0.4, 0.8, 0.8);
  gs.fillRect(cx - 0.8, cy + 0.9, 0.8, 0.8);
  gs.fillRect(cx - 1.3, cy + 1.5, 0.8, 0.8);
  gs.fillRect(cx - 1.8, cy + 2.1, 0.8, 0.8);
  // 240° (up-left)
  gs.fillRect(cx - 0.4, cy - 1.2, 0.8, 0.8);
  gs.fillRect(cx - 0.8, cy - 1.7, 0.8, 0.8);
  gs.fillRect(cx - 1.3, cy - 2.3, 0.8, 0.8);
  gs.fillRect(cx - 1.8, cy - 2.9, 0.8, 0.8);
  // Short arms — slightly fainter
  gs.fillStyle(0xccecff, 0.95);
  // 60° (down-right) short
  gs.fillRect(cx + 0.4, cy + 0.4, 0.8, 0.8);
  gs.fillRect(cx + 0.8, cy + 0.9, 0.8, 0.8);
  gs.fillRect(cx + 1.3, cy + 1.5, 0.8, 0.8);
  // 180° (left) short
  gs.fillRect(cx - 3.2, cy - 0.4, 3.2, 0.8);
  // 300° (up-right) short
  gs.fillRect(cx + 0.4, cy - 1.2, 0.8, 0.8);
  gs.fillRect(cx + 0.8, cy - 1.7, 0.8, 0.8);
  gs.fillRect(cx + 1.3, cy - 2.3, 0.8, 0.8);

  // ── Tip caps — small bright squares at the END of each long arm
  // for the crystal-tip feel. ──
  gs.fillStyle(0xffffff, 1);
  gs.fillRect(cx + 3.5, cy - 0.5, 1, 1);  // 0°
  gs.fillRect(cx - 2.2, cy + 2.4, 1, 1);  // 120°
  gs.fillRect(cx - 2.2, cy - 3.2, 1, 1);  // 240°

  // ── CENTRE SPARKLE POP — bright 1-pixel pinprick over a small
  // cross. The eye reads "snow crystal centre". ──
  gs.fillStyle(0xffffff, 1);
  gs.fillRect(cx - 1, cy - 1, 2, 2);
  gs.fillStyle(0xaaf0ff, 0.95);
  gs.fillRect(cx - 0.5, cy - 1.5, 1, 3);
  gs.fillRect(cx - 1.5, cy - 0.5, 3, 1);
  // 1-pixel sparkle pop — pure white pinpoint at exact centre.
  gs.fillStyle(0xffffff, 1);
  gs.fillRect(cx - 0.3, cy - 0.3, 0.6, 0.6);

  gs.generateTexture('fx_snowflake', snow, snow);
  gs.destroy();
}
