/**
 * Pure state machine for the Cailleach boss's `'wail'` behaviour.
 * The Enemy class composes this each frame to decide whether to fire
 * a lance, fire the one-shot pulse, or neither.
 *
 * Slow chase + ice-lance projectile every 4 s + one-shot 600 px radial
 * slow-pulse at 50 % HP. Spec:
 * `docs/archive/superpowers/specs/2026-05-22-moor-remembers-v2-design.md`.
 */
export const WAIL_LANCE_CADENCE_MS = 4000;
export const WAIL_PULSE_RADIUS_PX = 600;
export const WAIL_PULSE_HP_THRESHOLD_PCT = 0.5;
export const WAIL_PULSE_SLOW_MUL = 0.4;
export const WAIL_PULSE_SLOW_DURATION_MS = 2000;
export const WAIL_PULSE_DAMAGE = 30;
export const WAIL_ICE_LANCE_DAMAGE = 18;
export const WAIL_ICE_LANCE_SPEED = 320;

export interface WailState {
  readonly msSinceLastLance: number;
  readonly hasWailed: boolean;
  readonly shouldFireLance?: boolean;
  readonly shouldFireWail?: boolean;
}

export interface WailTickInput {
  readonly deltaMs: number;
  readonly hpPct: number;
}

export function initialWailState(): WailState {
  return { msSinceLastLance: 0, hasWailed: false };
}

export function simulateWailBehaviour(
  prev: WailState,
  input: WailTickInput,
): WailState {
  const acc = prev.msSinceLastLance + input.deltaMs;
  const shouldFireLance = acc >= WAIL_LANCE_CADENCE_MS;
  const shouldFireWail =
    !prev.hasWailed && input.hpPct <= WAIL_PULSE_HP_THRESHOLD_PCT;
  return {
    msSinceLastLance: shouldFireLance ? 0 : acc,
    hasWailed: prev.hasWailed || shouldFireWail,
    shouldFireLance,
    shouldFireWail,
  };
}
