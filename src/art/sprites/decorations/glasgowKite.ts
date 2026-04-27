/**
 * `deco_glasgow_kite` — windblown plastic carrier bag ("Glesga
 * kite"). v4 lift: visible string trailing off the right handle
 * (the giveaway it's been blown), bigger Asda "A" with a clearer
 * apex notch, deeper rim shadow so the bag opening reads, plus a
 * wee sodium-amber price-sticker corner so the brand cue lands
 * even before the green stripe registers.
 */

import * as Phaser from 'phaser';

export function bakeGlasgowKite(scene: Phaser.Scene): void {
  const s = 24;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Layered ground shadow — deeper near contact. ──
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 11, 14, 2.5);
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(cx, cy + 11, 10, 1.8);

  // ── Bag body — wedge-shape. Back layer (shadow silhouette). ──
  g.fillStyle(0x6a8298, 1);
  g.fillRect(cx - 7, cy - 2, 14, 11);
  g.fillTriangle(cx - 7, cy + 9, cx + 7, cy + 9, cx, cy + 11);
  // Main body — near-white polyethylene with blue tint
  g.fillStyle(0xd8e4f0, 1);
  g.fillRect(cx - 6, cy - 2, 12, 11);
  g.fillTriangle(cx - 6, cy + 8, cx + 6, cy + 8, cx, cy + 10);
  // Wind-billow highlight — bright strip on left
  g.fillStyle(0xf4faff, 0.9);
  g.fillRect(cx - 5, cy - 1, 2, 10);
  // Crease shadow down the centre
  g.fillStyle(0x7a92a8, 0.55);
  g.fillRect(cx - 0.5, cy - 1, 1, 11);

  // ── BAG RIM — deeper dark line + inset lip so the opening reads. ──
  g.fillStyle(0x2a3a4a, 1);
  g.fillRect(cx - 6, cy - 2, 12, 1.5);
  g.fillStyle(0x4a5e72, 1);
  g.fillRect(cx - 6, cy - 1.7, 12, 0.6);
  g.fillStyle(0x6a8298, 1);
  g.fillRect(cx - 6, cy - 2, 12, 0.4);

  // ── TWIN HANDLE ARCHES — 2px uprights + crossbars. ──
  g.fillStyle(0x4a5e72, 1);
  g.fillRect(cx - 5, cy - 7, 2, 5);
  g.fillRect(cx - 2.5, cy - 7, 2, 5);
  g.fillRect(cx - 5, cy - 8, 4.5, 2);
  g.fillRect(cx + 0.5, cy - 7, 2, 5);
  g.fillRect(cx + 3, cy - 7, 2, 5);
  g.fillRect(cx + 0.5, cy - 8, 4.5, 2);
  // Handle highlight
  g.fillStyle(0x7a92a8, 1);
  g.fillRect(cx - 5, cy - 8, 4.5, 0.6);
  g.fillRect(cx + 0.5, cy - 8, 4.5, 0.6);
  g.fillRect(cx - 5, cy - 7, 0.6, 5);
  g.fillRect(cx + 0.5, cy - 7, 0.6, 5);
  // Handle-loop cutouts
  g.fillStyle(0x0a1a28, 0.9);
  g.fillRect(cx - 3.5, cy - 7, 1.5, 2);
  g.fillRect(cx + 2, cy - 7, 1.5, 2);

  // ── TRAILING STRING — thin off-white line snaking down off the
  // right handle, the visual cue this thing has been blown across
  // the moor. ──
  g.fillStyle(0xe0e8f0, 0.95);
  g.fillRect(cx + 5, cy - 8, 0.8, 1);
  g.fillRect(cx + 5.6, cy - 7, 0.8, 1);
  g.fillRect(cx + 6.2, cy - 6, 0.7, 1);
  g.fillRect(cx + 6.6, cy - 5, 0.6, 1);
  g.fillRect(cx + 6.9, cy - 4, 0.6, 1);
  g.fillRect(cx + 7, cy - 3, 0.5, 1);
  // String shadow underneath
  g.fillStyle(0x4a5e72, 0.4);
  g.fillRect(cx + 5, cy - 7.5, 0.8, 0.4);
  g.fillRect(cx + 6.6, cy - 4.5, 0.6, 0.4);

  // ── ASDA-GREEN CORPORATE STRIPE — bold band. ──
  g.fillStyle(0x1e7a1e, 1);
  g.fillRect(cx - 6, cy + 1, 12, 2.5);
  g.fillStyle(0x3a9a3a, 1);
  g.fillRect(cx - 6, cy + 1, 12, 0.8);
  // Yellow "A" — bigger, with apex notch carved out
  g.fillStyle(0xffdd22, 1);
  g.fillRect(cx - 1.8, cy + 1.2, 3.6, 2.1);
  // A-apex notch (dark) — turns rectangle into recognisable letter
  g.fillStyle(0x1e7a1e, 1);
  g.fillTriangle(cx, cy + 1.2, cx - 0.6, cy + 1.7, cx + 0.6, cy + 1.7);
  // A crossbar (dark)
  g.fillStyle(0x1e7a1e, 1);
  g.fillRect(cx - 1.2, cy + 2.4, 2.4, 0.5);

  // ── Crinkle highlights — crumpled plastic. ──
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(cx - 5, cy, 1.5, 0.5);
  g.fillRect(cx + 3, cy + 5, 1.5, 0.5);
  g.fillRect(cx - 3, cy + 6, 1, 0.4);
  g.fillStyle(0x6a8298, 0.45);
  g.fillRect(cx + 3, cy, 1.5, 0.5);
  g.fillRect(cx - 4, cy + 5, 1.5, 0.5);

  // ── PRICE STICKER — wee sodium-amber corner sticker, urban-cue. ──
  g.fillStyle(0xff9030, 1);
  g.fillRect(cx + 2.5, cy + 4, 3, 1.6);
  g.fillStyle(0xffd070, 0.8);
  g.fillRect(cx + 2.5, cy + 4, 3, 0.5);
  // Sticker text suggestion (tiny dark stripes)
  g.fillStyle(0x4a2810, 0.85);
  g.fillRect(cx + 3, cy + 4.7, 2, 0.3);
  g.fillRect(cx + 3, cy + 5.2, 1.5, 0.3);

  // ── Mud scuff at bottom. ──
  g.fillStyle(0x4a3820, 0.6);
  g.fillCircle(cx - 2, cy + 8, 1.4);
  g.fillCircle(cx + 3, cy + 7, 1);
  g.fillStyle(0x2a1810, 0.5);
  g.fillCircle(cx - 2, cy + 8, 0.7);

  // ── Grass blade poking through. ──
  g.fillStyle(0x2a5a18, 1);
  g.fillRect(cx + 4, cy + 8, 1.2, 3);
  g.fillStyle(0x4a8a28, 1);
  g.fillRect(cx + 4, cy + 8, 0.6, 2);

  g.generateTexture('deco_glasgow_kite', s, s);
  g.destroy();
}
