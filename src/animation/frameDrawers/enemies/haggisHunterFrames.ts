/**
 * Haggis Hunter — ranged archetype frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Attacking and
 * celebrating fall back to idle_0 — enemies don't use those states.
 *
 * The hunter's walk is a stiff rural stride — wellies don't flex
 * much, so the leg shuffle is modest. The net-pole sways with the
 * body via breathY.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawHaggisHunterBody, HAGGIS_HUNTER_CANVAS_SIZE } from '../../../art/sprites/enemies/haggisHunter';
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
    { bodyX: -2, breathY: 2 },
    { bodyX: -1, breathY: 1 },
  ],
  dying: [
    { breathY: 1, bodyX: -1 },
    { breathY: 3, leftLegY: 2, rightLegY: 2 },
    { breathY: 6, leftLegY: 4, rightLegY: 4 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const haggisHunterDrawer: EnemyFrameDrawer = {
  enemyKey: 'haggis_hunter',
  canvasSize: HAGGIS_HUNTER_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawHaggisHunterBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(haggisHunterDrawer);
