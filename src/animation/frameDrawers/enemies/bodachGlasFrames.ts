/**
 * Bodach Glas — the Grey Old Man of Ben Macdui, frost biome walker.
 *
 * 4 authored states (idle, walking, hurt, dying). Uses breathY for
 * the slow cloak-sway and leftLegY / rightLegY for the deliberate
 * stride. Speed 35 is the slowest chase enemy — the dread is the
 * inevitability, not the sprint. Stride kept to ±1 px (half the
 * Cu Sith's ±2) to reflect that plodding gait.
 *
 * SCOTTISH_RESEARCH §1.2 (Bodach Glas, grey man of Ben Macdui).
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { BODACH_GLAS_CANVAS_SIZE, drawBodachGlasBody } from '../../../art/sprites/enemies/bodachGlas';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    // Slow, deliberate stride — ±1 px, cloak sways with the step.
    { breathY: 0, leftLegY: -1, rightLegY: 1 },
    { breathY: -1, leftLegY: 0, rightLegY: 0 },
    { breathY: 0, leftLegY: 1, rightLegY: -1 },
    { breathY: 1, leftLegY: 0, rightLegY: 0 },
  ],
  hurt: [
    { bodyX: -2, breathY: -1 },  // recoil — the grey man doesn't flinch often
    { bodyX: -1 },
  ],
  dying: [
    // Sinks and lists — the staff no longer holds him.
    { breathY: 1, bodyX: -1 },
    { breathY: 3, bodyX: -2 },
    { breathY: 5, bodyX: -2 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const bodachGlasDrawer: EnemyFrameDrawer = {
  enemyKey: 'bodach_glas',
  canvasSize: BODACH_GLAS_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBodachGlasBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(bodachGlasDrawer);
