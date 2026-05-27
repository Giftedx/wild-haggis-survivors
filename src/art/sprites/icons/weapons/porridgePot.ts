import * as Phaser from 'phaser';

/**
 * `wicon_porridge_pot` — Flying Porridge Pot weapon icon.
 * A round cast-iron pot mid-arc, oatmeal splashing out of the top —
 * reads as "lob / sticky / slow zone" at 32px.
 */
export function drawPorridgePotIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 17, cy = 18;

  // Motion arc — faint beige trail behind the pot.
  g.fillStyle(0xc4b090, 0.18);
  g.fillEllipse(cx - 8, cy - 4, 10, 7);
  g.fillStyle(0xc4b090, 0.10);
  g.fillEllipse(cx - 14, cy - 6, 7, 5);

  // Pot shadow.
  g.fillStyle(0x1a1a1a, 0.40);
  g.fillEllipse(cx + 1, cy + 1, 15, 12);

  // Pot body — dark cast iron.
  g.fillStyle(0x3a3a3a, 1);
  g.fillEllipse(cx, cy, 14, 11);

  // Pot rim — lighter rim highlight.
  g.lineStyle(1.5, 0x6a6a6a, 0.80);
  g.strokeEllipse(cx, cy - 1, 14, 5);

  // Oatmeal inside — warm beige fill visible over rim.
  g.fillStyle(0xd4c090, 1);
  g.fillEllipse(cx, cy - 1, 12, 4);

  // Porridge blob erupting — three splats out the top.
  g.fillStyle(0xd4c090, 0.90);
  g.fillCircle(cx, cy - 7, 3);
  g.fillCircle(cx - 4, cy - 8, 2.2);
  g.fillCircle(cx + 3, cy - 8, 2.0);

  // Splash droplets — tiny motes.
  g.fillStyle(0xd4c090, 0.65);
  g.fillCircle(cx - 6, cy - 10, 1.5);
  g.fillCircle(cx + 5, cy - 9, 1.2);
  g.fillCircle(cx + 1, cy - 11, 1.0);

  // Handle on the right.
  g.lineStyle(2, 0x5a5a5a, 0.90);
  g.strokeCircle(cx + 8, cy, 3);

  g.generateTexture('wicon_porridge_pot', s, s);
  g.destroy();
}
