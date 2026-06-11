/**
 * Wicker Haggis — Bealltainn burning effigy boss frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Burning wicker
 * construction — breathY gives the pyre its flickering sway; bodyX
 * sells the phase-2 speed boost charge. The draw function takes explicit
 * cx/cy so the frame offset is applied at call site rather than through
 * the sprite.
 *
 * SCOTTISH_RESEARCH_DEEP.md §22.1.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossWickerHaggis } from '../../../art/sprites/bosses/wickerHaggis';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const WICKER_CANVAS_SIZE = 56;
const HALF = WICKER_CANVAS_SIZE / 2;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 2 },
    { breathY: -2 },
  ],
  walking: [
    // Burning effigy lurches toward the player.
    { breathY: 0, bodyX: 1 },
    { breathY: -2, bodyX: 1 },
    { breathY: 0, bodyX: 0 },
    { breathY: 2, bodyX: 0 },
  ],
  hurt: [
    { bodyX: -2, breathY: -2 },
    { bodyX: -1 },
  ],
  dying: [
    // The wicker collapses — embers scatter.
    { breathY: 3, bodyX: -1 },
    { breathY: 6, bodyX: -2 },
    { breathY: 9, bodyX: -3 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const wickerHaggisDrawer: EnemyFrameDrawer = {
  enemyKey: 'wicker_haggis',
  canvasSize: WICKER_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossWickerHaggis(g, HALF + (frame.bodyX ?? 0), HALF + (frame.breathY ?? 0));
  },
};

registerEnemyFrameDrawer(wickerHaggisDrawer);
