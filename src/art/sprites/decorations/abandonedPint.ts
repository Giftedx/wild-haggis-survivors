/**
 * `deco_tennents` — abandoned Tennent's pint glass on the moor. v4
 * lift: frothier head with bubble texture (the foam silhouette is the
 * pub-cue), a deeper layered contact shadow with wet-glass smear, and
 * a clearer label bar (the red Tennent's wordmark band) so the brand
 * reads even on dark moor floor.
 */

import * as Phaser from 'phaser';

export function bakeAbandonedPint(scene: Phaser.Scene): void {
  const s = 24;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  const top = cy - 10, bot = cy + 9;
  const tw = 5;
  const bw = 4;

  // ── Layered contact shadow + wet-glass smear. ──
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx + 1, bot + 3, 16, 3.5);
  g.fillStyle(0x000000, 0.36);
  g.fillEllipse(cx, bot + 2, 12, 2.5);
  // Wet smear — slight blue-grey wash extending right (spilled lager)
  g.fillStyle(0x6a7080, 0.35);
  g.fillEllipse(cx + 4, bot + 3, 10, 1.5);
  g.fillStyle(0xa48838, 0.3);
  g.fillEllipse(cx + 4, bot + 3, 7, 1);

  // ── Glass body — tapered silhouette. ──
  g.fillStyle(0x3a4850, 1);
  for (let y = top; y <= bot; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t;
    g.fillRect(cx - w - 0.5, y, w * 2 + 1, 1);
  }
  g.fillStyle(0x9ab0c0, 0.6);
  for (let y = top; y <= bot; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t;
    g.fillRect(cx - w, y, w * 2, 1);
  }

  // ── BIG AMBER LAGER. ──
  const lagerTop = cy + 1;
  for (let y = lagerTop; y <= bot - 1; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t - 0.8;
    g.fillStyle(0xd48818, 1);
    g.fillRect(cx - w, y, w * 2, 1);
  }
  g.fillStyle(0xffcc66, 0.55);
  g.fillRect(cx - 3, lagerTop + 1, 1, 4);
  // Tiny rising bubbles in the lager — wee carbonation specks
  g.fillStyle(0xffe090, 0.7);
  g.fillCircle(cx - 1, lagerTop + 3, 0.4);
  g.fillCircle(cx + 1.5, lagerTop + 5, 0.35);
  g.fillCircle(cx - 0.5, lagerTop + 6, 0.3);

  // ── FOAM HEAD — frothy with bubble texture. The pub silhouette. ──
  // Base foam band
  g.fillStyle(0xfaf4e8, 1);
  for (let y = cy - 1; y <= cy + 1; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t - 0.5;
    g.fillRect(cx - w, y, w * 2, 1);
  }
  // Frothy crown — multiple bumps across the top of the foam
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 3, cy - 1, 1.4);
  g.fillCircle(cx - 1, cy - 1.8, 1.6);
  g.fillCircle(cx + 1.5, cy - 1.5, 1.5);
  g.fillCircle(cx + 3.5, cy - 1, 1.3);
  // Foam shadow side (right-lower) for depth
  g.fillStyle(0xe8d8b8, 0.6);
  g.fillRect(cx + 1, cy + 0.5, 3, 0.5);
  // Bubble pops — bright dots
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 2, cy - 2.2, 0.4);
  g.fillCircle(cx + 0.5, cy - 2.5, 0.5);
  g.fillCircle(cx + 2.5, cy - 2, 0.4);
  // Hollow bubble rings — shows it's foam not just paint
  g.fillStyle(0xc8b888, 0.7);
  g.fillCircle(cx - 1.5, cy - 0.5, 0.5);
  g.fillStyle(0xfaf4e8, 1);
  g.fillCircle(cx - 1.5, cy - 0.5, 0.25);
  g.fillStyle(0xc8b888, 0.7);
  g.fillCircle(cx + 2, cy - 0.3, 0.45);
  g.fillStyle(0xfaf4e8, 1);
  g.fillCircle(cx + 2, cy - 0.3, 0.22);

  // ── BIG RED T — Tennent's wordmark anchor. ──
  g.fillStyle(0x7a0808, 1);
  g.fillRect(cx - 4, top + 2, 8, 2.5);
  g.fillRect(cx - 1, top + 2, 2, 7);
  g.fillStyle(0xdd1818, 1);
  g.fillRect(cx - 4, top + 2, 8, 2);
  g.fillRect(cx - 1, top + 2, 2, 6.5);
  g.fillStyle(0xff5a4a, 1);
  g.fillRect(cx - 4, top + 2, 8, 0.6);
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx - 3.5, top + 2.2, 7, 0.3);

  // ── LABEL BAR — wee horizontal red wordmark band beneath the T,
  // reads as the lager-name strip on a real Tennent's pint. ──
  g.fillStyle(0xb01010, 1);
  g.fillRect(cx - 3.5, top + 9.5, 7, 1.4);
  g.fillStyle(0xff3a3a, 0.85);
  g.fillRect(cx - 3.5, top + 9.5, 7, 0.4);
  // Tiny white wordmark dashes
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 3, top + 10.1, 1, 0.5);
  g.fillRect(cx - 1.5, top + 10.1, 1, 0.5);
  g.fillRect(cx + 0, top + 10.1, 1, 0.5);
  g.fillRect(cx + 1.5, top + 10.1, 1, 0.5);

  // ── Bright glass rim. ──
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - tw, top, tw * 2, 1);
  g.fillStyle(0xe0e8f0, 0.9);
  g.fillRect(cx - tw, top - 0.5, tw * 2, 0.5);

  // ── Vertical glass reflection. ──
  g.fillStyle(0xffffff, 0.55);
  g.fillRect(cx - tw + 0.5, top + 1, 0.8, 17);

  // ── Chunky glass base. ──
  g.fillStyle(0x3a4850, 1);
  g.fillRect(cx - bw - 1.5, bot, bw * 2 + 3, 2);
  g.fillStyle(0x6a7c88, 1);
  g.fillRect(cx - bw - 1, bot, bw * 2 + 2, 1);
  g.fillStyle(0x8a9ca8, 1);
  g.fillRect(cx - bw, bot + 0.2, bw * 2, 0.4);

  g.generateTexture('deco_tennents', s, s);
  g.destroy();
}
