/**
 * Midgie Swarm — living cloud frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Attacking and
 * celebrating fall back to idle_0 — enemies don't use those states.
 *
 * Amorphous swarm — only breathY + bodyX offsets.
 * Idle: cloud pulse. Walking: drifting. Dying: cloud disperses.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawMidgieSwarmBody, MIDGIE_SWARM_CANVAS_SIZE } from '../../../art/sprites/enemies/midgieSwarm';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },    // cloud expands
    { breathY: -1 },   // cloud contracts
  ],
  walking: [
    { breathY: 0, bodyX: 1 },    // drift right
    { breathY: -1, bodyX: 1 },   // drift right-up
    { breathY: 0 },              // neutral
    { breathY: 1 },              // drift down
  ],
  hurt: [
    { bodyX: -2, breathY: -1 },   // swarm recoils
    { bodyX: -1 },                 // reform
  ],
  dying: [
    { breathY: 1 },                // cloud swells
    { breathY: -2, bodyX: 2 },    // dispersal burst
    { breathY: 4 },               // fades out
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const midgieSwarmDrawer: EnemyFrameDrawer = {
  enemyKey: 'midgie_swarm',
  canvasSize: MIDGIE_SWARM_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawMidgieSwarmBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(midgieSwarmDrawer);
