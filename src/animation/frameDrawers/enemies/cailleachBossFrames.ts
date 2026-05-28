/**
 * Cailleach (boss) — Cailleach Gauntlet endgame boss frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Floating winter-crone —
 * breathY gives the frost-cloak its hover; bodyX sells the ice-lance
 * approach. The `wail` behaviour slow-chases + fires ice lances every 4 s.
 * Animation should feel inevitable and cold.
 *
 * SCOTTISH_RESEARCH §1.3 / The Moor Remembers V2.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossCailleach, BOSS_CAILLEACH_CANVAS_SIZE } from '../../../art/sprites/bosses/cailleachBoss';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    // Cold, deliberate. Slower than most bosses — wail behaviour is slow chase.
    { breathY: 0, bodyX: 1 },
    { breathY: -2, bodyX: 1 },
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
    { breathY: 9, bodyX: -2 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const cailleachBossDrawer: EnemyFrameDrawer = {
  enemyKey: 'cailleach_boss',
  canvasSize: BOSS_CAILLEACH_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossCailleach(g, frame);
  },
};

registerEnemyFrameDrawer(cailleachBossDrawer);
