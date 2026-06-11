import * as Phaser from 'phaser';

/**
 * `ucard_rowan_amulet` — Rowan Amulet passive card icon.
 * A rowan-wood disc on a cord — rowan-red berries clustered at the top,
 * wood-grain texture suggested by thin lines. Reads as "charm / speed /
 * protection" at 32px. Distinct from the rowan thread (thin cord) icon.
 */
export function drawRowanAmulet(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 18;

  // Hanging cord.
  g.lineStyle(1.5, 0x8a6030, 0.75);
  g.lineBetween(cx, 4, cx, 10);
  g.lineBetween(cx - 1, 4, cx - 4, 1);
  g.lineBetween(cx + 1, 4, cx + 4, 1);

  // Rowan-red berry cluster at the top of the cord.
  g.fillStyle(0xcc3311, 0.90);
  g.fillCircle(cx, 4, 2.5);
  g.fillCircle(cx - 3, 5, 2);
  g.fillCircle(cx + 3, 5, 2);

  // Berry highlights.
  g.fillStyle(0xff6644, 0.50);
  g.fillCircle(cx - 0.5, 3, 1);
  g.fillCircle(cx - 3.5, 4, 0.8);

  // Amulet disc shadow.
  g.fillStyle(0x2a1a0a, 0.45);
  g.fillCircle(cx + 1, cy + 1, 10);

  // Amulet disc — rowan wood, warm amber-brown.
  g.fillStyle(0x9a6030, 1);
  g.fillCircle(cx, cy, 9);

  // Wood grain lines.
  g.lineStyle(1, 0x6b3d12, 0.55);
  g.lineBetween(cx - 6, cy - 4, cx + 6, cy - 4);
  g.lineBetween(cx - 7, cy, cx + 7, cy);
  g.lineBetween(cx - 6, cy + 4, cx + 6, cy + 4);

  // Disc rim.
  g.lineStyle(1.5, 0x6b3d12, 0.70);
  g.strokeCircle(cx, cy, 9);

  // Centre rune mark — a small cross-hatch charm symbol.
  g.lineStyle(1.5, 0xcc3311, 0.80);
  g.lineBetween(cx, cy - 4, cx, cy + 4);
  g.lineBetween(cx - 4, cy, cx + 4, cy);

  // Warm aura glow.
  g.lineStyle(1, 0xdd4422, 0.20);
  g.strokeCircle(cx, cy, 12);

  g.generateTexture('ucard_rowan_amulet', s, s);
  g.destroy();
}
