/**
 * `nest` — eagle's nest spawner. Design pivot: old criss-cross twig
 * lines softened at 1× and the eggs merged with the base tones. New
 * pitch — chunky stick-ring silhouette in strong value contrast
 * (dark-rim/light-interior), THREE bold blue-speckled eggs that pop
 * against the brown bowl, a big auburn primary feather spearing
 * up from the rim as a fight-happened tell. Reads "raptor's nest"
 * at 40px, not "bowl of something".
 */

import Phaser from 'phaser';

export function bakeNest(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Dark outer twig ring — rough bowl silhouette. ──
  g.fillStyle(0x1a0e04, 1);
  g.fillEllipse(cx, cy + 3, 34, 18);
  // Warm brown mid-ring
  g.fillStyle(0x4a2e10, 1);
  g.fillEllipse(cx, cy + 2, 32, 16);
  // Lighter twig highlights on the rim
  g.fillStyle(0x7a5020, 1);
  g.fillEllipse(cx, cy, 30, 13);

  // ── Visible stick ends poking out of the rim — bold chunky
  // rectangles at the cardinal angles, not thin 1px lines. ──
  g.fillStyle(0x3a1e0a, 1);
  g.fillRect(cx - 16, cy - 1, 4, 1.2);
  g.fillRect(cx + 12, cy - 2, 4, 1.2);
  g.fillRect(cx - 14, cy + 5, 4, 1.2);
  g.fillRect(cx + 10, cy + 6, 4, 1.2);
  g.fillRect(cx - 10, cy - 4, 3, 1);
  g.fillRect(cx + 8, cy - 4, 3, 1);
  // Stick highlight
  g.fillStyle(0x8a5820, 1);
  g.fillRect(cx - 16, cy - 1, 4, 0.4);
  g.fillRect(cx + 12, cy - 2, 4, 0.4);

  // ── Dark nest cavity — where the eggs sit. ──
  g.fillStyle(0x2a1806, 1);
  g.fillEllipse(cx, cy - 1, 22, 9);
  g.fillStyle(0x1a0e04, 1);
  g.fillEllipse(cx, cy - 1, 20, 7);

  // ── THREE big eggs — pale blue-cream like raptor eggs. Positioned
  // in a clear triangle so the count reads at a glance. ──
  drawEgg(g, cx - 7, cy - 2);
  drawEgg(g, cx + 7, cy - 2);
  drawEgg(g, cx, cy - 4);

  // ── Large auburn primary feather spearing up-right from the rim.
  // The "bird's been here" tell. ──
  // Shaft
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx + 8, cy - 12, 0.8, 8);
  // Main feather vane — diagonal tear-drop
  g.fillStyle(0x6a3818, 1);
  g.fillTriangle(cx + 6, cy - 12, cx + 12, cy - 15, cx + 9, cy - 5);
  g.fillStyle(0x8a5028, 1);
  g.fillTriangle(cx + 7, cy - 11, cx + 11, cy - 14, cx + 9, cy - 6);
  // Light-catching highlight
  g.fillStyle(0xba7848, 0.85);
  g.fillTriangle(cx + 8, cy - 10, cx + 10, cy - 13, cx + 9, cy - 8);
  // Feather barbs (short cross-lines)
  g.fillStyle(0x3a2010, 0.8);
  g.fillRect(cx + 7, cy - 8, 2.5, 0.3);
  g.fillRect(cx + 7, cy - 10, 2.5, 0.3);
  g.fillRect(cx + 8, cy - 12, 2.5, 0.3);

  g.generateTexture('nest', s, s);
  g.destroy();
}

/**
 * Draw one speckled eagle egg — pale blue-cream body, darker spots.
 */
function drawEgg(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  // Shadow under the egg
  g.fillStyle(0x000000, 0.5);
  g.fillEllipse(x, y + 4, 6, 1.5);
  // Main body — off-white with cold tint
  g.fillStyle(0xe0e8d8, 1);
  g.fillEllipse(x, y, 7, 9);
  g.fillStyle(0xf0f4e4, 1);
  g.fillEllipse(x - 0.5, y - 0.5, 5, 7);
  // Highlight on the top-left
  g.fillStyle(0xffffff, 0.9);
  g.fillEllipse(x - 1.5, y - 2, 1.8, 2.5);
  // Speckles — blue-brown freckling
  g.fillStyle(0x6a4828, 1);
  g.fillCircle(x - 1, y + 1, 0.6);
  g.fillCircle(x + 1.5, y - 1, 0.5);
  g.fillCircle(x + 0.5, y + 2.5, 0.5);
  g.fillCircle(x - 2, y + 2, 0.4);
  g.fillStyle(0x3a2818, 0.8);
  g.fillCircle(x + 1, y + 1, 0.3);
  g.fillCircle(x - 1.5, y - 1.5, 0.3);
}
