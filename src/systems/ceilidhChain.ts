/**
 * Ceilidh Chain Combo — pure helper for the "every Nth kill in a
 * streak triggers a callout" mechanic (DESIGN_IDEAS.md, §1).
 *
 * Kept separate from JuiceSystem so the trigger math can be unit-
 * tested without Phaser. JuiceSystem imports this + adds the side-
 * effects (magnet grant, toast, caption).
 */

/** Period between ceilidh pulses — every Nth kill in a combo. */
export const CEILIDH_PULSE_PERIOD = 8;

/**
 * True when `comboCount` is a ceilidh pulse moment — a multiple of
 * `CEILIDH_PULSE_PERIOD` starting at `CEILIDH_PULSE_PERIOD` itself
 * (so the very first pulse is at combo 8, not combo 0).
 *
 * Fractional / negative / non-finite inputs return false — guards
 * against buggy callers rather than silently triggering.
 */
export function isCeilidhPulseMoment(comboCount: number): boolean {
  if (!Number.isInteger(comboCount)) return false;
  if (comboCount < CEILIDH_PULSE_PERIOD) return false;
  return comboCount % CEILIDH_PULSE_PERIOD === 0;
}

/** Pulse magnet radius bonus (flat pixels). Matches a moor moment grant. */
export const CEILIDH_MAGNET_FLAT_PX = 40;
/** How long the magnet pulse lasts. */
export const CEILIDH_MAGNET_DURATION_MS = 2000;
