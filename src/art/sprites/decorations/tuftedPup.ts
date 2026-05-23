/**
 * `tufted_pup` — the Tufted variant's companion pup.
 *
 * A wee haggis pup: small rounded body, four stubby legs, two tiny eyes,
 * and the namesake cream tuft on top. Visually smaller and rounder than
 * the player haggis — clearly a young companion, not a threat. The tuft
 * reads as the variant's accent colour at gameplay scale.
 */

import * as Phaser from 'phaser';

const OUTLINE    = 0x1a1208;
const BODY_DARK  = 0x2d1f0d;
const BODY_MID   = 0x4a3420;
const BODY_LIGHT = 0x7a5c3d;
const FUR_HI     = 0x9a7855;
const SNOUT      = 0xb89070;
const TUFT_DARK  = 0xc8b890;
const TUFT_LIGHT = 0xe8dcc8;
const EYE        = 0x0c0804;
const EYE_HI     = 0xffffff;
const NOSE       = 0xd47070;

export function bakeTuftedPup(scene: Phaser.Scene): void {
  const s = 20;
  const g = scene.add.graphics();
  const cx = s / 2;
  const cy = s / 2 + 1;

  // Soft ground shadow.
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 7, 14, 3);

  // Outline body.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx, cy + 1, 13, 9);

  // Main body.
  g.fillStyle(BODY_DARK, 1);
  g.fillEllipse(cx, cy + 1, 12, 8);
  g.fillStyle(BODY_MID, 1);
  g.fillEllipse(cx, cy, 10, 7);
  g.fillStyle(BODY_LIGHT, 1);
  g.fillEllipse(cx - 1, cy - 0.5, 7, 4.5);
  g.fillStyle(FUR_HI, 0.7);
  g.fillEllipse(cx - 1.5, cy - 1, 3.5, 2);

  // Snout — rounded front nub.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx + 4.5, cy + 1.5, 5, 3.5);
  g.fillStyle(SNOUT, 1);
  g.fillEllipse(cx + 4.5, cy + 1.4, 4, 3);
  g.fillStyle(BODY_LIGHT, 0.6);
  g.fillEllipse(cx + 3.8, cy + 0.8, 1.8, 1.2);

  // Nose.
  g.fillStyle(NOSE, 1);
  g.fillCircle(cx + 6, cy + 1.2, 0.9);

  // Eyes.
  g.fillStyle(EYE, 1);
  g.fillCircle(cx + 3, cy - 0.8, 1.1);
  g.fillStyle(EYE_HI, 1);
  g.fillCircle(cx + 2.7, cy - 1.1, 0.4);

  // Legs — four stubby nubs below body.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx - 3.5, cy + 5.5, 3, 2.5);
  g.fillEllipse(cx - 0.5, cy + 5.8, 3, 2.5);
  g.fillEllipse(cx + 2, cy + 5.5, 3, 2.5);
  g.fillEllipse(cx + 4.5, cy + 5, 3, 2.5);
  g.fillStyle(BODY_DARK, 1);
  g.fillEllipse(cx - 3.5, cy + 5.2, 2.2, 1.8);
  g.fillEllipse(cx - 0.5, cy + 5.5, 2.2, 1.8);
  g.fillEllipse(cx + 2, cy + 5.2, 2.2, 1.8);
  g.fillEllipse(cx + 4.5, cy + 4.7, 2.2, 1.8);

  // Tuft — the namesake cream topknot.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx - 1.5, cy - 4.5, 5, 3.5);
  g.fillStyle(TUFT_DARK, 1);
  g.fillEllipse(cx - 1.5, cy - 4.5, 4.2, 2.8);
  g.fillStyle(TUFT_LIGHT, 1);
  g.fillEllipse(cx - 2, cy - 5, 2.8, 1.8);
  g.fillStyle(0xffffff, 0.5);
  g.fillEllipse(cx - 2.2, cy - 5.2, 1.4, 0.8);

  g.generateTexture('tufted_pup', s, s);
  g.destroy();
}
