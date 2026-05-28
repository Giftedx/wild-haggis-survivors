/**
 * Deep Fryer — idle-only frame definitions.
 *
 * The fryer is a static hazard (behavior: 'hazard', speed: 0, hp: 9999) —
 * it never chases, is never hurt, and never dies. Only `idle` is authored.
 *
 * Two idle frames sell the oil-pressure pulse: the whole unit bobs
 * imperceptibly up and down as the superheated oil roils beneath it.
 * At idle fps 2 this is one bob per second — a barely-there shimmer
 * that reads "still hot" without distracting from the threat-glow halos.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawDeepFryerBody, DEEP_FRYER_CANVAS_SIZE } from '../../../art/sprites/enemies/deepFryer';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 0 },    // rest position
    { breathY: -1 },   // oil-pressure push — fryer lifts 1 px
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const deepFryerDrawer: EnemyFrameDrawer = {
  enemyKey: 'deep_fryer',
  canvasSize: DEEP_FRYER_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawDeepFryerBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(deepFryerDrawer);
