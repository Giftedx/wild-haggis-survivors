/**
 * Pure helpers used by SettingsScene sliders.
 *
 * Kept separate from the Phaser scene so the math is testable without a
 * running Phaser environment. The scene uses these to translate between
 * three coordinate spaces:
 *
 *   value  — the real setting (e.g. masterVolume 0..1, uiScale 0.8..1.4)
 *   ratio  — a 0..1 fraction along the slider track (for drawing)
 *   bump   — a stepped increment from keyboard/gamepad input
 *
 * All functions clamp their outputs into the valid range, and the
 * stepped helpers round against the step to avoid floating drift when
 * the player nudges a slider many times in a row.
 */

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function snapToStep(value: number, step: number, min: number): number {
  if (step <= 0) return value;
  // Round relative to `min` so slider ranges that don't start at 0 still
  // land on clean step boundaries (e.g. 0.8..1.4 step 0.05 → 0.80, 0.85…).
  const steps = Math.round((value - min) / step);
  // Multiply-then-round trick avoids e.g. 0.7 → 0.6999999 after many bumps.
  const raw = min + steps * step;
  const precision = 1 / step;
  return Math.round(raw * precision) / precision;
}

export function sliderRatioFromValue(value: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return 0;
  return clamp01((value - min) / span);
}

export function sliderValueFromRatio(
  ratio: number,
  min: number,
  max: number,
  step: number = 0
): number {
  const r = clamp01(ratio);
  const raw = min + r * (max - min);
  if (step <= 0) return raw;
  const snapped = snapToStep(raw, step, min);
  // Guard against step rounding pushing us past max (e.g. 0.8..1.4 step 0.05
  // with ratio 1 is exactly 1.4, but other combos might round up).
  if (snapped > max) return max;
  if (snapped < min) return min;
  return snapped;
}

export function steppedSliderBump(
  current: number,
  direction: number,
  min: number,
  max: number,
  step: number
): number {
  const sign = direction > 0 ? 1 : direction < 0 ? -1 : 0;
  if (sign === 0) return current;
  const next = current + sign * step;
  const clamped = Math.max(min, Math.min(max, next));
  // Snap the result to the step grid so repeated bumps never accumulate
  // floating-point error (e.g. 0.1 + 0.1 + 0.1 drifting off the grid).
  return snapToStep(clamped, step, min);
}
