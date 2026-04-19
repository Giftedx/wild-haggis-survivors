/**
 * Shared haggis body drawer.
 *
 * Original source: `BootScene.createHaggisVariantTexture` +
 * `drawHaggisVariantAccent`. Extracted here so:
 *  - BootScene's per-variant texture bake keeps producing the
 *    identical sprite it always did (legacy `haggis_classic` etc.).
 *  - The new per-state atlas (`haggis_classic_idle_0` etc.) can
 *    draw the same full-detail body with subtle per-frame offsets
 *    for breathing / walking / etc.
 *
 * This is the load-bearing craft-bar module — every animated haggis
 * frame renders through here. Changes to shape / palette / layering
 * propagate everywhere that matters.
 */

import type {
  VariantDef,
  HaggisPalette,
  HaggisAccentStyle,
} from '../../data/variants';

/**
 * Per-frame offsets applied on top of the base pose. All default to 0 —
 * callers (BootScene legacy texture, haggisFrames per-state atlas) pass
 * the shape that drives their animation beat.
 */
export interface HaggisBodyFrame {
  /** Body y offset (px). Positive = sinks (breathing in). */
  readonly breathY?: number;
  /** Extra y offset for LEFT leg pair (px). Positive = lifts (foot back). */
  readonly leftLegY?: number;
  /** Extra y offset for RIGHT leg pair (px). */
  readonly rightLegY?: number;
  /** Whole-body x offset (px). Used for hurt-flinch and attack-lean. */
  readonly bodyX?: number;
}

/** Canonical sprite size — 56×56. Matches existing variant textures. */
export const HAGGIS_SPRITE_SIZE = 56;

/**
 * Draw a full handcrafted haggis body for `variant` into `g`. Pure
 * function over Graphics — no scene ownership, no texture generation.
 * Caller decides whether to generateTexture afterwards.
 */
export function drawHaggisBody(
  g: Phaser.GameObjects.Graphics,
  variant: VariantDef,
  frame: HaggisBodyFrame = {},
): void {
  const s = HAGGIS_SPRITE_SIZE;
  const baseCx = s / 2;
  const baseCy = s / 2 - 2;
  const { palette } = variant.appearance;
  const accent = variant.appearance.accentStyle;

  const breathY = frame.breathY ?? 0;
  const leftLegExtra = frame.leftLegY ?? 0;
  const rightLegExtra = frame.rightLegY ?? 0;

  // ── Per-variant body shape modifiers ──
  let tiltY = 0;
  let bodyW = 44;
  let bodyH = 34;
  let humpX = 0, humpY = 0, humpW = 0, humpH = 0;

  if (accent === 'none') {
    tiltY = 6;
  } else if (accent === 'racing_band') {
    tiltY = 10;
  } else if (accent === 'iron_belly') {
    bodyW = 54;
    bodyH = 28;
  } else if (accent === 'forager') {
    humpX = baseCx + 8; humpY = baseCy - 8; humpW = 16; humpH = 11;
  }

  const cx = baseCx + (frame.bodyX ?? 0);
  const cy = baseCy + breathY;
  const leftDy = -Math.floor(tiltY / 2);
  const rightDy = Math.ceil(tiltY / 2);

  // ── Wee tail nub at the rear ──
  g.fillStyle(palette.bodyDark, 1);
  g.fillCircle(cx - 20, cy + 4 + leftDy, 4);
  g.fillStyle(palette.fur, 0.7);
  g.fillCircle(cx - 20, cy + 3 + leftDy, 2.5);

  // ── Dark outline body silhouette ──
  g.fillStyle(palette.outline, 1);
  g.fillEllipse(cx, cy + 2, bodyW, bodyH);

  // ── Furry body — layered ellipses for depth ──
  g.fillStyle(palette.bodyDark, 1);
  g.fillEllipse(cx, cy + 2, bodyW - 4, bodyH - 4);
  g.fillStyle(palette.bodyLight, 1);
  g.fillEllipse(cx, cy, bodyW - 10, bodyH - 8);

  // ── Forager hump ──
  if (humpW > 0) {
    g.fillStyle(palette.bodyDark, 1);
    g.fillEllipse(humpX, humpY + breathY, humpW + 2, humpH + 2);
    g.fillStyle(palette.bodyLight, 0.8);
    g.fillEllipse(humpX, humpY + breathY, humpW, humpH);
  }

  // ── Fur texture — individual shaggy tufts ──
  g.fillStyle(palette.fur, 1);
  g.fillEllipse(cx - 5, cy - 4, 16, 11);
  g.fillEllipse(cx + 6, cy - 2, 10, 7);
  g.fillStyle(palette.fur, 0.7);
  g.fillCircle(cx - 12, cy + 2, 3);
  g.fillCircle(cx + 12, cy + 1, 3);
  g.fillCircle(cx - 8, cy + 6, 2.5);
  g.fillCircle(cx + 8, cy + 5, 2.5);
  // Darker belly shadow
  g.fillStyle(palette.bodyDark, 0.4);
  g.fillEllipse(cx, cy + 8, bodyW - 16, 8);

  // ── Legs — left pair SHORTER than right (THE drift!) ──
  // Left legs stubby; right legs longer. Walking offsets add on top.
  const legBase = accent === 'iron_belly' ? cy + 9 : cy + 11;
  g.fillStyle(palette.outline, 1);
  g.fillRect(cx - 13, legBase + leftDy + leftLegExtra, 5, 9);
  g.fillRect(cx - 5,  legBase + leftDy + leftLegExtra, 5, 9);
  g.fillRect(cx + 4,  legBase + rightDy + rightLegExtra, 5, 13);
  g.fillRect(cx + 12, legBase + rightDy + rightLegExtra, 5, 13);
  // Furry leg tops
  g.fillStyle(palette.bodyDark, 0.6);
  g.fillCircle(cx - 11, legBase + 1 + leftDy + leftLegExtra, 3);
  g.fillCircle(cx - 3,  legBase + 1 + leftDy + leftLegExtra, 3);
  g.fillCircle(cx + 6,  legBase + 1 + rightDy + rightLegExtra, 3);
  g.fillCircle(cx + 14, legBase + 1 + rightDy + rightLegExtra, 3);
  // Hooves
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 14, legBase + 8 + leftDy + leftLegExtra, 6, 2);
  g.fillRect(cx - 6,  legBase + 8 + leftDy + leftLegExtra, 6, 2);
  g.fillRect(cx + 3,  legBase + 12 + rightDy + rightLegExtra, 6, 2);
  g.fillRect(cx + 11, legBase + 12 + rightDy + rightLegExtra, 6, 2);
  // Hoof split detail
  g.fillStyle(palette.outline, 0.5);
  g.fillRect(cx - 11, legBase + 8 + leftDy + leftLegExtra, 1, 2);
  g.fillRect(cx - 3,  legBase + 8 + leftDy + leftLegExtra, 1, 2);
  g.fillRect(cx + 6,  legBase + 12 + rightDy + rightLegExtra, 1, 2);
  g.fillRect(cx + 14, legBase + 12 + rightDy + rightLegExtra, 1, 2);

  // ── Eye whites ──
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 8, cy - 4, 6);
  g.fillCircle(cx + 8, cy - 4, 6);
  g.lineStyle(0.8, palette.outline, 0.5);
  g.strokeCircle(cx - 8, cy - 4, 6);
  g.strokeCircle(cx + 8, cy - 4, 6);
  // Pupils
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 6, cy - 3, 3);
  g.fillCircle(cx + 10, cy - 3, 3);
  g.fillStyle(0x332211, 1);
  g.fillCircle(cx - 6, cy - 3, 2);
  g.fillCircle(cx + 10, cy - 3, 2);
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 6, cy - 3, 1.2);
  g.fillCircle(cx + 10, cy - 3, 1.2);
  // Eye glints
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 7, cy - 5, 1.5);
  g.fillCircle(cx + 9, cy - 5, 1.5);
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(cx - 5, cy - 2, 0.7);
  g.fillCircle(cx + 11, cy - 2, 0.7);

  // ── Brow tufts ──
  g.fillStyle(palette.fur, 0.9);
  g.fillEllipse(cx - 8, cy - 10, 8, 3);
  g.fillEllipse(cx + 8, cy - 10, 8, 3);

  // ── Snout ──
  g.fillStyle(palette.snout, 1);
  g.fillCircle(cx + 1, cy + 4, 4.5);
  g.fillStyle(palette.snout, 0.7);
  g.fillCircle(cx, cy + 3, 3);
  g.fillStyle(palette.outline, 1);
  g.fillCircle(cx + 2, cy + 3, 2);
  g.fillStyle(0x0a0a0a, 1);
  g.fillCircle(cx + 2, cy + 3, 1.2);
  g.fillStyle(0xffffff, 0.3);
  g.fillCircle(cx + 1.5, cy + 2.5, 0.6);
  g.fillStyle(palette.outline, 0.8);
  g.fillCircle(cx + 1, cy + 3.5, 0.5);
  g.fillCircle(cx + 3, cy + 3.5, 0.5);

  // ── Tiny content smile ──
  g.fillStyle(palette.outline, 0.5);
  g.fillRect(cx - 1, cy + 7, 4, 1);

  drawHaggisAccent(g, accent, cx, cy, palette);
}

function drawHaggisAccent(
  g: Phaser.GameObjects.Graphics,
  accentStyle: HaggisAccentStyle,
  cx: number,
  cy: number,
  palette: HaggisPalette,
): void {
  switch (accentStyle) {
    case 'racing_band':
      g.fillStyle(palette.accent, 1);
      g.fillRect(cx - 17, cy - 9, 34, 3);
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(cx - 14, cy - 8, 9, 1);
      g.fillRect(cx + 3, cy - 8, 9, 1);
      g.fillStyle(palette.accent, 0.6);
      g.fillRect(cx - 17, cy - 5, 34, 1);
      g.fillStyle(palette.accent, 0.3);
      g.fillRect(cx - 22, cy - 10, 4, 1);
      g.fillRect(cx - 21, cy - 8, 3, 1);
      g.fillStyle(palette.accent, 0.2);
      g.fillRect(cx - 20, cy - 12, 3, 1);
      break;
    case 'iron_belly':
      g.fillStyle(0x2a2e35, 1);
      g.fillEllipse(cx + 2, cy + 6, 18, 10);
      g.fillStyle(0x3a3e45, 0.7);
      g.fillEllipse(cx + 1, cy + 5, 14, 8);
      g.fillStyle(palette.accent, 1);
      g.fillRect(cx - 4, cy + 2, 2, 8);
      g.fillRect(cx + 2, cy + 2, 2, 8);
      g.fillStyle(palette.accent, 0.8);
      g.fillCircle(cx - 6, cy + 5, 0.8);
      g.fillCircle(cx + 6, cy + 5, 0.8);
      g.fillCircle(cx, cy + 8, 0.8);
      g.fillStyle(0xffffff, 0.12);
      g.fillEllipse(cx, cy + 4, 12, 5);
      break;
    case 'forager':
      g.fillStyle(palette.accent, 1);
      g.fillCircle(cx - 10, cy + 2, 3);
      g.fillCircle(cx + 8, cy + 5, 2.5);
      g.fillStyle(0xb7f08f, 0.8);
      g.fillCircle(cx - 9, cy + 1, 1.5);
      g.fillCircle(cx + 9, cy + 4, 1.2);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(cx - 9, cy, 0.5);
      g.fillCircle(cx + 9, cy + 3, 0.4);
      g.fillStyle(0xddddbb, 0.7);
      g.fillRect(cx - 10, cy + 3, 1, 2);
      g.fillRect(cx + 8, cy + 6, 1, 2);
      g.fillStyle(0x55aa33, 0.6);
      g.fillTriangle(cx + 14, cy - 2, cx + 16, cy + 1, cx + 12, cy + 1);
      break;
    case 'surefoot':
      g.fillStyle(palette.accent, 1);
      g.fillRect(cx - 6, cy - 12, 12, 3);
      g.fillStyle(0xffffff, 0.7);
      g.fillRect(cx - 1, cy - 13, 2, 5);
      g.fillStyle(palette.accent, 0.8);
      g.fillTriangle(cx - 7, cy - 12, cx - 6, cy - 12, cx - 8, cy - 10);
      g.fillTriangle(cx + 7, cy - 12, cx + 6, cy - 12, cx + 8, cy - 10);
      g.fillStyle(0xffffff, 0.2);
      g.fillCircle(cx + 6, cy + 23, 2);
      g.fillCircle(cx + 14, cy + 23, 2);
      break;
    case 'wee_ghostie':
      g.lineStyle(2, palette.accent, 0.35);
      g.beginPath();
      g.arc(cx, cy, 17, 0, Math.PI * 2);
      g.strokePath();
      g.lineStyle(1.5, 0xffffff, 0.5);
      g.beginPath();
      g.arc(cx, cy - 2, 14, 0, Math.PI * 2);
      g.strokePath();
      g.fillStyle(palette.accent, 0.45);
      g.fillCircle(cx - 14, cy - 6, 1.8);
      g.fillCircle(cx + 13, cy - 8, 1.6);
      g.fillCircle(cx + 6, cy - 14, 1.4);
      g.fillStyle(palette.accent, 0.25);
      g.fillRect(cx - 14, cy - 10, 1, 3);
      g.fillRect(cx + 13, cy - 12, 1, 3);
      g.fillRect(cx + 6, cy - 18, 1, 3);
      g.fillStyle(0xe0fcff, 0.8);
      g.fillCircle(cx - 5, cy - 3, 1.2);
      g.fillCircle(cx + 5, cy - 3, 1.2);
      g.fillStyle(0xffffff, 0.08);
      g.fillEllipse(cx, cy + 12, 22, 4);
      break;
    case 'laird':
      // ── Gold crown — three-point circlet with a red centre ruby
      // and two accent gems. Previously paired with a clan-plaid
      // swatch on the body, but the plaid read as a weird red
      // rectangle at gameplay scale — removed for cleaner
      // silhouette. The crown alone is enough to say "laird". ──
      g.fillStyle(0xd4a017, 1);
      g.fillRect(cx - 6, cy - 14, 12, 3);
      g.fillTriangle(cx - 6, cy - 14, cx - 4, cy - 17, cx - 2, cy - 14);
      g.fillTriangle(cx - 2, cy - 14, cx, cy - 18, cx + 2, cy - 14);
      g.fillTriangle(cx + 2, cy - 14, cx + 4, cy - 17, cx + 6, cy - 14);
      g.fillStyle(0xcc2222, 1);
      g.fillCircle(cx, cy - 13, 0.8);
      g.fillStyle(palette.accent, 1);
      g.fillCircle(cx - 4, cy - 13, 0.6);
      g.fillCircle(cx + 4, cy - 13, 0.6);
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(cx - 5, cy - 13, 10, 0.5);
      break;
    case 'pipe_breath':
      g.lineStyle(1.5, palette.accent, 0.5);
      g.beginPath();
      g.arc(cx - 8, cy - 2, 8, -Math.PI * 0.3, Math.PI * 0.5);
      g.strokePath();
      g.beginPath();
      g.arc(cx + 10, cy + 1, 6, Math.PI * 0.2, Math.PI * 0.9);
      g.strokePath();
      g.lineStyle(1, palette.accent, 0.25);
      g.beginPath();
      g.arc(cx - 12, cy - 4, 12, -Math.PI * 0.2, Math.PI * 0.4);
      g.strokePath();
      g.fillStyle(palette.accent, 0.9);
      g.fillCircle(cx + 12, cy - 10, 2.2);
      g.fillRect(cx + 13, cy - 16, 1.5, 7);
      g.fillStyle(palette.accent, 0.7);
      g.fillTriangle(cx + 14, cy - 16, cx + 17, cy - 14, cx + 14, cy - 13);
      g.fillStyle(palette.accent, 0.5);
      g.fillCircle(cx - 14, cy - 8, 1.5);
      g.fillRect(cx - 13, cy - 13, 1, 5);
      break;
    case 'none':
    default:
      break;
  }
}
