/**
 * HUD dash indicator — palette + pulse animation helpers.
 *
 * Two orthogonal axes drive the dash label colour:
 *   - ready / on cooldown (the "state")
 *   - normal / high-contrast palette (accessibility)
 *
 * Four colours total, pinned as named constants so a palette edit
 * touches one file.
 *
 * Pulse runs on a phase number that advances 0.1 rad/frame while
 * dash is ready. Scene holds the phase; helpers read (phase, ready)
 * and return the scale + alpha to apply to each full pip.
 */

export const DASH_COLOR_READY = '#ffcc44';
export const DASH_COLOR_READY_HC = '#ffe68a';
export const DASH_COLOR_COOLING = '#7a6a3a';
export const DASH_COLOR_COOLING_HC = '#8a7a4a';

/** Amount the dash-pulse phase advances per HUD tick while ready. */
export const DASH_PULSE_PHASE_STEP = 0.1;
/** Scale amplitude — full pip scale cycles inside [1 - A, 1 + A]. */
export const DASH_PULSE_SCALE_AMPLITUDE = 0.12;
/** Alpha floor (cooling): full pips fade in toward 1.0 on ready. */
export const DASH_PULSE_ALPHA_CENTER = 0.75;
export const DASH_PULSE_ALPHA_AMPLITUDE = 0.25;

/** Prefix + suffix text colour chooser. */
export function dashLabelColor(ready: boolean, highContrast: boolean): string {
  if (ready) return highContrast ? DASH_COLOR_READY_HC : DASH_COLOR_READY;
  return highContrast ? DASH_COLOR_COOLING_HC : DASH_COLOR_COOLING;
}

/** Scale multiplier for a full pip given the current pulse phase. */
export function dashPulseScale(ready: boolean, phase: number): number {
  if (!ready) return 1;
  return 1 + Math.sin(phase) * DASH_PULSE_SCALE_AMPLITUDE;
}

/** Alpha for a full pip given the current pulse phase. */
export function dashPulseAlpha(ready: boolean, phase: number): number {
  if (!ready) return 1;
  return DASH_PULSE_ALPHA_CENTER + Math.sin(phase) * DASH_PULSE_ALPHA_AMPLITUDE;
}
