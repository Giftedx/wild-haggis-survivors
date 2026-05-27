import * as Phaser from 'phaser';

/**
 * `ucard_wire_strings` — Wire Strings passive card icon.
 * Three taut bronze wire strings stretched horizontally, slightly angled
 * to suggest tension and tuning. A faint warm glow suggests resonance.
 * Reads as "wire / harp / speed" at 32px — distinct from gut-string
 * imagery and wool-based passives.
 */
export function drawWireStrings(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  // Background warmth — faint amber haze behind the strings.
  g.fillStyle(0x3a2800, 0.40);
  g.fillRoundedRect(4, 6, 24, 20, 3);

  // Bridge anchor points — left and right wood pegs.
  g.fillStyle(0x6b3d12, 1);
  g.fillRect(4, 7, 3, 18);
  g.fillRect(25, 7, 3, 18);

  // Peg highlight.
  g.fillStyle(0x9a6030, 0.55);
  g.fillRect(5, 8, 1, 15);
  g.fillRect(26, 8, 1, 15);

  // Three wire strings — taut bronze, slightly different angles (tuning).
  const strings = [
    { y1: 11, y2: 10, thick: 2.0, alpha: 1.00 },
    { y1: 16, y2: 16, thick: 1.5, alpha: 0.90 },
    { y1: 21, y2: 22, thick: 1.5, alpha: 0.80 },
  ];
  for (const str of strings) {
    g.lineStyle(str.thick, 0xd4960a, str.alpha);
    g.lineBetween(7, str.y1, 25, str.y2);
    // Sheen on each wire.
    g.lineStyle(0.8, 0xffe060, str.alpha * 0.55);
    g.lineBetween(7, str.y1 - 0.5, 25, str.y2 - 0.5);
  }

  // Tension node — a tuning peg nub on the right bridge.
  g.fillStyle(0xc88820, 1);
  g.fillCircle(26, 11, 2);
  g.fillCircle(26, 16, 2);
  g.fillCircle(26, 21, 2);

  // Resonance glow — central amber shimmer.
  g.lineStyle(1, 0xf5c842, 0.20);
  g.strokeCircle(16, 16, 11);

  g.generateTexture('ucard_wire_strings', s, s);
  g.destroy();
}
