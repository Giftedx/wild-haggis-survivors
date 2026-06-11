/**
 * Shared per-frame offset interface for enemy animation. Same concept
 * as HaggisBodyFrame — small positional tweaks per frame that sell the
 * animation beat without redrawing the full sprite shape.
 *
 * Every enemy drawer accepts these offsets and shifts its internal cx/cy
 * anchor accordingly. Defaults to 0 for all fields.
 */

import type { AnimationState } from '../../animationStates';

export interface EnemyBodyFrame {
  /** Body vertical offset (px). Positive = sinks (breathing in). */
  readonly breathY?: number;
  /** Whole-body horizontal offset (px). Used for hurt-flinch. */
  readonly bodyX?: number;
  /** Left leg vertical offset (px). Walking shuffle. */
  readonly leftLegY?: number;
  /** Right leg vertical offset (px). Walking shuffle. */
  readonly rightLegY?: number;
}

/**
 * A frame drawer for one enemy type. Maps (state, frame) -> the offset
 * to pass to the enemy's draw function. States not in the map fall back
 * to idle frame 0 (same pattern as accessory drawers).
 */
export interface EnemyFrameDrawer {
  /** Enemy texture key (e.g. 'buckfast_ned'). */
  readonly enemyKey: string;
  /** Canvas size the original bake function uses. */
  readonly canvasSize: number;
  /** States with authored frames. Others fall back to idle_0. */
  readonly authoredStates: ReadonlySet<AnimationState>;
  /** Get the offset for a specific state + frame index. */
  getFrame(state: AnimationState, frame: number): EnemyBodyFrame;
  /** Draw the enemy body into the given Graphics at the given offset. */
  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void;
}
