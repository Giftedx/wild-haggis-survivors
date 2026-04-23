/**
 * Mantle tier ladder for the heather-mantle overlay (W71 Phase 2).
 *
 * Thresholds are placeholders pending first playtest (spec §3.5). The
 * two values below are the only tuning knob — adjust and the rest of
 * the pipeline rides the change.
 */

export type MantleTier = 0 | 1 | 2;

export const MANTLE_TIERS = {
  tier1KillThreshold: 50,
  tier2KillThreshold: 250,
} as const;

export function computeMantleTier(kills: number): MantleTier {
  const n = Math.max(0, kills);
  if (n >= MANTLE_TIERS.tier2KillThreshold) return 2;
  if (n >= MANTLE_TIERS.tier1KillThreshold) return 1;
  return 0;
}
