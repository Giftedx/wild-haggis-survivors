/**
 * Earl Beardie — Glamis ghost card-dealer boss frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Seated-ish floating
 * ghost — breathY gives the spectral form its hover sway; bodyX sells
 * the closing drift. Cards are parryable (Shinty Parry E-flick) so the
 * visual cadence of approach matters.
 *
 * SCOTTISH_RESEARCH §1.4 (Glamis Castle ghost / Earl Beardie legend).
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossEarlBeardie, BOSS_EARL_BEARDIE_CANVAS_SIZE } from '../../../art/sprites/bosses/earl_beardie';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    // Slow deliberate drift — he approaches with awful patience.
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
    { breathY: 4, bodyX: -1 },
    { breathY: 6, bodyX: -2 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const earlBeardieDrawer: EnemyFrameDrawer = {
  enemyKey: 'earl_beardie',
  canvasSize: BOSS_EARL_BEARDIE_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossEarlBeardie(g, frame);
  },
};

registerEnemyFrameDrawer(earlBeardieDrawer);
