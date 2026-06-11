/**
 * Traffic Cone Totem — bound-cone cairn frame definitions.
 *
 * A `speed: 0` static enemy (it never chases — the roadworks come to YOU)
 * that can still be hurt and killed (hp 45). So three states are authored:
 * idle, hurt, dying — but NOT walking, because the totem is rooted.
 *
 *  - idle:   a slow 1 px strain-bob — the bound cones flex against their
 *            ropes, smoke wisping off the top-cone head. "Animated and
 *            wants a fight" (per the sprite's own design note).
 *  - hurt:   the whole stack jolts back when struck.
 *  - dying:  the cairn topples — leans hard, sinks, comes apart. The
 *            EnemyKillHandler collapse (cones spat outward) takes over
 *            once the death frames finish.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import {
  drawTrafficConeTotemBody,
  TRAFFIC_CONE_TOTEM_CANVAS_SIZE,
} from '../../../art/sprites/enemies/trafficConeTotem';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 0 },               // rest
    { breathY: -1, bodyX: 0.5 },  // strain — leans against the bindings
  ],
  hurt: [
    { bodyX: -2, breathY: 1 },    // jolt back + compress
    { bodyX: -1 },                // settle
  ],
  dying: [
    { breathY: 2, bodyX: -1 },    // tip
    { breathY: 5, bodyX: -3 },    // topple
    { breathY: 8, bodyX: -5 },    // down — about to spit its cones
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const trafficConeTotemDrawer: EnemyFrameDrawer = {
  enemyKey: 'traffic_cone_totem',
  canvasSize: TRAFFIC_CONE_TOTEM_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawTrafficConeTotemBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(trafficConeTotemDrawer);
