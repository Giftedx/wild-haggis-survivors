/**
 * Wicker Haggis — post-bell boss behaviour (pure state machine).
 *
 * Bealltainn's Tribute. On the May ceremony the old wicker effigy is raised
 * on the hillside above Calton Hill — a latticed figure packed with straw,
 * kindling, and one perfectly-formed wild haggis that ran in of its own free
 * will. Or so the story insists. The figure burns. The haggis, as it turns
 * out, does not burn quietly.
 *
 * Phase 1 (HP > WICKER_PHASE2_HP_THRESHOLD):
 *   Chase. Every WICKER_RING_CADENCE_MS: a 6-shard fire-ring burst outward.
 *
 * Phase transition (HP crosses threshold):
 *   One-tick `shouldFireTransitionBurst: true` — 8 slow ember shards scatter
 *   in a ring as the wicker structure ignites properly.
 *
 * Phase 2 (HP ≤ WICKER_PHASE2_HP_THRESHOLD):
 *   Speed ×1.35. Every WICKER_SCATTER_CADENCE_MS: 4-shard ember scatter —
 *   2 aimed ±20° toward the player, 2 at ±60°. Burning wicker collapse,
 *   embers flying wide.
 *
 * Post-bell exclusive. Refs: SCOTTISH_RESEARCH_DEEP.md §22.1 (Beltane
 * fire festival, Calton Hill); SCOTTISH_RESEARCH.md §1.2 (fire customs).
 */

export const WICKER_PHASE2_HP_THRESHOLD = 0.55;

// Phase 1 — fire ring outward
export const WICKER_RING_CADENCE_MS = 4800;
export const WICKER_RING_SHARD_COUNT = 6;
export const WICKER_RING_SHARD_SPEED = 190;
export const WICKER_RING_SHARD_DAMAGE = 12;

// Phase transition — slow ember explosion on ignition
export const WICKER_TRANSITION_SHARD_COUNT = 8;
export const WICKER_TRANSITION_SHARD_SPEED = 120;
export const WICKER_TRANSITION_SHARD_DAMAGE = 14;

// Phase 2 — ember scatter toward player
export const WICKER_SCATTER_CADENCE_MS = 3000;
export const WICKER_SCATTER_SHARD_COUNT = 4;
export const WICKER_SCATTER_SHARD_SPEED = 230;
export const WICKER_SCATTER_SHARD_DAMAGE = 14;
/** Inner spread — shards at ±INNER_SPREAD_RAD from direct player bearing. */
export const WICKER_SCATTER_INNER_SPREAD_RAD = Math.PI / 9; // 20°
/** Outer spread — the wide flanking pair. */
export const WICKER_SCATTER_OUTER_SPREAD_RAD = Math.PI / 3; // 60°

export interface WickerHaggisState {
  readonly phase: 1 | 2;
  readonly msSinceLastAttack: number;
  readonly speedMul: number;
  readonly shouldFireRing: boolean;
  readonly shouldFireScatter: boolean;
  /** True for exactly one tick when HP first crosses the phase threshold. */
  readonly shouldFireTransitionBurst: boolean;
}

export interface WickerHaggisTickInput {
  readonly deltaMs: number;
  readonly hpPct: number;
}

export function initialWickerHaggisState(): WickerHaggisState {
  return {
    phase: 1,
    msSinceLastAttack: 0,
    speedMul: 1.0,
    shouldFireRing: false,
    shouldFireScatter: false,
    shouldFireTransitionBurst: false,
  };
}

export function simulateWickerHaggisBehaviour(
  prev: WickerHaggisState,
  input: WickerHaggisTickInput,
): WickerHaggisState {
  const { deltaMs, hpPct } = input;

  const phase: 1 | 2 = hpPct <= WICKER_PHASE2_HP_THRESHOLD ? 2 : 1;
  const speedMul = phase === 2 ? 1.35 : 1.0;
  const phaseChanged = phase !== prev.phase;

  // Phase transition gives the player a beat before the new scatter cadence.
  const cadenceMs = phase === 1 ? WICKER_RING_CADENCE_MS : WICKER_SCATTER_CADENCE_MS;
  const acc = phaseChanged ? deltaMs : prev.msSinceLastAttack + deltaMs;
  const fired = !phaseChanged && acc >= cadenceMs;
  const nextMs = fired ? acc - cadenceMs : acc;

  return {
    phase,
    msSinceLastAttack: nextMs,
    speedMul,
    shouldFireRing: fired && phase === 1,
    shouldFireScatter: fired && phase === 2,
    shouldFireTransitionBurst: phaseChanged,
  };
}
