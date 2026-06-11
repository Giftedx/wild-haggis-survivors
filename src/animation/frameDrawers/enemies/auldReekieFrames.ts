/**
 * Auld Reekie Ghaist — ghost boss frame definitions.
 *
 * A ghost floats rather than walks — `breathY` drives the hover bob,
 * `bodyX` drives the hurt flinch. No leg offsets needed.
 *
 * Idle:    slow hover pulse (2fps, 2 frames). Ghost rests at a low bob.
 * Walking: agitated hover as it closes on the player (24fps, 4 frames,
 *          faster oscillation selling spectral urgency).
 * Hurt:    spectral flinch — the body blurs sideways, snaps back.
 * Dying:   sinks through the floor, hat last.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawAuldReekieBody, AULD_REEKIE_CANVAS_SIZE } from '../../../art/sprites/bosses/auldReekie';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 2 },    // ghost sinks — at rest low
    { breathY: -1 },   // ghost rises — slow hover cycle
  ],
  walking: [
    { breathY: 1 },    // closing — forward lean
    { breathY: -1 },   // lifting
    { breathY: 2 },    // sinking — weight of pursuit
    { breathY: 0 },    // neutral
  ],
  hurt: [
    { bodyX: -3, breathY: 1 },   // spectral lurch — the ghost billows backward
    { bodyX: -1 },                // recoil snap
  ],
  dying: [
    { breathY: 3, bodyX: -1 },   // stagger — disbelief
    { breathY: 7 },               // sinking into cobbles
    { breathY: 12 },              // gone — only the hat brim visible at canvas edge
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const auldReekieDrawer: EnemyFrameDrawer = {
  enemyKey: 'auld_reekie',
  canvasSize: AULD_REEKIE_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawAuldReekieBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(auldReekieDrawer);
