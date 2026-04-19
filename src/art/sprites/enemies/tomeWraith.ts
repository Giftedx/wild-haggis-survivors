/**
 * `tome_wraith` — giant open book floating upright with a ghostly
 * spectre rising OUT of the pages like smoke. Design pivot: the book
 * dominates the bottom half of the canvas at full width, drawn as a
 * V-shape in perspective with clear ruled lines + a big blocky ink
 * letter on each page. The spectre is a vertical smoke column rising
 * upward from the gutter, with hollow-eyed face at the top. Torn page
 * scraps orbit. Reads as "evil library book" at a glance.
 */

import Phaser from 'phaser';

export function bakeTomeWraith(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Ghostly halo — cool parchment-blue, larger than before. ──
  g.fillStyle(0xb0c8d8, 0.2);
  g.fillEllipse(cx, cy, 30, 28);
  g.fillStyle(0xb0c8d8, 0.12);
  g.fillEllipse(cx, cy, 34, 32);

  // ── Smoke column rising from the gutter — vertical translucent
  // wisp connecting book to face. Drawn first so everything else
  // overlaps. ──
  g.fillStyle(0xc4d8e4, 0.35);
  g.fillEllipse(cx, cy - 3, 7, 10);
  g.fillStyle(0xd4e4ec, 0.25);
  g.fillEllipse(cx, cy - 7, 5, 8);

  // ── Open book — big V-shape, pages fanning outward in
  // perspective. Fills the bottom 60% of the canvas. ──
  // Leather cover shadow (back edge)
  g.fillStyle(0x0a0604, 1);
  g.fillTriangle(cx - 15, cy + 11, cx + 15, cy + 11, cx, cy + 2);
  // Leather cover main
  g.fillStyle(0x3a1a08, 1);
  g.fillTriangle(cx - 14, cy + 10, cx + 14, cy + 10, cx, cy + 3);
  // Inner leather lighter band
  g.fillStyle(0x5a2a10, 1);
  g.fillTriangle(cx - 13, cy + 9, cx + 13, cy + 9, cx, cy + 4);

  // ── Left page — big parchment triangle, ruled lines + blocky
  // ink letter. ──
  g.fillStyle(0xeadfb8, 1);
  g.fillTriangle(cx - 13, cy + 8, cx - 0.5, cy + 3, cx - 0.5, cy + 8);
  // Page top-edge highlight
  g.fillStyle(0xf8eec8, 1);
  g.fillTriangle(cx - 13, cy + 8, cx - 0.5, cy + 3, cx - 11, cy + 7.5);

  // ── Right page — mirror of left. ──
  g.fillStyle(0xf0e4c0, 1);
  g.fillTriangle(cx + 13, cy + 8, cx + 0.5, cy + 3, cx + 0.5, cy + 8);
  g.fillStyle(0xfaf2d0, 1);
  g.fillTriangle(cx + 13, cy + 8, cx + 0.5, cy + 3, cx + 11, cy + 7.5);

  // ── Gutter shadow — dark crease where the two pages meet. ──
  g.fillStyle(0x1a0804, 0.85);
  g.fillRect(cx - 0.5, cy + 3, 1, 7);

  // ── Ruled lines — three per page, thick enough to read. ──
  g.fillStyle(0x1a1028, 0.85);
  // Left page
  g.fillRect(cx - 10, cy + 5, 8, 0.5);
  g.fillRect(cx - 9, cy + 6.5, 7.5, 0.5);
  g.fillRect(cx - 8, cy + 8, 7, 0.5);
  // Right page
  g.fillRect(cx + 2, cy + 5, 8, 0.5);
  g.fillRect(cx + 1.5, cy + 6.5, 7.5, 0.5);
  g.fillRect(cx + 1, cy + 8, 7, 0.5);

  // ── Blocky initial letters — one black blot per page so the
  // book reads as "writing inside". ──
  g.fillStyle(0x0a0610, 1);
  g.fillRect(cx - 9, cy + 4.5, 2, 2);
  g.fillRect(cx + 7, cy + 4.5, 2, 2);

  // ── Red underline on the right page — audit threat colour. ──
  g.fillStyle(0xaa2020, 1);
  g.fillRect(cx + 3, cy + 8.5, 4, 0.7);

  // ── Ghostly face rising above the book — hollow-eyed skull
  // wraith. Bigger than before, high-contrast. ──
  g.fillStyle(0xd4c8e0, 0.92);
  g.fillEllipse(cx, cy - 10, 8, 10);
  g.fillStyle(0xe8dce8, 0.85);
  g.fillEllipse(cx, cy - 11, 6, 8);
  // Hollow eye pits
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 2.5, cy - 12, 1.5, 2.5);
  g.fillRect(cx + 1, cy - 12, 1.5, 2.5);
  // Mouth
  g.fillStyle(0x0a0610, 1);
  g.fillRect(cx - 2, cy - 7, 4, 1);

  // ── Torn page scraps orbiting — three small parchment
  // rectangles at varied positions. ──
  g.fillStyle(0xeadfb8, 0.95);
  g.fillRect(cx + 13, cy - 8, 3, 2);
  g.fillStyle(0xeadfb8, 0.8);
  g.fillRect(cx - 15, cy - 10, 3, 2);
  g.fillStyle(0xeadfb8, 0.6);
  g.fillRect(cx + 14, cy + 2, 2.5, 1.5);

  // ── Ink drip from the right-page underline — threat beat. ──
  g.fillStyle(0xaa2020, 1);
  g.fillCircle(cx + 9, cy + 11, 0.7);
  g.fillStyle(0xaa2020, 0.7);
  g.fillCircle(cx + 11, cy + 13, 0.5);

  g.generateTexture('tome_wraith', s, s);
  g.destroy();
}

/**
 * Dean Apparition — DESIGN_IDEAS section 3 Academic #3. Formal
 * ghostly dean in academic gown + mortarboard, stern moustached
 * face, arms folded in a disciplinary pose. Mass-override chase
 * so contact shoves the player — "the academy does not wait".
 */
