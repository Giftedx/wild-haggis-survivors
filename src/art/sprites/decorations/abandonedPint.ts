/**
 * `deco_tennents` — abandoned Tennent's pint glass on the moor.
 * Design pivot: cleaner geometry. The old trapezoid+edge-bulges
 * produced odd spikes where the ellipses overshot the taper. This
 * version uses a stacked two-band silhouette (rim band + taper body)
 * + a proper pint-glass waist bulge drawn inside the body. Features:
 * half-drunk golden lager, foam head, Tennent's red-T branding,
 * lipstick mark, condensation streak, mystery origin.
 */

import Phaser from 'phaser';

export function bakeAbandonedPint(scene: Phaser.Scene): void {
  const s = 24;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  const top = cy - 10, bot = cy + 9;
  const tw = 5; // top half-width
  const bw = 3.5; // bottom half-width (slight taper)

  // ── Shadow on ground. ──
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, bot + 1, 11, 3);

  // ── Glass silhouette — stacked horizontal bands forming a clean
  // taper. Back layer (darker tint) first. ──
  g.fillStyle(0x6a8090, 0.55);
  for (let y = top; y <= bot; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t;
    g.fillRect(cx - w - 0.5, y, w * 2 + 1, 1);
  }
  // Main glass layer — lighter blue-grey
  g.fillStyle(0x9ab0c0, 0.55);
  for (let y = top; y <= bot; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t;
    g.fillRect(cx - w, y, w * 2, 1);
  }

  // ── Waist bulge — classic pint-glass shape. Slight brighter
  // band where the glass widens just below the rim. ──
  g.fillStyle(0xbac8d4, 0.45);
  for (let y = top + 3; y <= top + 6; y++) {
    const w = tw + 0.3;
    g.fillRect(cx - w, y, w * 2, 1);
  }

  // ── Golden amber lager — fills the bottom 55%. ──
  const lagerTop = top + Math.floor((bot - top) * 0.55);
  for (let y = lagerTop + 2; y <= bot - 1; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t - 0.8;
    g.fillStyle(0xd48818, 0.92);
    g.fillRect(cx - w, y, w * 2, 1);
  }
  // Lager highlight shimmer
  g.fillStyle(0xffcc66, 0.55);
  for (let y = lagerTop + 2; y <= lagerTop + 5; y++) {
    g.fillRect(cx - 2, y, 1, 1);
  }

  // ── Foam head remnant — thin cream layer just above the lager. ──
  g.fillStyle(0xf5f0e0, 0.9);
  for (let y = lagerTop; y <= lagerTop + 1; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t - 0.8;
    g.fillRect(cx - w, y, w * 2, 1);
  }
  // Foam bubbles
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 2, lagerTop, 0.8);
  g.fillCircle(cx + 1, lagerTop - 0.5, 0.6);
  g.fillCircle(cx + 3, lagerTop + 0.5, 0.5);

  // ── Tennent's red-T branding — the iconic logo. Centred in the
  // upper empty half of the glass. ──
  g.fillStyle(0xdd1111, 1);
  // Horizontal bar of T
  g.fillRect(cx - 3, top + 3, 6, 1.5);
  // Vertical stem of T
  g.fillRect(cx - 0.8, top + 4, 1.6, 4);
  // White T highlight
  g.fillStyle(0xff5a4a, 0.85);
  g.fillRect(cx - 3, top + 3, 6, 0.6);

  // ── Glass reflection — vertical highlight strip on the left
  // edge (light catching the rim). ──
  g.fillStyle(0xffffff, 0.45);
  g.fillRect(cx - tw + 0.5, top + 1, 0.8, (bot - top) - 2);

  // ── Thin glass rim at the top — brightest line. ──
  g.fillStyle(0xeaf0f6, 0.9);
  g.fillRect(cx - tw, top, tw * 2, 1);
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - tw + 1, top, tw * 2 - 2, 0.5);

  // ── Glass base — thicker ring at the bottom (pint-glass foot). ──
  g.fillStyle(0x4a5c68, 0.85);
  g.fillRect(cx - bw - 1, bot - 1, bw * 2 + 2, 2);
  g.fillStyle(0x6a7c88, 0.9);
  g.fillRect(cx - bw, bot - 1, bw * 2, 1);

  // ── Condensation droplets + streak — classic "been sitting out"
  // detail. Right side gets one big streak. ──
  g.fillStyle(0xc8d8e4, 0.55);
  g.fillCircle(cx + 3, top + 5, 0.6);
  g.fillCircle(cx + 4, top + 7, 0.5);
  g.fillCircle(cx - 3, top + 9, 0.5);
  // Running streak down the right side
  g.fillStyle(0x9ab0c0, 0.4);
  g.fillRect(cx + 3, top + 6, 1, 5);

  // ── Lipstick mark on the rim — the mystery. Red smudge with a
  // tell-tale kiss-print ovoid shape. ──
  g.fillStyle(0xcc3860, 0.95);
  g.fillRect(cx + 2, top, 2.5, 0.8);
  g.fillStyle(0xe84878, 0.7);
  g.fillRect(cx + 2.2, top, 2, 0.5);
  // Tiny lip imprint dot
  g.fillStyle(0xaa2a48, 0.7);
  g.fillCircle(cx + 3, top + 1, 0.4);

  g.generateTexture('deco_tennents', s, s);
  g.destroy();
}
