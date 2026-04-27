/**
 * `caber` projectile — Highland Games caber (telephone-pole-sized log).
 * Tapered wood body with bark edges, cut end-grain rings on the right
 * end, jagged left end. Flies horizontally through enemies.
 */

import * as Phaser from 'phaser';

export function bakeCaber(scene: Phaser.Scene): void {
  // 28×28 — Highland Games caber (telephone-pole-sized log).
  const s = 28;
  const g = scene.add.graphics();
  const cy = 14;

  // ── MOTION TRAIL — translucent puff to the LEFT (thin trailing
  // end is left, fat-end forward right). Sells "this thing is
  // flying". ──
  g.fillStyle(0x9a7a28, 0.18);
  g.fillCircle(1, cy, 2.5);
  g.fillCircle(0, cy + 1, 1.5);
  g.fillStyle(0xc8a050, 0.25);
  g.fillCircle(1.5, cy - 1, 1.6);

  // ── Dark bark outline (TAPERED — fat-end forward right, thin-end
  // trailing left). Polygon gives motion-direction. ──
  g.fillStyle(0x1a0e02, 1);
  g.fillTriangle(2, cy - 4, 24, cy - 6, 24, cy + 7);
  g.fillTriangle(2, cy - 4, 24, cy + 7, 2, cy + 5);
  g.fillCircle(23, cy, 6);  // rounded right end

  // ── Main wood body — TAPERED warm brown ──
  g.fillStyle(0x6a4a10, 1);
  g.fillTriangle(3, cy - 3, 23, cy - 5, 23, cy + 6);
  g.fillTriangle(3, cy - 3, 23, cy + 6, 3, cy + 4);

  // ── Bark texture — dark top and bottom edges, also tapered ──
  g.fillStyle(0x3a2808, 1);
  g.fillTriangle(3, cy - 3, 23, cy - 5, 23, cy - 3);
  g.fillTriangle(3, cy - 3, 23, cy - 3, 3, cy - 2.5);
  g.fillTriangle(3, cy + 3.5, 23, cy + 4, 23, cy + 6);
  g.fillTriangle(3, cy + 3.5, 23, cy + 6, 3, cy + 4);

  // ── Wood grain lines running horizontally ──
  g.fillStyle(0x5a3a08, 0.7);
  g.fillRect(3, cy - 2, 20, 1);
  g.fillRect(3, cy + 1, 20, 1);
  // Lighter grain highlights
  g.fillStyle(0x8a6a20, 0.5);
  g.fillRect(3, cy - 1, 20, 1);
  g.fillRect(3, cy + 3, 20, 1);

  // ── SIDE HIGHLIGHT along upper length — bright catchlight that
  // runs the full length of the log (light from above). Stronger
  // and longer than the old top highlight. ──
  g.fillStyle(0xc8a050, 0.85);
  g.fillRect(5, cy - 3.6, 16, 0.6);
  g.fillStyle(0xeacc70, 0.6);
  g.fillRect(7, cy - 4, 12, 0.4);

  // ── Knot holes — darker circles with ring detail ──
  g.fillStyle(0x3a2206, 1);
  g.fillCircle(9, cy, 2);
  g.fillStyle(0x4a3008, 1);
  g.fillCircle(9, cy, 1.2);
  g.fillStyle(0x3a2206, 0.6);
  g.fillCircle(17, cy - 2, 1.2);

  // ── SPLINTER TICKS along the body — three small chips of pale
  // wood that read as bark damage. ──
  g.fillStyle(0xb88a30, 1);
  g.fillRect(7, cy + 2.5, 1.5, 0.6);
  g.fillRect(13, cy - 2.5, 1.2, 0.6);
  g.fillRect(19, cy + 1.5, 1.4, 0.6);

  // ── Cut end-grain (right fat end) — concentric rings forming a
  // SPIRAL pattern (offset rings) so the centre reads as growth-
  // ring spiral, not a flat target. ──
  g.fillStyle(0x5a3e08, 1);
  g.fillCircle(23, cy, 5.5);
  g.fillStyle(0x7a5a14, 1);
  g.fillCircle(23, cy, 4.5);
  // Spiral ring detail — offset so they don't look concentric.
  g.lineStyle(0.7, 0x4a2e08, 0.85);
  g.strokeCircle(23.3, cy - 0.2, 3.6);
  g.lineStyle(0.7, 0x5a4010, 0.7);
  g.strokeCircle(22.7, cy + 0.3, 2.5);
  g.lineStyle(0.6, 0x4a2e08, 0.6);
  g.strokeCircle(23.4, cy - 0.4, 1.5);
  // Pith (centre dot)
  g.fillStyle(0x4a3008, 1);
  g.fillCircle(23, cy, 0.9);
  // End-grain highlight
  g.fillStyle(0x9a7a28, 0.5);
  g.fillCircle(22, cy - 2, 2);

  // ── Left thin end (trailing — narrower jagged break) ──
  g.fillStyle(0x3a2206, 1);
  g.fillRect(2, cy - 3, 2, 1.4);
  g.fillRect(2, cy + 2, 2, 1.4);
  g.fillStyle(0x5a3e08, 1);
  g.fillRect(3, cy - 2, 1, 5.5);

  // ── Trailing motion-blur dot OFF the back of the thin end —
  // single small dot communicating direction-of-travel. ──
  g.fillStyle(0xc8a050, 0.55);
  g.fillCircle(0.5, cy + 0.5, 0.9);
  g.fillStyle(0xeacc70, 0.85);
  g.fillCircle(0.5, cy + 0.5, 0.4);

  g.generateTexture('caber', s, s);
  g.destroy();
}
