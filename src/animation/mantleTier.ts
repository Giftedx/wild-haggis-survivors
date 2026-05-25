/**
 * Mantle tier ladder for the heather-mantle overlay (W71 Phase 2).
 *
 * The two thresholds below are the tuning surface: tier 1 gives an
 * early-run visible reward, while tier 2 waits for a sustained kill
 * count so the full mantle still reads as earned in normal survivor
 * pacing. Adjust these values here and the rest of the mantle pipeline
 * rides the change.
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
