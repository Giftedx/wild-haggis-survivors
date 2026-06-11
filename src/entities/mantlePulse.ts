/**
 * Heather-mantle pulse — tier-2 stagger ring.
 *
 * Per DESIGN_IDEAS §1 ("Heather Mantle"): kills grow a visible mantle;
 * at max kill-threshold the mantle pulses and staggers nearby enemies.
 * The visual half (W71 Phase 2 keyframe overlay) and the kill-threshold
 * tier ladder (`mantleTier.ts`) are already shipped — this module is
 * the missing gameplay half: a pure 6 s pulse timer + a radius-stagger
 * helper that GameScene wires to the actual enemy group.
 *
 * The pulse is **pure stagger** — no damage, no XP, no kill credit. It
 * only knocks nearby enemies outward through Phaser's arcade resolver
 * so the player gets a small breathing-room beat in long high-tier
 * runs. Tier-gated to `2` (the visual already signals to the player
 * "you have arrived"), and only fires when the mantle is at full tier.
 *
 * Helpers in this file are deliberately framework-free (no Phaser,
 * no Player) so vitest can cover the timer and the stagger geometry
 * without the scene mounting cost. The Player + GameScene wiring
 * ride these helpers without re-implementing the math.
 */

import type { MantleTier } from '../animation/mantleTier';

export const MANTLE_PULSE_INTERVAL_MS = 6_000;
export const MANTLE_PULSE_RADIUS_PX = 50;
/** Outward knockback applied to enemies caught in the pulse ring. */
export const MANTLE_PULSE_KNOCKBACK_VEL = 220;
/** Duration of the visual punch tween (alpha + scale). */
export const MANTLE_PULSE_TWEEN_MS = 300;

export interface MantlePulseTimerInput {
  /** ms elapsed since the previous tick (already scaled if scaling is desired). */
  readonly deltaMs: number;
  /** Accumulated since the last firing — caller persists between ticks. */
  readonly accumulatedMs: number;
  /** Current mantle tier — gate keeps pulse off until tier 2. */
  readonly currentTier: MantleTier;
}

export interface MantlePulseTimerResult {
  /** True when a pulse should fire this tick. */
  readonly didPulse: boolean;
  /** New accumulator value the caller should persist for next tick. */
  readonly nextAccumulatedMs: number;
}

/**
 * Pure timer step. Adds delta to the accumulator, fires + resets when
 * the threshold is crossed at tier 2, and resets without firing when
 * tier drops below 2 so a player who steps off tier 2 (impossible
 * mid-run today, but defensive against future un-ladder logic) doesn't
 * carry stale charge into the next tier-2 entry.
 */
export function tickMantlePulseTimer(input: MantlePulseTimerInput): MantlePulseTimerResult {
  if (input.currentTier !== 2) {
    return { didPulse: false, nextAccumulatedMs: 0 };
  }
  const next = input.accumulatedMs + Math.max(0, input.deltaMs);
  if (next >= MANTLE_PULSE_INTERVAL_MS) {
    // Carry the overshoot into the next cycle so a frame-drop doesn't
    // delay the following pulse — mirrors the timer-overshoot pattern
    // in CLAUDE.md "Common Patterns".
    return {
      didPulse: true,
      nextAccumulatedMs: next - MANTLE_PULSE_INTERVAL_MS,
    };
  }
  return { didPulse: false, nextAccumulatedMs: next };
}

export interface MantlePulseStaggerImpulse {
  /** X velocity component to apply (px/s). */
  readonly vx: number;
  /** Y velocity component to apply (px/s). */
  readonly vy: number;
}

/**
 * Compute the outward-radial impulse for one enemy, or null if outside
 * the pulse radius. Direction is from player → enemy; magnitude is
 * `MANTLE_PULSE_KNOCKBACK_VEL`. An enemy at the player's exact position
 * (a degenerate co-located stack) receives a deterministic +x impulse
 * so the resolver doesn't divide by zero and the stagger reads as a
 * push rather than a no-op.
 */
export function computeMantlePulseStagger(
  playerX: number,
  playerY: number,
  enemyX: number,
  enemyY: number,
  radiusPx: number = MANTLE_PULSE_RADIUS_PX,
  knockback: number = MANTLE_PULSE_KNOCKBACK_VEL,
): MantlePulseStaggerImpulse | null {
  const dx = enemyX - playerX;
  const dy = enemyY - playerY;
  const distSq = dx * dx + dy * dy;
  const radSq = radiusPx * radiusPx;
  if (distSq > radSq) return null;
  const dist = Math.sqrt(distSq);
  if (dist < 0.001) {
    return { vx: knockback, vy: 0 };
  }
  return {
    vx: (dx / dist) * knockback,
    vy: (dy / dist) * knockback,
  };
}
