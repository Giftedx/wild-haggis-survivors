/**
 * T1 Phase 3 — snapshot of composed player stats at run start.
 *
 * BALANCE.player constants are excluded — they're build-level and
 * cross-build replay is archive-only per ADR-0002.
 */
import type { ComposedPlayerStats } from '../core/StatComposer';

/**
 * Snapshot field set — must match the `Pick<ComposedPlayerStats, …>`
 * Player's constructor accepts. Changing either side without the other
 * breaks playback reconstruction.
 */
const FIELDS = [
  'speed',
  'maxHp',
  'driftDegrees',
  'pickupRadius',
  'damagePctBonus',
  'hpRegen',
  'critBonus',
  'cooldownReduction',
  'xpGainBonus',
  'armorBonus',
  'dashCooldownReduction',
] as const;

export type ComposedStatsSnapshot = Pick<ComposedPlayerStats, typeof FIELDS[number]>;

/** Shallow copy of just the whitelisted fields. */
export function captureComposedStats(stats: ComposedPlayerStats): ComposedStatsSnapshot {
  const out = {} as Record<(typeof FIELDS)[number], number>;
  for (const key of FIELDS) out[key] = stats[key];
  return out;
}

/** Guard — every whitelisted field present, finite number. */
export function isComposedStatsSnapshot(value: unknown): value is ComposedStatsSnapshot {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  for (const key of FIELDS) {
    const x = v[key];
    if (typeof x !== 'number') return false;
    if (!Number.isFinite(x)) return false;
  }
  return true;
}
