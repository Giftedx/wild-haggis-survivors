import * as Phaser from 'phaser';

/**
 * `ucard_smoked_haddock` — Smoked Haddock passive card icon.
 * A small golden-brown whole fish (haddock silhouette) with a slight
 * smoke-amber glow. Reads as "fish/food" at 32px — distinct from the
 * rowan thread (sprig), reeds (cane), and peated oak (barrel stave).
 */
export function drawSmokedHaddock(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Smoke glow behind the fish — soft amber haze.
  g.fillStyle(0xd4a040, 0.18);
  g.fillEllipse(16, 17, 26, 14);

  // Fish body — horizontal silhouette, golden-brown (smoked).
  // Outline.
  g.fillStyle(0x1a0c04, 1);
  g.fillEllipse(15, 17, 22, 10);
  // Body fill.
  g.fillStyle(0xa06820, 1);
  g.fillEllipse(15, 17, 20, 8);
  // Belly highlight — lighter stripe.
  g.fillStyle(0xd09840, 0.6);
  g.fillEllipse(14, 16, 14, 4);

  // Tail — forked wedge at the right end.
  g.fillStyle(0x1a0c04, 1);
  g.fillTriangle(24, 13, 30, 11, 30, 15);
  g.fillTriangle(24, 21, 30, 17, 30, 23);
  g.fillStyle(0x804820, 1);
  g.fillTriangle(24, 14, 29, 12, 29, 15);
  g.fillTriangle(24, 20, 29, 18, 29, 22);

  // Eye — small dark dot.
  g.fillStyle(0x1a0c04, 1);
  g.fillCircle(7, 16, 2);
  g.fillStyle(0xfff0d0, 0.7);
  g.fillCircle(6.5, 15.5, 0.8);

  // Smoke wisps above.
  g.lineStyle(1, 0xd0c0a0, 0.40);
  g.lineBetween(10, 12, 11, 9);
  g.lineBetween(16, 11, 17, 8);
  g.lineBetween(22, 12, 23, 9);

  g.generateTexture('ucard_smoked_haddock', s, s);
  g.destroy();
}
