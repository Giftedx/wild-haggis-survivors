import * as Phaser from 'phaser';

/**
 * `wicon_dirk_dance` — Highland dirk: longer than the sgian dubh,
 * narrower than the claymore. A single diagonal blade with a deep-red
 * tartan-wrapped grip and a brass pommel cap. The blade's character is
 * "everyday Highland steel" — not ceremonial like the sgian dubh,
 * not heroic like the claymore.
 */
export function drawDirkDanceIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // Drop shadow.
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx + 1, cy + 10, 18, 2.5);

  // BLADE — long diagonal, lower-left to upper-right. Longer than
  // sgian dubh (extends past 12 o'clock toward the corner). The
  // sharpened edge is the upper line.
  g.fillStyle(0x0a0a0e, 1);
  g.fillTriangle(cx - 6, cy + 5, cx + 13, cy - 13, cx + 13, cy - 11);
  g.fillTriangle(cx - 6, cy + 5, cx + 13, cy - 11, cx - 5, cy + 7);
  g.fillStyle(0x8c98a4, 1);
  g.fillTriangle(cx - 5, cy + 5, cx + 12, cy - 12, cx + 12, cy - 10);
  g.fillTriangle(cx - 5, cy + 5, cx + 12, cy - 10, cx - 4, cy + 6);
  // Leading edge — bright cold steel.
  g.fillStyle(0xd0d8e0, 1);
  g.fillTriangle(cx - 5, cy + 4.5, cx + 12, cy - 12, cx + 11.5, cy - 11.5);
  // Specular.
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx + 3, cy - 3, 1.2, 0.7);
  g.fillStyle(0xfff0d0, 0.7);
  g.fillRect(cx + 7, cy - 7, 0.9, 0.5);

  // BOLSTER — small brass collar.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 8, cy + 4, 4.4, 4.4);
  g.fillStyle(0xa07028, 1);
  g.fillRect(cx - 7.4, cy + 4.6, 3.2, 3.2);
  g.fillStyle(0xd8a040, 1);
  g.fillRect(cx - 7, cy + 5, 1.6, 1);

  // GRIP — tartan-red wrap with cross-binding (deeper red than blood,
  // matches WEAPON_ACCENTS tartan-blood for dirk_dance).
  g.fillStyle(0x0a0a0e, 1);
  g.fillTriangle(cx - 8, cy + 4, cx - 14, cy + 10, cx - 12, cy + 12);
  g.fillTriangle(cx - 8, cy + 4, cx - 12, cy + 12, cx - 6, cy + 6);
  g.fillStyle(0x6a1818, 1);
  g.fillTriangle(cx - 7.4, cy + 4.6, cx - 13, cy + 10, cx - 11.4, cy + 11.4);
  g.fillStyle(0x9a2a2a, 1);
  // Cross-binding stitches in a paler red.
  for (let i = 0; i < 3; i++) {
    g.fillRect(cx - 12 + i * 1.6, cy + 7 - i * 0.6, 2.4, 0.4);
    g.fillRect(cx - 12 + i * 1.6, cy + 9 - i * 0.6, 2.4, 0.4);
  }

  // POMMEL — brass cap, no stone. Working knife, not ceremonial.
  g.fillStyle(0x0a0a0e, 1);
  g.fillCircle(cx - 13, cy + 11, 3.5);
  g.fillStyle(0xa07028, 1);
  g.fillCircle(cx - 13, cy + 11, 2.8);
  g.fillStyle(0xd8a040, 0.9);
  g.fillCircle(cx - 13.6, cy + 10.4, 1.4);

  g.generateTexture('wicon_dirk_dance', s, s);
  g.destroy();
}
