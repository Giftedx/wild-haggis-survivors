/**
 * Per-state × per-frame drawers for the classic haggis body. Each
 * drawer delegates to the shared full-detail `drawHaggisBody` with
 * small per-frame offsets that sell the animation beat — breathing
 * pulse on idle, leg shuffle on walking. The body itself is the
 * same 160-line handcrafted sprite that ships as `haggis_classic`
 * via BootScene's legacy texture bake. No downgrade.
 *
 * Phase 0 only authors `idle` + `walking`. `attacking`, `hurt`,
 * `celebrating`, `dying` land in Phase 1 (and throw here for now so
 * an unauthored state can't silently draw the wrong thing).
 */

import type { AnimationState } from '../animationStates';
import type { VariantPalette } from '../../art/palettes';
import { getVariantByKey } from '../../data/variants';
import type { VariantDef } from '../../data/variants';
import { drawHaggisBody, HAGGIS_SPRITE_SIZE } from './haggisBodyDraw';

export interface HaggisDrawCtx {
  /** Kept for signature compatibility; accessory drawers still read it. */
  readonly variantPalette: VariantPalette;
  readonly state: AnimationState;
  readonly frame: number;
}

type StateFrameDrawer = (g: Phaser.GameObjects.Graphics, variant: VariantDef) => void;

function drawIdleFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Breathing in — body sits 1 px lower than neutral.
  drawHaggisBody(g, variant, { breathY: 1 });
}

function drawIdleFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Breathing out — body rises 1 px above neutral.
  drawHaggisBody(g, variant, { breathY: -1 });
}

function drawWalkingFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Contact — left leg forward (pushed up), right leg planted (back).
  drawHaggisBody(g, variant, { breathY: 0, leftLegY: -2, rightLegY: 1 });
}

function drawWalkingFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Passing — legs converging, body lifts slightly.
  drawHaggisBody(g, variant, { breathY: -1, leftLegY: -1, rightLegY: 0 });
}

function drawWalkingFrame2(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Contact — right leg forward, left leg planted (mirror of frame 0).
  drawHaggisBody(g, variant, { breathY: 0, leftLegY: 1, rightLegY: -2 });
}

function drawWalkingFrame3(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Passing — legs converging from the other side, body lifts slightly.
  drawHaggisBody(g, variant, { breathY: -1, leftLegY: 0, rightLegY: -1 });
}

const DRAWERS: Partial<Record<AnimationState, StateFrameDrawer[]>> = {
  idle: [drawIdleFrame0, drawIdleFrame1],
  walking: [drawWalkingFrame0, drawWalkingFrame1, drawWalkingFrame2, drawWalkingFrame3],
  // attacking, hurt, celebrating, dying — Phase 1
};

/**
 * Draw a full haggis body for `ctx.state, ctx.frame` into `g`. The
 * classic variant is used for Phase 0. Phase 1 extends the lookup to
 * all 9 variants via the variant key.
 */
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
  const variant = getVariantByKey('classic');
  drawer(g, variant);
}

export function getHaggisSpriteSize(): number {
  return HAGGIS_SPRITE_SIZE;
}
