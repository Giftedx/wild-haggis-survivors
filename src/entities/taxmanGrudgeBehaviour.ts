/**
 * Taxman Grudge — pure state machine for the Taxman's Phase 2 at 50% HP.
 *
 * At 50 % HP the Taxman reads the current GrudgeVerdict (from
 * judgeGrudge on the per-run ledger) and enters a 1.5 s pause before
 * switching to a verdict-specific attack pattern that counters the
 * player's dominant fighting style across the run:
 *
 *   coward   (kept distance)  → Tax Demands:   3-spread slow projectiles
 *   bruiser  (fought up close) → Penalty:       6-shard radial burst
 *   precise  (fought untouched)→ Assessment:    1 large % HP-drain blob
 *   reckless (fought on brink) → Interest:      7-shard fan spray
 *   even     (no clear style)  → Standard:      4-spread gold fan
 *
 * Pure helper — no Phaser types, no scene state. The caller (Enemy.ts
 * behaviorTaxmanGrudge) supplies tick input and reads output flags to
 * drive scene-side effects.
 *
 * Refs: DESIGN_IDEAS.md §1 (Taxman Grudge Ledger) and §3 (Father Taxman
 * expanded with a Grudge-Ledger phase — "DESIGN_IDEAS §3: Father Taxman
 * — current Taxman expanded with a Grudge-Ledger phase").
 */

import type { GrudgeVerdict } from './grudgeLedger';

export const TAXMAN_PHASE2_HP_THRESHOLD = 0.50;
export const TAXMAN_TRANSITION_PAUSE_MS = 1500;

/** ms between attacks in phase 2, keyed by verdict. */
export const TAXMAN_PHASE2_CADENCE_MS: Record<GrudgeVerdict, number> = {
  coward:   3500,
  bruiser:  3000,
  precise:  5000,
  reckless: 2500,
  even:     4000,
};

/** Speed multiplier in phase 2, keyed by verdict. */
export const TAXMAN_PHASE2_SPEED_MUL: Record<GrudgeVerdict, number> = {
  coward:   1.30,  // closes faster when you've been running
  bruiser:  0.90,  // methodical; the burst is the real threat
  precise:  1.15,  // slightly faster; the assessment does the heavy lifting
  reckless: 1.40,  // matches your chaotic energy
  even:     1.20,  // standard escalation
};

type TaxmanGrudgePhase = 1 | 'transitioning' | 2;

export interface TaxmanGrudgeState {
  readonly phase: TaxmanGrudgePhase;
  readonly verdict: GrudgeVerdict;
  readonly pauseRemainingMs: number;
  readonly attackCooldownMs: number;
  /** True for exactly one tick: the frame phase 1 → transitioning fires. */
  readonly shouldFireTransition: boolean;
  /** True for exactly one tick: the frame a phase-2 attack fires. */
  readonly shouldFireAttack: boolean;
  /** True while the 1.5 s transition pause is active. */
  readonly isPaused: boolean;
  readonly speedMul: number;
}

export interface TaxmanGrudgeTickInput {
  readonly deltaMs: number;
  readonly hpPct: number;
  /** Current grudge verdict — caller computes via judgeGrudge(ledger). */
  readonly resolvedVerdict: GrudgeVerdict;
}

export function initialTaxmanGrudgeState(): TaxmanGrudgeState {
  return {
    phase: 1,
    verdict: 'even',
    pauseRemainingMs: 0,
    attackCooldownMs: TAXMAN_PHASE2_CADENCE_MS.even,
    shouldFireTransition: false,
    shouldFireAttack: false,
    isPaused: false,
    speedMul: 1.0,
  };
}

export function simulateTaxmanGrudgeBehaviour(
  prev: TaxmanGrudgeState,
  input: TaxmanGrudgeTickInput,
): TaxmanGrudgeState {
  // ── Phase 1: standard chase ─────────────────────────────────────────
  if (prev.phase === 1) {
    if (input.hpPct > TAXMAN_PHASE2_HP_THRESHOLD) {
      return {
        ...prev,
        shouldFireTransition: false,
        shouldFireAttack: false,
        isPaused: false,
        speedMul: 1.0,
      };
    }
    // HP threshold crossed — lock in the verdict and start the pause.
    const verdict = input.resolvedVerdict;
    return {
      phase: 'transitioning',
      verdict,
      pauseRemainingMs: TAXMAN_TRANSITION_PAUSE_MS,
      attackCooldownMs: TAXMAN_PHASE2_CADENCE_MS[verdict],
      shouldFireTransition: true,
      shouldFireAttack: false,
      isPaused: true,
      speedMul: 0,
    };
  }

  // ── Transitioning: count down the 1.5 s dramatic pause ─────────────
  if (prev.phase === 'transitioning') {
    const remaining = prev.pauseRemainingMs - input.deltaMs;
    if (remaining > 0) {
      return {
        ...prev,
        pauseRemainingMs: remaining,
        shouldFireTransition: false,
        shouldFireAttack: false,
        isPaused: true,
        speedMul: 0,
      };
    }
    // Pause expired — enter phase 2.
    return {
      phase: 2,
      verdict: prev.verdict,
      pauseRemainingMs: 0,
      attackCooldownMs: TAXMAN_PHASE2_CADENCE_MS[prev.verdict],
      shouldFireTransition: false,
      shouldFireAttack: false,
      isPaused: false,
      speedMul: TAXMAN_PHASE2_SPEED_MUL[prev.verdict],
    };
  }

  // ── Phase 2: verdict-specific attack cadence ────────────────────────
  const cooldown = prev.attackCooldownMs - input.deltaMs;
  const fire = cooldown <= 0;
  return {
    phase: 2,
    verdict: prev.verdict,
    pauseRemainingMs: 0,
    attackCooldownMs: fire ? TAXMAN_PHASE2_CADENCE_MS[prev.verdict] : cooldown,
    shouldFireTransition: false,
    shouldFireAttack: fire,
    isPaused: false,
    speedMul: TAXMAN_PHASE2_SPEED_MUL[prev.verdict],
  };
}
