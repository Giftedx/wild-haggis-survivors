/**
 * `midge` — lone highland midge. Design pivot: old sprite drew
 * the midge FILLING the 32px canvas so it read as "small flying
 * beetle" at gameplay scale, not "tiny biting annoyance". New
 * pitch: the midge is DELIBERATELY TINY inside the canvas, with a
 * BIG MOTION BLUR HALO around it so "tiny thing moving fast" is
 * the silhouette, and a PROBOSCIS POINTING DOWN FORWARD as the
 * unmistakable biting-midge pose. Red compound eyes dominate the
 * tiny body so the visual anchor survives at 1×.
 */

import Phaser from 'phaser';

export function bakeMidge(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Motion-blur halo — big soft circle so the sprite reads as
  // "tiny thing in a cloud of its own wingbeats". ──
  g.fillStyle(0x3a3348, 0.25);
  g.fillCircle(cx, cy, 13);
  g.fillStyle(0x5a5068, 0.18);
  g.fillCircle(cx, cy, 10);

  // ── TRANSLUCENT WINGS — big blur ovals behind the body showing
  // the wingbeat smear. Much bigger than before relative to body. ──
  g.fillStyle(0xeaf0f8, 0.35);
  g.fillEllipse(cx - 5, cy - 2, 10, 4);
  g.fillEllipse(cx + 5, cy - 2, 10, 4);
  g.fillStyle(0xffffff, 0.55);
  g.fillEllipse(cx - 4, cy - 2, 7, 3);
  g.fillEllipse(cx + 4, cy - 2, 7, 3);
  // Wing leading-edge flicker lines
  g.fillStyle(0xaabbcc, 0.7);
  g.fillRect(cx - 8, cy - 2.5, 6, 0.4);
  g.fillRect(cx + 2, cy - 2.5, 6, 0.4);

  // ── TINY MIDGE BODY — deliberately small, dark. Reads as a
  // pinprick of menace in the centre of the motion cloud. ──
  g.fillStyle(0x0a0a14, 1);
  g.fillEllipse(cx, cy + 1, 6, 4);
  g.fillStyle(0x2a1a20, 1);
  g.fillEllipse(cx, cy, 5, 3);
  // Abdomen segmented stripes
  g.fillStyle(0x0a0a14, 0.85);
  g.fillRect(cx - 2, cy + 0.5, 4, 0.4);
  g.fillRect(cx - 2, cy + 1.5, 4, 0.4);

  // ── LARGE RED COMPOUND EYES — dominating the tiny head. This is
  // the signature "I'm biting you" face. ──
  g.fillStyle(0xaa0020, 1);
  g.fillCircle(cx - 1.5, cy - 1.5, 1.2);
  g.fillCircle(cx + 1.5, cy - 1.5, 1.2);
  g.fillStyle(0xff4466, 1);
  g.fillCircle(cx - 1.5, cy - 1.5, 0.7);
  g.fillCircle(cx + 1.5, cy - 1.5, 0.7);
  // Eye highlight pinpricks
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(cx - 1.8, cy - 1.8, 0.3);
  g.fillCircle(cx + 1.2, cy - 1.8, 0.3);

  // ── PROBOSCIS — sharp needle pointing DOWN FORWARD, the
  // unmistakable biting-midge tell. ──
  g.fillStyle(0x0a0006, 1);
  g.fillRect(cx - 0.4, cy + 1, 0.8, 3);
  g.fillTriangle(cx - 0.6, cy + 4, cx + 0.6, cy + 4, cx, cy + 5.5);

  // ── Six tiny legs — visible thin strokes angling away from the
  // body. Kept short so they don't become leg-forest. ──
  g.fillStyle(0x0a0006, 1);
  // Left side
  g.fillRect(cx - 4, cy + 1, 2, 0.5);
  g.fillRect(cx - 3, cy + 2, 1.5, 0.5);
  g.fillRect(cx - 2, cy + 2.5, 1, 0.5);
  // Right side
  g.fillRect(cx + 2, cy + 1, 2, 0.5);
  g.fillRect(cx + 1.5, cy + 2, 1.5, 0.5);
  g.fillRect(cx + 1, cy + 2.5, 1, 0.5);

  // ── Bright spark at the proboscis tip — "bite incoming" punctuation. ──
  g.fillStyle(0xff5555, 0.8);
  g.fillCircle(cx, cy + 6, 0.8);
  g.fillStyle(0xffaaaa, 1);
  g.fillCircle(cx, cy + 6, 0.4);

  g.generateTexture('midge', s, s);
  g.destroy();
}
