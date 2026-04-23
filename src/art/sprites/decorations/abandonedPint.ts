/**
 * `deco_tennents` — abandoned Tennent's pint glass on the moor.
 * Design pivot (v3): prior version fought itself — rim + foam
 * wisps + condensation droplets + lipstick kiss + branding pinstripe
 * all competed at 24px and the silhouette blurred into a tan blob.
 * New pitch: strip detail clutter. BIG BOLD RED T occupies the top
 * half of the glass (40% area). Solid amber lager fills the bottom
 * half. Foam head is a clean white horizontal cap between them.
 * Chunky glass base anchors the shape. No lipstick, no droplets,
 * no pinstripes — Tennent's red IS the branding.
 */

import * as Phaser from 'phaser';

export function bakeAbandonedPint(scene: Phaser.Scene): void {
  const s = 24;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  const top = cy - 10, bot = cy + 9;
  const tw = 5;   // top half-width
  const bw = 4;   // bottom half-width (slight taper)

  // ── Ground shadow. ──
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(cx, bot + 2, 12, 3);

  // ── Glass body — simple tapered silhouette, two layers. ──
  // Dark outline
  g.fillStyle(0x3a4850, 1);
  for (let y = top; y <= bot; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t;
    g.fillRect(cx - w - 0.5, y, w * 2 + 1, 1);
  }
  // Main glass — cool blue-grey tint
  g.fillStyle(0x9ab0c0, 0.6);
  for (let y = top; y <= bot; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t;
    g.fillRect(cx - w, y, w * 2, 1);
  }

  // ── BIG AMBER LAGER — solid fill, bottom 50%. No shimmer lines,
  // no gradients — just a bold amber block behind the glass tint. ──
  const lagerTop = cy + 1;
  for (let y = lagerTop; y <= bot - 1; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t - 0.8;
    g.fillStyle(0xd48818, 1);
    g.fillRect(cx - w, y, w * 2, 1);
  }
  // Single bright amber highlight on left side — gives depth without clutter
  g.fillStyle(0xffcc66, 0.55);
  g.fillRect(cx - 3, lagerTop + 1, 1, 4);

  // ── Foam head — solid white horizontal cap above the lager. No
  // wispy bubbles — just a clean 2px thick band. ──
  g.fillStyle(0xfaf4e8, 1);
  for (let y = cy; y <= cy + 1; y++) {
    const t = (y - top) / (bot - top);
    const w = tw + (bw - tw) * t - 0.5;
    g.fillRect(cx - w, y, w * 2, 1);
  }
  // Foam crown bump — one small peak at centre for texture
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx, cy - 0.5, 1.2);
  g.fillCircle(cx - 2, cy, 0.8);
  g.fillCircle(cx + 2, cy, 0.8);

  // ── BIG RED T — dominates the upper empty half of the glass. ──
  // Shadow layer
  g.fillStyle(0x7a0808, 1);
  g.fillRect(cx - 4, top + 2, 8, 2.5);
  g.fillRect(cx - 1, top + 2, 2, 7);
  // Main red
  g.fillStyle(0xdd1818, 1);
  g.fillRect(cx - 4, top + 2, 8, 2);
  g.fillRect(cx - 1, top + 2, 2, 6.5);
  // Bright highlight on top bar
  g.fillStyle(0xff5a4a, 1);
  g.fillRect(cx - 4, top + 2, 8, 0.6);
  // White saltire-style accent strip on the cross bar
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx - 3.5, top + 2.2, 7, 0.3);

  // ── Bright glass rim at the top — brightest line on the sprite. ──
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - tw, top, tw * 2, 1);
  g.fillStyle(0xe0e8f0, 0.9);
  g.fillRect(cx - tw, top - 0.5, tw * 2, 0.5);

  // ── Vertical glass reflection — single crisp highlight strip. ──
  g.fillStyle(0xffffff, 0.55);
  g.fillRect(cx - tw + 0.5, top + 1, 0.8, 17);

  // ── Chunky glass base — thick ring at the bottom anchors the
  // silhouette as "pint glass" not "jar". ──
  g.fillStyle(0x3a4850, 1);
  g.fillRect(cx - bw - 1.5, bot, bw * 2 + 3, 2);
  g.fillStyle(0x6a7c88, 1);
  g.fillRect(cx - bw - 1, bot, bw * 2 + 2, 1);
  g.fillStyle(0x8a9ca8, 1);
  g.fillRect(cx - bw, bot + 0.2, bw * 2, 0.4);

  g.generateTexture('deco_tennents', s, s);
  g.destroy();
}
