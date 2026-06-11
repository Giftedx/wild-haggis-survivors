/**
 * `reliquary` — DESIGN_IDEAS § 1 M15. A sacred ember held aloft.
 * Design pivot: old altar had the bowl and plinth merging visually
 * so the whole thing read as "brown lump with glow". New pitch —
 * make the silhouette a proper ORNATE GOLD RELIQUARY BOX (the
 * medieval reliquary shape: arched-lid casket on clawed feet) with
 * a glass window in the front showing the glowing ember inside.
 * Gold + amber palette so it can't be mistaken for a chest or coin.
 */

import * as Phaser from 'phaser';

export function bakeReliquary(scene: Phaser.Scene): void {
  const s = 28;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── BASE SHADOW — wider, layered drop shadow under the
  // reliquary so it grounds firmly on whatever surface. ──
  g.fillStyle(0x000000, 0.5);
  g.fillEllipse(cx, cy + 10, 22, 3.5);
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(cx, cy + 10.5, 26, 4);

  // ── Outer glow halo — warm amber light pouring out of the relic. ──
  g.fillStyle(0xffa040, 0.22);
  g.fillEllipse(cx, cy - 1, 24, 20);
  g.fillStyle(0xffc060, 0.16);
  g.fillEllipse(cx, cy - 1, 28, 24);

  // ── Clawed feet — four small gold blocks at the bottom corners. ──
  g.fillStyle(0x4a3010, 1);
  g.fillRect(cx - 8, cy + 7, 2.5, 2.5);
  g.fillRect(cx + 5.5, cy + 7, 2.5, 2.5);
  g.fillStyle(0x8a6028, 1);
  g.fillRect(cx - 8, cy + 7, 2.5, 1);
  g.fillRect(cx + 5.5, cy + 7, 2.5, 1);

  // ── Main casket body — rectangular gold box with THICKER FRAME
  // (deeper outline + double-band trim so the shrine feels carved
  // rather than painted-on). ──
  g.fillStyle(0x1a0a04, 1);
  g.fillRect(cx - 10, cy - 3, 20, 12);
  g.fillStyle(0x4a3010, 1);
  g.fillRect(cx - 9, cy - 2, 18, 10);
  g.fillStyle(0x8a6028, 1);
  g.fillRect(cx - 8, cy - 1, 16, 8);
  // Inner trim band — bronze double-line.
  g.fillStyle(0x6a4018, 1);
  g.fillRect(cx - 8, cy - 1, 16, 0.5);
  g.fillRect(cx - 8, cy + 7, 16, 0.5);
  g.fillStyle(0xba8840, 1);
  g.fillRect(cx - 7, cy, 14, 1.5);
  // Gold sheen on upper edge
  g.fillStyle(0xfadc6a, 0.9);
  g.fillRect(cx - 8, cy - 1, 16, 0.5);

  // ── CARVED CORNER GLYPHS — two small Celtic-style triskele dots
  // at the lower corners of the casket face. Tiny, decorative,
  // sells the "shrine box" identity. ──
  g.fillStyle(0x2a1a08, 1);
  g.fillCircle(cx - 6, cy + 5, 1);
  g.fillCircle(cx + 6, cy + 5, 1);
  g.fillStyle(0xfadc6a, 0.95);
  g.fillCircle(cx - 6, cy + 5, 0.5);
  g.fillCircle(cx + 6, cy + 5, 0.5);
  g.fillStyle(0xfadc6a, 0.7);
  // Triskele tick-marks at each corner glyph (3 dots).
  g.fillRect(cx - 6.5, cy + 4.0, 0.4, 0.4);
  g.fillRect(cx - 5.5, cy + 4.0, 0.4, 0.4);
  g.fillRect(cx - 6.0, cy + 5.8, 0.4, 0.4);
  g.fillRect(cx + 5.5, cy + 4.0, 0.4, 0.4);
  g.fillRect(cx + 6.5, cy + 4.0, 0.4, 0.4);
  g.fillRect(cx + 6.0, cy + 5.8, 0.4, 0.4);

  // ── Glass window in the front — round amber porthole showing the
  // ember burning inside. THE visual anchor for "relic, not chest". ──
  // Window frame (bronze)
  g.fillStyle(0x2a1a08, 1);
  g.fillCircle(cx, cy + 3, 4);
  g.fillStyle(0x6a4018, 1);
  g.fillCircle(cx, cy + 3, 3.5);
  // Glass interior (dark)
  g.fillStyle(0x1a0804, 1);
  g.fillCircle(cx, cy + 3, 3);
  // EMBER — bright amber-gold core
  g.fillStyle(0xff6a20, 1);
  g.fillCircle(cx, cy + 3, 2.5);
  g.fillStyle(0xffb060, 1);
  g.fillCircle(cx, cy + 3, 1.8);
  g.fillStyle(0xfff0c0, 1);
  g.fillCircle(cx - 0.3, cy + 2.7, 1);
  // GEM SHIMMER POP — bright pinprick + crossed sparkle rays so the
  // central ember reads "magical" rather than "lit candle".
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 0.6, cy + 2.3, 0.5);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(cx - 1.4, cy + 2.5, 1.8, 0.3);
  g.fillRect(cx - 0.5, cy + 1.6, 0.3, 1.8);
  g.fillStyle(0xfff8d0, 0.8);
  g.fillCircle(cx - 0.6, cy + 2.3, 1.1);

  // ── ARCHED CASKET LID — the giveaway shape. Semicircular dome
  // topping the rectangular box. ──
  g.fillStyle(0x2a1a08, 1);
  g.fillEllipse(cx, cy - 3, 20, 6);
  g.fillStyle(0x8a6028, 1);
  g.fillEllipse(cx, cy - 3, 18, 5);
  g.fillStyle(0xba8840, 1);
  g.fillEllipse(cx, cy - 4, 14, 3);
  // Lid top highlight
  g.fillStyle(0xfadc6a, 0.9);
  g.fillEllipse(cx, cy - 4.5, 10, 1.5);

  // ── Cross-shaped finial on top of the lid — the SACRED mark. ──
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 0.6, cy - 9, 1.2, 4);
  g.fillRect(cx - 2, cy - 7, 4, 1.2);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 0.3, cy - 9, 0.6, 4);
  g.fillStyle(0xffea90, 0.9);
  g.fillCircle(cx, cy - 9, 0.7);

  // ── Decorative studs along the lid seam — small gold bumps. ──
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(cx - 6, cy - 1, 0.5);
  g.fillCircle(cx - 3, cy - 1, 0.5);
  g.fillCircle(cx + 3, cy - 1, 0.5);
  g.fillCircle(cx + 6, cy - 1, 0.5);

  // ── Rising ember wisps above the lid — faint amber motes that
  // sell "alive" / "sacred". ──
  g.fillStyle(0xffcc80, 0.6);
  g.fillCircle(cx - 1, cy - 11, 0.8);
  g.fillStyle(0xffcc80, 0.35);
  g.fillCircle(cx + 1.5, cy - 13, 0.7);
  g.fillStyle(0xffcc80, 0.2);
  g.fillCircle(cx, cy - 15, 0.5);

  g.generateTexture('reliquary', s, s);
  g.destroy();
}
