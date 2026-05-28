/**
 * Twin Stones of Callanish — An Càraid boss frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Petrified giants —
 * standing stones don't "walk" but they close the distance. breathY
 * gives the stone its imperceptible dimensional shift; bodyX sells
 * the ring-burst approach. The dread is that they're moving at all.
 *
 * Only Stone A (boss_twin_stone_a) is animated — the primary boss;
 * Stone B is cosmetic shadow and keeps its static texture.
 *
 * SCOTTISH_RESEARCH §1.8 (Callanish Standing Stones).
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossTwinStoneA, BOSS_TWIN_STONE_CANVAS_SIZE } from '../../../art/sprites/bosses/twinStones';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    // Barely perceptible — stones only sway in the oldest stories.
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    // Stones don't stride. The dread is the implication of motion.
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
    { breathY: 2, bodyX: -1 },
    { breathY: 4, bodyX: -2 },
    { breathY: 6, bodyX: -2 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const twinStonesDrawer: EnemyFrameDrawer = {
  enemyKey: 'twin_stones',
  canvasSize: BOSS_TWIN_STONE_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossTwinStoneA(g, frame);
  },
};

registerEnemyFrameDrawer(twinStonesDrawer);
