/**
 * Pure helpers for the HUD HP bar colour + wave-label logic.
 *
 * Two small pins:
 *
 *   - `targetHpBarColor(hpFrac)` — the four-tier green/yellow/orange/red
 *     palette as an RGB tuple. Separate from the scene's smoothing
 *     loop (which lerps toward this target each frame) so the
 *     thresholds are testable in isolation.
 *
 *   - `packRgbColor({ r, g, b })` — convenience 0xRRGGBB packer for
 *     Phaser `.setFillStyle(...)`. Clamps each channel to [0, 255].
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** HP fraction threshold for green (healthy). Strictly `> 0.6`. */
export const HP_BAR_GREEN_THRESHOLD = 0.6;
/** HP fraction threshold for yellow (caution). Strictly `> 0.35`. */
export const HP_BAR_YELLOW_THRESHOLD = 0.35;
/** HP fraction threshold for orange (danger). Strictly `> 0.15`. */
export const HP_BAR_ORANGE_THRESHOLD = 0.15;

/** Palette tuples — kept as exported constants so tests reference the same values as production. */
export const HP_BAR_GREEN: RgbColor = { r: 0x44, g: 0xcc, b: 0x44 };
export const HP_BAR_YELLOW: RgbColor = { r: 0xcc, g: 0xcc, b: 0x44 };
export const HP_BAR_ORANGE: RgbColor = { r: 0xdd, g: 0x88, b: 0x44 };
export const HP_BAR_RED: RgbColor = { r: 0xcc, g: 0x33, b: 0x33 };

/**
 * Pick the target HP bar colour for a given HP fraction. Four tiers,
 * strict `>` gates:
 *
 *   frac > 0.6   → green
 *   frac > 0.35  → yellow
 *   frac > 0.15  → orange
 *   otherwise    → red (including 0 — the bar is empty but still tinted)
 *
 * The scene smooths from its current displayed colour toward this
 * target over ~300ms; this helper is only responsible for picking
 * which colour the player is heading to.
 */
export function targetHpBarColor(hpFrac: number): RgbColor {
  if (hpFrac > HP_BAR_GREEN_THRESHOLD) return HP_BAR_GREEN;
  if (hpFrac > HP_BAR_YELLOW_THRESHOLD) return HP_BAR_YELLOW;
  if (hpFrac > HP_BAR_ORANGE_THRESHOLD) return HP_BAR_ORANGE;
  return HP_BAR_RED;
}

function clampByte(n: number): number {
  if (n <= 0) return 0;
  if (n >= 255) return 255;
  return Math.round(n);
}

/** Pack an RGB tuple into a Phaser 0xRRGGBB integer. Clamps each channel to [0, 255]. */
export function packRgbColor(c: RgbColor): number {
  return (clampByte(c.r) << 16) | (clampByte(c.g) << 8) | clampByte(c.b);
}

/** Fraction below which the HP bar enters low-HP urgency pulse mode. */
export const HP_LOW_PULSE_THRESHOLD = 0.3;
/** Phase advance per HUD tick while low HP. */
export const HP_LOW_PULSE_PHASE_STEP = 0.12;
/** Alpha oscillates inside [CENTER - AMP, CENTER + AMP]. */
export const HP_LOW_PULSE_ALPHA_CENTER = 0.7;
export const HP_LOW_PULSE_ALPHA_AMPLITUDE = 0.3;

/**
 * True when the HP bar should pulse. Strictly `> 0` — at 0 HP the
 * death flow takes over and the pulse stops.
 */
export function isLowHpPulseActive(hpFrac: number): boolean {
  return hpFrac > 0 && hpFrac < HP_LOW_PULSE_THRESHOLD;
}

/**
 * Alpha for the HP bar fill while pulsing. Caller passes the
 * current phase (running accumulator). When the bar is NOT pulsing,
 * callers use alpha = 1 directly.
 */
export function hpLowPulseAlpha(phase: number): number {
  return HP_LOW_PULSE_ALPHA_CENTER + Math.sin(phase) * HP_LOW_PULSE_ALPHA_AMPLITUDE;
}
