/**
 * Midge — hovering insect frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Attacking and
 * celebrating fall back to idle_0 — enemies don't use those states.
 *
 * Flying insect — only breathY + bodyX offsets, no legs.
 * Idle: tight hover buzz. Walking: dart. Dying: wings fail, drops.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawMidgeBody, MIDGE_CANVAS_SIZE } from '../../../art/sprites/enemies/midge';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: -1 },   // hover up
    { breathY: 1 },    // hover down
  ],
  walking: [
    { breathY: -1, bodyX: -1 },   // dart left-up
    { breathY: 1, bodyX: 1 },     // dart right-down
    { breathY: 0, bodyX: 0 },     // neutral
    { breathY: -1, bodyX: -1 },   // dart left-up
  ],
  hurt: [
    { bodyX: -3, breathY: -1 },   // snap away
    { bodyX: -1 },                 // recover
  ],
  dying: [
    { breathY: -2 },               // wings still beating
    { breathY: 1, bodyX: 2 },     // spiraling
    { breathY: 5 },                // drops
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const midgeDrawer: EnemyFrameDrawer = {
  enemyKey: 'midge',
  canvasSize: MIDGE_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawMidgeBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(midgeDrawer);
