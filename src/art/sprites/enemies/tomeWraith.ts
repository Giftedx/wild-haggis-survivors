/**
 * `tome_wraith` — giant open book floating upright with a ghostly
 * spectre rising OUT of the pages like smoke. Design pivot: the book
 * dominates the bottom half of the canvas at full width, drawn as a
 * V-shape in perspective with clear ruled lines + a big blocky ink
 * letter on each page. The spectre is a vertical smoke column rising
 * upward from the gutter, with hollow-eyed face at the top. Torn page
 * scraps orbit. Reads as "evil library book" at a glance.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const TOME_WRAITH_CANVAS_SIZE = 40;

export function drawTomeWraithBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = TOME_WRAITH_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);

  // ── Ghostly halo — cool parchment-blue, lifted opacity (audit
  // dislike: "aura is pale"). ──
  g.fillStyle(0xb0c8d8, 0.32);
  g.fillEllipse(cx, cy, 30, 28);
  g.fillStyle(0xb0c8d8, 0.18);
  g.fillEllipse(cx, cy, 34, 32);

  // ── Page glow — warm gold radiance pouring up out of the open book
  // (audit dislike: "no page glow"). Drawn before the smoke column so
  // the wisp tints over it. ──
  g.fillStyle(0xfff0a8, 0.28);
  g.fillEllipse(cx, cy + 4, 22, 14);
  g.fillStyle(0xffe070, 0.35);
  g.fillEllipse(cx, cy + 5, 16, 9);
  g.fillStyle(0xffd040, 0.5);
  g.fillEllipse(cx, cy + 6, 8, 5);

  // ── Smoke column rising from the gutter — vertical translucent
  // wisp connecting book to face. Tinted slightly warm by the page
  // glow below. ──
  g.fillStyle(0xc4d8e4, 0.45);
  g.fillEllipse(cx, cy - 3, 7, 10);
  g.fillStyle(0xe8e0c8, 0.32);
  g.fillEllipse(cx, cy - 1, 5, 6);
  g.fillStyle(0xd4e4ec, 0.3);
  g.fillEllipse(cx, cy - 7, 5, 8);

  // ── Open book — big V-shape, pages fanning outward in
  // perspective. Fills the bottom 60% of the canvas. Leather cover
  // gets two binding ridges so the bottom no longer reads as a
  // fence (audit dislike: "lower book can look like fence"). ──
  // Leather cover shadow (back edge)
  g.fillStyle(0x0a0604, 1);
  g.fillTriangle(cx - 15, cy + 11, cx + 15, cy + 11, cx, cy + 2);
  // Leather cover main
  g.fillStyle(0x3a1a08, 1);
  g.fillTriangle(cx - 14, cy + 10, cx + 14, cy + 10, cx, cy + 3);
  // Inner leather lighter band
  g.fillStyle(0x5a2a10, 1);
  g.fillTriangle(cx - 13, cy + 9, cx + 13, cy + 9, cx, cy + 4);
  // Binding studs — three small brass corners on each cover face,
  // breaks the flat-triangle fence look.
  g.fillStyle(0xc89028, 1);
  g.fillRect(cx - 13, cy + 10, 1.2, 1);
  g.fillRect(cx + 11.8, cy + 10, 1.2, 1);
  g.fillRect(cx - 8, cy + 10.5, 0.8, 0.8);
  g.fillRect(cx + 7.2, cy + 10.5, 0.8, 0.8);
  g.fillStyle(0xffd070, 0.85);
  g.fillRect(cx - 13, cy + 10, 1.2, 0.3);
  g.fillRect(cx + 11.8, cy + 10, 1.2, 0.3);

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

  // ── Ghost shoulder/arms hint — translucent wisps either side of
  // the smoke column suggesting a body emerging from the pages
  // (audit dislike: "ghost body is very simple"). ──
  g.fillStyle(0xc4d8e4, 0.4);
  g.fillEllipse(cx - 5, cy - 4, 4, 5);
  g.fillEllipse(cx + 5, cy - 4, 4, 5);
  g.fillStyle(0xd4e4ec, 0.25);
  g.fillEllipse(cx - 6, cy - 5, 2, 3);
  g.fillEllipse(cx + 6, cy - 5, 2, 3);

  // ── Ghostly face rising above the book — hollow-eyed skull
  // wraith. Bigger than before, high-contrast. ──
  g.fillStyle(0xd4c8e0, 0.92);
  g.fillEllipse(cx, cy - 10, 8, 10);
  g.fillStyle(0xe8dce8, 0.85);
  g.fillEllipse(cx, cy - 11, 6, 8);
  // Cheek hollow shadows — sharpens the skull read.
  g.fillStyle(0x6a5a78, 0.55);
  g.fillEllipse(cx - 2.5, cy - 8.5, 1.4, 1.8);
  g.fillEllipse(cx + 2.5, cy - 8.5, 1.4, 1.8);
  // Hollow eye pits with a faint amber glow inside (page-light reflection).
  g.fillStyle(0xffd040, 0.45);
  g.fillCircle(cx - 1.7, cy - 11, 1.4);
  g.fillCircle(cx + 1.8, cy - 11, 1.4);
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 2.5, cy - 12, 1.5, 2.5);
  g.fillRect(cx + 1, cy - 12, 1.5, 2.5);
  g.fillStyle(0xff8030, 0.85);
  g.fillRect(cx - 2.1, cy - 11.4, 0.6, 0.6);
  g.fillRect(cx + 1.4, cy - 11.4, 0.6, 0.6);
  // Mouth — slightly opened with a tooth glint.
  g.fillStyle(0x0a0610, 1);
  g.fillRect(cx - 2, cy - 7, 4, 1.2);
  g.fillStyle(0xe8dce8, 0.7);
  g.fillRect(cx - 1.4, cy - 6.6, 0.4, 0.5);
  g.fillRect(cx + 0.4, cy - 6.6, 0.4, 0.5);

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

  // ── Crimson bookmark ribbon flowing out the bottom of the spine
  // and curling sideways. Storytelling beat: "you're losing your
  // place". Reads as motion, not a static prop. ──
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx - 0.6, cy + 9, 1.2, 5);
  g.fillStyle(0xc42828, 1);
  g.fillRect(cx - 0.5, cy + 9, 1, 5);
  // Curl tail — ribbon flicks left at the end.
  g.fillStyle(0xc42828, 1);
  g.fillTriangle(cx - 0.5, cy + 14, cx - 3.5, cy + 16, cx - 0.5, cy + 16);
  g.fillStyle(0xff5050, 0.75);
  g.fillRect(cx - 0.4, cy + 9, 0.4, 4);
  // Forked tip at the bottom of the curl
  g.fillStyle(0x8a1818, 1);
  g.fillTriangle(cx - 3.5, cy + 16, cx - 4.4, cy + 17, cx - 2.6, cy + 16.6);

}

export function bakeTomeWraith(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawTomeWraithBody(g);
  g.generateTexture('tome_wraith', TOME_WRAITH_CANVAS_SIZE, TOME_WRAITH_CANVAS_SIZE);
  g.destroy();
}

/**
 * Dean Apparition — DESIGN_IDEAS section 3 Academic #3. Formal
 * ghostly dean in academic gown + mortarboard, stern moustached
 * face, arms folded in a disciplinary pose. Mass-override chase
 * so contact shoves the player — "the academy does not wait".
 */
