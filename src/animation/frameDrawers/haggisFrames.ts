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
import type { VariantKey } from '../../data/variants';
import { drawHaggisBody, HAGGIS_SPRITE_SIZE } from './haggisBodyDraw';
import type { HaggisBodyFrame } from './haggisBodyDraw';

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

/**
 * FRAME_OFFSETS — authored HaggisBodyFrame per (state, frame).
 *
 * Exposed as a const so the W71 Phase 2 tail-lag regression can assert
 * values without spying on the drawer function. `drawHaggisFrame` below
 * looks up the offset here and delegates to `drawHaggisBody`.
 *
 * Tail offsets follow a phase-offset rule: tail-frame at index N is
 * authored as if reading `body[N - 1]`. On 2-frame loops (idle, hurt)
 * this reads as counter-phase; on longer cycles (walking, attacking,
 * celebrating, dying) it reads as visible trailing.
 */
export const FRAME_OFFSETS: Record<AnimationState, readonly HaggisBodyFrame[]> = {
  idle: [
    { breathY: 1, tailY: -1 },
    { breathY: -1, tailY: 1 },
  ],
  walking: [
    { breathY: 0, leftLegY: -2, rightLegY: 1, tailX: -1 },
    { breathY: -1, leftLegY: -1, rightLegY: 0, tailX: 0 },
    { breathY: 0, leftLegY: 1, rightLegY: -2, tailX: 1 },
    { breathY: -1, leftLegY: 0, rightLegY: -1, tailX: 0 },
  ],
  attacking: [
    { bodyX: 1, tailX: 0 },
    { bodyX: 2, breathY: -2, tailX: -1 },
    { bodyX: 1, breathY: -1, tailX: -1 },
    { tailX: 0 },
  ],
  hurt: [
    { bodyX: -2, breathY: 1, tailX: 1 },
    { bodyX: -1, breathY: 0, tailX: 0 },
  ],
  celebrating: [
    { breathY: 2, tailY: 0 },
    { breathY: -6, tailY: 3 },
    { breathY: -1, bodyX: -1, tailY: 1 },
    { breathY: -1, bodyX: 1, tailY: -1 },
  ],
  dying: [
    { breathY: 1, bodyX: -1, tailY: 0 },
    { breathY: 4, leftLegY: 3, rightLegY: 3, tailY: 3 },
    { breathY: 6, leftLegY: 4, rightLegY: 4, tailY: 5 },
  ],
};

/**
 * Draw a full haggis body for `ctx.state, ctx.frame` into `g`. Reads
 * the authored offset from `FRAME_OFFSETS` and delegates to the shared
 * body drawer. Every variant uses the same authored table.
 */
export function drawHaggisFrame(
  g: Phaser.GameObjects.Graphics,
  ctx: HaggisDrawCtx,
): void {
  const frames = FRAME_OFFSETS[ctx.state];
  if (!frames) {
    throw new Error(`drawHaggisFrame: state ${ctx.state} not authored yet`);
  }
  const bodyFrame = frames[ctx.frame];
  if (!bodyFrame) {
    throw new Error(`drawHaggisFrame: frame ${ctx.frame} out of range for state ${ctx.state}`);
  }
  const variant = getVariantByKey(ctx.variantKey ?? 'classic');
  drawHaggisBody(g, variant, bodyFrame);
}

export function getHaggisSpriteSize(): number {
  return HAGGIS_SPRITE_SIZE;
}
