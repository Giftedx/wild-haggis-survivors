import * as Phaser from 'phaser';

/**
 * `wicon_highland_fling` — bagpipe-blast evolution icon. Design
 * pivot: old icon was blue concentric rings + scattered arrow-
 * stars that read as "generic AoE burst". New pitch — a TINY
 * KILTED DANCER silhouette caught mid-fling pose (one arm raised
 * overhead, one leg high-kicked sideways) inside rotating blue
 * pulse rings. The figure ties the icon to "Highland Fling"
 * specifically rather than any ring-burst AoE.
 */
export function drawHighlandFlingIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Evolution halo + rotating pulse rings. ──
  g.fillStyle(0x2244aa, 0.25);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0x4488ff, 0.18);
  g.fillCircle(cx, cy, 12);
  g.lineStyle(1.5, 0x66aaff, 0.85);
  g.strokeCircle(cx, cy, 13);
  g.lineStyle(1.2, 0x99ccff, 0.6);
  g.strokeCircle(cx, cy, 10);

  // ── Kilted dancer silhouette — signature Fling pose. ──
  // Head
  g.fillStyle(0x1a1a24, 1);
  g.fillCircle(cx, cy - 8, 1.8);
  g.fillStyle(0xd8b888, 1);
  g.fillCircle(cx, cy - 8, 1.4);
  // Raised arm (up-right, overhead)
  g.fillStyle(0x1a1a24, 1);
  g.fillRect(cx, cy - 10, 1.2, 4);
  g.fillRect(cx + 2, cy - 13, 1.2, 3);
  g.fillStyle(0xd8b888, 1);
  g.fillCircle(cx + 2.5, cy - 13, 0.8);
  // Opposite arm (bent to side)
  g.fillStyle(0x1a1a24, 1);
  g.fillRect(cx - 3, cy - 6, 1.2, 3);
  g.fillStyle(0xd8b888, 1);
  g.fillCircle(cx - 3.5, cy - 4, 0.7);
  // Torso (dark jacket)
  g.fillStyle(0x0a1a38, 1);
  g.fillRect(cx - 2, cy - 6, 4, 5);
  g.fillStyle(0x1a3858, 1);
  g.fillRect(cx - 1.5, cy - 5.5, 3, 4);

  // Kilt — tartan diamond
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx - 3, cy - 1, 6, 4);
  g.fillStyle(0xaa2828, 1);
  g.fillRect(cx - 2.5, cy - 0.5, 5, 3);
  g.fillStyle(0x0a0808, 0.8);
  g.fillRect(cx - 2.5, cy + 0.3, 5, 0.4);
  g.fillRect(cx - 2.5, cy + 1.5, 5, 0.4);
  g.fillRect(cx - 0.5, cy - 0.5, 0.4, 3);

  // Standing leg — straight down with sock + shoe
  g.fillStyle(0xd8b888, 1);
  g.fillRect(cx - 1, cy + 3, 1.3, 3);
  g.fillStyle(0xe8e8e0, 1);
  g.fillRect(cx - 1, cy + 6, 1.3, 1.5);
  g.fillStyle(0x1a1a24, 1);
  g.fillRect(cx - 1.3, cy + 7.5, 2, 1.2);

  // High-kicked leg — out to the right, the Fling tell
  g.fillStyle(0xd8b888, 1);
  g.fillRect(cx + 1, cy + 2, 3, 1.2);
  g.fillRect(cx + 4, cy + 1, 3, 1.2);
  g.fillStyle(0xe8e8e0, 1);
  g.fillRect(cx + 6.5, cy + 0.5, 1.5, 1.2);
  g.fillStyle(0x1a1a24, 1);
  g.fillRect(cx + 7.5, cy + 0.3, 1.5, 1);

  // ── Motion sparkles around the dancer. ──
  g.fillStyle(0xccddff, 1);
  g.fillCircle(cx - 10, cy - 5, 1.2);
  g.fillStyle(0xaaddff, 0.8);
  g.fillCircle(cx + 10, cy + 5, 1.2);
  g.fillStyle(0x88ccff, 0.75);
  g.fillCircle(cx - 8, cy + 8, 0.9);
  g.fillCircle(cx + 8, cy - 8, 0.9);
  // Four-point star sparkles
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 11, cy, 1.5, 0.5);
  g.fillRect(cx - 10.3, cy - 0.7, 0.5, 1.5);
  g.fillRect(cx + 10, cy, 1.5, 0.5);
  g.fillRect(cx + 10.3, cy - 0.7, 0.5, 1.5);

  g.generateTexture('wicon_highland_fling', s, s);
  g.destroy();
}
