/**
 * `deco_tunnock` — Tunnock's Teacake. v4 lift: clearer wrapper crinkle
 * (radiating fold-lines on the dome, not just dark dots), stronger
 * layered contact shadow, brand-care detail (a wee gold "T" stamp on
 * the foil and a paper-doily edge under the chocolate base — the kind
 * of careful brand-adjacent cue Boyd Tunnock would nod at).
 */

import * as Phaser from 'phaser';

export function bakeTunnock(scene: Phaser.Scene): void {
  const s = 24;
  const g = scene.add.graphics();
  const cx = 12, cy = 13;
  const R = 9;

  // ── Layered ground shadow. ──
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(cx, cy + 9, 20, 4);
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(cx, cy + 8, 16, 3);

  // ── PAPER DOILY EDGE — pale scalloped ring under the chocolate
  // base. Tunnock's teacakes ship in foil but this is the brand-care
  // serving cue — like the doily on a tea tray. ──
  g.fillStyle(0xf0e8d0, 0.95);
  g.fillEllipse(cx, cy + 5, 20, 4);
  // Scallop nibble
  g.fillStyle(0x3a2210, 1);
  g.fillCircle(cx - 8, cy + 5, 0.8);
  g.fillCircle(cx - 4, cy + 5.5, 0.7);
  g.fillCircle(cx + 1, cy + 5.7, 0.7);
  g.fillCircle(cx + 6, cy + 5.5, 0.8);
  g.fillCircle(cx + 9, cy + 5, 0.7);

  // ── Flat chocolate base. ──
  g.fillStyle(0x3a2210, 1);
  g.fillEllipse(cx, cy + 4, 18, 5);
  g.fillStyle(0x4a3220, 1);
  g.fillEllipse(cx, cy + 3, 16, 4);
  g.fillStyle(0x6a4a30, 0.7);
  g.fillEllipse(cx - 1, cy + 2.5, 10, 1.5);

  // ── Foil dome — pixel-row stripes. ──
  for (let dy = -R; dy <= 0; dy++) {
    const halfW = Math.floor(Math.sqrt(R * R - dy * dy));
    const y = cy + dy;
    for (let dx = -halfW; dx <= halfW; dx++) {
      const x = cx + dx;
      const angle = Math.atan2(dy, dx);
      const stripeIndex = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 10);
      const isRed = stripeIndex % 2 === 0;

      if (isRed) {
        const shade = dx < 0 ? 0xdd1122 : 0xbb0e1c;
        g.fillStyle(shade, 1);
      } else {
        const shade = dx < -2 ? 0xdddddd : dx < 2 ? 0xcccccc : 0xaaaaaa;
        g.fillStyle(shade, 1);
      }
      g.fillRect(x, y, 1, 1);
    }
  }

  // ── Foil dome outline. ──
  g.lineStyle(1, 0x555555, 0.85);
  g.beginPath();
  g.arc(cx, cy, R, Math.PI, 0, false);
  g.strokePath();

  // ── CRINKLE FOLD-LINES — radiating thin dark lines from the apex.
  // This is the wrapper detail the audit asked for. ──
  g.fillStyle(0x000000, 0.32);
  g.fillRect(cx - 4, cy - 6, 0.5, 4);
  g.fillRect(cx - 1, cy - 8, 0.5, 5);
  g.fillRect(cx + 2, cy - 7, 0.5, 4);
  g.fillRect(cx + 4, cy - 5, 0.5, 3);
  g.fillRect(cx - 6, cy - 3, 0.5, 2);
  g.fillRect(cx + 5, cy - 2, 0.5, 2);
  // Bright crinkle counter-highlights — light catching the fold ridges
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(cx - 3, cy - 6, 0.4, 3);
  g.fillRect(cx, cy - 8, 0.4, 4);
  g.fillRect(cx + 3, cy - 6, 0.4, 3);

  // ── Specular highlights (kept). ──
  g.fillStyle(0xffffff, 0.6);
  g.fillEllipse(cx - 3, cy - 6, 5, 3);
  g.fillStyle(0xffffff, 0.35);
  g.fillEllipse(cx - 2, cy - 5, 3, 2);
  g.fillStyle(0xffffff, 0.2);
  g.fillEllipse(cx + 3, cy - 2, 3, 2);

  // ── GOLD "T" STAMP — wee Tunnock's brand cue on the foil cap. The
  // brand-adjacent care detail. ──
  g.fillStyle(0xc8a040, 1);
  g.fillRect(cx - 1.5, cy - 4, 3, 0.6);
  g.fillRect(cx - 0.3, cy - 4, 0.6, 2.5);
  g.fillStyle(0xffe080, 0.85);
  g.fillRect(cx - 1.5, cy - 4, 3, 0.3);

  g.generateTexture('deco_tunnock', s, s);
  g.destroy();
}
