/**
 * T1 Phase 3 — snapshot of composed player stats at run start.
 *
 * BALANCE.player constants are excluded — they're build-level and
 * cross-build replay is archive-only per ADR-0002.
 */
import type { ComposedPlayerStats, PlayerComposedSheet } from '../core/StatComposer';

/**
 * Snapshot is exactly `PlayerComposedSheet` — the same type Player's
 * constructor reads. Any new field on PlayerComposedSheet surfaces as a
 * compile error in `FIELDS` below (forces the runtime guard to be
 * updated) while Player.ts picks it up automatically.
 */
export type ComposedStatsSnapshot = PlayerComposedSheet;

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
] as const satisfies ReadonlyArray<keyof PlayerComposedSheet>;

/** Shallow copy of just the PlayerComposedSheet fields. */
export function captureComposedStats(stats: ComposedPlayerStats): ComposedStatsSnapshot {
  const out = {} as ComposedStatsSnapshot;
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
