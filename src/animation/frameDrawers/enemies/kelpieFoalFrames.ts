/**
 * Kelpie Foal — flee archetype frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Young water-horse
 * with four legs — front pair = leftLegY, back pair = rightLegY.
 * Gentler animal offsets.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawKelpieFoalBody, KELPIE_FOAL_CANVAS_SIZE } from '../../../art/sprites/enemies/kelpieFoal';
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
    { breathY: -1, leftLegY: 0, rightLegY: 0 },
  ],
  hurt: [
    { bodyX: -1, breathY: 1 },
    { bodyX: 0 },
  ],
  dying: [
    { breathY: 1, bodyX: -1 },
    { breathY: 3, leftLegY: 2, rightLegY: 2 },
    { breathY: 5, leftLegY: 3, rightLegY: 3 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const kelpieFoalDrawer: EnemyFrameDrawer = {
  enemyKey: 'kelpie_foal',
  canvasSize: KELPIE_FOAL_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawKelpieFoalBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(kelpieFoalDrawer);
