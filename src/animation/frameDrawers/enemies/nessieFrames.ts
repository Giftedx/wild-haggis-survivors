/**
 * Nessie, Reconsidered — post-bell loch-emergence boss frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Aquatic creature —
 * breathY gives the neck its surface-breaking undulation; bodyX sells
 * the tracking sway as the creature locks onto its target.
 *
 * SCOTTISH_RESEARCH §1.2; SCOTTISH_RESEARCH_DEEP.md §21.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossNessie, BOSS_NESSIE_CANVAS_SIZE } from '../../../art/sprites/bosses/nessie';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    // Neck sways as the creature glides through the water.
    { breathY: 0, bodyX: 1 },
    { breathY: -1, bodyX: 1 },
    { breathY: 0, bodyX: 0 },
    { breathY: 1, bodyX: 0 },
  ],
  hurt: [
    { bodyX: -2, breathY: -2 },
    { bodyX: -1, breathY: -1 },
  ],
  dying: [
    // The neck sinks back below the surface.
    { breathY: 2, bodyX: -1 },
    { breathY: 5, bodyX: -1 },
    { breathY: 8, bodyX: 0 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const nessieDrawer: EnemyFrameDrawer = {
  enemyKey: 'nessie',
  canvasSize: BOSS_NESSIE_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossNessie(g, frame);
  },
};

registerEnemyFrameDrawer(nessieDrawer);
