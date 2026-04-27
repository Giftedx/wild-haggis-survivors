/**
 * `nest` — eagle's nest spawner. Design pivot: old criss-cross twig
 * lines softened at 1× and the eggs merged with the base tones. New
 * pitch — chunky stick-ring silhouette in strong value contrast
 * (dark-rim/light-interior), THREE bold blue-speckled eggs that pop
 * against the brown bowl, a big auburn primary feather spearing
 * up from the rim as a fight-happened tell. Reads "raptor's nest"
 * at 40px, not "bowl of something".
 */

import * as Phaser from 'phaser';

export function bakeNest(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Dark outer twig ring — rough bowl silhouette. Lifted vertically
  // to break the flat low silhouette (audit dislike: "silhouette is
  // low"). ──
  g.fillStyle(0x0a0602, 1);
  g.fillEllipse(cx, cy + 4, 36, 19);
  g.fillStyle(0x1a0e04, 1);
  g.fillEllipse(cx, cy + 3, 34, 18);
  // Warm brown mid-ring
  g.fillStyle(0x4a2e10, 1);
  g.fillEllipse(cx, cy + 2, 32, 16);
  // Lighter twig highlights on the rim
  g.fillStyle(0x7a5020, 1);
  g.fillEllipse(cx, cy, 30, 13);

  // ── Visible stick ends poking out of the rim — bold chunky
  // rectangles at varied angles + a tall back-spike that lifts the
  // silhouette (audit dislike: "twigs are tiny" + "silhouette is low"). ──
  g.fillStyle(0x3a1e0a, 1);
  g.fillRect(cx - 17, cy - 1, 5, 1.4);
  g.fillRect(cx + 12, cy - 2, 5, 1.4);
  g.fillRect(cx - 14, cy + 5, 5, 1.4);
  g.fillRect(cx + 10, cy + 6, 5, 1.4);
  g.fillRect(cx - 10, cy - 4, 4, 1.2);
  g.fillRect(cx + 8, cy - 4, 4, 1.2);
  // Tall back-twig spearing up — adds vertical volume to the silhouette.
  g.fillStyle(0x2a1808, 1);
  g.fillRect(cx - 4, cy - 9, 1.4, 6);
  g.fillStyle(0x6a4020, 1);
  g.fillRect(cx - 4, cy - 9, 0.6, 6);
  // Crossing twig — a second stick laid diagonally over the rim,
  // adds the "woven" overlap volume the audit asks for.
  g.fillStyle(0x2a1808, 1);
  g.fillTriangle(cx + 4, cy - 7, cx + 5, cy - 7, cx + 11, cy - 1);
  g.fillTriangle(cx + 4, cy - 7, cx + 11, cy - 1, cx + 12, cy - 1);
  g.fillStyle(0x6a4020, 0.9);
  g.fillRect(cx + 4.4, cy - 7, 0.4, 7);
  // Stick highlights
  g.fillStyle(0x8a5820, 1);
  g.fillRect(cx - 17, cy - 1, 5, 0.4);
  g.fillRect(cx + 12, cy - 2, 5, 0.4);
  g.fillRect(cx - 14, cy + 5, 5, 0.4);

  // ── Dark inner CAVITY — deeper, with an inner shadow gradient so
  // the bowl reads as a real concave space (audit dislike: "dark inner
  // cavity"). ──
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx, cy - 1, 22, 9);
  g.fillStyle(0x1a0c04, 1);
  g.fillEllipse(cx, cy - 1, 20, 7);
  g.fillStyle(0x2a1806, 1);
  g.fillEllipse(cx + 0.5, cy - 0.5, 17, 5);

  // ── THREE eggs — VARIED. Front-left and front-right are normal;
  // the centre back egg is HATCHING with a visible crack and a tiny
  // beak/eye showing through. Adds the "danger" beat the audit asks
  // for (audit dislike: "enemy behavior not visualized"). ──
  drawEgg(g, cx - 7, cy - 2, false);
  drawEgg(g, cx + 7, cy - 2, false);
  drawEgg(g, cx, cy - 4, true);

  // Wobble lines around the hatching egg — three short curved
  // ticks at 45° angles imply movement (audit dislike: "no motion cue").
  g.fillStyle(0xeebf68, 0.85);
  g.fillRect(cx - 5, cy - 8, 1.4, 0.4);
  g.fillRect(cx + 4, cy - 8, 1.4, 0.4);
  g.fillRect(cx - 0.5, cy - 11, 0.4, 1.4);

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
 * When `hatching` is true a zigzag crack runs across the top and a
 * tiny eye+beak peeks out, signalling spawner-imminent.
 */
function drawEgg(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  hatching: boolean = false,
): void {
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

  if (!hatching) return;

  // Hatching egg variant — zigzag crack across the top of the shell.
  g.fillStyle(0x2a1808, 1);
  g.fillRect(x - 2.5, y - 3, 1, 0.5);
  g.fillRect(x - 1.5, y - 3.5, 1, 0.5);
  g.fillRect(x - 0.5, y - 3, 1, 0.5);
  g.fillRect(x + 0.5, y - 3.5, 1, 0.5);
  g.fillRect(x + 1.5, y - 3, 1, 0.5);
  // A small dark gap inside the crack — sky behind the broken shell.
  g.fillStyle(0x000000, 1);
  g.fillRect(x - 1.5, y - 2.6, 3, 0.6);
  // Tiny eye glint peeking through the crack — signals "imminent threat".
  g.fillStyle(0xffd040, 1);
  g.fillCircle(x + 0.2, y - 2.4, 0.5);
  g.fillStyle(0x000000, 1);
  g.fillCircle(x + 0.2, y - 2.4, 0.25);
  // Tiny orange beak tip protruding from the crack.
  g.fillStyle(0xff8030, 1);
  g.fillTriangle(x - 0.6, y - 2.2, x - 1.2, y - 2.6, x - 0.6, y - 2.7);
}
