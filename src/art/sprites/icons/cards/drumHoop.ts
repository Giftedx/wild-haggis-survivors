import * as Phaser from 'phaser';

/**
 * `ucard_drum_hoop` — Drum Hoop passive card icon.
 * A bent-willow hoop — the circular frame that tensions the bodhrán
 * goatskin head. A single pale circle of bent wood on a dark background,
 * with grain-dot texture and two lash-cord bindings. Reads as
 * "resonance / expand" at 32px.
 */
export function drawDrumHoop(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Dark background — workshop shadow.
  g.fillStyle(0x1a1008, 1);
  g.fillRoundedRect(2, 2, 28, 28, 4);

  // Outer hoop ring — bent willow, warm brown.
  g.lineStyle(4, 0x7a4a1c, 1);
  g.strokeCircle(16, 16, 11);

  // Inner ring highlight — pale wood edge.
  g.lineStyle(1.5, 0xb0783c, 0.70);
  g.strokeCircle(16, 16, 9.2);

  // Grain texture — three short arcs suggesting wood fibre.
  g.lineStyle(0.8, 0x9a6028, 0.45);
  g.lineBetween(8, 10, 12, 8);
  g.lineBetween(20, 8, 24, 10);
  g.lineBetween(9, 22, 13, 24);

  // Lash-cord bindings — two small cross-wraps at 10-o'clock and 4-o'clock.
  g.fillStyle(0x3a200c, 1);
  g.fillRect(7, 9, 3, 5);
  g.fillRect(22, 18, 3, 5);
  g.fillStyle(0xc89050, 0.80);
  g.fillRect(8, 10, 1, 3);
  g.fillRect(23, 19, 1, 3);

  // Centre open space — shows drum head resonance.
  g.fillStyle(0xc87840, 0.12);
  g.fillCircle(16, 16, 8);

  g.generateTexture('ucard_drum_hoop', s, s);
  g.destroy();
}
