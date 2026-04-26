/**
 * W95 — right-side dash-zone discoverability helpers.
 *
 * `setupTouchInput` (`src/utils/input.ts`) splits the screen at 60% width:
 * left 60% = virtual joystick, right 40% = dash tap. The split is
 * invisible by default — first-time mobile players have no signal that
 * the right side fires a dash. This module owns the geometry + visibility
 * gates for a subtle visible affordance over the dash zone.
 *
 * Pure: no Phaser imports, no DOM. Callers (HUD, GameScene) consume the
 * bounds and the hint-visible decision separately. Unit tests cover the
 * geometry across the canonical mobile viewport widths used in the
 * Playwright reflow sweep.
 */

/**
 * The virtual-joystick / dash-zone split point as a fraction of canvas
 * width. Mirrors the literal in `setupTouchInput`. If the input split
 * ever moves, update both this constant AND the input handler.
 */
export const DASH_ZONE_X_FRACTION = 0.6;

/** Bounding rect for the right-side dash zone, in scene pixels. */
export interface DashZoneBounds {
  /** Left edge of the dash zone (inclusive). */
  x: number;
  /** Top edge — the dash zone spans the full canvas height. */
  y: number;
  /** Width of the zone in pixels. */
  width: number;
  /** Height of the zone in pixels. */
  height: number;
  /** Centre-x convenience for placing labels. */
  centreX: number;
  /** Centre-y convenience. */
  centreY: number;
}

/**
 * Resolve dash-zone bounds for a given canvas size. The right edge of
 * the zone is the canvas right edge; the left edge is at
 * `width * DASH_ZONE_X_FRACTION`.
 */
export function resolveDashZoneBounds(canvasWidth: number, canvasHeight: number): DashZoneBounds {
  const x = canvasWidth * DASH_ZONE_X_FRACTION;
  const width = canvasWidth - x;
  const height = canvasHeight;
  return {
    x,
    y: 0,
    width,
    height,
    centreX: x + width / 2,
    centreY: height / 2,
  };
}

/**
 * Visibility decision for the dash-zone hint. Returns `true` when:
 *  - the device looks touch-primary (mobile/tablet),
 *  - the player has not yet executed their first touch-dash this run, and
 *  - the gameplay isn't paused / over (showing a dash hint behind a
 *    death overlay would be noise).
 *
 * Pure decision; does not mutate input. Callers update their own
 * "hint dismissed" flag the first frame after the player taps the zone.
 */
export interface DashZoneHintGate {
  isTouchPrimary: boolean;
  hasUsedTouchDash: boolean;
  isGameActive: boolean;
}

export function shouldShowDashZoneHint(gate: DashZoneHintGate): boolean {
  if (!gate.isTouchPrimary) return false;
  if (gate.hasUsedTouchDash) return false;
  if (!gate.isGameActive) return false;
  return true;
}

/**
 * Pulse alpha for the dash-zone hint based on a wall-clock time. Returns
 * a value in `[minAlpha, maxAlpha]`. Slow breathing pulse — tuned to
 * read as a hint, not a UI distraction. Wall-clock so the pulse keeps
 * pulsing under hit-freeze / pause overlays (pause hides it via the gate
 * above; if exposed, the pulse stays animated).
 */
export function dashZoneHintPulseAlpha(
  timeMs: number,
  minAlpha: number = 0.18,
  maxAlpha: number = 0.32,
  periodMs: number = 1800,
): number {
  const t = (timeMs % periodMs) / periodMs;
  const wave = 0.5 - 0.5 * Math.cos(2 * Math.PI * t);
  return minAlpha + wave * (maxAlpha - minAlpha);
}
