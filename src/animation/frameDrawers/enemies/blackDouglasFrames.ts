/**
 * Black Douglas — post-bell fear-shout boss frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Fast humanoid chaser
 * — breathY sells the spectral cloak billow; bodyX gives the charge
 * its forward lean. This is the fastest post-bell boss (130 px/s) so
 * walking frames are more pronounced than slower bosses.
 *
 * SCOTTISH_RESEARCH_DEEP.md §6.3.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossBlackDouglas, BOSS_BLACK_DOUGLAS_CANVAS_SIZE } from '../../../art/sprites/bosses/black_douglas';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    // Fast forward-lean charge.
    { breathY: 0, bodyX: 1 },
    { breathY: -2, bodyX: 1 },
    { breathY: 0, bodyX: 0 },
    { breathY: 1, bodyX: 0 },
  ],
  hurt: [
    { bodyX: -3, breathY: -1 },
    { bodyX: -1 },
  ],
  dying: [
    { breathY: 2, bodyX: -1 },
    { breathY: 4, bodyX: -2 },
    { breathY: 7, bodyX: -2 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const blackDouglasDrawer: EnemyFrameDrawer = {
  enemyKey: 'black_douglas',
  canvasSize: BOSS_BLACK_DOUGLAS_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossBlackDouglas(g, frame);
  },
};

registerEnemyFrameDrawer(blackDouglasDrawer);
