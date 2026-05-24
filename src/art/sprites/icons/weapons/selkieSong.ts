import * as Phaser from 'phaser';

/**
 * `wicon_selkie_song` — Selkie Song weapon icon.
 * A stylised wave of blue-grey sea-water, a single selkie silhouette
 * breaking the surface, and a faint radial song-ring suggesting the
 * charm aura. Reads as "sea / song / control" at 32px.
 */
export function drawSelkieSongIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Sea-blue background wash.
  g.fillStyle(0x1a3a5c, 0.55);
  g.fillEllipse(16, 20, 28, 18);

  // Faint outer charm ring.
  g.lineStyle(1, 0x88ccee, 0.30);
  g.strokeCircle(16, 16, 14);

  // Inner charm ring — stronger.
  g.lineStyle(1.5, 0x66aadd, 0.50);
  g.strokeCircle(16, 16, 9);

  // Wave crest — mid-blue polyline approximating a sine arc.
  g.lineStyle(2, 0x5599cc, 0.85);
  g.beginPath();
  g.moveTo(4, 19);
  g.lineTo(7, 15);
  g.lineTo(10, 14);
  g.lineTo(13, 16);
  g.lineTo(16, 19);
  g.lineTo(19, 22);
  g.lineTo(22, 23);
  g.lineTo(25, 21);
  g.lineTo(28, 19);
  g.strokePath();

  // Second wave crest — lighter, offset.
  g.lineStyle(1.5, 0x88bbdd, 0.60);
  g.beginPath();
  g.moveTo(6, 22);
  g.lineTo(9, 19);
  g.lineTo(12, 18);
  g.lineTo(15, 20);
  g.lineTo(18, 22);
  g.lineTo(21, 25);
  g.lineTo(24, 25);
  g.lineTo(27, 23);
  g.lineTo(29, 22);
  g.strokePath();

  // Selkie silhouette — dark sleek head breaking the surface.
  g.fillStyle(0x1a2a3a, 1);
  g.fillEllipse(16, 14, 10, 8);

  // Selkie highlight — the wet shine of a seal's back.
  g.fillStyle(0x4488aa, 0.55);
  g.fillEllipse(15, 13, 5, 3);

  // Song notes — two tiny floating dots above the head.
  g.fillStyle(0xaaddee, 0.80);
  g.fillCircle(12, 7, 1.5);
  g.fillCircle(20, 9, 1.5);
  g.lineStyle(1, 0xaaddee, 0.55);
  g.lineBetween(12, 7, 12, 10);
  g.lineBetween(20, 9, 20, 12);

  g.generateTexture('wicon_selkie_song', s, s);
  g.destroy();
}
