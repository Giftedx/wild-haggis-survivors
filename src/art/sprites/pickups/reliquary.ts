/**
 * `reliquary` — DESIGN_IDEAS § 1 M15. A small carved altar with a
 * cupped bowl holding a pulsing ember. Amber-warm palette so the
 * relic reads as "sacred ember" rather than another coin or chest.
 */

import Phaser from 'phaser';

export function bakeReliquary(scene: Phaser.Scene): void {
  const s = 28;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Ground shadow — soft ellipse tucks the altar into the moor.
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 8, 20, 4);

  // Altar base — weather-stained stone.
  g.fillStyle(0x2a2520, 1);
  g.fillRect(cx - 9, cy + 3, 18, 5);
  g.fillStyle(0x443a2e, 1);
  g.fillRect(cx - 8, cy + 4, 16, 3);

  // Column — tapered plinth, amber glyph scratched on face.
  g.fillStyle(0x1f1a14, 1);
  g.fillRect(cx - 6, cy - 5, 12, 9);
  g.fillStyle(0x3a3022, 1);
  g.fillRect(cx - 5, cy - 4, 10, 8);
  g.fillStyle(0xffb060, 0.85);
  g.fillRect(cx - 2, cy - 2, 4, 1);
  g.fillRect(cx - 1, cy - 3, 2, 4);

  // Bowl — stone cup on top of the plinth.
  g.fillStyle(0x1a1410, 1);
  g.fillEllipse(cx, cy - 6, 10, 3);
  g.fillStyle(0x2a241a, 1);
  g.fillEllipse(cx, cy - 7, 8, 2);

  // Ember — warm amber core with bright white-gold centre.
  g.fillStyle(0xff9040, 0.9);
  g.fillCircle(cx, cy - 8, 3);
  g.fillStyle(0xffc880, 1);
  g.fillCircle(cx, cy - 8, 2);
  g.fillStyle(0xfff0c0, 1);
  g.fillCircle(cx - 0.5, cy - 9, 1);

  // Rising wisp above the ember — faint, suggests the relic is "alive".
  g.fillStyle(0xffd090, 0.35);
  g.fillCircle(cx + 1, cy - 11, 1);
  g.fillStyle(0xffd090, 0.18);
  g.fillCircle(cx, cy - 13, 0.8);

  g.generateTexture('reliquary', s, s);
  g.destroy();
}
