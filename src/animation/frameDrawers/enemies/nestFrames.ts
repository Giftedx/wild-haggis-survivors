/**
 * Nest — eagle-nest spawner frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Attacking and
 * celebrating fall back to idle_0 — enemies don't use those states.
 *
 * Static spawner — only breathY + bodyX offsets, no legs.
 * Idle/walking: subtle nest-settle. Hurt: jolts. Dying: collapses.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawNestBody, NEST_CANVAS_SIZE } from '../../../art/sprites/enemies/nest';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 0 },    // settled
    { breathY: 1 },    // eggs shift
  ],
  walking: [
    { breathY: 0 },
    { breathY: 1 },
    { breathY: 0 },
    { breathY: -1 },
  ],
  hurt: [
    { bodyX: -2 },                 // nest jolts
    { bodyX: 0, breathY: 1 },     // settles
  ],
  dying: [
    { breathY: 2 },                // tilts
    { breathY: 4, bodyX: 1 },     // collapses
    { breathY: 7 },               // spills
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const nestDrawer: EnemyFrameDrawer = {
  enemyKey: 'nest',
  canvasSize: NEST_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawNestBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(nestDrawer);
