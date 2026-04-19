/**
 * Per-state × per-frame drawers for the classic haggis body. Each
 * drawer delegates to the shared full-detail `drawHaggisBody` with
 * small per-frame offsets that sell the animation beat — breathing
 * pulse on idle, leg shuffle on walking, forward lunge on attacking,
 * flinch-back on hurt, celebratory bounce on level-up, a 3-beat
 * collapse on death. The body itself is the same handcrafted sprite
 * that ships as `haggis_classic` via BootScene's legacy texture bake.
 * No downgrade.
 */

import type { AnimationState } from '../animationStates';
import type { VariantPalette } from '../../art/palettes';
import { getVariantByKey } from '../../data/variants';
import type { VariantDef, VariantKey } from '../../data/variants';
import { drawHaggisBody, HAGGIS_SPRITE_SIZE } from './haggisBodyDraw';

export interface HaggisDrawCtx {
  /** Kept for signature compatibility; accessory drawers still read it. */
  readonly variantPalette: VariantPalette;
  readonly state: AnimationState;
  readonly frame: number;
  /**
   * Which haggis variant to draw. Defaults to `'classic'` when omitted.
   * BootScene passes the full variant list to bake per-variant atlases.
   */
  readonly variantKey?: VariantKey;
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

// ── Celebrating (4 frames @ 12 fps, loop = ~333 ms per cycle) ──
// Played on level-up + boss-kill moments. The haggis hunkers then hops
// with a little sway — the same beat you get from a 3-frame squash-
// and-stretch but paced so the hop lands cleanly on the whole-number
// frame. Lifts use the existing breathY/bodyX offsets so accessories
// ride along with no new plumbing.
function drawCelebratingFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Windup — compress into the ground.
  drawHaggisBody(g, variant, { breathY: 2 });
}
function drawCelebratingFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Apex — body lifts well above neutral.
  drawHaggisBody(g, variant, { breathY: -6 });
}
function drawCelebratingFrame2(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Land — body settles with a subtle left lean.
  drawHaggisBody(g, variant, { breathY: -1, bodyX: -1 });
}
function drawCelebratingFrame3(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Sway — right-lean counterbalance before the loop restarts.
  drawHaggisBody(g, variant, { breathY: -1, bodyX: 1 });
}

// ── Dying (3 frames @ 12 fps, one-shot = ~250 ms total) ──
// A clean three-beat fall: lean back, buckle, flat. The sprite stays
// on frame 2 after the one-shot finishes (FSM gate keeps dying
// terminal), so the "dead haggis" pose persists until the scene
// resets. Legs splay outward on the buckle frame for extra misery.
function drawDyingFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Stagger back — body leans with breath held.
  drawHaggisBody(g, variant, { breathY: 1, bodyX: -1 });
}
function drawDyingFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Buckle — legs splay, body sinks.
  drawHaggisBody(g, variant, { breathY: 4, leftLegY: 3, rightLegY: 3 });
}
function drawDyingFrame2(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  // Down — flat to the ground, final pose.
  drawHaggisBody(g, variant, { breathY: 6, leftLegY: 4, rightLegY: 4 });
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
  celebrating: [
    drawCelebratingFrame0,
    drawCelebratingFrame1,
    drawCelebratingFrame2,
    drawCelebratingFrame3,
  ],
  dying: [drawDyingFrame0, drawDyingFrame1, drawDyingFrame2],
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
  const variant = getVariantByKey(ctx.variantKey ?? 'classic');
  drawer(g, variant);
}

export function getHaggisSpriteSize(): number {
  return HAGGIS_SPRITE_SIZE;
}
