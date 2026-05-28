/**
 * Berserker — rage-scaling chase variant frame definitions.
 *
 * Reuses `drawAngryScotsmanBody` (same visual — berserker IS an angry
 * scotsman that's been hit too many times). Frame offsets are heavier
 * and wider than the base angry_scotsman drawer to sell bulk and fury:
 * bigger chest heave, wider stomp stride, more violent hurt flinch,
 * harder fall on dying.
 *
 * The berserker's speed scales with HP loss (`berserkerSpeedMul` in
 * Enemy.ts) — the animation reads as increasingly frenzied through the
 * combination of faster frame rate (driven by the speed mul) and the
 * heavier offset design here.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawAngryScotsmanBody, ANGRY_SCOTSMAN_CANVAS_SIZE } from '../../../art/sprites/enemies/angryScotsman';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 2 },    // heavier chest heave — more rage-breath than scotsman
    { breathY: -1 },
  ],
  walking: [
    { breathY: 0, leftLegY: -3, rightLegY: 2 },    // wider stomp — contact L
    { breathY: -1, leftLegY: -1, rightLegY: 0 },
    { breathY: 0, leftLegY: 2, rightLegY: -3 },    // wider stomp — contact R
    { breathY: -1, leftLegY: 0, rightLegY: -1 },
  ],
  hurt: [
    { bodyX: -3, breathY: 2 },   // bigger flinch — more mass resisting the hit
    { bodyX: -1, breathY: 1 },   // slower recovery
  ],
  dying: [
    { breathY: 2, bodyX: -2 },                      // heavier stagger
    { breathY: 5, leftLegY: 4, rightLegY: 4 },      // heavy buckle
    { breathY: 8, leftLegY: 6, rightLegY: 6 },      // hard down
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const berserkerDrawer: EnemyFrameDrawer = {
  enemyKey: 'berserker',
  canvasSize: ANGRY_SCOTSMAN_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawAngryScotsmanBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(berserkerDrawer);
