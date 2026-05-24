/**
 * Nessie, Reconsidered — post-bell boss behaviour (pure state machine).
 *
 * The Loch Ness Monster has had a long career as a tourist attraction, a
 * sonar anomaly, and a regional economic policy. This is none of those
 * things. This is the actual animal. It surfaces when the bell-toll makes
 * the water restless, and it is not interested in photographs.
 *
 * Phase 1 (HP > NESSIE_PHASE2_HP_THRESHOLD):
 *   Chase at surface speed. Every NESSIE_SWEEP_CADENCE_MS: a 5-shard
 *   tentacle sweep fan aimed roughly at the player direction. The neck
 *   bends to arc the sweep; shards spread across NESSIE_SWEEP_SPREAD_RAD.
 *
 * Phase 2 (HP ≤ NESSIE_PHASE2_HP_THRESHOLD):
 *   Speed ×1.5. The creature half-submerges and drives at the player —
 *   every NESSIE_PLUNGE_CADENCE_MS: a 6-shard plunge burst tight-aimed
 *   at the player (NESSIE_PLUNGE_SPREAD_RAD half-angle). Sweep stops.
 *
 * Post-bell exclusive. Refs: SCOTTISH_RESEARCH.md §1.2 (Nessie / water
 * horse legend); SCOTTISH_RESEARCH_DEEP.md §21 (Loch Ness deep lore).
 */

export const NESSIE_PHASE2_HP_THRESHOLD = 0.50;

// Phase 1 — tentacle sweep fan
export const NESSIE_SWEEP_CADENCE_MS = 6000;
export const NESSIE_SWEEP_SHARD_COUNT = 5;
export const NESSIE_SWEEP_SHARD_SPEED = 210;
export const NESSIE_SWEEP_SHARD_DAMAGE = 14;
/** Half-angle of the sweep arc (radians — ~63° total). */
export const NESSIE_SWEEP_SPREAD_RAD = Math.PI / 2.9;

// Phase 2 — plunge burst toward player
export const NESSIE_PLUNGE_CADENCE_MS = 3800;
export const NESSIE_PLUNGE_SHARD_COUNT = 6;
export const NESSIE_PLUNGE_SHARD_SPEED = 280;
export const NESSIE_PLUNGE_SHARD_DAMAGE = 18;
/** Half-angle of the plunge cone (tight — ~22° total). */
export const NESSIE_PLUNGE_SPREAD_RAD = Math.PI / 8;

export interface NessieState {
  readonly phase: 1 | 2;
  readonly msSinceLastAttack: number;
  readonly speedMul: number;
  readonly shouldFireSweep: boolean;
  readonly shouldFirePlunge: boolean;
}

export interface NessieTickInput {
  readonly deltaMs: number;
  readonly hpPct: number;
}

export function initialNessieState(): NessieState {
  return {
    phase: 1,
    msSinceLastAttack: 0,
    speedMul: 1.0,
    shouldFireSweep: false,
    shouldFirePlunge: false,
  };
}

export function simulateNessieBehaviour(
  prev: NessieState,
  input: NessieTickInput,
): NessieState {
  const { deltaMs, hpPct } = input;

  const phase: 1 | 2 = hpPct <= NESSIE_PHASE2_HP_THRESHOLD ? 2 : 1;
  const speedMul = phase === 2 ? 1.5 : 1.0;
  const phaseChanged = phase !== prev.phase;
  const cadenceMs = phase === 1 ? NESSIE_SWEEP_CADENCE_MS : NESSIE_PLUNGE_CADENCE_MS;

  // Phase transition gives the player a beat before the plunge cadence opens.
  const acc = phaseChanged ? deltaMs : prev.msSinceLastAttack + deltaMs;
  const fired = !phaseChanged && acc >= cadenceMs;
  const nextMs = fired ? acc - cadenceMs : acc;

  return {
    phase,
    msSinceLastAttack: nextMs,
    speedMul,
    shouldFireSweep: fired && phase === 1,
    shouldFirePlunge: fired && phase === 2,
  };
}
