/**
 * Pure animation state machine. Evaluated per tick in AnimationController
 * from game signals. No timers, no side effects, no wall-clock — hand
 * the snapshot in, get the next state back. Replay-deterministic by
 * construction.
 *
 * Transition precedence (highest first):
 *   1. hp <= 0 → dying
 *   2. hurtEdge → hurt
 *   3. attackEdge → attacking
 *   4. celebrateEdge → celebrating
 *   5. velocityMag above threshold → walking
 *   6. velocity below threshold → idle
 *
 * `dying` is terminal — once entered, stays there until the entity is
 * destroyed.
 */

export type AnimationState =
  | 'idle'
  | 'walking'
  | 'attacking'
  | 'hurt'
  | 'celebrating'
  | 'dying';

export interface AnimationSignals {
  /** Length of the entity's velocity vector, in px/s. */
  readonly velocityMag: number;
  /** True on the frame a takeDamage fired. */
  readonly hurtEdge: boolean;
  /** True on the frame a melee weapon fired. */
  readonly attackEdge: boolean;
  /** True on the frame a celebration event fired (boss kill, level up). */
  readonly celebrateEdge: boolean;
  /** Current HP. 0 triggers dying; entity cleans up separately. */
  readonly hp: number;
}

/**
 * Minimum velocity magnitude (px/s) for an entity to count as "walking".
 * Below this it idles. Value chosen to match Player.ts normal movement
 * baseline (~150 px/s min) with headroom for drift micro-jitter.
 */
export const WALKING_VELOCITY_THRESHOLD = 20;

export function evaluateAnimationState(
  current: AnimationState,
  signals: AnimationSignals,
): AnimationState {
  if (current === 'dying') return 'dying';
  if (signals.hp <= 0) return 'dying';
  if (signals.hurtEdge) return 'hurt';
  if (signals.attackEdge) return 'attacking';
  if (signals.celebrateEdge) return 'celebrating';
  if (signals.velocityMag >= WALKING_VELOCITY_THRESHOLD) return 'walking';
  return 'idle';
}
