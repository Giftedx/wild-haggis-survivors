/**
 * Ninth Legion — pure state machine for the Lost Ninth Legion wave-boss.
 *
 * Phase 1 (first 30 s): The Centurion drifts under an ancient-mist shroud.
 *   90 % damage reduction; spawns three waves of 4 spectre_legionaries
 *   at elapsed = 0 s, 10 s, and 20 s. Players fight through the waves
 *   before the Centurion materialises.
 *
 * Phase 2 (30 s elapsed): Shroud lifts. Full damage. Formation pilum attack
 *   (3 simultaneous throws in a 0.35-rad spread) every 4 s. Speed × 1.4.
 *
 * Phase 3 (HP ≤ 35 %): Formation attacks tighten (3 s cadence). Rear-guard
 *   summon: 4 legionaries every 20 s. Speed × 1.8.
 *
 * Wave-spawn timing is time-based (not kill-count-based) so it is
 * replay-deterministic without needing to track living-entity counts
 * across systems.
 *
 * Pure helper — no Phaser, no scene state. Caller (Enemy.ts
 * behaviorNinthLegion) supplies tick input and reads output flags.
 *
 * Ref: SCOTTISH_RESEARCH_DEEP.md §6.1 (The mystery of the Legio IX
 * Hispana — Caledonia's enduring historical puzzle).
 */

export const NINTH_LEGION_PHASE2_ELAPSED_MS = 30_000;
export const NINTH_LEGION_PHASE3_HP = 0.35;
export const NINTH_LEGION_SHROUD_DR = 0.90;   // 90 % DR while shrouded

/** Elapsed ms at which each wave of legionaries spawns. */
export const NINTH_LEGION_WAVE_SPAWN_MS = [0, 10_000, 20_000] as const;
export const NINTH_LEGION_WAVE_SIZE = 4;

export const NINTH_LEGION_ATTACK_CADENCE_MS = {
  2: 4000,
  3: 3000,
} as const;

export const NINTH_LEGION_SPEED_MUL = {
  1: 1.0,
  2: 1.4,
  3: 1.8,
} as const;

export const NINTH_LEGION_REARGUARD_CADENCE_MS = 20_000;
export const NINTH_LEGION_REARGUARD_SIZE = 4;

type NinthLegionPhase = 1 | 2 | 3;

export interface NinthLegionState {
  readonly phase: NinthLegionPhase;
  /** Total ms elapsed since the boss was spawned. */
  readonly elapsedMs: number;
  /** Which wave indices have already fired (0, 1, 2). */
  readonly wavesFired: readonly number[];
  /** ms remaining until the next attack (phase 2/3 only). */
  readonly attackCooldownMs: number;
  /** ms remaining until the next rear-guard summon (phase 3 only). */
  readonly rearguardCooldownMs: number;
  /** True while the shroud is active (phase 1). DR applies. */
  readonly isShrouded: boolean;
  /** True for one tick when the shroud lifts (phase 1 → 2). */
  readonly shouldLiftShroud: boolean;
  /** True for one tick when a wave should spawn. waveSizeThisFrame = NINTH_LEGION_WAVE_SIZE. */
  readonly shouldSpawnWave: boolean;
  /** True for one tick when a pilum attack fires. */
  readonly shouldFireAttack: boolean;
  /** True for one tick when a rear-guard batch should spawn (phase 3). */
  readonly shouldSpawnRearguard: boolean;
  readonly speedMul: number;
}

export interface NinthLegionTickInput {
  readonly deltaMs: number;
  readonly hpPct: number;
}

export function initialNinthLegionState(): NinthLegionState {
  return {
    phase: 1,
    elapsedMs: 0,
    wavesFired: [],
    attackCooldownMs: NINTH_LEGION_ATTACK_CADENCE_MS[2],
    rearguardCooldownMs: NINTH_LEGION_REARGUARD_CADENCE_MS,
    isShrouded: true,
    shouldLiftShroud: false,
    shouldSpawnWave: false,
    shouldFireAttack: false,
    shouldSpawnRearguard: false,
    speedMul: NINTH_LEGION_SPEED_MUL[1],
  };
}

export function simulateNinthLegionBehaviour(
  prev: NinthLegionState,
  input: NinthLegionTickInput,
): NinthLegionState {
  const elapsed = prev.elapsedMs + input.deltaMs;

  // ── Phase 1: shroud + wave spawning ──────────────────────────────────
  if (prev.phase === 1) {
    // Check for new wave to fire.
    const wavesFired = [...prev.wavesFired];
    let shouldSpawnWave = false;
    for (let i = 0; i < NINTH_LEGION_WAVE_SPAWN_MS.length; i++) {
      if (!wavesFired.includes(i) && elapsed >= NINTH_LEGION_WAVE_SPAWN_MS[i]) {
        wavesFired.push(i);
        shouldSpawnWave = true;
      }
    }

    // Shroud lifts after PHASE2_ELAPSED_MS.
    if (elapsed >= NINTH_LEGION_PHASE2_ELAPSED_MS) {
      return {
        ...prev,
        phase: 2,
        elapsedMs: elapsed,
        wavesFired,
        isShrouded: false,
        shouldLiftShroud: true,
        shouldSpawnWave,
        shouldFireAttack: false,
        shouldSpawnRearguard: false,
        speedMul: NINTH_LEGION_SPEED_MUL[2],
      };
    }

    return {
      ...prev,
      elapsedMs: elapsed,
      wavesFired,
      shouldSpawnWave,
      shouldLiftShroud: false,
      shouldFireAttack: false,
      shouldSpawnRearguard: false,
    };
  }

  // ── Phase 2 / 3: combat mode ───────────────────────────────────────────
  let phase = prev.phase;
  if (phase === 2 && input.hpPct <= NINTH_LEGION_PHASE3_HP) {
    phase = 3;
  }
  const speedMul = NINTH_LEGION_SPEED_MUL[phase];

  // Attack tick.
  const cadence = NINTH_LEGION_ATTACK_CADENCE_MS[phase === 3 ? 3 : 2];
  const attackCooldown = prev.attackCooldownMs - input.deltaMs;
  const fireAttack = attackCooldown <= 0;
  const attackCooldownMs = fireAttack ? cadence : attackCooldown;

  // Rear-guard tick (phase 3 only).
  let rearguardCooldownMs = prev.rearguardCooldownMs;
  let shouldSpawnRearguard = false;
  if (phase === 3) {
    rearguardCooldownMs -= input.deltaMs;
    if (rearguardCooldownMs <= 0) {
      shouldSpawnRearguard = true;
      rearguardCooldownMs = NINTH_LEGION_REARGUARD_CADENCE_MS;
    }
  }

  return {
    phase,
    elapsedMs: elapsed,
    wavesFired: prev.wavesFired,
    attackCooldownMs,
    rearguardCooldownMs,
    isShrouded: false,
    shouldLiftShroud: false,
    shouldSpawnWave: false,
    shouldFireAttack: fireAttack,
    shouldSpawnRearguard,
    speedMul,
  };
}
