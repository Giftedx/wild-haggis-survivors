/**
 * Cu Sith frame definitions — Highland fairy hound.
 *
 * Mirrors barghestFrames shape (4 authored states, hound-low offsets).
 * The Cu Sith's bigger build per the bullock-size legend means
 * slightly wider stride than the barghest's quick bound — leg offsets
 * push to ±2 px instead of ±1.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { CU_SITH_CANVAS_SIZE, drawCuSithBody } from '../../../art/sprites/enemies/cuSith';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    { breathY: 0, leftLegY: -2, rightLegY: 2 },
    { breathY: -1, leftLegY: 0, rightLegY: 0 },
    { breathY: 0, leftLegY: 2, rightLegY: -2 },
    { breathY: -1, leftLegY: 0, rightLegY: 0 },
  ],
  hurt: [
    { bodyX: -1, breathY: 1 },
    { bodyX: 0 },
  ],
  dying: [
    { breathY: 1, bodyX: -1 },
    { breathY: 3, leftLegY: 2, rightLegY: 2 },
    { breathY: 5, leftLegY: 3, rightLegY: 3 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const cuSithDrawer: EnemyFrameDrawer = {
  enemyKey: 'cu_sith',
  canvasSize: CU_SITH_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawCuSithBody(g, frame);
  },
};

registerEnemyFrameDrawer(cuSithDrawer);
