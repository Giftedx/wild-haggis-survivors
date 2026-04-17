/**
 * Pure helper for the HUD weapon slot's breathing / cooling animation.
 *
 * When the weapon's cooldown bar is full (`isReady = true`), the icon
 * pulses on a sine curve so the player can see at a glance that the
 * weapon is eligible to fire. Different slots pulse at different
 * phases (0.5 rad apart) so the HUD has staggered motion rather than
 * a single big breath.
 *
 * When cooling, the icon drops to a dimmed static scale / alpha.
 *
 * Phase is driven by wall-clock milliseconds so the animation runs at
 * the same visible speed regardless of frame rate (a previous
 * `+= 0.08 / frame` version ran 2× faster at 60fps vs 30fps).
 *
 * `PULSE_RATE_RAD_PER_MS = 0.0048` reproduces the old 60fps cadence
 * (0.08 rad per ~16.67ms ≈ 0.0048 rad/ms).
 */

/** Radians per millisecond — phase advance rate for the ready pulse. */
export const PULSE_RATE_RAD_PER_MS = 0.0048;
/** Phase offset per slot index — staggers the sinewave across the row. */
export const PULSE_PHASE_OFFSET_PER_SLOT = 0.5;

/** Base scale of the weapon icon (before pulse amplitude is applied). */
export const WEAPON_ICON_BASE_SCALE = 0.8;

/** Ready pulse: scale oscillates inside `[CENTER - AMP, CENTER + AMP]`. */
export const READY_PULSE_SCALE_CENTER = 0.92;
export const READY_PULSE_SCALE_AMPLITUDE = 0.08;
/** Ready pulse: alpha oscillates inside `[CENTER - AMP, CENTER + AMP]`. */
export const READY_PULSE_ALPHA_CENTER = 0.85;
export const READY_PULSE_ALPHA_AMPLITUDE = 0.15;

/** Cooling state: static dim scale factor (relative to base) and alpha. */
export const COOLING_SCALE_FACTOR = 1.0;
export const COOLING_ALPHA = 0.55;

export interface WeaponPulseState {
  /** Final scale to pass to `.setScale(...)` (already includes base). */
  scale: number;
  /** Alpha in 0..1. */
  alpha: number;
}

/**
 * Compute the weapon-slot icon scale + alpha for one HUD tick.
 * `nowMs` is a wall-clock ms value (e.g. Phaser's `scene.time.now`);
 * `slotIndex` is the zero-based slot column so adjacent slots pulse
 * out of phase.
 */
export function weaponPulseState(
  nowMs: number,
  slotIndex: number,
  isReady: boolean,
): WeaponPulseState {
  if (!isReady) {
    return {
      scale: WEAPON_ICON_BASE_SCALE * COOLING_SCALE_FACTOR,
      alpha: COOLING_ALPHA,
    };
  }
  const phase = nowMs * PULSE_RATE_RAD_PER_MS + slotIndex * PULSE_PHASE_OFFSET_PER_SLOT;
  const sin = Math.sin(phase);
  const pulse = READY_PULSE_SCALE_CENTER + sin * READY_PULSE_SCALE_AMPLITUDE;
  return {
    scale: WEAPON_ICON_BASE_SCALE * pulse,
    alpha: READY_PULSE_ALPHA_CENTER + sin * READY_PULSE_ALPHA_AMPLITUDE,
  };
}
