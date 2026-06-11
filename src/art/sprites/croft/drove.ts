/**
 * H1 M3 T19 — Drove silhouettes drawer.
 *
 * One haggis silhouette per unlocked variant, arranged along the window
 * sill inside the croft. Variants already unlocked render in their
 * appearance palette (the "drove" the player has amassed); variants
 * still locked show a dim placeholder slot behind the sill.
 *
 * Silhouette is deliberately stylised — a compact three-bumps blob so
 * each silhouette fits within ~28 px of sill, the variant palette does
 * the heavy-lifting to distinguish them at a glance.
 */

import * as Phaser from 'phaser';
import { VARIANTS, type VariantDef, type VariantKey } from '../../../data/variants';

export interface DroveSlot {
  x: number;
  y: number;
  w: number;
  h: number;
  variant: VariantDef;
  unlocked: boolean;
  selected: boolean;
}

/** Sill slot rect — wide enough for a small haggis silhouette. */
const SLOT_W = 28;
const SLOT_GAP = 4;

/**
 * Compute per-slot rects across the drove region. We always render a
 * slot per variant so locked positions keep their place in the line-up
 * (the sill reads as a herd the player is gradually gathering).
 */
export function computeDroveSlots(
  region: { x: number; y: number; w: number; h: number },
  unlockedVariants: readonly VariantKey[],
  selectedVariant: VariantKey,
): DroveSlot[] {
  const unlockedSet = new Set(unlockedVariants);
  const count = VARIANTS.length;
  const gap = region.w < 260 ? 2 : SLOT_GAP;
  const slotW = Math.min(SLOT_W, (region.w - (count - 1) * gap) / count);
  const totalWidth = count * slotW + (count - 1) * gap;
  const startX = region.x + Math.max(0, (region.w - totalWidth) / 2);
  const y = region.y + region.h - slotW * 0.6; // sit on the sill, feet at base
  return VARIANTS.map((variant, idx) => ({
    x: startX + idx * (slotW + gap),
    y,
    w: slotW,
    h: Math.min(region.h, slotW),
    variant,
    unlocked: unlockedSet.has(variant.key),
    selected: selectedVariant === variant.key,
  }));
}

/**
 * Paint the window sill bar underneath the silhouettes. A thin warm
 * plank that anchors them visually rather than floating in the
 * window frame.
 */
function drawSill(
  g: Phaser.GameObjects.Graphics,
  region: { x: number; y: number; w: number; h: number },
): void {
  const sillY = region.y + region.h - 2;
  g.fillStyle(0x0a0604, 1);
  g.fillRect(region.x, sillY - 1, region.w, 5);
  g.fillStyle(0x4a2a18, 1);
  g.fillRect(region.x + 1, sillY, region.w - 2, 3);
  g.fillStyle(0x8a5a38, 0.8);
  g.fillRect(region.x + 1, sillY, region.w - 2, 1);
}

/**
 * Draw a single haggis silhouette for the given slot. Locked slots get
 * a near-black dim outline; unlocked use the variant palette.
 */
export function drawDroveSilhouette(
  g: Phaser.GameObjects.Graphics,
  slot: DroveSlot,
): void {
  const { x, y, w, variant, unlocked, selected } = slot;
  const palette = variant.appearance.palette;
  const cx = x + w / 2;
  const bodyY = y;

  if (!unlocked) {
    // Dim silhouette with a soft question-mark feel.
    g.fillStyle(0x2a2a32, 0.85);
    g.fillEllipse(cx, bodyY, w - 4, w * 0.7);
    g.fillStyle(0x5a5a68, 0.4);
    g.fillEllipse(cx, bodyY - 2, w * 0.4, w * 0.2);
    // Lock glint ("?" on the body).
    g.fillStyle(0x8a8a96, 0.9);
    g.fillRect(cx - 0.5, bodyY - 2, 1, 3);
    g.fillRect(cx - 0.5, bodyY + 3, 1, 1);
    return;
  }

  // Outline.
  g.fillStyle(palette.outline, 1);
  g.fillEllipse(cx, bodyY, w - 2, w * 0.8);
  // Body (dark tone).
  g.fillStyle(palette.bodyDark, 1);
  g.fillEllipse(cx, bodyY, w - 4, w * 0.65);
  // Body highlight.
  g.fillStyle(palette.bodyLight, 1);
  g.fillEllipse(cx - 1, bodyY - 2, w * 0.55, w * 0.3);
  // Fur scruff across the back.
  g.fillStyle(palette.fur, 0.85);
  g.fillEllipse(cx, bodyY - 3.5, w * 0.45, w * 0.18);
  // Snout dot (bottom-right).
  g.fillStyle(palette.snout, 1);
  g.fillCircle(cx + w * 0.25, bodyY + 1.5, 1.6);
  // Legs — two stubs.
  g.fillStyle(palette.outline, 1);
  g.fillRect(cx - w * 0.2, bodyY + w * 0.25, 2, 3);
  g.fillRect(cx + w * 0.1, bodyY + w * 0.25, 2, 3);
  // Eye dot.
  g.fillStyle(palette.outline, 1);
  g.fillRect(cx - 2, bodyY - 1, 1.2, 1.2);

  // Accent ring for the selected variant — whisky gold outline.
  if (selected) {
    g.lineStyle(1.4, palette.accent, 1);
    g.strokeEllipse(cx, bodyY, w, w * 0.9);
  }
}

/**
 * Render the full drove — sill + per-variant silhouettes — for the
 * given window region. CroftScene calls this each create().
 */
export function drawDrove(
  g: Phaser.GameObjects.Graphics,
  region: { x: number; y: number; w: number; h: number },
  unlockedVariants: readonly VariantKey[],
  selectedVariant: VariantKey,
): DroveSlot[] {
  drawSill(g, region);
  const slots = computeDroveSlots(region, unlockedVariants, selectedVariant);
  for (const slot of slots) drawDroveSilhouette(g, slot);
  return slots;
}
