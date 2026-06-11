/**
 * Beithir — Argyll viper frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Floating/serpent
 * entity — only breathY + bodyX offsets, no legs. Walking uses
 * bodyX oscillation (±1 px) to sell the sinuous slithering motion;
 * breathY gives the coil its living sway.
 *
 * SCOTTISH_RESEARCH §1.2 (beithir, Highland serpent).
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBeithirBody, BEITHIR_CANVAS_SIZE } from '../../../art/sprites/enemies/beithir';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    // Sinuous slither — side-to-side ±1 px with vertical sway.
    { breathY: 0, bodyX: -1 },
    { breathY: -1, bodyX: 0 },
    { breathY: 0, bodyX: 1 },
    { breathY: 1, bodyX: 0 },
  ],
  hurt: [
    { bodyX: -2, breathY: -1 },
    { bodyX: -1 },
  ],
  dying: [
    // Coil uncurls and goes flat.
    { breathY: 1 },
    { breathY: 3 },
    { breathY: 5 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const beithirDrawer: EnemyFrameDrawer = {
  enemyKey: 'beithir',
  canvasSize: BEITHIR_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBeithirBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(beithirDrawer);
