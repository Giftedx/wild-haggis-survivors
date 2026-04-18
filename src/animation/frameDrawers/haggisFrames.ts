/**
 * Procedural drawers for the classic haggis body across (state × frame).
 *
 * Authored against `docs/ART_STYLE_BIBLE.md`. Reference sprites for
 * craft-bar comparison: `dean_apparition`, `tome_wraith`, `redcap`,
 * `ceilidh_caller` in `src/scenes/BootScene.ts`.
 *
 * Ships Phase 0: idle × 2 + walking × 4 (6 frames total for classic).
 * Remaining states (attacking, hurt, celebrating, dying) land in Phase 1.
 *
 * Light model per the bible:
 *   - Primary light upper-left
 *   - Fill light upper-right at 50%
 *   - Ambient occlusion at body underside
 */

import type { AnimationState } from '../animationStates';
import type { VariantPalette } from '../../art/palettes';

export interface HaggisDrawCtx {
  readonly variantPalette: VariantPalette;
  readonly state: AnimationState;
  readonly frame: number;
}

const SPRITE_SIZE = 56; // matches the existing variant texture sizes

type StateFrameDrawer = (g: Phaser.GameObjects.Graphics, palette: VariantPalette) => void;

const DRAWERS: Partial<Record<AnimationState, StateFrameDrawer[]>> = {
  idle: [drawIdleFrame0, drawIdleFrame1],
  walking: [drawWalkingFrame0, drawWalkingFrame1, drawWalkingFrame2, drawWalkingFrame3],
  // attacking, hurt, celebrating, dying — Phase 1
};

export function drawHaggisFrame(
  g: Phaser.GameObjects.Graphics,
  ctx: HaggisDrawCtx,
): void {
  const drawers = DRAWERS[ctx.state];
  if (!drawers) {
    throw new Error(`drawHaggisFrame: state ${ctx.state} not authored yet (Phase 1)`);
  }
  const drawer = drawers[ctx.frame];
  if (!drawer) {
    throw new Error(`drawHaggisFrame: frame ${ctx.frame} out of range for state ${ctx.state}`);
  }
  drawer(g, ctx.variantPalette);
}

export function getHaggisSpriteSize(): number {
  return SPRITE_SIZE;
}

// ──────────────────────────────────────────────────────────────
// IDLE frames — ~2 fps loop. Subtle breathing: body rises + falls.
// ──────────────────────────────────────────────────────────────

function drawIdleFrame0(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // FIRST DRAFT — iterate against ART_STYLE_BIBLE.md before declaring done.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 2;

  // Ground shadow (ambient occlusion)
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 14, 28, 6);

  // Body — breathing in (slight squash down)
  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy + 2, 32, 26);
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy + 1, 29, 23);

  // Upper-left highlight per the bible
  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 4, 12, 8);

  // Eyes
  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 2, 1.8);
  g.fillCircle(cx + 5, cy - 2, 1.8);

  // Little feet nubs
  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx - 8, cy + 12, 4, 3);
  g.fillRect(cx + 4, cy + 12, 4, 3);
}

function drawIdleFrame1(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // Breathing out — body lifts slightly, slight stretch upward.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 2;

  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 14, 28, 6);

  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy, 30, 28);      // slightly taller
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy - 1, 27, 25);   // lifts up

  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 6, 12, 8);

  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 4, 1.8);
  g.fillCircle(cx + 5, cy - 4, 1.8);

  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx - 8, cy + 12, 4, 3);
  g.fillRect(cx + 4, cy + 12, 4, 3);
}

// ──────────────────────────────────────────────────────────────
// WALKING frames — 24 fps loop. Contact → passing → contact → passing.
// Authored in Task 7.
// ──────────────────────────────────────────────────────────────

function drawWalkingFrame0(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // Contact pose — left foot forward, body centred, slight downward settle.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 2;

  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 14, 28, 5);

  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy + 2, 32, 25);
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy + 1, 29, 22);

  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 4, 12, 8);

  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 2, 1.8);
  g.fillCircle(cx + 5, cy - 2, 1.8);

  // Feet — left forward, right back
  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx - 10, cy + 12, 4, 3);  // left forward
  g.fillRect(cx + 6, cy + 13, 4, 3);   // right back
}
function drawWalkingFrame1(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // Passing pose — mid-step, body lifts slightly.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 1;  // body lifted by 1px

  g.fillStyle(0x000000, 0.30);
  g.fillEllipse(cx, cy + 15, 24, 4);

  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy + 1, 31, 26);
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy, 28, 23);

  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 5, 12, 8);

  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 3, 1.8);
  g.fillCircle(cx + 5, cy - 3, 1.8);

  // Feet — together (both tucked under)
  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx - 4, cy + 13, 4, 3);
  g.fillRect(cx, cy + 13, 4, 3);
}
function drawWalkingFrame2(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // Contact pose — right foot forward (mirror of frame 0), body centre.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 2;

  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 14, 28, 5);

  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy + 2, 32, 25);
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy + 1, 29, 22);

  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 4, 12, 8);

  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 2, 1.8);
  g.fillCircle(cx + 5, cy - 2, 1.8);

  // Feet — right forward, left back
  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx - 10, cy + 13, 4, 3);  // left back
  g.fillRect(cx + 6, cy + 12, 4, 3);   // right forward
}
function drawWalkingFrame3(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // Passing pose (second half) — same lift as frame 1, opposite foot grouping.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 1;

  g.fillStyle(0x000000, 0.30);
  g.fillEllipse(cx, cy + 15, 24, 4);

  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy + 1, 31, 26);
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy, 28, 23);

  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 5, 12, 8);

  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 3, 1.8);
  g.fillCircle(cx + 5, cy - 3, 1.8);

  // Feet — together (both tucked under, inverse of frame 1)
  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx, cy + 13, 4, 3);
  g.fillRect(cx + 4, cy + 13, 4, 3);
}
