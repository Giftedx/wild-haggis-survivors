/**
 * Boss HP bar visual state.
 *
 * Three tiers of colour + glow by remaining HP fraction:
 *
 *   hpFrac >= 0.5    → standard angry red (static glow off)
 *   hpFrac in [0.25, 0.5) → brighter mid-fight red + small glow
 *   hpFrac < 0.25   → warning state: brightest red + pulsing glow
 *
 * Pulse phase is driven by wall-clock ms so the oscillation is
 * frame-rate-independent and doesn't accumulate a stale offset if HP
 * oscillates above/below the 25% gate during a fight.
 */

/** HP fraction at/above which the bar sits in the baseline (tier 3) palette. */
export const BOSS_HP_MID_THRESHOLD = 0.5;
/** HP fraction at/above which the bar is in mid tier — below is warning. */
export const BOSS_HP_WARNING_THRESHOLD = 0.25;
/** Radians-per-ms for the warning glow pulse (matches the previous inline 0.006). */
export const BOSS_GLOW_PULSE_RATE_RAD_PER_MS = 0.006;
/** Warning glow alpha centre + amplitude — pulses inside [C-A, C+A]. */
export const BOSS_GLOW_PULSE_ALPHA_CENTER = 0.3;
export const BOSS_GLOW_PULSE_ALPHA_AMPLITUDE = 0.25;
/** Static glow alpha in the mid-tier. */
export const BOSS_GLOW_MID_ALPHA = 0.08;

export interface BossBarStyle {
  /** Main fill bar colour (0xRRGGBB). */
  fillColor: number;
  /** Highlight stripe colour (0xRRGGBB). */
  highlightColor: number;
  /** Glow rectangle colour (0xRRGGBB). */
  glowColor: number;
  /** Glow alpha, 0..1. 0 when fully off (tier 3 baseline). */
  glowAlpha: number;
}

export function bossHpBarStyle(hpFrac: number, nowMs: number): BossBarStyle {
  if (hpFrac < BOSS_HP_WARNING_THRESHOLD) {
    const phase = nowMs * BOSS_GLOW_PULSE_RATE_RAD_PER_MS;
    const alpha = BOSS_GLOW_PULSE_ALPHA_CENTER + Math.sin(phase) * BOSS_GLOW_PULSE_ALPHA_AMPLITUDE;
    return {
      fillColor: 0xff2222,
      highlightColor: 0xffaa44,
      glowColor: 0xff2200,
      glowAlpha: alpha,
    };
  }
  if (hpFrac < BOSS_HP_MID_THRESHOLD) {
    return {
      fillColor: 0xdd3333,
      highlightColor: 0xff7755,
      glowColor: 0xff4400,
      glowAlpha: BOSS_GLOW_MID_ALPHA,
    };
  }
  return {
    fillColor: 0xcc2222,
    highlightColor: 0xff6644,
    glowColor: 0xff2200,
    glowAlpha: 0,
  };
}
