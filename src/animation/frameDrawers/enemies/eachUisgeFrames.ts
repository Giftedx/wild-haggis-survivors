/**
 * Each-Uisge — Fey water-horse boss frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Equine body — uses
 * leftLegY / rightLegY for the leg stride (same pattern as kelpie) plus
 * breathY for body sway. Players hunt this boss for the kelpie_foal
 * companion unlock, so the animation carries weight.
 *
 * SCOTTISH_RESEARCH_DEEP.md §3 / Wild Living World companion unlock.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossEachUisge, BOSS_EACH_UISGE_CANVAS_SIZE } from '../../../art/sprites/bosses/eachUisge';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    { breathY: 0, leftLegY: -1, rightLegY: 1 },
    { breathY: -1, leftLegY: 0, rightLegY: 0 },
    { breathY: 0, leftLegY: 1, rightLegY: -1 },
    { breathY: 1, leftLegY: 0, rightLegY: 0 },
  ],
  hurt: [
    { bodyX: -2, breathY: -2 },
    { bodyX: -1, breathY: -1 },
  ],
  dying: [
    { breathY: 2, bodyX: -1 },
    { breathY: 5, bodyX: -2 },
    { breathY: 8, bodyX: -2 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const eachUisgeDrawer: EnemyFrameDrawer = {
  enemyKey: 'each_uisge',
  canvasSize: BOSS_EACH_UISGE_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossEachUisge(g, frame);
  },
};

registerEnemyFrameDrawer(eachUisgeDrawer);
