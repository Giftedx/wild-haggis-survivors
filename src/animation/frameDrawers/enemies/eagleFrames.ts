/**
 * Eagle — dive archetype frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). No leg offsets —
 * the eagle is a bird with talons, so the entire body (including
 * talons) shifts with bodyX/breathY.
 *
 * The walk cycle reads as a soaring glide — forward lean + slight
 * altitude bob rather than a terrestrial stride.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawEagleBody, EAGLE_CANVAS_SIZE } from '../../../art/sprites/enemies/eagle';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },    // thermal dip
    { breathY: -1 },   // thermal rise
  ],
  walking: [
    { breathY: 0, bodyX: 1 },    // glide forward
    { breathY: -1, bodyX: 2 },   // committed lean
    { breathY: 0, bodyX: 1 },    // level off
    { breathY: 1, bodyX: 0 },    // slight pull-up between beats
  ],
  hurt: [
    { bodyX: -3, breathY: -2 },  // flinch up and back (wing tuck)
    { bodyX: -1, breathY: -1 },  // recover
  ],
  dying: [
    { breathY: 1, bodyX: -1 },   // stall
    { breathY: 4, bodyX: -2 },   // tumble
    { breathY: 7 },              // drop
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const eagleDrawer: EnemyFrameDrawer = {
  enemyKey: 'eagle',
  canvasSize: EAGLE_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawEagleBody(g, frame);
  },
};

registerEnemyFrameDrawer(eagleDrawer);
