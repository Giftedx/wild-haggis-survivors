/**
 * Ninth Legion Centurion — post-bell wave-boss frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Spectral Roman
 * centurion — breathY gives the mist-hem its drift; bodyX sells
 * the gladius-forward advance. The ghost commander still walks
 * in formation even three millennia later.
 *
 * SCOTTISH_RESEARCH_DEEP.md §6.1 (Legio IX Hispana disappearance).
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossNinthLegion, BOSS_NINTH_LEGION_CANVAS_SIZE } from '../../../art/sprites/bosses/ninthLegion';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    // March step — disciplined even as a ghost.
    { breathY: 0, bodyX: 1 },
    { breathY: -1, bodyX: 1 },
    { breathY: 0, bodyX: 0 },
    { breathY: 1, bodyX: 0 },
  ],
  hurt: [
    { bodyX: -2, breathY: -2 },
    { bodyX: -1, breathY: -1 },
  ],
  dying: [
    { breathY: 2, bodyX: -1 },
    { breathY: 5, bodyX: -2 },
    { breathY: 8, bodyX: -3 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const ninthLegionDrawer: EnemyFrameDrawer = {
  enemyKey: 'ninth_legion',
  canvasSize: BOSS_NINTH_LEGION_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossNinthLegion(g, frame);
  },
};

registerEnemyFrameDrawer(ninthLegionDrawer);
