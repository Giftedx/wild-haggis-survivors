/**
 * `haggis_ball` projectile — the bouncing "jobby" lump for Jobby Hurler
 * / Cannon. Lumpy, organic, steaming, with oat-fleck texture and a wet
 * sheen. Must look disgusting AND hilarious — peak Glesga humour.
 */

import Phaser from 'phaser';

export function bakeHaggisBall(scene: Phaser.Scene): void {
  const s = 22;
  const g = scene.add.graphics();
  const cx = 11, cy = 11;

  // Steam wisps rising from the top (it's warm and fresh...)
  g.fillStyle(0xccbb88, 0.25);
  g.fillCircle(cx - 2, cy - 9, 2);
  g.fillCircle(cx + 2, cy - 8, 1.5);
  g.fillCircle(cx, cy - 10, 1.2);

  // ── Dark outline — lumpy, not perfectly round ──
  g.fillStyle(0x1a0e04, 1);
  g.fillCircle(cx, cy, 8);
  g.fillCircle(cx + 1, cy - 1, 7);  // slight offset for lumpiness
  g.fillCircle(cx - 2, cy + 1, 6);  // bottom-left bulge

  // ── Main body — dark brown haggis meat ──
  g.fillStyle(0x4a3008, 1);
  g.fillCircle(cx, cy, 7);
  g.fillCircle(cx + 1, cy - 1, 6);

  // ── Lighter brown layer (upper half catches light) ──
  g.fillStyle(0x6a4a10, 1);
  g.fillCircle(cx - 1, cy - 1, 5.5);
  g.fillStyle(0x7a5a18, 0.8);
  g.fillCircle(cx - 2, cy - 2, 4);

  // ── Oat fleck texture — visible pale speckles in the meat ──
  g.fillStyle(0x9a8030, 0.8);
  g.fillCircle(cx - 3, cy - 1, 1);
  g.fillCircle(cx + 2, cy + 2, 1.2);
  g.fillCircle(cx + 1, cy - 3, 0.8);
  g.fillCircle(cx - 1, cy + 3, 1);
  g.fillCircle(cx + 4, cy, 0.7);
  g.fillCircle(cx - 4, cy + 2, 0.8);
  // Darker flecks (pepper / liver bits)
  g.fillStyle(0x2a1806, 0.6);
  g.fillCircle(cx + 3, cy - 2, 0.7);
  g.fillCircle(cx - 2, cy + 4, 0.6);
  g.fillCircle(cx + 1, cy + 1, 0.5);

  // ── Wet sheen — glistening surface highlight ──
  g.fillStyle(0xbb9933, 0.5);
  g.fillCircle(cx - 2, cy - 3, 2);
  g.fillStyle(0xddbb55, 0.3);
  g.fillCircle(cx - 3, cy - 4, 1.2);

  // Specular dot
  g.fillStyle(0xffffff, 0.35);
  g.fillCircle(cx - 3, cy - 4, 0.8);

  // ── Bottom shadow (sitting on ground or just launched) ──
  g.fillStyle(0x1a0e04, 0.4);
  g.fillEllipse(cx, cy + 5, 8, 2);

  g.generateTexture('haggis_ball', s, s);
  g.destroy();
}
