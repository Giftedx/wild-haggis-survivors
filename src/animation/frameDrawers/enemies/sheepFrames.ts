/**
 * Sheep (Scottish Blackface ram) — chase archetype frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Four legs in two
 * pairs: front pair uses leftLegY, back pair uses rightLegY. The
 * ram trots with a stiff-legged gait — heavy wool doesn't bounce.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawSheepBody, SHEEP_CANVAS_SIZE } from '../../../art/sprites/enemies/sheep';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },   // wool settles
    { breathY: -1 },   // wool lifts
  ],
  walking: [
    { breathY: 0, leftLegY: -2, rightLegY: 1 },   // front stride, back planted
    { breathY: -1, leftLegY: -1, rightLegY: 0 },   // passing
    { breathY: 0, leftLegY: 1, rightLegY: -2 },    // back stride, front planted
    { breathY: -1, leftLegY: 0, rightLegY: -1 },   // passing
  ],
  hurt: [
    { bodyX: -2, breathY: 1 },   // flinch back + compress
    { bodyX: -1 },                // recover
  ],
  dying: [
    { breathY: 1, bodyX: -1 },                      // stagger
    { breathY: 4, leftLegY: 3, rightLegY: 3 },      // buckle
    { breathY: 6, leftLegY: 4, rightLegY: 4 },      // down
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const sheepDrawer: EnemyFrameDrawer = {
  enemyKey: 'sheep',
  canvasSize: SHEEP_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawSheepBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(sheepDrawer);
