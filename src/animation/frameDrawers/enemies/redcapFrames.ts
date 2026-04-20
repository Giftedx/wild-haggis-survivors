/**
 * Redcap — chase archetype frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Humanoid goblin
 * with iron-shod boots — full leg offsets. The stocky build gives
 * the walk a heavy, stomping quality.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawRedcapBody, REDCAP_CANVAS_SIZE } from '../../../art/sprites/enemies/redcap';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    { breathY: 0, leftLegY: -2, rightLegY: 1 },
    { breathY: -1, leftLegY: -1, rightLegY: 0 },
    { breathY: 0, leftLegY: 1, rightLegY: -2 },
    { breathY: -1, leftLegY: 0, rightLegY: -1 },
  ],
  hurt: [
    { bodyX: -2, breathY: 1 },
    { bodyX: -1 },
  ],
  dying: [
    { breathY: 1, bodyX: -1 },
    { breathY: 4, leftLegY: 3, rightLegY: 3 },
    { breathY: 6, leftLegY: 4, rightLegY: 4 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const redcapDrawer: EnemyFrameDrawer = {
  enemyKey: 'redcap',
  canvasSize: REDCAP_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawRedcapBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(redcapDrawer);
