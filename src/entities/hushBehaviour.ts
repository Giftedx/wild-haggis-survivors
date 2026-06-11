/**
 * Hush behaviour — pure state machine for the Black Douglas post-bell boss.
 *
 * "Hush ye, hush ye, little pet ye, / Hush ye, hush ye, do not fret ye, /
 * The Black Douglas shall not get ye." — English mothers' lullaby, c.15th C.
 *
 * The Black Douglas was feared for sudden, fast raids deep into English
 * territory. His mechanic reflects that: fastest boss in the timeline
 * (130 px/s) plus a periodic fear-shout (HUSH_CADENCE_MS) that deals
 * moderate damage and applies a 1.5 s net-slow to the player.
 *
 * Pure helper — no Phaser types, no scene state. The caller (Enemy.ts
 * behaviorHush) supplies the tick input and reads the output to drive
 * scene-side effects (AoE ring, applyNetSlow, damage).
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §6.3 (Black Douglas / border raids);
 * DESIGN_IDEAS.md §6 (boss pipeline — post-bell exclusive).
 */

/** ms between hush shouts. */
export const HUSH_CADENCE_MS = 4000;
/** ms of telegraph before the shout deals damage. */
export const HUSH_TELEGRAPH_MS = 600;
/** AoE radius of the fear pulse (px). */
export const HUSH_RADIUS_PX = 220;
/** Damage dealt by a hush pulse. */
export const HUSH_DAMAGE = 18;
/** Duration of the player slow applied by the hush. */
export const HUSH_SLOW_MS = 1500;

export interface HushState {
  readonly msSinceLastShout: number;
  /**
   * When true: the telegraph ring has fired but the damage hasn't
   * landed yet. The caller fires the ring visual on the same tick
   * that `telegraphing` first becomes true, then waits
   * `HUSH_TELEGRAPH_MS` before applying damage.
   */
  readonly telegraphing: boolean;
  readonly msTelegraphElapsed: number;
  /** Fires for exactly one tick when the damage should land. */
  readonly shouldDamage: boolean;
}

export interface HushTickInput {
  readonly deltaMs: number;
}

export function initialHushState(): HushState {
  return {
    msSinceLastShout: 0,
    telegraphing: false,
    msTelegraphElapsed: 0,
    shouldDamage: false,
  };
}

export function simulateHushBehaviour(
  prev: HushState,
  input: HushTickInput,
): HushState {
  if (prev.telegraphing) {
    const elapsed = prev.msTelegraphElapsed + input.deltaMs;
    const shouldDamage = elapsed >= HUSH_TELEGRAPH_MS;
    return {
      msSinceLastShout: 0,
      telegraphing: !shouldDamage,
      msTelegraphElapsed: shouldDamage ? 0 : elapsed,
      shouldDamage,
    };
  }

  const acc = prev.msSinceLastShout + input.deltaMs;
  if (acc >= HUSH_CADENCE_MS) {
    return {
      msSinceLastShout: 0,
      telegraphing: true,
      msTelegraphElapsed: 0,
      shouldDamage: false,
    };
  }

  return {
    msSinceLastShout: acc,
    telegraphing: false,
    msTelegraphElapsed: 0,
    shouldDamage: false,
  };
}
