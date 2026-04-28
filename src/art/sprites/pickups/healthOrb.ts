/**
 * `health_orb` — a wee glass bottle of Irn-Bru with a healing cross
 * label. Squat enough to sit inside the 22×22 canvas while keeping
 * the iconic neck + cap silhouette of "the other national drink".
 * Cross label preserves universal heal readability; bottle silhouette
 * does the Glesga warmth lift the audit asked for.
 *
 * Bru orange anchored to the Hearth tonal band. Glass refraction +
 * rising fizz columns + golden cap give it the craft-bar lift over
 * the previous flat sphere. Runtime breathe/pulse handled where the
 * orb is spawned — this sprite only needs to look perfect frozen.
 */

import * as Phaser from 'phaser';

export function bakeHealthOrb(scene: Phaser.Scene): void {
  // 22×22 — squat Irn-Bru bottle. Center 11,11.
  const s = 22;
  const g = scene.add.graphics();
  const cx = 11, cy = 11;

  // ── Warm orange halo (tells you "heal" before you read the cross)
  g.fillStyle(0xff6a14, 0.10);
  g.fillCircle(cx, cy, 11);
  g.fillStyle(0xff8a2a, 0.18);
  g.fillCircle(cx, cy, 9);

  // ── Ground contact shadow
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(cx, cy + 9, 12, 2);

  // ── Bottle silhouette (dark outline). Stubby teardrop: round
  // shoulders fall to a flat base, narrow neck rises to a flat cap.
  // Ranges:
  //   cap     : cy-10 to cy-8
  //   neck    : cy-8  to cy-5
  //   shoulder: cy-5  to cy-2
  //   body    : cy-2  to cy+8
  g.fillStyle(0x2a1004, 1);
  // Body (rounded rect)
  g.fillRoundedRect(cx - 6, cy - 2, 12, 10, 3);
  // Shoulders (smaller rect blends into body)
  g.fillRoundedRect(cx - 5, cy - 5, 10, 4, 2);
  // Neck (narrow vertical strip)
  g.fillRect(cx - 2, cy - 8, 4, 4);
  // Cap (flat top)
  g.fillRect(cx - 3, cy - 10, 6, 3);

  // ── Glass body — deep amber-orange (the Bru itself)
  g.fillStyle(0x9a3a08, 1);
  g.fillRoundedRect(cx - 5, cy - 1, 10, 8, 2);
  g.fillRoundedRect(cx - 4, cy - 4, 8, 3, 1);
  // Neck inner
  g.fillRect(cx - 1.5, cy - 7, 3, 3);

  // ── Bright Bru orange (main body colour)
  g.fillStyle(0xee6a18, 1);
  g.fillRoundedRect(cx - 4.5, cy - 0.5, 9, 7, 2);
  g.fillRect(cx - 4, cy - 3.5, 8, 2);

  // ── Upper light hemisphere (light from above-left)
  g.fillStyle(0xff9b3e, 1);
  g.fillEllipse(cx - 1, cy + 1, 7, 4);
  g.fillStyle(0xffb868, 0.85);
  g.fillEllipse(cx - 2, cy, 4, 2);

  // ── Rising fizz columns — three columns of tiny bubbles climbing
  // through the liquid. Sells "carbonated drink" not "fruit juice".
  g.fillStyle(0xffe09a, 0.95);
  g.fillCircle(cx - 3, cy + 4, 0.7);
  g.fillCircle(cx - 3, cy + 1, 0.5);
  g.fillCircle(cx - 3, cy - 2, 0.4);
  g.fillCircle(cx, cy + 5, 0.6);
  g.fillCircle(cx, cy + 2, 0.8);
  g.fillCircle(cx, cy - 1, 0.5);
  g.fillCircle(cx + 3, cy + 6, 0.5);
  g.fillCircle(cx + 3, cy + 3, 0.7);
  g.fillCircle(cx + 3, cy, 0.4);
  // A couple of fizz dots in the bright highlight
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 3, cy + 4, 0.3);
  g.fillCircle(cx, cy + 2, 0.3);

  // ── Cross label — white band across the middle, red Highland
  // Pharmacy cross on top. This is what makes it READ as health.
  g.fillStyle(0xfff0d4, 0.95);
  g.fillRect(cx - 5, cy + 1, 10, 3);
  g.fillStyle(0xc8c0a8, 0.5);
  g.fillRect(cx - 5, cy + 3.6, 10, 0.4);
  // Cross — saturated red
  g.fillStyle(0xc41a1a, 1);
  g.fillRect(cx - 2, cy + 1.5, 4, 2);
  g.fillRect(cx - 0.5, cy + 0.5, 1.5, 3);
  // Cross inner highlight
  g.fillStyle(0xff5a5a, 0.85);
  g.fillRect(cx - 1.5, cy + 1.8, 3, 0.5);
  g.fillRect(cx - 0.3, cy + 1, 0.6, 2);

  // ── Bottle cap — gold/brass with screw-thread ridges
  g.fillStyle(0xc88a14, 1);
  g.fillRect(cx - 2.5, cy - 9.5, 5, 2.5);
  g.fillStyle(0xe8b048, 1);
  g.fillRect(cx - 2.5, cy - 9.5, 5, 1);
  // Crimped edge (tiny dark lines that suggest a metal cap)
  g.fillStyle(0x6e4408, 1);
  g.fillRect(cx - 2.5, cy - 7, 5, 0.5);
  g.fillRect(cx - 2.5, cy - 8, 0.5, 1);
  g.fillRect(cx + 2, cy - 8, 0.5, 1);
  g.fillRect(cx, cy - 8, 0.4, 1);
  // Cap top specular
  g.fillStyle(0xffffff, 0.55);
  g.fillRect(cx - 2, cy - 9.3, 2, 0.5);

  // ── Neck collar (the lip just below the cap)
  g.fillStyle(0xb04a10, 1);
  g.fillRect(cx - 2.2, cy - 7, 4.4, 0.6);

  // ── Glass refraction highlight — bright vertical strip on the
  // bottle's left side (the "shine" that sells glass)
  g.fillStyle(0xffffff, 0.55);
  g.fillRect(cx - 4, cy - 0.5, 0.8, 5);
  g.fillStyle(0xffffff, 0.3);
  g.fillRect(cx - 3.2, cy + 0.5, 0.5, 4);

  // ── Tiny secondary specular on the neck
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(cx - 1, cy - 6.5, 0.5, 1.5);

  // ── Underside shadow inside the bottle (sells liquid weight)
  g.fillStyle(0x6a2a06, 0.55);
  g.fillEllipse(cx, cy + 6, 7, 2);

  g.generateTexture('health_orb', s, s);
  g.destroy();
}
