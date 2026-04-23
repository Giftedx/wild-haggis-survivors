/**
 * `deco_thistle` — Scotland's national flower. Design pivot: old
 * sprite had a smooth purple sphere + 10 tiny bract triangles that
 * read as "generic flower" at 24px; the calyx globe wasn't thistle-
 * specific. New pitch — make the CALYX GLOBE the signature: bigger,
 * heavily armoured with spiky bracts poking outward like a morning-
 * star (thistle's literal threat), topped with a bristly purple
 * floret crown (not a smooth ball), serrated leaves flanking the
 * stem. This is the shape on every Scotland jersey.
 */

import * as Phaser from 'phaser';

export function bakeThistle(scene: Phaser.Scene): void {
  const s = 24;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 3;

  // ── Ground shadow. ──
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 8, 14, 4);

  // ── Stem — thick, ribbed, darker than before for value contrast. ──
  g.fillStyle(0x0a1808, 1);
  g.fillRect(cx - 1.2, cy - 1, 2.4, 10);
  g.fillStyle(0x2a4a18, 1);
  g.fillRect(cx - 0.5, cy - 1, 1.2, 10);
  // Stem spurs — tiny spike-nodes
  g.fillStyle(0x0a1808, 1);
  g.fillRect(cx - 2.5, cy + 3, 1.2, 1);
  g.fillRect(cx + 1.5, cy + 5, 1.2, 1);

  // ── Left serrated leaf — bigger than before, with prominent
  // spike-tips along the edge (thistle leaves are armoured too). ──
  g.fillStyle(0x1a3810, 1);
  g.fillTriangle(cx - 8, cy + 3, cx - 1, cy + 0, cx - 1, cy + 7);
  g.fillStyle(0x3a6a18, 1);
  g.fillTriangle(cx - 7, cy + 3, cx - 1, cy + 1, cx - 1, cy + 6);
  // Leaf spikes poking out along the edge
  g.fillStyle(0x0a1808, 1);
  g.fillTriangle(cx - 7, cy + 1, cx - 8, cy + 3, cx - 6, cy + 3);
  g.fillTriangle(cx - 6, cy + 5, cx - 8, cy + 6, cx - 5, cy + 6);
  // Leaf vein
  g.fillStyle(0x6a9828, 0.85);
  g.fillRect(cx - 5, cy + 3, 4, 0.5);

  // ── Right serrated leaf — mirror. ──
  g.fillStyle(0x1a3810, 1);
  g.fillTriangle(cx + 8, cy + 4, cx + 1, cy + 0, cx + 1, cy + 7);
  g.fillStyle(0x3a6a18, 1);
  g.fillTriangle(cx + 7, cy + 4, cx + 1, cy + 1, cx + 1, cy + 6);
  g.fillStyle(0x0a1808, 1);
  g.fillTriangle(cx + 7, cy + 2, cx + 8, cy + 4, cx + 5, cy + 4);
  g.fillTriangle(cx + 6, cy + 6, cx + 8, cy + 7, cx + 5, cy + 7);
  g.fillStyle(0x6a9828, 0.85);
  g.fillRect(cx + 1, cy + 4, 4, 0.5);

  // ── CALYX GLOBE — bigger, greener, with SIGNATURE radiating
  // spike-bracts jutting outward like a mace head. This is the
  // unmistakable thistle anchor. ──
  // Base dark globe
  g.fillStyle(0x0a2810, 1);
  g.fillCircle(cx, cy - 2, 5);
  // Mid-green globe
  g.fillStyle(0x2a5818, 1);
  g.fillCircle(cx, cy - 2, 4.2);
  // Lighter green highlight on top
  g.fillStyle(0x4a7828, 1);
  g.fillCircle(cx - 0.8, cy - 3, 3);
  // Globe ribbing — vertical strokes for the armoured quilted look
  g.fillStyle(0x0a2810, 0.7);
  g.fillRect(cx - 3, cy - 3, 0.5, 4);
  g.fillRect(cx - 1, cy - 3, 0.5, 4);
  g.fillRect(cx + 1, cy - 3, 0.5, 4);
  g.fillRect(cx + 3, cy - 3, 0.5, 4);

  // ── RADIATING SPIKE-BRACTS — 8 bold outward spikes, not 10 tiny.
  // Thicker triangles that read even at 1× zoom. ──
  g.fillStyle(0x0a2810, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const tx = cx + Math.cos(a) * 8;
    const ty = cy - 2 + Math.sin(a) * 8;
    const pLx = cx + Math.cos(a - 0.25) * 4.5;
    const pLy = cy - 2 + Math.sin(a - 0.25) * 4.5;
    const pRx = cx + Math.cos(a + 0.25) * 4.5;
    const pRy = cy - 2 + Math.sin(a + 0.25) * 4.5;
    g.fillTriangle(pLx, pLy, tx, ty, pRx, pRy);
  }
  // Highlight on upper half of spikes (catches light)
  g.fillStyle(0x4a7828, 0.8);
  for (let i = 0; i < 4; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const tx = cx + Math.cos(a) * 7;
    const ty = cy - 2 + Math.sin(a) * 7;
    g.fillCircle(tx, ty, 0.5);
  }

  // ── PURPLE FLORET CROWN — bristly, not a smooth dome. Fine purple
  // lines radiating upward like fresh-bloom floss. ──
  // Dark purple base
  g.fillStyle(0x3a0e5a, 1);
  g.fillEllipse(cx, cy - 6, 6, 3);
  g.fillStyle(0x6a28a8, 1);
  g.fillEllipse(cx, cy - 6.5, 5, 2.5);
  // Bright purple core
  g.fillStyle(0x9a48d8, 1);
  g.fillEllipse(cx, cy - 7, 3.5, 1.8);
  // Bristly florets — upward radial lines
  g.fillStyle(0xaa5aee, 1);
  for (let i = 0; i < 9; i++) {
    const ax = cx - 4 + i;
    const h = 2 + (i % 3);
    g.fillRect(ax, cy - 7 - h, 0.5, h);
  }
  // Brighter tips
  g.fillStyle(0xdd88ff, 1);
  g.fillRect(cx - 3, cy - 10, 0.5, 1);
  g.fillRect(cx, cy - 11, 0.5, 1);
  g.fillRect(cx + 3, cy - 10, 0.5, 1);
  g.fillStyle(0xffccff, 0.9);
  g.fillRect(cx, cy - 11.5, 0.4, 0.5);

  // ── Pollen specks floating above the crown. ──
  g.fillStyle(0xffdd88, 0.5);
  g.fillRect(cx + 2, cy - 12, 0.6, 0.6);
  g.fillRect(cx - 2, cy - 13, 0.6, 0.6);

  g.generateTexture('deco_thistle', s, s);
  g.destroy();
}
