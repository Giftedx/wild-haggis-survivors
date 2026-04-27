/**
 * `deep_fryer` — chip-shop hazard.
 *
 * Stainless-steel commercial fryer that has WALKED off the counter.
 * Battered Mars bar + battered pizza slice + a half-submerged haggis
 * chunk bob in volcanic oil; the chip basket dangles from a welded
 * arm; the temperature dial is welded on MAX. Steam and grease cast
 * a pulsing warning halo so the player clocks the AoE radius.
 *
 * Rewrite pass (lift from 6 → target 8-9):
 *  - Basket handle replaced with crisp fillRect geometry; the
 *    lineBetween strokes were sub-pixel at gameplay scale.
 *  - Warning halo punched up (alpha 0.25 → 0.42, plus a tighter
 *    inner ring) so the hazard radius reads from the moor.
 *  - Battered fry pieces enlarged with proper crusts + crunch nubs;
 *    Mars bar got readable wrapper text-bar, pizza got grease pool.
 *  - Added: floating battered haggis chunk (signature Glesga prop),
 *    oil-line dark seam (containment edge), control-panel power LED,
 *    cracked-plinth weathering on the steel base.
 */

import * as Phaser from 'phaser';

const STEEL_OUTLINE = 0x0a0a0c;
const STEEL_BASE = 0x484c52;
const STEEL_MID = 0x6a6e76;
const STEEL_HI = 0x9aa0a8;
const STEEL_RIM = 0xb0b6be;
const PANEL_DARK = 0x1c1c20;
const PANEL_MID = 0x32323a;
const PANEL_HI = 0x6a6a72;
const DIAL_RED = 0xd92020;
const DIAL_HOT = 0xff5050;
const LED_GREEN = 0x6aff6a;
const LED_HOT = 0xc6ffc6;
const OIL_DEEP = 0x4a2200;
const OIL_BASE = 0x9a5a08;
const OIL_BRIGHT = 0xddaa20;
const OIL_HOT = 0xffd844;
const OIL_BUBBLE = 0xffec88;
const OIL_FOAM = 0xfff8d0;
const BATTER_DARK = 0x6a3a08;
const BATTER_MID = 0xb87420;
const BATTER_HI = 0xefb04a;
const BATTER_CRUNCH = 0xffe48a;
const MARS_BROWN = 0x381808;
const MARS_LABEL = 0xc01010;
const MARS_LABEL_HI = 0xff5a4a;
const PIZZA_RED = 0xa01818;
const PIZZA_RED_HI = 0xd83838;
const HAGGIS_DARK = 0x2a1a08;
const HAGGIS_MID = 0x6a4018;
const STEAM_OUTER = 0xd8d8e0;
const STEAM_INNER = 0xfafaff;
const WARNING_GLOW = 0xff8420;

export function bakeDeepFryer(scene: Phaser.Scene): void {
  const s = 48;
  const g = scene.add.graphics();
  const cx = s / 2;
  const cy = s / 2 + 2;

  // ── Warning halo — TWO RINGS so the threat zone reads from the
  // moor. Outer is wide and faint; inner is tight and stronger. ──
  g.fillStyle(WARNING_GLOW, 0.18);
  g.fillCircle(cx, cy + 3, 23);
  g.fillStyle(WARNING_GLOW, 0.42);
  g.fillCircle(cx, cy + 3, 16);

  // ── Contact shadow + cracked plinth ──
  // The fryer has stomped here long enough to crack the floor.
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(cx, cy + 16, 36, 4);
  g.fillStyle(0x000000, 0.7);
  g.fillEllipse(cx, cy + 15, 26, 2.4);
  // Plinth cracks — three short jagged dark rects.
  g.fillStyle(0x0a0608, 0.85);
  g.fillRect(cx - 14, cy + 16, 4, 0.6);
  g.fillRect(cx - 6, cy + 16.6, 5, 0.5);
  g.fillRect(cx + 7, cy + 16.2, 4, 0.5);

  // ── Stainless steel body (outline + base + bevelled top rim) ──
  g.fillStyle(STEEL_OUTLINE, 1);
  g.fillRect(cx - 19, cy - 7, 38, 24);
  g.fillStyle(STEEL_BASE, 1);
  g.fillRect(cx - 18, cy - 6, 36, 22);
  g.fillStyle(STEEL_MID, 1);
  g.fillRect(cx - 17, cy - 5, 34, 20);
  // Top rim (polished — catches strip-light).
  g.fillStyle(STEEL_HI, 1);
  g.fillRect(cx - 16, cy - 5, 32, 4);
  g.fillStyle(STEEL_RIM, 1);
  g.fillRect(cx - 16, cy - 5, 32, 1.4);
  // Vertical seam down the front (welded panel join).
  g.fillStyle(STEEL_OUTLINE, 0.6);
  g.fillRect(cx, cy - 1, 1, 16);
  // Side handles (heavy welded loops).
  g.fillStyle(STEEL_OUTLINE, 1);
  g.fillRect(cx - 23, cy - 4, 5, 4);
  g.fillRect(cx + 18, cy - 4, 5, 4);
  g.fillStyle(STEEL_MID, 1);
  g.fillRect(cx - 22.4, cy - 3.4, 3.8, 2.8);
  g.fillRect(cx + 18.6, cy - 3.4, 3.8, 2.8);
  // Welded bolts on the corners.
  g.fillStyle(STEEL_RIM, 1);
  g.fillCircle(cx - 17.4, cy + 14.6, 0.7);
  g.fillCircle(cx + 17.4, cy + 14.6, 0.7);

  // ── Control panel ──
  g.fillStyle(PANEL_DARK, 1);
  g.fillRect(cx - 18, cy - 9, 36, 4);
  g.fillStyle(PANEL_MID, 1);
  g.fillRect(cx - 17.6, cy - 8.6, 35.2, 3.2);
  g.fillStyle(PANEL_HI, 0.85);
  g.fillRect(cx - 17.6, cy - 8.6, 35.2, 0.6);
  // Temperature dial — welded on MAX.
  g.fillStyle(STEEL_OUTLINE, 1);
  g.fillCircle(cx - 14, cy - 7, 1.6);
  g.fillStyle(DIAL_RED, 1);
  g.fillCircle(cx - 14, cy - 7, 1.2);
  g.fillStyle(DIAL_HOT, 0.95);
  g.fillCircle(cx - 14.4, cy - 7.4, 0.6);
  // Dial pointer needle (pointing right — past the safety mark).
  g.fillStyle(STEEL_OUTLINE, 1);
  g.fillRect(cx - 14, cy - 7, 1.6, 0.4);
  // Power LED — a sickly green dot.
  g.fillStyle(STEEL_OUTLINE, 1);
  g.fillCircle(cx - 9.4, cy - 7, 1);
  g.fillStyle(LED_GREEN, 1);
  g.fillCircle(cx - 9.4, cy - 7, 0.7);
  g.fillStyle(LED_HOT, 1);
  g.fillCircle(cx - 9.6, cy - 7.2, 0.3);
  // Branding bar — three thin dark stripes (model number stand-in).
  g.fillStyle(PANEL_DARK, 0.9);
  g.fillRect(cx - 5, cy - 7.4, 8, 0.5);
  g.fillRect(cx - 5, cy - 6.6, 6, 0.5);
  g.fillRect(cx + 6, cy - 7, 10, 0.5);

  // ── Basket arm — welded steel bar to the right of the vat,
  // ending in a wire-frame chip basket up above the surface. Built
  // entirely from fillRects so it reads at 1× zoom. ──
  g.fillStyle(STEEL_OUTLINE, 1);
  g.fillRect(cx + 12.4, cy - 14, 1.6, 7);
  g.fillStyle(STEEL_MID, 1);
  g.fillRect(cx + 12.7, cy - 13.6, 1, 6);
  // Crossbar (top of the lift arm).
  g.fillStyle(STEEL_OUTLINE, 1);
  g.fillRect(cx + 9, cy - 14, 8, 1.4);
  g.fillStyle(STEEL_HI, 1);
  g.fillRect(cx + 9, cy - 14, 8, 0.5);
  // Hook ring at the bar tip.
  g.fillStyle(STEEL_OUTLINE, 1);
  g.fillCircle(cx + 9, cy - 13.4, 1.2);
  g.fillStyle(STEEL_MID, 1);
  g.fillCircle(cx + 9, cy - 13.4, 0.7);
  // Wire basket — 5 vertical bars + a horizontal lip + a horizontal
  // bottom. Each bar is 0.6×3.4 so it reads as wire mesh.
  g.fillStyle(STEEL_OUTLINE, 1);
  g.fillRect(cx + 7.8, cy - 12, 7, 0.7);
  g.fillRect(cx + 7.8, cy - 8.8, 7, 0.7);
  for (let i = 0; i < 5; i++) {
    const bx = cx + 8.2 + i * 1.5;
    g.fillRect(bx, cy - 11.6, 0.5, 3);
  }
  // Three golden chips poking out of the basket.
  g.fillStyle(BATTER_DARK, 1);
  g.fillRect(cx + 8.4, cy - 13.4, 0.9, 2);
  g.fillRect(cx + 10.2, cy - 13.6, 0.9, 2);
  g.fillRect(cx + 12.0, cy - 13.2, 0.9, 1.8);
  g.fillStyle(BATTER_HI, 1);
  g.fillRect(cx + 8.5, cy - 13.4, 0.6, 1.6);
  g.fillRect(cx + 10.3, cy - 13.6, 0.6, 1.6);
  g.fillRect(cx + 12.1, cy - 13.2, 0.6, 1.4);

  // ── Oil vat ──
  // Containment edge — dark outline at the waterline.
  g.fillStyle(STEEL_OUTLINE, 1);
  g.fillRect(cx - 16, cy - 4, 32, 1.2);
  // Deep oil base.
  g.fillStyle(OIL_DEEP, 1);
  g.fillRect(cx - 16, cy - 3, 32, 17);
  g.fillStyle(OIL_BASE, 1);
  g.fillRect(cx - 15, cy - 2.4, 30, 15.6);
  g.fillStyle(OIL_BRIGHT, 1);
  g.fillRect(cx - 14, cy - 1.6, 28, 2.4);
  // Surface ripple (lighter, narrower band) — sells "hot moving oil".
  g.fillStyle(OIL_HOT, 0.75);
  g.fillRect(cx - 14, cy - 1.4, 28, 0.6);
  g.fillStyle(STEEL_OUTLINE, 0.7);
  g.fillRect(cx - 14, cy - 0.6, 28, 0.4);

  // Bubbling pops — bigger, bolder than before so they read.
  const bubbles: Array<[number, number, number, number]> = [
    [-9, 1, 2.6, OIL_HOT],
    [4, 3, 2.4, OIL_HOT],
    [10, 0.5, 2.2, OIL_HOT],
    [-3, 7, 2.6, OIL_HOT],
    [-11, 5.5, 1.8, OIL_BUBBLE],
    [8, 8, 1.8, OIL_BUBBLE],
    [1, 1.2, 2.0, OIL_BUBBLE],
  ];
  for (const [dx, dy, r, col] of bubbles) {
    g.fillStyle(col, 1);
    g.fillCircle(cx + dx, cy + dy, r);
  }
  // Foam caps on the brightest bubbles.
  g.fillStyle(OIL_FOAM, 0.95);
  g.fillCircle(cx - 9, cy + 0.2, 1.2);
  g.fillCircle(cx + 4, cy + 2.2, 1.2);
  g.fillCircle(cx - 3, cy + 6.2, 1.1);

  // ── Battered haggis chunk floating front-left ─────────────────
  // The signature Glesga prop. Rounded, dark, with a crispy
  // batter shell and a single highlight.
  g.fillStyle(HAGGIS_DARK, 1);
  g.fillEllipse(cx - 8, cy + 3.5, 8, 5);
  g.fillStyle(BATTER_DARK, 1);
  g.fillEllipse(cx - 8, cy + 3, 7.4, 4);
  g.fillStyle(BATTER_MID, 1);
  g.fillEllipse(cx - 8, cy + 2.8, 6.4, 3);
  g.fillStyle(BATTER_HI, 0.9);
  g.fillEllipse(cx - 8.4, cy + 2.2, 4.4, 1.6);
  g.fillStyle(HAGGIS_MID, 0.85);
  g.fillCircle(cx - 6.6, cy + 2.6, 0.8);

  // ── Battered Mars bar ──
  g.fillStyle(MARS_BROWN, 1);
  g.fillRect(cx - 1, cy + 4.5, 14, 6);
  g.fillStyle(BATTER_DARK, 1);
  g.fillRect(cx - 0.6, cy + 4.8, 13.2, 5.4);
  g.fillStyle(BATTER_MID, 1);
  g.fillRect(cx - 0.2, cy + 5.2, 12.4, 4.6);
  g.fillStyle(BATTER_HI, 1);
  g.fillRect(cx + 0.2, cy + 5.4, 11.6, 1.4);
  // Mars label band — red with a white edge.
  g.fillStyle(MARS_LABEL, 1);
  g.fillRect(cx + 1, cy + 7.2, 10.4, 1.6);
  g.fillStyle(MARS_LABEL_HI, 0.9);
  g.fillRect(cx + 1, cy + 7.2, 10.4, 0.5);
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx + 2, cy + 7.6, 1.4, 0.6);
  g.fillRect(cx + 5, cy + 7.6, 1.4, 0.6);
  g.fillRect(cx + 8, cy + 7.6, 1.4, 0.6);
  // Crispy crunch nubs along the top edge.
  g.fillStyle(BATTER_CRUNCH, 0.95);
  g.fillCircle(cx + 1, cy + 4.6, 0.7);
  g.fillCircle(cx + 3.4, cy + 4.4, 0.7);
  g.fillCircle(cx + 6.2, cy + 4.4, 0.7);
  g.fillCircle(cx + 9, cy + 4.6, 0.7);
  g.fillCircle(cx + 11.6, cy + 4.6, 0.6);

  // ── Pizza crunch slice — tip pointing down-right ──
  g.fillStyle(MARS_BROWN, 1);
  g.fillTriangle(cx + 4, cy + 1, cx + 14.4, cy + 7.6, cx + 4.6, cy + 7.6);
  g.fillStyle(BATTER_DARK, 1);
  g.fillTriangle(cx + 4.4, cy + 1.6, cx + 13.4, cy + 7, cx + 5.2, cy + 7);
  g.fillStyle(BATTER_MID, 1);
  g.fillTriangle(cx + 5, cy + 2.2, cx + 12.6, cy + 6.6, cx + 5.6, cy + 6.6);
  // Cheese-and-tomato pool (just a red pool, that's the joke).
  g.fillStyle(PIZZA_RED, 0.85);
  g.fillEllipse(cx + 8.4, cy + 5, 4, 1.6);
  g.fillStyle(PIZZA_RED_HI, 0.85);
  g.fillEllipse(cx + 8.4, cy + 4.7, 3, 1);
  // Crust crunch.
  g.fillStyle(BATTER_CRUNCH, 0.95);
  g.fillCircle(cx + 5, cy + 2.4, 0.7);
  g.fillCircle(cx + 6.6, cy + 4, 0.5);
  g.fillCircle(cx + 8.4, cy + 6.4, 0.5);

  // ── Steam — three dense base wisps + two thin upper trails so
  // the column rises out of the canvas.  ──
  const wisps: Array<[number, number, number, number]> = [
    [-9, -10, 3.2, 0.78],
    [0, -13, 3.6, 0.85],
    [9, -10, 3.2, 0.78],
    [-3, -17, 2.4, 0.55],
    [4, -19, 2.0, 0.45],
  ];
  for (const [dx, dy, r, a] of wisps) {
    g.fillStyle(STEAM_OUTER, a);
    g.fillCircle(cx + dx, cy + dy, r);
  }
  for (const [dx, dy, r, a] of wisps) {
    g.fillStyle(STEAM_INNER, Math.min(0.85, a + 0.18));
    g.fillCircle(cx + dx, cy + dy, Math.max(0.8, r - 1.0));
  }

  g.generateTexture('deep_fryer', s, s);
  g.destroy();
}
