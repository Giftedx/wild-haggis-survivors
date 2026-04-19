import Phaser from 'phaser';

export function bakeEdinburghGhostGuide(scene: Phaser.Scene): void {
  const s = 44;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Ectoplasmic aura.
  g.fillStyle(0x8fc6d4, 0.15);
  g.fillEllipse(cx, cy, 32, 36);
  g.fillStyle(0x8fc6d4, 0.08);
  g.fillEllipse(cx, cy, 40, 44);

  // Long Victorian frock coat — spectral grey-blue.
  g.fillStyle(0x1a2838, 1);
  g.fillTriangle(cx - 10, cy + 18, cx + 10, cy + 18, cx + 6, cy - 4);
  g.fillTriangle(cx - 10, cy + 18, cx - 6, cy - 4, cx + 6, cy - 4);
  g.fillStyle(0x334858, 1);
  g.fillTriangle(cx - 8, cy + 16, cx + 8, cy + 16, cx + 5, cy - 3);
  g.fillTriangle(cx - 8, cy + 16, cx - 5, cy - 3, cx + 5, cy - 3);
  // Coat-tails trail (translucent ghost fade).
  g.fillStyle(0x334858, 0.4);
  g.fillTriangle(cx - 10, cy + 18, cx - 14, cy + 21, cx - 6, cy + 18);
  g.fillTriangle(cx + 10, cy + 18, cx + 14, cy + 21, cx + 6, cy + 18);

  // Wispy trailing bottom (no hard feet — ghost drift).
  g.fillStyle(0x8fc6d4, 0.35);
  g.fillRect(cx - 6, cy + 16, 12, 2);
  g.fillStyle(0x8fc6d4, 0.2);
  g.fillRect(cx - 8, cy + 18, 16, 1);

  // Pale gaunt face above the collar.
  g.fillStyle(0xd8e6ee, 0.95);
  g.fillEllipse(cx, cy - 9, 8, 10);
  // Collar — white Victorian shirt-front.
  g.fillStyle(0xe0e8f0, 0.9);
  g.fillRect(cx - 3, cy - 4, 6, 2);
  // Hollow eyes — cyan pinpricks.
  g.fillStyle(0x8fc6d4, 1);
  g.fillCircle(cx - 2, cy - 10, 1);
  g.fillCircle(cx + 2, cy - 10, 1);
  // Thin moustache for that tour-guide beat.
  g.lineStyle(0.8, 0x2a3848, 1);
  g.lineBetween(cx - 3, cy - 6, cx + 3, cy - 6);

  // Top hat.
  g.fillStyle(0x10141a, 1);
  g.fillRect(cx - 5, cy - 18, 10, 5);
  g.fillRect(cx - 7, cy - 13, 14, 2);
  g.fillStyle(0xa89050, 0.6);
  g.fillRect(cx - 5, cy - 15, 10, 1); // hat band

  // Lantern in hand — outstretched, glowing.
  g.fillStyle(0xa89050, 1);
  g.fillRect(cx + 11, cy + 2, 2, 5); // pole
  g.fillStyle(0xffcc66, 0.9);
  g.fillCircle(cx + 12, cy + 2, 3);
  g.fillStyle(0xfff0a0, 1);
  g.fillCircle(cx + 12, cy + 2, 1.5);
  // Lantern glow halo.
  g.fillStyle(0xffd88a, 0.25);
  g.fillCircle(cx + 12, cy + 2, 6);

  g.generateTexture('edinburgh_ghost_guide', s, s);
  g.destroy();
}

/**
 * Barghest — DESIGN_IDEAS section 3 Cryptids family opener.
 * Shadow-hound silhouette that dives in from the edge, eyes and
 * fangs the only bright points on a near-black body. Contrasts
 * the eagle's clean silver dive: slower-reading silhouette, more
 * ominous palette, teeth drawn so the collision feels earned.
 */
