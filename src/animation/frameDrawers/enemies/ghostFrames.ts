/**
 * Ghost (Mary Queen of Scots) — floating archetype frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). No legs — ghost
 * drifts. Uses breathY for ethereal bob and bodyX for hurt flinch.
 * Dying sinks the ghost downward.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawGhostBody, GHOST_CANVAS_SIZE } from '../../../art/sprites/enemies/ghost';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },    // bob down
    { breathY: -1 },   // bob up
  ],
  walking: [
    { breathY: 1 },    // drift down
    { breathY: 0 },    // neutral
    { breathY: -1 },   // drift up
    { breathY: 0 },    // neutral
  ],
  hurt: [
    { bodyX: -2, breathY: -1 },   // flinch back
    { bodyX: -1 },                 // recover
  ],
  dying: [
    { breathY: 1 },    // sinks
    { breathY: 3 },    // sinking further
    { breathY: 5 },    // fades down
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const ghostDrawer: EnemyFrameDrawer = {
  enemyKey: 'ghost',
  canvasSize: GHOST_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawGhostBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(ghostDrawer);
