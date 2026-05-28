/**
 * Spectre Legionary — ghost Roman soldier minion frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Attacking and
 * celebrating fall back to idle_0 — enemies don't use those states.
 *
 * Ghost archetype — only breathY + bodyX offsets, no legs.
 * Stiff military bearing even in death; floats with parade-ground drift.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawSpectreLegionry, SPECTRE_LEGIONARY_CANVAS_SIZE } from '../../../art/sprites/bosses/ninthLegion';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },    // at attention, slight settle
    { breathY: -1 },   // rise
  ],
  walking: [
    { breathY: 0, bodyX: 1 },     // march right
    { breathY: -1, bodyX: 0 },    // rise
    { breathY: 0, bodyX: -1 },    // march left
    { breathY: 1, bodyX: 0 },     // settle
  ],
  hurt: [
    { bodyX: -2, breathY: -1 },   // flinch
    { bodyX: -1 },                 // recover
  ],
  dying: [
    { breathY: 1 },               // dissolving
    { breathY: 3, bodyX: 1 },     // dispersing
    { breathY: 5 },              // fades
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const spectreLegionaryDrawer: EnemyFrameDrawer = {
  enemyKey: 'spectre_legionary',
  canvasSize: SPECTRE_LEGIONARY_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawSpectreLegionry(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(spectreLegionaryDrawer);
