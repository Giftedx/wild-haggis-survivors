/**
 * Ceilidh Caller — floating academic apparition frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). The caller is an
 * ethereal figure in academic robes — no legs, floats and drifts.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawCeilidhCallerBody, CEILIDH_CALLER_CANVAS_SIZE } from '../../../art/sprites/enemies/ceilidhCaller';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    { breathY: 0, bodyX: 1 },
    { breathY: -1, bodyX: 1 },
    { breathY: 0, bodyX: 0 },
    { breathY: 1, bodyX: 0 },
  ],
  hurt: [
    { bodyX: -2, breathY: -1 },
    { bodyX: -1 },
  ],
  dying: [
    { breathY: 1 },
    { breathY: 3 },
    { breathY: 5 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const ceilidhCallerDrawer: EnemyFrameDrawer = {
  enemyKey: 'ceilidh_caller',
  canvasSize: CEILIDH_CALLER_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawCeilidhCallerBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(ceilidhCallerDrawer);
