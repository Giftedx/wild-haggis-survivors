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
  /**
   * Tail x offset (px). Positive = tail trails right. W71 Phase 2 —
   * used by walking/attacking/hurt keyframes to sell secondary motion.
   */
  readonly tailX?: number;
  /**
   * Tail y offset (px). Positive = tail sinks (lags body rise).
   * W71 Phase 2 — used by idle/celebrating/dying keyframes.
   */
  readonly tailY?: number;
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
  const tailDx = frame.tailX ?? 0;
  const tailDy = frame.tailY ?? 0;
  g.fillStyle(palette.bodyDark, 1);
  g.fillCircle(cx - 20 + tailDx, cy + 4 + leftDy + tailDy, 4);
  g.fillStyle(palette.fur, 0.7);
  g.fillCircle(cx - 20 + tailDx, cy + 3 + leftDy + tailDy, 2.5);

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
  drawVariantSignature(g, variant.key, cx, cy);
}

/**
 * Per-variant signature flourish — drawn AFTER the shared body + accent
 * so identity-too-subtle variants (audit 7.5–7.8) gain a visual hook
 * without disturbing variants already at 8.0+. Each motif is < 12 pixel
 * ops and palette-anchored to the ART_STYLE_BIBLE bands. Variants not
 * listed (classic, moor_runner, iron_belly, glen_forager, surefoot,
 * pipe_breath, wee_ghostie, laird) fall through unchanged.
 */
function drawVariantSignature(
  g: Phaser.GameObjects.Graphics,
  key: string,
  cx: number,
  cy: number,
): void {
  switch (key) {
    case 'haggis_doric_quinie':
    case 'doric_quinie': {
      // Barley/oat sprig held above the right shoulder — rural
      // Aberdeenshire harvest tell. Sits above the brow tufts at
      // cy-10 so the sprig reads cleanly against the dark frame.
      g.fillStyle(0x6a4a18, 1);
      g.fillRect(cx + 16, cy - 14, 0.8, 5);
      g.fillStyle(0xd4a017, 1);
      g.fillCircle(cx + 15, cy - 15, 0.9);
      g.fillCircle(cx + 17, cy - 15, 0.9);
      g.fillCircle(cx + 16, cy - 17, 0.9);
      g.fillStyle(0xffdd66, 0.85);
      g.fillCircle(cx + 16, cy - 16, 0.5);
      g.fillStyle(0x55aa33, 0.85);
      g.fillTriangle(cx + 18, cy - 12, cx + 20, cy - 9, cx + 16, cy - 9);
      break;
    }
    case 'haggis_anticlockwise':
    case 'anticlockwise': {
      // Counter-clockwise spiral painted on the left flank fur —
      // sits between the tail nub (cx-20) and the body silhouette,
      // away from eyes (cx-8, cy-4) and smile (cx-1, cy+7).
      g.fillStyle(0xe0d8c0, 0.9);
      g.fillCircle(cx - 14, cy + 4, 0.9);
      g.fillCircle(cx - 16, cy + 5, 0.8);
      g.fillCircle(cx - 16, cy + 7, 0.7);
      g.fillCircle(cx - 14, cy + 8, 0.6);
      g.fillCircle(cx - 12, cy + 7, 0.5);
      // Arrowhead pointing back-up to close the counter-clockwise loop
      g.fillStyle(0xffffff, 0.95);
      g.fillTriangle(cx - 14, cy + 4, cx - 13, cy + 2, cx - 12, cy + 4);
      break;
    }
    case 'haggis_peerie_shetlander':
    case 'peerie_shetlander': {
      // White-cap wave glint at the feet — Shetland sea-edge.
      g.fillStyle(0xcceaf8, 0.85);
      g.fillRect(cx - 8, cy + 22, 5, 0.8);
      g.fillRect(cx + 4, cy + 22, 5, 0.8);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(cx - 5, cy + 22, 0.6);
      g.fillCircle(cx + 6, cy + 22, 0.6);
      break;
    }
    case 'haggis_burns_wee_beastie':
    case 'burns_wee_beastie': {
      // Tiny rolled scroll tucked against the right flank — poet's
      // tribute. Avoids the tail (cx-20) and the eye/snout cluster.
      g.fillStyle(0xe8d8a8, 1);
      g.fillRect(cx + 16, cy + 3, 6, 2);
      g.fillStyle(0xfff0c8, 1);
      g.fillRect(cx + 16, cy + 3, 6, 0.7);
      g.fillStyle(0x6a4a18, 1);
      g.fillCircle(cx + 16, cy + 4, 0.9);
      g.fillCircle(cx + 22, cy + 4, 0.9);
      // Ink dot — "wee, sleekit, cowrin'..."
      g.fillStyle(0x111111, 0.85);
      g.fillCircle(cx + 19, cy + 4, 0.5);
      break;
    }
    case 'haggis_glaswegian':
    case 'glaswegian': {
      // Wee traffic-cone wedge atop the head — Duke of Wellington tribute.
      g.fillStyle(0x1a0e06, 1);
      g.fillTriangle(cx - 3, cy - 11, cx + 3, cy - 11, cx, cy - 16);
      g.fillStyle(0xff6622, 1);
      g.fillTriangle(cx - 2.5, cy - 11, cx + 2.5, cy - 11, cx, cy - 15.5);
      g.fillStyle(0xffaa55, 0.85);
      g.fillRect(cx - 1.5, cy - 13, 3, 0.6);
      g.fillStyle(0x2a1a08, 1);
      g.fillRect(cx - 3, cy - 11, 6, 1);
      break;
    }
    case 'haggis_cailleach':
    case 'cailleach': {
      // Frost-rime ringing the brow — winter-hag chill. Positioned
      // between brow tufts (cy-10) and crone-hair tuft (cy-14) without
      // colliding with the rowan-berry pip at (cx+6, cy-10).
      g.fillStyle(0xcceaf8, 0.9);
      g.fillCircle(cx - 9, cy - 9, 0.8);
      g.fillCircle(cx - 4, cy - 12, 0.7);
      g.fillCircle(cx + 1, cy - 13, 0.7);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(cx - 7, cy - 11, 0.4);
      g.fillCircle(cx - 1, cy - 14, 0.4);
      break;
    }
    case 'haggis_witch_hare':
    case 'witch_hare': {
      // Two long pointed hare ears rising from the brow plus a
      // heather-green witch-eye gleam on the left eye. Mountain-hare
      // silhouette tells you what she is at a glance; the gleam tells
      // you what she was. Auldearn 1662, Isobel Gowdie's confession:
      // "I sall gae intill ane haire" — the hare is the witch.
      // Outline first so the inner pelt reads on the silver body.
      g.fillStyle(0x1a1812, 1);
      g.fillTriangle(cx - 7, cy - 12, cx - 4, cy - 12, cx - 6, cy - 19);
      g.fillTriangle(cx + 5, cy - 12, cx + 8, cy - 12, cx + 7, cy - 19);
      g.fillStyle(0x9a8e7e, 1);
      g.fillTriangle(cx - 6.5, cy - 13, cx - 4.5, cy - 13, cx - 6, cy - 18);
      g.fillTriangle(cx + 5.5, cy - 13, cx + 7.5, cy - 13, cx + 7, cy - 18);
      // Pink ear-blush — the soft inner cartilage. Pulls the ears out
      // of the silhouette plane so they read as living, not paper.
      g.fillStyle(0xfba0c0, 0.7);
      g.fillRect(cx - 6.2, cy - 17, 0.6, 2);
      g.fillRect(cx + 7, cy - 17, 0.6, 2);
      // Witch-eye gleam — heather-green spark with bright pip on the
      // left eye (cx-8, cy-4 in the body draw). Sits over the eye's
      // dark pupil so the gleam reads as a living look.
      g.fillStyle(0x6a8848, 0.95);
      g.fillCircle(cx - 8, cy - 4, 0.7);
      g.fillStyle(0xa8d068, 1);
      g.fillCircle(cx - 8, cy - 4, 0.35);
      break;
    }
    default:
      break;
  }
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
    case 'pipe_breath': {
      // Cold-moor exhale. Pure wind — a tapered wisp-trail of breath
      // on each side, drifting away from the body like steam off a
      // teacup. No semicircular "horns" or "tusks" — just a series
      // of shrinking ellipses + droplets that read as "organic gust"
      // even at small sprite scales. Hats / crowns / accessories sit
      // flat on the head; wisps stay well outside the hat silhouette
      // (|cx±13|) and well below the body-top (cy-15).
      // Flavor: "wheesht — the moor exhales through this one."
      const s = palette.accent;

      // Chest bellows glow — suggests the lungs inside. Stays fully
      // inside body silhouette so it reads as inner light.
      g.fillStyle(s, 0.1);
      g.fillEllipse(cx, cy + 4, 18, 8);
      g.fillStyle(s, 0.18);
      g.fillEllipse(cx, cy + 4, 10, 4);

      // Right-side exhale wisp — three shrinking ellipses form the
      // main plume, angled slightly upward as the gust rises. Body
      // right-edge sits at ~cx+22; wisps extend to cx+26 max.
      g.fillStyle(s, 0.55);
      g.fillEllipse(cx + 14, cy + 3, 5, 2.5);
      g.fillStyle(s, 0.45);
      g.fillEllipse(cx + 18, cy + 1, 4, 2);
      g.fillStyle(s, 0.32);
      g.fillEllipse(cx + 21, cy - 1, 3, 1.6);
      // Trailing sparkle droplets that scatter outward
      g.fillStyle(s, 0.7);
      g.fillCircle(cx + 24, cy, 0.8);
      g.fillStyle(s, 0.5);
      g.fillCircle(cx + 25, cy + 3, 0.6);
      g.fillStyle(s, 0.35);
      g.fillCircle(cx + 26, cy - 3, 0.5);

      // Left-side exhale wisp — mirror of the right but shorter,
      // so one side reads as "main breath" and the other as "ambient".
      g.fillStyle(s, 0.45);
      g.fillEllipse(cx - 14, cy + 4, 4.5, 2.2);
      g.fillStyle(s, 0.32);
      g.fillEllipse(cx - 18, cy + 2, 3.5, 1.8);
      g.fillStyle(s, 0.5);
      g.fillCircle(cx - 22, cy + 1, 0.7);
      g.fillStyle(s, 0.3);
      g.fillCircle(cx - 24, cy + 4, 0.5);
      break;
    }
    case 'cailleach': {
      // Silver crone-hair tuft — wispy accents at crown
      g.fillStyle(0xd4d0c0, 0.9);
      g.fillEllipse(cx, cy - 14, 6, 3);
      g.fillEllipse(cx - 3, cy - 15, 2, 2);
      g.fillEllipse(cx + 3, cy - 15, 2, 2);

      // Rowan-berry pip at the right temple
      g.fillStyle(0x8a2828, 1);
      g.fillCircle(cx + 6, cy - 10, 1.2);
      break;
    }
    case 'glaswegian': {
      // Wee traffic cone on the heid — Duke of Wellington statue
      // tribute. Cream stripe + dark base anchor it; tram-orange
      // body uses the variant's signature `accent` to keep the
      // motif palette-driven. Mirrors the tier-2 mantle's
      // shoulder-cone at sprite scale.
      g.fillStyle(0x2a1810, 1);
      g.fillRect(cx - 3, cy - 11, 6, 1.2);
      g.fillStyle(palette.accent, 1);
      g.fillTriangle(cx, cy - 17, cx - 3, cy - 11, cx + 3, cy - 11);
      g.fillStyle(0xfff1d6, 0.95);
      g.fillRect(cx - 2.4, cy - 14, 4.8, 1);
      // 1-pixel highlight up the cone's left edge.
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(cx - 1.4, cy - 16, 0.6, 4);
      break;
    }
    case 'doric_quinie': {
      // Fisherman's bonnet — a knit cap pulled low with a tuft
      // pompom on top. Silver-blue band runs the brim; the
      // pompom uses a paler accent so it reads at sprite scale.
      // Aberdonian quine on the harbour wall.
      g.fillStyle(palette.outline, 1);
      g.fillEllipse(cx, cy - 11, 14, 4);
      g.fillStyle(0x4a5868, 1);
      g.fillEllipse(cx, cy - 12, 13, 4);
      // Silver-blue band along the brim.
      g.fillStyle(palette.accent, 0.95);
      g.fillRect(cx - 6, cy - 11, 12, 1);
      // Pompom tuft on top.
      g.fillStyle(0x6a7888, 1);
      g.fillCircle(cx, cy - 14, 1.6);
      g.fillStyle(0xc8d4e4, 0.9);
      g.fillCircle(cx - 0.4, cy - 14.4, 0.7);
      break;
    }
    case 'peerie_shetlander': {
      // Kelp wisps trailing from the collar — two strands of
      // bladderwrack draped over the shoulders, fronds tapering
      // toward the body. Norn-shore cue. Bladder-pip dots stand
      // in for the seaweed's air sacs.
      g.fillStyle(0x2a4a32, 1);
      // Right strand — longer, drooping outward.
      g.fillRect(cx + 7, cy - 4, 1.2, 6);
      g.fillRect(cx + 7.6, cy + 2, 1.2, 4);
      g.fillStyle(0x3a6a44, 0.95);
      g.fillCircle(cx + 7.6, cy + 6.2, 1);
      g.fillCircle(cx + 8.4, cy + 0, 0.7);
      // Left strand — shorter.
      g.fillStyle(0x2a4a32, 1);
      g.fillRect(cx - 8.2, cy - 3, 1.2, 5);
      g.fillStyle(0x3a6a44, 0.95);
      g.fillCircle(cx - 7.6, cy + 2.2, 0.9);
      // Sea-glass bead on the right — pale accent matches palette.
      g.fillStyle(palette.accent, 0.85);
      g.fillCircle(cx + 8, cy - 3, 0.7);
      break;
    }
    case 'none':
    default:
      break;
  }
}
