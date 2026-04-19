/**
 * `haggis_hunter` — obsessive rural man with a BIG haggis-net on a
 * pole raised diagonally over the shoulder. Design pivot: the net
 * dominates the silhouette — hoop + mesh are the unmistakable anchor.
 * Body is simple and bold (tweed flat cap + Barbour wax jacket +
 * green wellies). Dropped the sub-pixel noise (Swarovski binoculars,
 * thermos, crow's feet) — they weren't reading at 48×48 and were
 * diluting the silhouette.
 */

import Phaser from 'phaser';

export function bakeHaggisHunter(scene: Phaser.Scene): void {
  const s = 48;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Ground shadow — subtle. ──
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(cx, cy + 20, 18, 4);

  // ── Green wellies — classic Hunter boots, brown mud scuff. ──
  g.fillStyle(0x0a2a0a, 1);
  g.fillRect(cx - 7, cy + 11, 5, 9);
  g.fillRect(cx + 2, cy + 11, 5, 9);
  g.fillStyle(0x1a4a1a, 1);
  g.fillRect(cx - 7, cy + 11, 5, 8);
  g.fillRect(cx + 2, cy + 11, 5, 8);
  g.fillStyle(0x2a5a22, 1);
  g.fillRect(cx - 6, cy + 12, 3, 6);
  g.fillRect(cx + 3, cy + 12, 3, 6);
  // Mud scuff at the toe — been out on the moor
  g.fillStyle(0x3a2a10, 0.8);
  g.fillRect(cx - 7, cy + 18, 5, 2);
  g.fillRect(cx + 2, cy + 18, 5, 2);
  // Buckle strap at the top
  g.fillStyle(0x554422, 1);
  g.fillRect(cx - 7, cy + 11, 5, 1);
  g.fillRect(cx + 2, cy + 11, 5, 1);

  // ── Barbour wax jacket — dark olive green, bold block shape.
  // Collar popped high. ──
  g.fillStyle(0x102010, 1);
  g.fillRect(cx - 11, cy - 5, 22, 17);
  g.fillStyle(0x223a1a, 1);
  g.fillRect(cx - 10, cy - 4, 20, 15);
  // Wax sheen — lighter swath down the left side
  g.fillStyle(0x3a5a2a, 0.6);
  g.fillRect(cx - 9, cy - 3, 5, 10);
  // Corduroy collar — brown, bold
  g.fillStyle(0x4a3318, 1);
  g.fillRect(cx - 8, cy - 6, 16, 3);
  g.fillStyle(0x6a4a24, 1);
  g.fillRect(cx - 7, cy - 6, 14, 2);
  // Centre zip line — visible from top to belt
  g.fillStyle(0x0a1a08, 1);
  g.fillRect(cx - 0.5, cy - 3, 1, 12);
  // Two pocket flaps — big chest pockets, the Barbour tell
  g.fillStyle(0x102010, 1);
  g.fillRect(cx - 9, cy + 4, 7, 5);
  g.fillRect(cx + 2, cy + 4, 7, 5);
  g.fillStyle(0x2a4a1a, 1);
  g.fillRect(cx - 9, cy + 4, 7, 1);
  g.fillRect(cx + 2, cy + 4, 7, 1);
  // Brass popper buttons on the pocket flaps
  g.fillStyle(0xaa7722, 1);
  g.fillRect(cx - 6, cy + 4.5, 1, 1);
  g.fillRect(cx + 5, cy + 4.5, 1, 1);

  // ── Head — weathered pink, sits clear of the coat. ──
  g.fillStyle(0x6a3a22, 1);
  g.fillCircle(cx, cy - 11, 7);
  g.fillStyle(0xd8a478, 1);
  g.fillCircle(cx, cy - 11, 6);
  // Wind-burned cheek blush — bold enough to read
  g.fillStyle(0xc86a4a, 0.7);
  g.fillCircle(cx - 3, cy - 10, 2);
  g.fillCircle(cx + 3, cy - 10, 2);
  // Narrow determined eyes — two dark horizontal slits
  g.fillStyle(0x1a1010, 1);
  g.fillRect(cx - 3.5, cy - 12, 2, 1);
  g.fillRect(cx + 1.5, cy - 12, 2, 1);
  // Furrowed brow line above the eyes
  g.fillStyle(0x4a2a10, 1);
  g.fillRect(cx - 4, cy - 13, 3, 0.6);
  g.fillRect(cx + 1, cy - 13, 3, 0.6);
  // Set jaw — thin dark line mouth
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx - 2, cy - 8, 4, 0.8);

  // ── Harris Tweed flat cap — dominant block with a peak. Two
  // scattered fleck dots are all we keep from the weave detail —
  // everything else was sub-pixel noise. ──
  g.fillStyle(0x2a2414, 1);
  g.fillRect(cx - 9, cy - 19, 18, 6);
  g.fillStyle(0x4a3d22, 1);
  g.fillRect(cx - 8, cy - 18, 16, 4);
  // Light fleck (two bold dots, readable at zoom)
  g.fillStyle(0x6a5a34, 1);
  g.fillRect(cx - 4, cy - 17, 1, 1);
  g.fillRect(cx + 3, cy - 16, 1, 1);
  // Peak — stiff, forward-pointing
  g.fillStyle(0x2a2414, 1);
  g.fillRect(cx - 11, cy - 14, 13, 2);
  g.fillStyle(0x3a3320, 1);
  g.fillRect(cx - 10, cy - 14, 11, 1);

  // ── Haggis-net on a pole — BIG diagonal rig raised over the
  // shoulder, pole runs from waist up to the top-right corner. The
  // hoop dominates the sprite's right side. ──
  // Wooden pole — diagonal, brown
  g.fillStyle(0x3a2410, 1);
  // Thick pole drawn as stacked rects stepping up-right
  for (let i = 0; i < 18; i++) {
    g.fillRect(cx + 2 + i * 0.7, cy + 4 - i * 1.1, 2, 2);
  }
  g.fillStyle(0x6a4418, 1);
  for (let i = 0; i < 18; i++) {
    g.fillRect(cx + 2 + i * 0.7, cy + 4 - i * 1.1, 1, 1);
  }

  // ── Net hoop — big ring at the top-right, ring is bold 2-pixel
  // wood so it reads clearly. ──
  g.lineStyle(2.5, 0x3a2410, 1);
  g.strokeCircle(cx + 15, cy - 16, 7);
  g.lineStyle(1.2, 0x6a4418, 1);
  g.strokeCircle(cx + 15, cy - 16, 6.5);

  // ── Net mesh — crosshatch INSIDE the hoop so the silhouette
  // reads "net" not "wheel". Diagonal lattice, pale cream thread. ──
  g.lineStyle(0.8, 0xc8b894, 0.9);
  // Diagonal lines one way
  g.lineBetween(cx + 10, cy - 18, cx + 20, cy - 14);
  g.lineBetween(cx + 9, cy - 16, cx + 20, cy - 11);
  g.lineBetween(cx + 10, cy - 13, cx + 18, cy - 10);
  // Diagonal lines the other way
  g.lineBetween(cx + 10, cy - 14, cx + 20, cy - 18);
  g.lineBetween(cx + 9, cy - 16, cx + 20, cy - 21);
  g.lineBetween(cx + 12, cy - 10, cx + 20, cy - 14);
  // Net bag droop — subtle darker curve at the bottom of the hoop
  g.fillStyle(0x8a7a58, 0.4);
  g.fillEllipse(cx + 15, cy - 13, 12, 3);

  g.generateTexture('haggis_hunter', s, s);
  g.destroy();
}
