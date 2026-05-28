/**
 * Stoor Worm — Orcadian giant sea-serpent (manual-spawn final boss) frame
 * definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Vast serpent — breathY
 * gives the scaled body its ocean-swell undulation; bodyX sells the
 * head-tracking sweep. Scale 3.5× — the largest entity in the game.
 *
 * SCOTTISH_RESEARCH §1.1 (Assipattle / Stoor Worm of Orkney).
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossStoorWorm, BOSS_STOOR_WORM_CANVAS_SIZE } from '../../../art/sprites/bosses/stoorWorm';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 2 },
    { breathY: -2 },
  ],
  walking: [
    // Ocean-scale swell — wider than any other boss.
    { breathY: 0, bodyX: -2 },
    { breathY: -2, bodyX: 0 },
    { breathY: 0, bodyX: 2 },
    { breathY: 2, bodyX: 0 },
  ],
  hurt: [
    { bodyX: -3, breathY: -3 },
    { bodyX: -1, breathY: -1 },
  ],
  dying: [
    { breathY: 4, bodyX: -2 },
    { breathY: 8, bodyX: -3 },
    { breathY: 12, bodyX: -4 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const stoorWormDrawer: EnemyFrameDrawer = {
  enemyKey: 'stoor_worm',
  canvasSize: BOSS_STOOR_WORM_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossStoorWorm(g, frame);
  },
};

registerEnemyFrameDrawer(stoorWormDrawer);
