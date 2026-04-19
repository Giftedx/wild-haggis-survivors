/**
 * `tourist` — sunburned visitor in a tartan bucket hat, selfie stick
 * up like a flagpole. Regatta cagoule, open-mouthed at the bonnie
 * scenery, ears glowing pink.
 */

import Phaser from 'phaser';

export function bakeTourist(scene: Phaser.Scene): void {
  const s = 48;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // === Legs (plain under cagoule — simplified for readability) ===
  g.fillStyle(0xee8877, 1);
  g.fillRect(cx - 7, cy + 10, 5, 8);
  g.fillRect(cx + 2, cy + 10, 5, 8);
  g.fillStyle(0x664422, 1);
  g.fillRect(cx - 8, cy + 17, 7, 2);
  g.fillRect(cx + 1, cy + 17, 7, 2);

  // === Bright blue cagoule (THE tourist silhouette — Regatta's finest) ===
  g.fillStyle(0x0e2d77, 1);
  g.fillRect(cx - 12, cy - 6, 24, 18);
  g.fillStyle(0x2255cc, 1);
  g.fillRect(cx - 11, cy - 5, 22, 16);
  // Nylon sheen highlight
  g.fillStyle(0x4477dd, 0.4);
  g.fillRect(cx - 8, cy - 4, 10, 4);
  // Zip line down center
  g.fillStyle(0x1144aa, 1);
  g.fillRect(cx, cy - 5, 1, 16);

  // === Head (SUNBURNED despite clearly overcast sky) ===
  g.fillStyle(0xcc6644, 1);
  g.fillCircle(cx, cy - 12, 9);
  g.fillStyle(0xee8866, 1);
  g.fillCircle(cx, cy - 12, 8);
  // Sunburn flush on cheeks
  g.fillStyle(0xff7755, 0.35);
  g.fillCircle(cx - 4, cy - 10, 2);
  g.fillCircle(cx + 4, cy - 10, 2);
  // Wide bewildered eyes
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 4, cy - 13, 3.5);
  g.fillCircle(cx + 4, cy - 13, 3.5);
  g.fillStyle(0x445566, 1);
  g.fillCircle(cx - 4, cy - 13, 2);
  g.fillCircle(cx + 4, cy - 13, 2);
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 4, cy - 13, 0.8);
  g.fillCircle(cx + 4, cy - 13, 0.8);
  // Worried eyebrows
  g.lineStyle(1.5, 0x884422, 1);
  g.lineBetween(cx - 7, cy - 16, cx - 3, cy - 17);
  g.lineBetween(cx + 7, cy - 16, cx + 3, cy - 17);
  // Open mouth
  g.fillStyle(0x993322, 1);
  g.fillEllipse(cx, cy - 8, 3, 2);

  // === Tartan bucket hat (the tat-shop special from Buchanan Street) ===
  g.fillStyle(0x776633, 1);
  g.fillEllipse(cx, cy - 19, 22, 5);
  g.fillStyle(0xbb8855, 1);
  g.fillEllipse(cx, cy - 19, 20, 4);
  g.fillStyle(0x886644, 1);
  g.fillRect(cx - 8, cy - 24, 16, 6);
  g.fillStyle(0xbb8855, 1);
  g.fillRect(cx - 7, cy - 23, 14, 5);
  // Tartan crosshatch — proper check pattern, not just one red line.
  // Two red horizontals frame top + middle of the crown.
  g.fillStyle(0xcc3322, 0.75);
  g.fillRect(cx - 7, cy - 22, 14, 1);
  g.fillRect(cx - 7, cy - 20, 14, 1);
  // Dark green verticals — the Black-Watch sett flavour.
  g.fillStyle(0x2a4028, 0.7);
  g.fillRect(cx - 5, cy - 23, 1, 5);
  g.fillRect(cx + 4, cy - 23, 1, 5);
  // Red verticals — intersect the horizontals to form classic check.
  g.fillStyle(0xcc3322, 0.55);
  g.fillRect(cx - 1, cy - 23, 1, 5);
  g.fillRect(cx + 2, cy - 23, 1, 5);
  // Cream pin-stripe accents — single pixel highlights at crossings.
  g.fillStyle(0xf0e4c0, 0.6);
  g.fillRect(cx - 5, cy - 22, 1, 1);
  g.fillRect(cx + 4, cy - 22, 1, 1);
  g.fillRect(cx - 1, cy - 20, 1, 1);
  g.fillRect(cx + 2, cy - 20, 1, 1);
  // Sunburned ears poking below brim
  g.fillStyle(0xff7755, 1);
  g.fillCircle(cx - 10, cy - 16, 2);
  g.fillCircle(cx + 10, cy - 16, 2);

  // === Selfie stick + phone (the identifying prop — sticks UP above the silhouette) ===
  g.fillStyle(0x555555, 1);
  g.fillRect(cx - 14, cy - 6, 2, 18);
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 17, cy - 11, 6, 7);
  g.fillStyle(0x4488cc, 0.8);
  g.fillRect(cx - 16, cy - 10, 4, 4);
  // Screen glow
  g.fillStyle(0xffffcc, 0.25);
  g.fillCircle(cx - 14, cy - 12, 3);

  g.generateTexture('tourist', s, s);
  g.destroy();
}

