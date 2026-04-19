/**
 * `traffic_cone_totem` — stack of three traffic cones stood on end like a cairn. Reflective bands catch the light.
 */

import Phaser from 'phaser';

export function bakeTrafficConeTotem(scene: Phaser.Scene): void {
  const s = 44;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 4;

  // Wet asphalt base — darker for contrast so the base reads as "it's
  // been sat here since Hogmanay".
  g.fillStyle(0x1a1a1a, 0.7);
  g.fillEllipse(cx, cy + 14, 22, 5);
  // Grass tufts pushing through at the base — the moor is reclaiming it.
  g.fillStyle(0x2a5a28, 0.75);
  g.fillRect(cx - 10, cy + 13, 1, 2);
  g.fillRect(cx - 6, cy + 12, 1, 3);
  g.fillRect(cx + 7, cy + 13, 1, 2);
  g.fillStyle(0x3a7a3a, 0.6);
  g.fillRect(cx - 9, cy + 12, 1, 2);
  g.fillRect(cx + 8, cy + 12, 1, 2);

  // Lower cone — biggest, hazard orange with reflective bands.
  g.fillStyle(0x8a3a08, 1);
  g.fillTriangle(cx - 10, cy + 12, cx + 10, cy + 12, cx, cy + 2);
  g.fillStyle(0xdd5a10, 1);
  g.fillTriangle(cx - 9, cy + 11, cx + 9, cy + 11, cx, cy + 3);
  g.fillStyle(0xffe6cc, 1);
  g.fillRect(cx - 7, cy + 7, 14, 1);
  g.fillRect(cx - 6, cy + 10, 12, 1);
  // Scuff marks on lower cone — weather-battered.
  g.fillStyle(0x5a2804, 0.6);
  g.fillRect(cx - 4, cy + 9, 2, 1);
  g.fillRect(cx + 3, cy + 8, 1, 1);

  // Middle cone.
  g.fillStyle(0x8a3a08, 1);
  g.fillTriangle(cx - 7, cy + 2, cx + 7, cy + 2, cx, cy - 6);
  g.fillStyle(0xdd5a10, 1);
  g.fillTriangle(cx - 6, cy + 1, cx + 6, cy + 1, cx, cy - 5);
  g.fillStyle(0xffe6cc, 1);
  g.fillRect(cx - 5, cy - 2, 10, 1);
  // Wee scuff on middle cone.
  g.fillStyle(0x5a2804, 0.5);
  g.fillRect(cx + 2, cy - 1, 1, 1);

  // Top cone — smallest, slightly tilted.
  g.fillStyle(0x8a3a08, 1);
  g.fillTriangle(cx - 4, cy - 6, cx + 4, cy - 6, cx + 1, cy - 12);
  g.fillStyle(0xdd5a10, 1);
  g.fillTriangle(cx - 3, cy - 7, cx + 3, cy - 7, cx + 1, cy - 11);

  // Warning glow — cones have catch-light on their rim so the totem
  // reads as a hazard, not decor.
  g.fillStyle(0xffcc44, 0.25);
  g.fillCircle(cx, cy + 2, 12);

  g.generateTexture('traffic_cone_totem', s, s);
  g.destroy();
}

/**
 * Edinburgh Ghost Guide — DESIGN_IDEAS section 3 Urban Ghaists #3.
 * Spectral Victorian tour guide silhouette with a lantern. Ranged
 * enemy that keeps distance and lobs projectiles; visually reads as
 * a fluorescent-flicker ghost rather than a solid hench figure.
 */
