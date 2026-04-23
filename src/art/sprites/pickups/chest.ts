/**
 * `chest` — treasure chest with arched lid, tartan-accented metal
 * bands, rivets, golden lock clasp, warm golden glow underneath.
 */

import * as Phaser from 'phaser';

export function bakeChest(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 1;

  // Warm golden glow (treasure calling to you)
  g.fillStyle(0xddaa00, 0.1);
  g.fillCircle(cx, cy + 2, 16);

  // Dark outline
  g.fillStyle(0x2a1a06, 1);
  g.fillRect(cx - 14, cy - 4, 28, 16);
  g.fillEllipse(cx, cy - 4, 28, 10); // arched lid outline

  // Chest body (rich wood)
  g.fillStyle(0x7a5a10, 1);
  g.fillRect(cx - 13, cy - 3, 26, 14);
  // Lid — lighter, arched
  g.fillStyle(0x9a7418, 1);
  g.fillEllipse(cx, cy - 4, 26, 8);
  g.fillStyle(0xb08820, 0.8);
  g.fillEllipse(cx, cy - 5, 22, 5);
  // Wood grain lines
  g.fillStyle(0x5a4008, 0.7);
  g.fillRect(cx - 13, cy + 2, 26, 1);
  g.fillRect(cx - 13, cy + 6, 26, 1);
  g.fillRect(cx - 13, cy + 9, 26, 1);

  // Metal bands — horizontal straps
  g.fillStyle(0x6a5500, 1);
  g.fillRect(cx - 14, cy - 1, 28, 2);
  g.fillStyle(0xccaa33, 1);
  g.fillRect(cx - 14, cy - 1, 28, 1);
  // Tartan accent on bands (Scottish treasure!)
  g.fillStyle(0xcc2222, 0.6);
  g.fillRect(cx - 14, cy, 28, 1);
  g.fillStyle(0x224488, 0.4);
  g.fillRect(cx - 14, cy - 2, 28, 1);
  // Vertical metal band (center strap)
  g.fillStyle(0x6a5500, 1);
  g.fillRect(cx - 1, cy - 8, 2, 18);
  g.fillStyle(0xccaa33, 0.8);
  g.fillRect(cx, cy - 7, 1, 16);

  // Metal rivets — at intersections
  g.fillStyle(0xddbb44, 1);
  g.fillCircle(cx - 12, cy - 1, 1);
  g.fillCircle(cx + 12, cy - 1, 1);
  g.fillCircle(cx, cy - 1, 1.2);
  g.fillCircle(cx - 12, cy + 9, 0.8);
  g.fillCircle(cx + 12, cy + 9, 0.8);

  // Lock — ornate golden clasp
  g.fillStyle(0x443300, 1);
  g.fillRect(cx - 3, cy + 1, 6, 6);
  g.fillStyle(0xffcc44, 1);
  g.fillRect(cx - 2, cy + 2, 4, 4);
  g.fillStyle(0xffeebb, 1);
  g.fillCircle(cx, cy + 3, 1.5);
  g.fillStyle(0x221100, 1);
  g.fillCircle(cx, cy + 4, 0.8);

  g.generateTexture('chest', s, s);
  g.destroy();
}
