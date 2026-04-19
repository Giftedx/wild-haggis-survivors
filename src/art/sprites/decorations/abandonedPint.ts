/**
 * `deco_tennents` — an abandoned Tennent's pint glass on the moor.
 * Half-drunk lager, foam head remnant, Tennent's red-T branding,
 * condensation streaks, and a lipstick mark on the rim (someone left
 * it here — a mystery).
 */

import Phaser from 'phaser';

export function bakeAbandonedPint(scene: Phaser.Scene): void {
  // 22×22 — Tennent's pint glass, half-drunk, abandoned on the moor
  const s = 22;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  // Shadow on ground
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 9, 10, 3);
  // Glass outline — slightly wider at top (pint glass taper), with bulge
  // Draw glass as a trapezoid — bottom narrower than top
  const top = cy - 9, bot = cy + 8;
  const tw = 6, bw = 4; // half-widths
  // Glass body (grey/transparent look)
  g.fillStyle(0x99aabb, 0.45);
  g.fillTriangle(cx - tw, top, cx + tw, top, cx + bw, bot);
  g.fillTriangle(cx - tw, top, cx - bw, bot, cx + bw, bot);
  // Bulge on glass (classic pint shape) — slight bump at mid-height
  g.fillStyle(0xaabbcc, 0.35);
  g.fillEllipse(cx + tw, top + (bot - top) * 0.55, 4, 6);
  g.fillEllipse(cx - tw, top + (bot - top) * 0.55, 4, 6);
  // Golden amber lager — bottom ~40% of glass
  const lagerTop = top + (bot - top) * 0.6;
  const lagerBw = bw + (tw - bw) * 0.4;  // width at lager level
  g.fillStyle(0xd4880a, 0.85);
  g.fillTriangle(cx - lagerBw, lagerTop, cx + lagerBw, lagerTop, cx + bw, bot);
  g.fillTriangle(cx - lagerBw, lagerTop, cx - bw, bot, cx + bw, bot);
  // Foam head remnant — thin white layer just above lager
  g.fillStyle(0xf5f0e8, 0.75);
  g.fillRect(cx - lagerBw + 0.5, lagerTop - 2, lagerBw * 2 - 1, 2);
  // Foam bubbles
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(cx - 2, lagerTop - 1, 1);
  g.fillCircle(cx + 1, lagerTop - 1.5, 0.8);
  g.fillCircle(cx + 3, lagerTop - 0.8, 0.7);
  // Tennent's branding — big red "T" on the glass
  g.fillStyle(0xdd1111, 0.9);
  // Horizontal bar of T
  g.fillRect(cx - 3, top + 3, 6, 2);
  // Vertical stem of T
  g.fillRect(cx - 1, top + 5, 2, 5);
  // Glass reflection — vertical highlight strip on left edge
  g.fillStyle(0xffffff, 0.3);
  g.fillRect(cx - tw + 1, top + 1, 1, (bot - top) - 2);
  // Condensation droplets (it's been sitting out, getting warm)
  g.fillStyle(0xaabbcc, 0.3);
  g.fillCircle(cx + 3, top + 6, 0.6);
  g.fillCircle(cx + 4, top + 9, 0.5);
  g.fillCircle(cx - 2, bot - 3, 0.5);
  // Condensation streak (one droplet ran down the glass)
  g.fillStyle(0x99aabb, 0.2);
  g.fillRect(cx + 3, top + 6, 1, 4);
  // Lipstick mark on rim (someone left it here — a mystery)
  g.fillStyle(0xcc4466, 0.3);
  g.fillRect(cx + 2, top, 3, 1);
  // Thin glass rim at top
  g.lineStyle(1, 0xbbccdd, 0.7);
  g.lineBetween(cx - tw, top, cx + tw, top);
  g.generateTexture('deco_tennents', s, s);
  g.destroy();
}
