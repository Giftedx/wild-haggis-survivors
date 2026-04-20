/**
 * Boss Laird — humanoid aristocrat boss frame definitions.
 *
 * Humanoid with legs (wellies). Larger offsets for 80×80 boss canvas.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossLairdBody, BOSS_LAIRD_CANVAS_SIZE } from '../../../art/sprites/bosses/laird';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 2 },
    { breathY: -2 },
  ],
  walking: [
    { breathY: 0, leftLegY: -3, rightLegY: 2 },
    { breathY: -2, leftLegY: -1, rightLegY: 0 },
    { breathY: 0, leftLegY: 2, rightLegY: -3 },
    { breathY: -2, leftLegY: 0, rightLegY: -1 },
  ],
  hurt: [
    { bodyX: -4, breathY: 2 },
    { bodyX: -2, breathY: 1 },
  ],
  dying: [
    { breathY: 2, bodyX: -2 },
    { breathY: 6, leftLegY: 4, rightLegY: 4 },
    { breathY: 10, leftLegY: 6, rightLegY: 6 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const lairdDrawer: EnemyFrameDrawer = {
  enemyKey: 'the_laird',
  canvasSize: BOSS_LAIRD_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossLairdBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(lairdDrawer);
