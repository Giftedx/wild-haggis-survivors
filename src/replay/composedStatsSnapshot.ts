/**
 * T1 Phase 3 — snapshot of composed player stats at run start.
 *
 * Captures the merged output of `StatComposer.getPlayerStats(metaSave)`
 * × per-run modifiers so playback can reconstruct the Player with the
 * same starting sheet even when the player's meta-upgrades changed
 * between record and replay. The snapshot is a plain-data subset —
 * only the number fields Player's constructor actually reads, which
 * matches the existing `Pick<ComposedPlayerStats, …>` in Player.ts.
 *
 * BALANCE.player values (dashCooldownMs, dashSpeed, shieldCooldownMs,
 * etc.) are intentionally excluded — they're build-level constants and
 * already stable across a single build. Cross-build replay is
 * archive-only per ADR-0002.
 */
import type { ComposedPlayerStats } from '../core/StatComposer';

/**
 * Snapshot field set — matches `Pick<ComposedPlayerStats, …>` in
 * `Player` constructor. Changing either side without the other breaks
 * the playback reconstruction, so keep them in sync.
 */
export type ComposedStatsSnapshot = Pick<
  ComposedPlayerStats,
  | 'speed'
  | 'maxHp'
  | 'driftDegrees'
  | 'pickupRadius'
  | 'damagePctBonus'
  | 'hpRegen'
  | 'critBonus'
  | 'cooldownReduction'
  | 'xpGainBonus'
  | 'armorBonus'
  | 'dashCooldownReduction'
>;

const FIELDS: ReadonlyArray<keyof ComposedStatsSnapshot> = [
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
];

/**
 * Extract a plain-data snapshot — shallow copy, number-only fields.
 * Mutating the source after capture does not affect the snapshot.
 */
export function captureComposedStats(stats: ComposedPlayerStats): ComposedStatsSnapshot {
  return {
    speed: stats.speed,
    maxHp: stats.maxHp,
    driftDegrees: stats.driftDegrees,
    pickupRadius: stats.pickupRadius,
    damagePctBonus: stats.damagePctBonus,
    hpRegen: stats.hpRegen,
    critBonus: stats.critBonus,
    cooldownReduction: stats.cooldownReduction,
    xpGainBonus: stats.xpGainBonus,
    armorBonus: stats.armorBonus,
    dashCooldownReduction: stats.dashCooldownReduction,
  };
}

/** Guard — every field present, finite number, no extras required. */
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
