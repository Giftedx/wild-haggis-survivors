import { BALANCE } from '../core/BalanceConfig';

/**
 * HUD wave-difficulty chip: pick the label + colour for the current
 * game-time second. Reads `BALANCE.hud.WAVE_DIFFICULTY_MARKS` — an
 * ascending-by-`minSec` list — and returns the last mark whose
 * `minSec ≤ gameTimeSec`.
 *
 * Single source of truth for the wave arc text; extracted from the
 * inline sweep in HUD.update so the threshold hits are testable at
 * the exact boundary seconds (0 / 180 / 420 / 720 / 1200).
 */
export interface WaveLabel {
  label: string;
  color: string;
}

export function resolveWaveLabel(gameTimeSec: number): WaveLabel {
  const marks = BALANCE.hud.WAVE_DIFFICULTY_MARKS;
  // Start at the first mark (label 'I' at 0s) — ascending sweep picks up
  // every threshold the player has crossed.
  let current: WaveLabel = { label: marks[0].label, color: marks[0].color };
  for (const mark of marks) {
    if (gameTimeSec >= mark.minSec) {
      current = { label: mark.label, color: mark.color };
    }
  }
  return current;
}
