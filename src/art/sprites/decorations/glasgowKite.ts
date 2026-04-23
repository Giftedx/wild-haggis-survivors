/**
 * `deco_glasgow_kite` — windblown plastic carrier bag ("Glesga
 * kite"). Design pivot (v3): the 1.5px handles read as marginal
 * ant-lines at 24px, so thickened both uprights and crossbars to
 * 2px each, added a pronounced bag-rim below the handles, and made
 * the Asda-green stripe 2.5px thick with a clear white "A" mark so
 * the brand anchor lands. Grass blade still pokes through to ground
 * it on the moor.
 */

import * as Phaser from 'phaser';

export function bakeGlasgowKite(scene: Phaser.Scene): void {
  const s = 24;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Shadow on ground. ──
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(cx, cy + 11, 11, 2);

  // ── Bag body — wedge-shape. Back layer (shadow silhouette). ──
  g.fillStyle(0x6a8298, 1);
  g.fillRect(cx - 7, cy - 2, 14, 11);
  g.fillTriangle(cx - 7, cy + 9, cx + 7, cy + 9, cx, cy + 11);
  // Main body — near-white polyethylene with blue tint
  g.fillStyle(0xd8e4f0, 1);
  g.fillRect(cx - 6, cy - 2, 12, 11);
  g.fillTriangle(cx - 6, cy + 8, cx + 6, cy + 8, cx, cy + 10);
  // Wind-billow highlight — bright strip on left (catching light)
  g.fillStyle(0xf4faff, 0.9);
  g.fillRect(cx - 5, cy - 1, 2, 10);
  // Crease shadow down the centre
  g.fillStyle(0x7a92a8, 0.55);
  g.fillRect(cx - 0.5, cy - 1, 1, 11);

  // ── BAG RIM — thick dark line where the handles attach. This is
  // the silhouette tell that it's a bag not a brick. ──
  g.fillStyle(0x4a5e72, 1);
  g.fillRect(cx - 6, cy - 2, 12, 1.5);
  g.fillStyle(0x6a8298, 1);
  g.fillRect(cx - 6, cy - 2, 12, 0.5);

  // ── TWIN HANDLE ARCHES — thickened to 2px uprights + 2px
  // crossbars so they read at 1× zoom. ──
  // Left handle
  g.fillStyle(0x4a5e72, 1);
  g.fillRect(cx - 5, cy - 7, 2, 5);          // left upright
  g.fillRect(cx - 2.5, cy - 7, 2, 5);        // right upright
  g.fillRect(cx - 5, cy - 8, 4.5, 2);        // top crossbar
  // Right handle
  g.fillRect(cx + 0.5, cy - 7, 2, 5);        // left upright
  g.fillRect(cx + 3, cy - 7, 2, 5);          // right upright
  g.fillRect(cx + 0.5, cy - 8, 4.5, 2);      // top crossbar
  // Handle highlight (catches light on the outer edge)
  g.fillStyle(0x7a92a8, 1);
  g.fillRect(cx - 5, cy - 8, 4.5, 0.6);
  g.fillRect(cx + 0.5, cy - 8, 4.5, 0.6);
  g.fillRect(cx - 5, cy - 7, 0.6, 5);
  g.fillRect(cx + 0.5, cy - 7, 0.6, 5);
  // Handle-loop cutouts — dark rectangles so the loop reads
  g.fillStyle(0x0a1a28, 0.85);
  g.fillRect(cx - 3.5, cy - 7, 1.5, 2);
  g.fillRect(cx + 2, cy - 7, 1.5, 2);

  // ── ASDA-GREEN CORPORATE STRIPE — thick bold band across the
  // belly. The brand anchor. ──
  g.fillStyle(0x1e7a1e, 1);
  g.fillRect(cx - 6, cy + 1, 12, 2.5);
  g.fillStyle(0x3a9a3a, 1);
  g.fillRect(cx - 6, cy + 1, 12, 0.8);
  // Yellow "A" mark (Asda logo abstraction) — clearer than before
  g.fillStyle(0xffdd22, 1);
  g.fillRect(cx - 1.5, cy + 1.3, 3, 1.8);
  g.fillStyle(0x1e7a1e, 1);
  g.fillRect(cx - 0.5, cy + 2, 1, 1);

  // ── Crinkle highlights — tiny bright patches for crumpled plastic. ──
  g.fillStyle(0xffffff, 0.45);
  g.fillRect(cx - 5, cy, 1.5, 0.5);
  g.fillRect(cx + 3, cy + 5, 1.5, 0.5);
  g.fillStyle(0x6a8298, 0.4);
  g.fillRect(cx + 3, cy, 1.5, 0.5);
  g.fillRect(cx - 4, cy + 5, 1.5, 0.5);

  // ── Mud scuff at bottom — dragged across the moor. ──
  g.fillStyle(0x4a3820, 0.55);
  g.fillCircle(cx - 2, cy + 8, 1.3);
  g.fillCircle(cx + 3, cy + 7, 1);

  // ── Grass blade poking through — anchors it on the moor. ──
  g.fillStyle(0x2a5a18, 1);
  g.fillRect(cx + 4, cy + 8, 1.2, 3);
  g.fillStyle(0x4a8a28, 1);
  g.fillRect(cx + 4, cy + 8, 0.6, 2);

  g.generateTexture('deco_glasgow_kite', s, s);
  g.destroy();
}
