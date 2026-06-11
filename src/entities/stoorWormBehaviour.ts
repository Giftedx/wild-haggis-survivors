/**
 * Stoor Worm — pure state machine for the Orcadian giant sea-serpent.
 *
 * Three phases keyed to HP thresholds:
 *
 *   Phase 1 (HP > 60 %): Serpentine chase. Acid-spray (3-fan) every 5 s.
 *     Scale Lock cycles: 3 s of 80 % DR ("sealed") then 3 s fully open
 *     ("gaping"). Rewards burst damage during the gape window.
 *
 *   Phase 2 (HP 60–25 %): Speed × 1.3. Bile burst (5-fan) every 3.5 s.
 *     Scale lock continues (same cadence).
 *
 *   Phase 3 (HP < 25 %): Death Thrash. Speed × 1.6. 360° 8-shard burst
 *     every 3 s. Scale lock drops — worm is always vulnerable (scales
 *     shattered by the damage taken).
 *
 * Scale lock is cosmetic in phase 3 (always gaping) so callers don't
 * need special-casing: `isScaleLocked` returns false once phase 3 begins.
 *
 * Pure helper — no Phaser, no scene state, no RNG. Caller (Enemy.ts
 * behaviorStoorWorm) supplies tick input and reads output flags.
 *
 * Ref: SCOTTISH_RESEARCH.md §1.1 (Assipattle and the Stoor Worm —
 * Assipattle rowed into the worm's open maw and set fire to its liver;
 * the gape window is a mechanical echo of that legend).
 */

export const STOOR_WORM_PHASE2_HP = 0.60;
export const STOOR_WORM_PHASE3_HP = 0.25;

export const STOOR_WORM_SCALE_LOCK_MS = 3000;   // sealed window
export const STOOR_WORM_GAPE_MS       = 3000;   // open window
export const STOOR_WORM_SCALE_LOCK_DR = 0.80;   // 80 % DR when locked

/** ms between attacks, per phase. */
export const STOOR_WORM_ATTACK_CADENCE_MS = {
  1: 5000,
  2: 3500,
  3: 3000,
} as const;

/** Speed multiplier per phase. */
export const STOOR_WORM_SPEED_MUL = {
  1: 1.0,
  2: 1.3,
  3: 1.6,
} as const;

type StoorWormPhase = 1 | 2 | 3;

/** Whether the scale lock is currently sealed or gaping. */
type ScaleLockState = 'sealed' | 'gaping';

export interface StoorWormState {
  readonly phase: StoorWormPhase;
  /** Timer within the current scale-lock cycle (sealed → gaping → sealed). */
  readonly scaleLockTimerMs: number;
  readonly scaleLockState: ScaleLockState;
  /** ms remaining until the next attack fires. */
  readonly attackCooldownMs: number;
  /** True for one tick when a phase changes. */
  readonly didPhaseChange: boolean;
  /** True for one tick when an attack should fire. */
  readonly shouldFireAttack: boolean;
  /** True while scales are locked (DR applies). Always false in phase 3. */
  readonly isScaleLocked: boolean;
  readonly speedMul: number;
}

export interface StoorWormTickInput {
  readonly deltaMs: number;
  readonly hpPct: number;
}

export function initialStoorWormState(): StoorWormState {
  return {
    phase: 1,
    scaleLockTimerMs: STOOR_WORM_SCALE_LOCK_MS,
    scaleLockState: 'sealed',
    attackCooldownMs: STOOR_WORM_ATTACK_CADENCE_MS[1],
    didPhaseChange: false,
    shouldFireAttack: false,
    isScaleLocked: true,
    speedMul: STOOR_WORM_SPEED_MUL[1],
  };
}

export function simulateStoorWormBehaviour(
  prev: StoorWormState,
  input: StoorWormTickInput,
): StoorWormState {
  // ── Phase transition check ──────────────────────────────────────────────
  let phase = prev.phase;
  let didPhaseChange = false;
  if (phase === 1 && input.hpPct <= STOOR_WORM_PHASE2_HP) {
    phase = 2;
    didPhaseChange = true;
  } else if (phase === 2 && input.hpPct <= STOOR_WORM_PHASE3_HP) {
    phase = 3;
    didPhaseChange = true;
  }

  const speedMul = STOOR_WORM_SPEED_MUL[phase];

  // ── Scale lock tick (skip in phase 3 — always gaping) ─────────────────
  let scaleLockTimerMs = prev.scaleLockTimerMs - input.deltaMs;
  let scaleLockState = prev.scaleLockState;
  if (phase === 3) {
    scaleLockState = 'gaping';
    scaleLockTimerMs = 0;
  } else if (scaleLockTimerMs <= 0) {
    scaleLockState = scaleLockState === 'sealed' ? 'gaping' : 'sealed';
    scaleLockTimerMs =
      scaleLockState === 'sealed' ? STOOR_WORM_SCALE_LOCK_MS : STOOR_WORM_GAPE_MS;
  }
  const isScaleLocked = phase !== 3 && scaleLockState === 'sealed';

  // ── Attack tick ────────────────────────────────────────────────────────
  const cooldown = prev.attackCooldownMs - input.deltaMs;
  const fire = cooldown <= 0;
  const attackCooldownMs = fire ? STOOR_WORM_ATTACK_CADENCE_MS[phase] : cooldown;

  return {
    phase,
    scaleLockTimerMs,
    scaleLockState,
    attackCooldownMs,
    didPhaseChange,
    shouldFireAttack: fire,
    isScaleLocked,
    speedMul,
  };
}
