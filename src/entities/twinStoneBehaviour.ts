/**
 * Twin Stones of Callanish — post-bell boss behaviour (pure state machine).
 *
 * Two of the "Fir Bhreige" (False Men) of Callanish, Isle of Lewis: a
 * petrified giant race turned to stone for refusing baptism. They share
 * one heartstone buried beneath the circle's floor — one fate between
 * them. The haggis walks into a stone circle that has been waiting since
 * before memory.
 *
 * Phase 1 (HP > TWIN_PHASE2_HP_THRESHOLD):
 *   Chase. Every TWIN_RING_CADENCE_MS: a 6-shard ring burst from both
 *   the main stone and the orbiting shadow stone (shadow fires 1 s later).
 *
 * Phase 2 (HP ≤ TWIN_PHASE2_HP_THRESHOLD):
 *   Speed ×1.5. Shadow flanks perpendicular to the player direction.
 *   Every TWIN_FAN_CADENCE_MS: 3-shard fan from both stones simultaneously.
 *
 * Post-bell exclusive. Refs: SCOTTISH_RESEARCH.md §1.8 (Callanish).
 */

export const TWIN_PHASE2_HP_THRESHOLD = 0.55;

// Phase 1 — ring burst from both stone positions
export const TWIN_RING_CADENCE_MS = 7000;
export const TWIN_RING_SHARD_COUNT = 6;
export const TWIN_RING_SHARD_SPEED = 200;
export const TWIN_RING_SHARD_DAMAGE = 14;

// Phase 2 — fan toward player from both stone positions
export const TWIN_FAN_CADENCE_MS = 4200;
export const TWIN_FAN_SHARD_COUNT = 3;
export const TWIN_FAN_SHARD_SPEED = 260;
export const TWIN_FAN_SHARD_DAMAGE = 18;
export const TWIN_FAN_SPREAD_RAD = Math.PI / 5; // 36° total spread

// Shadow stone positioning
export const TWIN_SHADOW_ORBIT_RAD_PER_SEC = 0.75;
export const TWIN_SHADOW_ORBIT_RADIUS = 110;
export const TWIN_SHADOW_FLANK_DIST = 150;

// Delay between main and shadow ring fire (ms)
export const TWIN_SHADOW_RING_DELAY_MS = 1000;

export interface TwinStoneState {
  readonly phase: 1 | 2;
  readonly msSinceLastAttack: number;
  readonly speedMul: number;
  readonly shouldFireRing: boolean;
  readonly shouldFireFan: boolean;
}

export interface TwinStoneTickInput {
  readonly deltaMs: number;
  readonly hpPct: number;
}

export function initialTwinStoneState(): TwinStoneState {
  return {
    phase: 1,
    msSinceLastAttack: 0,
    speedMul: 1.0,
    shouldFireRing: false,
    shouldFireFan: false,
  };
}

export function simulateTwinStoneBehaviour(
  prev: TwinStoneState,
  input: TwinStoneTickInput,
): TwinStoneState {
  const { deltaMs, hpPct } = input;

  const phase: 1 | 2 = hpPct <= TWIN_PHASE2_HP_THRESHOLD ? 2 : 1;
  const speedMul = phase === 2 ? 1.5 : 1.0;
  const phaseChanged = phase !== prev.phase;
  const cadenceMs = phase === 1 ? TWIN_RING_CADENCE_MS : TWIN_FAN_CADENCE_MS;

  // Phase transition gives the player a beat before the new attack cadence.
  const msSinceLastAttack = phaseChanged ? deltaMs : prev.msSinceLastAttack + deltaMs;
  const fired = !phaseChanged && msSinceLastAttack >= cadenceMs;
  const nextMs = fired ? msSinceLastAttack - cadenceMs : msSinceLastAttack;

  return {
    phase,
    msSinceLastAttack: nextMs,
    speedMul,
    shouldFireRing: fired && phase === 1,
    shouldFireFan: fired && phase === 2,
  };
}
