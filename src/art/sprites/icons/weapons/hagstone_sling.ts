import * as Phaser from 'phaser';

/**
 * `wicon_hagstone_sling` — Hagstone Sling weapon icon.
 * A grey granite disc with a dark central hole and a cord trailing
 * behind — reads as "sling stone / piercing / geometry" at 32px.
 */
export function drawHagstoneSlingIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 17;

  // Cord — trailing behind the stone.
  g.lineStyle(1.5, 0x9a7040, 0.70);
  g.lineBetween(cx - 9, cy, cx - 14, cy + 3);
  g.lineBetween(cx - 14, cy + 3, cx - 19, cy + 2);

  // Cord tip loop.
  g.lineStyle(1.2, 0x9a7040, 0.55);
  g.strokeCircle(cx - 21, cy + 1, 2);

  // Stone shadow.
  g.fillStyle(0x1a1a1a, 0.45);
  g.fillCircle(cx + 1, cy + 1, 10);

  // Main stone body — grey granite.
  g.fillStyle(0x8a8a82, 1);
  g.fillCircle(cx, cy, 9);

  // Granite mottling — lighter.
  g.fillStyle(0xb0b0a8, 0.55);
  g.fillCircle(cx - 3, cy - 3, 3.5);
  g.fillCircle(cx + 3, cy + 1, 2.5);

  // Granite mottling — darker.
  g.fillStyle(0x5a5a56, 0.50);
  g.fillCircle(cx + 2, cy + 4, 2.5);
  g.fillCircle(cx - 4, cy + 3, 2);

  // Central aperture rim.
  g.lineStyle(1.5, 0x4a4a46, 1);
  g.strokeCircle(cx, cy, 4);

  // Central hole — the signature mechanic.
  g.fillStyle(0x0d0d0c, 1);
  g.fillCircle(cx, cy, 3.5);

  // Faint pierce-line through the hole — suggests the bonus.
  g.lineStyle(1, 0xcc9944, 0.30);
  g.lineBetween(cx + 9, cy, cx + 27, cy);

  g.generateTexture('wicon_hagstone_sling', s, s);
  g.destroy();
}
