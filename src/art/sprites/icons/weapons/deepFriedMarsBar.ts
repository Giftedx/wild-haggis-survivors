import * as Phaser from 'phaser';

/**
 * `wicon_deep_fried_mars_bar` — Deep-Fried Mars Bar weapon icon.
 * A rectangular battered chocolate bar in flight — dark chocolate interior
 * glimpsed through golden batter, caramel sheen, motion trail showing
 * slow heavy tumble. Reads as "absurd / heavy / piercing" at 32px.
 */
export function drawDeepFriedMarsBarIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // Motion trail — three faint caramel blurs.
  g.fillStyle(0xc08030, 0.15);
  g.fillRect(cx - 14, cy - 3, 6, 6);
  g.fillStyle(0xc08030, 0.08);
  g.fillRect(cx - 19, cy - 2, 4, 4);

  // Bar shadow.
  g.fillStyle(0x1a0d00, 0.55);
  g.fillRect(cx - 8, cy - 4, 18, 10);

  // Batter outer — pale gold.
  g.fillStyle(0xd4a040, 1);
  g.fillRect(cx - 9, cy - 5, 18, 10);

  // Chocolate inner — dark brown.
  g.fillStyle(0x4a1c08, 1);
  g.fillRect(cx - 7, cy - 3, 14, 6);

  // Caramel layer — warm amber.
  g.fillStyle(0xc87820, 0.85);
  g.fillRect(cx - 5, cy - 1, 10, 2);

  // Nougat centre.
  g.fillStyle(0xf0e0c0, 0.70);
  g.fillRect(cx - 4, cy, 8, 2);

  // Batter highlight — top edge.
  g.fillStyle(0xf0c868, 0.75);
  g.fillRect(cx - 8, cy - 5, 16, 2);

  // Batter shadow — bottom.
  g.fillStyle(0x8a5010, 0.60);
  g.fillRect(cx - 8, cy + 3, 16, 2);

  // Grease splat hint below — tiny dark drops.
  g.fillStyle(0x6b4820, 0.55);
  g.fillCircle(cx - 2, cy + 9, 2.5);
  g.fillCircle(cx + 3, cy + 10, 1.8);
  g.fillCircle(cx - 5, cy + 10, 1.5);

  g.generateTexture('wicon_deep_fried_mars_bar', s, s);
  g.destroy();
}
