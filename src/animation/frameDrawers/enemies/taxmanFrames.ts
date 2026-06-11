/**
 * Boss Taxman — floating reaper boss frame definitions.
 *
 * No legs — robes float. Body sways gently side-to-side while moving.
 * Larger offsets for 80×80 boss canvas displayed at 3× scale.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossTaxmanBody, BOSS_TAXMAN_CANVAS_SIZE } from '../../../art/sprites/bosses/taxman';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 2 },
    { breathY: -2 },
  ],
  walking: [
    { breathY: 0, bodyX: 2 },
    { breathY: -2, bodyX: 2 },
    { breathY: 0, bodyX: 0 },
    { breathY: 2, bodyX: 0 },
  ],
  hurt: [
    { bodyX: -4, breathY: -2 },
    { bodyX: -2 },
  ],
  dying: [
    { breathY: 2 },
    { breathY: 5 },
    { breathY: 8 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const taxmanDrawer: EnemyFrameDrawer = {
  enemyKey: 'taxman',
  canvasSize: BOSS_TAXMAN_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossTaxmanBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(taxmanDrawer);
