/**
 * Boss Tour Bus — vehicle boss frame definitions.
 *
 * No legs — whole body rocks. The bus sways side-to-side while moving.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossTourBusBody, BOSS_TOUR_BUS_CANVAS_SIZE } from '../../../art/sprites/bosses/tourBus';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    { breathY: 0, bodyX: 1 },
    { breathY: -1, bodyX: 2 },
    { breathY: 0, bodyX: 1 },
    { breathY: 1, bodyX: 0 },
  ],
  hurt: [
    { bodyX: -4, breathY: -2 },
    { bodyX: -2, breathY: -1 },
  ],
  dying: [
    { breathY: 2, bodyX: -2 },
    { breathY: 5, bodyX: -3 },
    { breathY: 8 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const tourBusDrawer: EnemyFrameDrawer = {
  enemyKey: 'tour_bus',
  canvasSize: BOSS_TOUR_BUS_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossTourBusBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(tourBusDrawer);
