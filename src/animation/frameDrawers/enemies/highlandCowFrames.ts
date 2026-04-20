/**
 * Highland Cow — tank archetype frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Attacking and
 * celebrating fall back to idle_0 — enemies don't use those states.
 *
 * The cow's walk is a heavy lumbering gait — big body sway, slow
 * leg shuffle. Hurt flinch is smaller (bodyX: -1 not -2) because
 * it's a tank — doesn't flinch as hard.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawHighlandCowBody, HIGHLAND_COW_CANVAS_SIZE } from '../../../art/sprites/enemies/highlandCow';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },   // breathing in — heavy chest rise
    { breathY: -1 },   // breathing out
  ],
  walking: [
    { breathY: 0, leftLegY: -1, rightLegY: 1 },   // contact L
    { breathY: -1, leftLegY: 0, rightLegY: 0 },    // passing
    { breathY: 0, leftLegY: 1, rightLegY: -1 },    // contact R
    { breathY: -1, leftLegY: 0, rightLegY: 0 },    // passing
  ],
  hurt: [
    { bodyX: -1, breathY: 1 },   // flinch (small — tank)
    { bodyX: 0 },                 // recover
  ],
  dying: [
    { breathY: 1, bodyX: -1 },                      // stagger
    { breathY: 3, leftLegY: 2, rightLegY: 2 },      // buckle
    { breathY: 5, leftLegY: 3, rightLegY: 3 },      // down
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const highlandCowDrawer: EnemyFrameDrawer = {
  enemyKey: 'highland_cow',
  canvasSize: HIGHLAND_COW_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawHighlandCowBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(highlandCowDrawer);
