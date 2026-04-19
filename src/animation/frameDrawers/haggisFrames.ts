/**
 * Per-state × per-frame drawers for the classic haggis body. Each
 * drawer delegates to the shared full-detail `drawHaggisBody` with
 * small per-frame offsets that sell the animation beat — breathing
 * pulse on idle, leg shuffle on walking, forward lunge on attacking,
 * flinch-back on hurt. The body itself is the same 160-line
 * handcrafted sprite that ships as `haggis_classic` via BootScene's
 * legacy texture bake. No downgrade.
 *
 * `celebrating` + `dying` land in Phase 1 (and throw here for now so
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

// ── Attacking (4 frames @ 24 fps, one-shot = ~167 ms total) ──
// The haggis pulses forward when a weapon fires. No facing rotation — the
// lunge is a small bodyX shift combined with a breath-up on the strike
// frame. Reads as "effort" without jumping the sprite noticeably.
function drawAttackingFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Anticipate — slight forward lean.
  drawHaggisBody(g, variant, { bodyX: 1 });
}

function drawAttackingFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Strike — full forward thrust + body rises with effort.
  drawHaggisBody(g, variant, { bodyX: 2, breathY: -2 });
}

function drawAttackingFrame2(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Hold — lingering commitment before the settle.
  drawHaggisBody(g, variant, { bodyX: 1, breathY: -1 });
}

function drawAttackingFrame3(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Recover — back to neutral pose.
  drawHaggisBody(g, variant, {});
}

// ── Hurt (2 frames @ 30 fps, one-shot = ~67 ms total) ──
// Snappy flinch: body jumps backward and compresses down, then recovers.
// 67 ms is brief but the 4-px horizontal punch + breath compression reads
// plainly — it's the same logic every fighting-game hitflash uses.
function drawHurtFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { bodyX: -2, breathY: 1 });
}

function drawHurtFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { bodyX: -1, breathY: 0 });
}

const DRAWERS: Partial<Record<AnimationState, StateFrameDrawer[]>> = {
  idle: [drawIdleFrame0, drawIdleFrame1],
  walking: [drawWalkingFrame0, drawWalkingFrame1, drawWalkingFrame2, drawWalkingFrame3],
  attacking: [
    drawAttackingFrame0,
    drawAttackingFrame1,
    drawAttackingFrame2,
    drawAttackingFrame3,
  ],
  hurt: [drawHurtFrame0, drawHurtFrame1],
  // celebrating, dying — Phase 1
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
