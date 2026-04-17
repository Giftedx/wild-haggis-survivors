/**
 * Canonical "M:SS" clock formatter used across the chronicle, run
 * result screens, HUD timer line, postcards, and variant panel
 * runtime readouts.
 *
 * Two near-identical helpers (formatClockTime in
 * gameOverFormatting, formatClock in chronicleAggregates) existed
 * in parallel — this version is the single source. Both callers
 * now re-export it.
 *
 * - Non-negative input: seconds below zero clamp to 0 (never renders
 *   a negative clock).
 * - Integer seconds only: fractional seconds floor (59.9 → "0:59").
 * - Minutes are not padded: "1:05" not "01:05" (matches the
 *   in-game HUD timer).
 */
export function formatClockTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
