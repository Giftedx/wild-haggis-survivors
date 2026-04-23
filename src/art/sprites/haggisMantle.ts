/**
 * Heather Mantle — tier-gated overlay drawn on the haggis's back as
 * kills accumulate (W71 Phase 2, DESIGN_IDEAS §M7 visual half).
 *
 * Universal shape, per-variant palette tint. Tier 1 draws a collar
 * over the neck; tier 2 extends the collar into a short cape down the
 * back. Canvas matches HAGGIS_SPRITE_SIZE so the overlay sprite aligns
 * pixel-perfect with the body texture at scale 1.
 */

import type { VariantDef } from '../../data/variants';
import type { MantleTier } from '../../animation/mantleTier';
import { HAGGIS_SPRITE_SIZE } from '../../animation/frameDrawers/haggisBodyDraw';

export function drawMantleTier(
  g: Phaser.GameObjects.Graphics,
  variant: VariantDef,
  tier: MantleTier,
): void {
  if (tier === 0) return;

  const s = HAGGIS_SPRITE_SIZE;
  const cx = s / 2;
  const cy = s / 2 - 2;
  const { palette } = variant.appearance;

  // ── Collar (present at tier 1 and tier 2) ──
  g.fillStyle(palette.outline, 1);
  g.fillEllipse(cx - 6, cy - 9, 22, 8);
  g.fillStyle(palette.bodyDark, 0.95);
  g.fillEllipse(cx - 6, cy - 9, 20, 6);
  g.fillStyle(palette.fur, 0.75);
  g.fillEllipse(cx - 6, cy - 10, 16, 4);

  if (tier === 1) return;

  // ── Tier 2: cape — extends from the collar down the back ──
  g.fillStyle(palette.outline, 1);
  g.fillEllipse(cx - 8, cy - 4, 28, 16);
  g.fillStyle(palette.bodyDark, 0.9);
  g.fillEllipse(cx - 8, cy - 4, 24, 12);
  g.fillStyle(palette.fur, 0.6);
  g.fillEllipse(cx - 8, cy - 3, 18, 8);

  // Subtle edge highlight along the cape hem.
  g.lineStyle(1, palette.fur, 0.5);
  g.strokeEllipse(cx - 8, cy - 4, 24, 12);
}
