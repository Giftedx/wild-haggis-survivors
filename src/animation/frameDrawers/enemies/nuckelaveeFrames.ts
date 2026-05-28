/**
 * Nuckelavee — Orcadian skinless sea-demon frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Horse-chimera body —
 * breathY gives the torso its heaving dread; bodyX sells the loping
 * charge. Hurt uses a sideways sway (the skinless body has no clean
 * recoil axis). Dying drops the chimera.
 *
 * SCOTTISH_RESEARCH §1.1; SCOTTISH_RESEARCH_DEEP.md Part 4.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossNuckelavee, BOSS_NUCKELAVEE_CANVAS_SIZE } from '../../../art/sprites/bosses/nuckelavee';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    // Heavy loping gait — wider bodyX swing than most bosses.
    { breathY: 0, bodyX: -2 },
    { breathY: -1, bodyX: -1 },
    { breathY: 0, bodyX: 2 },
    { breathY: 1, bodyX: 1 },
  ],
  hurt: [
    { bodyX: -3, breathY: -2 },
    { bodyX: -1, breathY: -1 },
  ],
  dying: [
    { breathY: 2, bodyX: -2 },
    { breathY: 5, bodyX: -3 },
    { breathY: 9, bodyX: -3 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const nuckelaveeDrawer: EnemyFrameDrawer = {
  enemyKey: 'nuckelavee',
  canvasSize: BOSS_NUCKELAVEE_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossNuckelavee(g, frame);
  },
};

registerEnemyFrameDrawer(nuckelaveeDrawer);
