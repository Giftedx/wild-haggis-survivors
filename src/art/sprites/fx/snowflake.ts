/**
 * `fx_snowflake` — snow particle at 10px. Design pivot: old 6-arm
 * stroke-line crystal collapsed into illegible scribble at gameplay
 * scale because 0.8px branches can't render cleanly on most
 * displays. New pitch — bold plus-cross (4 main arms as solid
 * rects) with a bright centre diamond. Reads as "snow" in motion
 * without relying on fine line-rendering. Accepted trade: gives up
 * the hexagonal fidelity for silhouette clarity at 10px.
 */

import Phaser from 'phaser';

export function bakeSnowflake(scene: Phaser.Scene): void {
  const snow = 10;
  const gs = scene.add.graphics();
  const cx = snow / 2;
  const cy = snow / 2;

  // ── Outer glow — soft halo so the flake pops against dark moor. ──
  gs.fillStyle(0xaaddff, 0.2);
  gs.fillCircle(cx, cy, 4.5);
  gs.fillStyle(0xccecff, 0.12);
  gs.fillCircle(cx, cy, 5);

  // ── Four main arms as solid rects. Horizontal + vertical cross
  // is the cleanest silhouette at 10px. ──
  gs.fillStyle(0xeaf4ff, 1);
  // Vertical arm
  gs.fillRect(cx - 0.5, cy - 4, 1, 8);
  // Horizontal arm
  gs.fillRect(cx - 4, cy - 0.5, 8, 1);

  // ── Diagonal arms — shorter, for the 8-point feel without fine
  // stroke lines. ──
  gs.fillStyle(0xccecff, 0.9);
  // NE-SW diagonal
  gs.fillRect(cx - 2.5, cy - 2.5, 1, 1);
  gs.fillRect(cx - 1.5, cy - 1.5, 1, 1);
  gs.fillRect(cx + 0.5, cy + 0.5, 1, 1);
  gs.fillRect(cx + 1.5, cy + 1.5, 1, 1);
  // NW-SE diagonal
  gs.fillRect(cx + 1.5, cy - 2.5, 1, 1);
  gs.fillRect(cx + 0.5, cy - 1.5, 1, 1);
  gs.fillRect(cx - 1.5, cy + 0.5, 1, 1);
  gs.fillRect(cx - 2.5, cy + 1.5, 1, 1);

  // ── Tip caps — small bright squares at the end of each main arm
  // for the crystal-tip feel. ──
  gs.fillStyle(0xffffff, 1);
  gs.fillRect(cx - 1, cy - 4, 2, 1);
  gs.fillRect(cx - 1, cy + 3, 2, 1);
  gs.fillRect(cx - 4, cy - 1, 1, 2);
  gs.fillRect(cx + 3, cy - 1, 1, 2);

  // ── Bright centre — small diamond made of two overlapping rects. ──
  gs.fillStyle(0xffffff, 1);
  gs.fillRect(cx - 1, cy - 1, 2, 2);
  gs.fillStyle(0xaaf0ff, 0.9);
  gs.fillRect(cx - 0.5, cy - 1.5, 1, 3);
  gs.fillRect(cx - 1.5, cy - 0.5, 3, 1);

  gs.generateTexture('fx_snowflake', snow, snow);
  gs.destroy();
}
