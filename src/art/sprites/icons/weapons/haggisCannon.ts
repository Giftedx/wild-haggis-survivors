import * as Phaser from 'phaser';

/**
 * `wicon_haggis_cannon` — scatter-fire upgrade icon. Design pivot:
 * old icon was 6 radial spoke-lines + center blob = concentric-
 * circles mess reading as "gear" or "sunburst". New pitch — proper
 * CANNON-BARREL shape angled diagonal from lower-left to upper-
 * right, with a BIG MUZZLE FLASH at the tip and 3 haggis balls
 * exploding outward in a scatter. Reads "cannon firing shrapnel"
 * not "abstract pattern".
 */
export function drawHaggisCannonIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // Cannon body — diagonal thick barrel from lower-left to centre
  // Dark outline
  g.fillStyle(0x0a0604, 1);
  g.fillTriangle(cx - 14, cy + 12, cx - 10, cy + 14, cx + 4, cy);
  g.fillTriangle(cx - 14, cy + 12, cx + 4, cy, cx + 2, cy - 4);
  // Main barrel — brass/bronze
  g.fillStyle(0x6a3010, 1);
  g.fillTriangle(cx - 13, cy + 12, cx - 10, cy + 13, cx + 3, cy - 1);
  g.fillTriangle(cx - 13, cy + 12, cx + 3, cy - 1, cx + 1, cy - 3);
  // Barrel highlight (upper edge catching light)
  g.fillStyle(0xba8040, 1);
  g.fillRect(cx - 12, cy + 10, 2, 1);
  g.fillRect(cx - 8, cy + 7, 3, 1);
  g.fillRect(cx - 4, cy + 3, 3, 1);
  g.fillRect(cx, cy - 1, 2, 1);
  // Reinforcement bands — two darker rings on the barrel
  g.fillStyle(0x2a1a08, 1);
  g.fillRect(cx - 10, cy + 8, 4, 1.5);
  g.fillRect(cx - 4, cy + 2, 4, 1.5);
  // Band brass highlight
  g.fillStyle(0xd8a840, 0.9);
  g.fillRect(cx - 10, cy + 8, 4, 0.4);
  g.fillRect(cx - 4, cy + 2, 4, 0.4);

  // Cannon breech (back end) — larger rounded block
  g.fillStyle(0x0a0604, 1);
  g.fillCircle(cx - 13, cy + 12, 3);
  g.fillStyle(0x6a3010, 1);
  g.fillCircle(cx - 13, cy + 12, 2.5);
  g.fillStyle(0xba8040, 0.9);
  g.fillCircle(cx - 14, cy + 11, 1);

  // MUZZLE FLASH — big bright orange-yellow burst at the tip
  // Outer glow
  g.fillStyle(0xff6020, 0.5);
  g.fillCircle(cx + 3, cy - 3, 10);
  g.fillStyle(0xffa040, 0.8);
  g.fillCircle(cx + 3, cy - 3, 7);
  // Core flash
  g.fillStyle(0xffd880, 1);
  g.fillCircle(cx + 3, cy - 3, 5);
  g.fillStyle(0xfff4c8, 1);
  g.fillCircle(cx + 3, cy - 3, 3);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 2, cy - 4, 1.3);

  // Three SCATTER BALLS — haggis shrapnel spreading outward upper-right
  drawMiniHaggis(g, cx + 9, cy - 9, 2.5);
  drawMiniHaggis(g, cx + 12, cy - 5, 2);
  drawMiniHaggis(g, cx + 7, cy - 13, 2);

  // Smoke puffs trailing from the muzzle
  g.fillStyle(0x8a8070, 0.6);
  g.fillCircle(cx - 4, cy - 8, 1.5);
  g.fillCircle(cx - 8, cy - 5, 1.2);
  g.fillStyle(0xa8a090, 0.4);
  g.fillCircle(cx - 6, cy - 11, 1);

  g.generateTexture('wicon_haggis_cannon', s, s);
  g.destroy();
}

/**
 * Draw a small haggis ball for scatter-shrapnel decoration on
 * weapon icons. Dark outline + brown body + oat fleck.
 */
function drawMiniHaggis(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0x0a0604, 1);
  g.fillCircle(x, y, r + 0.4);
  g.fillStyle(0x4a3008, 1);
  g.fillCircle(x, y, r);
  g.fillStyle(0x7a5020, 1);
  g.fillCircle(x - 0.3, y - 0.3, r * 0.65);
  g.fillStyle(0xc8a848, 0.9);
  g.fillCircle(x + 0.3, y + 0.3, 0.4);
}
