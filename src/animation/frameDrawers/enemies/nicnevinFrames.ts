/**
 * Nicnevin, Queen of the Witches — N1 Tier-2 Mythos boss frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Floating court entity
 * — breathY gives the gown its unsettled hover; she does not stride, she
 * drifts. Hurt recoil is subtle (a queen does not flinch easily). Dying
 * collapses the hovering silhouette downward.
 *
 * SCOTTISH_RESEARCH §1.3 / SCOTTISH_RESEARCH_DEEP Part 22.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBossNicnevin, BOSS_NICNEVIN_CANVAS_SIZE } from '../../../art/sprites/bosses/nicnevin';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },
    { breathY: -1 },
  ],
  walking: [
    // Slow deliberate drift — she does not walk, she processes.
    { breathY: 0, bodyX: 1 },
    { breathY: -1, bodyX: 1 },
    { breathY: 0, bodyX: 0 },
    { breathY: 1, bodyX: 0 },
  ],
  hurt: [
    { bodyX: -2, breathY: -2 },  // queen's recoil — sharp but brief
    { bodyX: -1, breathY: -1 },
  ],
  dying: [
    // The crown falls, the gown collapses into smoke.
    { breathY: 2, bodyX: -1 },
    { breathY: 4, bodyX: -2 },
    { breathY: 7, bodyX: -2 },
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const nicnevinDrawer: EnemyFrameDrawer = {
  enemyKey: 'nicnevin',
  canvasSize: BOSS_NICNEVIN_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBossNicnevin(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(nicnevinDrawer);
