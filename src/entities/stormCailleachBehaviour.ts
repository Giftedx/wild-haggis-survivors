/**
 * Storm Cailleach — pure state machine for the Tier-3 post-bell boss.
 *
 * Three escalating phases keyed to HP thresholds:
 *  Phase 1 (HP > 67%):  Haar Veil — slow chase, smoky haar pulse every 8 s.
 *  Phase 2 (HP 67→33%): Ice Fury — speed ×1.4, ice-lance fan (×3) every 5 s.
 *  Phase 3 (HP < 33%):  Hail Storm — speed ×1.7, hail burst (×8) every 3.5 s.
 *
 * On phase transition the attack timer resets to 0 so the player has a
 * beat before the new cadence opens fire.
 *
 * Pure helper — no Phaser types, no scene state. The caller (Enemy.ts
 * `behaviorStormCailleach`) supplies the tick input and reads the
 * output to drive scene-side effects.
 *
 * Refs: DESIGN_IDEAS.md §6 (boss pipeline — Cailleach of the Storm);
 * SCOTTISH_RESEARCH.md §1.1 (Cailleach Bheur / Blue Hag of winter).
 */

export const STORM_PHASE1_HP_THRESHOLD = 0.67;
export const STORM_PHASE2_HP_THRESHOLD = 0.33;

/** Phase-indexed speed multipliers (index = phase − 1). */
export const STORM_SPEED_MULS = [1.0, 1.4, 1.7] as const;

// ── Phase 1: Haar Veil ────────────────────────────────────────────────
/** ms between haar pulses. */
export const STORM_HAAR_CADENCE_MS = 8000;
/** Radius of the haar slow-pulse (px). */
export const STORM_HAAR_RADIUS_PX = 580;
/** Damage dealt if the player is inside the pulse. */
export const STORM_HAAR_DAMAGE = 14;
/** Duration of the haar net-slow. */
export const STORM_HAAR_SLOW_MS = 1200;

// ── Phase 2: Ice Fury ─────────────────────────────────────────────────
/** ms between ice-lance volleys. */
export const STORM_LANCE_CADENCE_MS = 5000;
/** Lances per volley — spread evenly across `STORM_LANCE_SPREAD_RAD`. */
export const STORM_LANCE_COUNT = 3;
/** Half-angle of the lance fan (radians). */
export const STORM_LANCE_SPREAD_RAD = Math.PI / 7;
/** Speed of each ice lance (px/s). */
export const STORM_LANCE_SPEED = 290;
/** Damage per lance. */
export const STORM_LANCE_DAMAGE = 16;
/** Net-slow duration applied on lance hit. */
export const STORM_LANCE_SLOW_MS = 900;

// ── Phase 3: Hail Storm ───────────────────────────────────────────────
/** ms between hail bursts. */
export const STORM_HAIL_CADENCE_MS = 3500;
/** Bolts per burst — scattered around the player direction. */
export const STORM_HAIL_COUNT = 8;
/** Speed of each hail bolt (px/s). */
export const STORM_HAIL_SPEED = 340;
/** Damage per bolt. */
export const STORM_HAIL_DAMAGE = 11;
/** Full spread angle of the hail burst (radians). */
export const STORM_HAIL_SPREAD_RAD = Math.PI * 0.85;

export interface StormCailleachState {
  readonly phase: 1 | 2 | 3;
  readonly msSinceLastAttack: number;
  readonly speedMul: number;
  // Output flags — true for exactly one tick when the attack fires.
  readonly shouldFireHaarPulse?: boolean;
  readonly shouldFireIceLances?: boolean;
  readonly shouldFireHailBurst?: boolean;
}

export interface StormCailleachTickInput {
  readonly deltaMs: number;
  readonly hpPct: number;
}

export function initialStormCailleachState(): StormCailleachState {
  return { phase: 1, msSinceLastAttack: 0, speedMul: 1.0 };
}

export function simulateStormCailleachBehaviour(
  prev: StormCailleachState,
  input: StormCailleachTickInput,
): StormCailleachState {
  const phase: 1 | 2 | 3 =
    input.hpPct > STORM_PHASE1_HP_THRESHOLD ? 1
    : input.hpPct > STORM_PHASE2_HP_THRESHOLD ? 2
    : 3;

  const speedMul = STORM_SPEED_MULS[phase - 1];

  // Phase transition resets the attack timer so the player gets a
  // brief window before the next cadence opens.
  const phaseChanged = phase !== prev.phase;
  const cadenceMs =
    phase === 1 ? STORM_HAAR_CADENCE_MS
    : phase === 2 ? STORM_LANCE_CADENCE_MS
    : STORM_HAIL_CADENCE_MS;

  const acc = (phaseChanged ? 0 : prev.msSinceLastAttack) + input.deltaMs;
  const fire = acc >= cadenceMs;

  return {
    phase,
    speedMul,
    msSinceLastAttack: fire ? 0 : acc,
    shouldFireHaarPulse: fire && phase === 1,
    shouldFireIceLances: fire && phase === 2,
    shouldFireHailBurst: fire && phase === 3,
  };
}
