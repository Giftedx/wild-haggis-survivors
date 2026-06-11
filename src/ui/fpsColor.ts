/**
 * Pure 3-state FPS color resolver for the debug overlay.
 *
 * The overlay tints its leading line based on the current FPS so a
 * player / developer can read the run's health at a glance without
 * parsing a number:
 *
 *   ≥ 55 fps  → green   (perf is fine)
 *   ≥ 30 fps  → amber   (noticeable but playable)
 *   < 30 fps  → red     (stuttering, worth diagnosing)
 *
 * Pulled out of DebugOverlay so the thresholds are unit-tested and
 * easy to re-use if another scene wants the same traffic-light.
 */

import { COLORS_CSS } from '../config';

export const FPS_GREEN_THRESHOLD = 55;
export const FPS_AMBER_THRESHOLD = 30;

export const FPS_COLOR_GREEN = '#88ff88';
export const FPS_COLOR_AMBER = '#ffcc44';
export const FPS_COLOR_RED = COLORS_CSS.DANGER_RED;

export function resolveFpsColor(fps: number): string {
  if (fps >= FPS_GREEN_THRESHOLD) return FPS_COLOR_GREEN;
  if (fps >= FPS_AMBER_THRESHOLD) return FPS_COLOR_AMBER;
  return FPS_COLOR_RED;
}
