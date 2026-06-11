/**
 * Storm Cailleach — post-bell Tier-3 storm-form boss frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Floating tempest entity —
 * breathY gives the storm-cloak its violent churn; bodyX sells the
 * three-phase escalating approach. More agitated animation than the
 * Cailleach Gauntlet boss (different form, different energy).
 *
 * SCOTTISH_RESEARCH §1.3.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossStormCailleach, BOSS_STORM_CAILLEACH_CANVAS_SIZE } from '../../../art/sprites/bosses/stormCailleach';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 2 },
    { breathY: -2 },
  ],
  walking: [
    // Storm energy — more agitated than the Gauntlet Cailleach.
    { breathY: 0, bodyX: 2 },
    { breathY: -2, bodyX: 1 },
    { breathY: 0, bodyX: -1 },
    { breathY: 2, bodyX: 0 },
  ],
  hurt: [
    { bodyX: -3, breathY: -2 },
    { bodyX: -1, breathY: -1 },
  ],
  dying: [
    { breathY: 3, bodyX: -2 },
    { breathY: 6, bodyX: -3 },
    { breathY: 10, bodyX: -3 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const stormCailleachDrawer: EnemyFrameDrawer = {
  enemyKey: 'storm_cailleach',
  canvasSize: BOSS_STORM_CAILLEACH_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossStormCailleach(g, frame);
  },
};

registerEnemyFrameDrawer(stormCailleachDrawer);
