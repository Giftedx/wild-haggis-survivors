/**
 * updateHudWeaponRows — copy the live weapon roster into the reused
 * HUD scratch array (avoids per-frame allocation). Populates the
 * first N rows and returns N; callers pass N into the HUD update so
 * stale rows beyond it are ignored.
 *
 * Extracted from GameScene.update() as a pure function.
 */
import type { ActiveWeapon } from '../../systems/WeaponSystem';

export interface HudWeaponRow {
  key: string;
  level: number;
  evolved: boolean;
  evolutionKey: string;
  cooldownFrac: number;
}

/**
 * Copy up to `rows.length` weapons into the scratch rows in place.
 * Returns the number of rows written. Cooldown fraction is clamped to
 * [0, 1] — 0 means just fired, 1 means fully ready.
 */
export function updateHudWeaponRows(
  rows: HudWeaponRow[],
  weapons: readonly ActiveWeapon[],
): number {
  const n = Math.min(rows.length, weapons.length);
  for (let i = 0; i < n; i++) {
    const w = weapons[i];
    const row = rows[i];
    row.key = w.config.key;
    row.level = w.level;
    row.evolved = w.evolved;
    row.evolutionKey = w.evolutionKey;
    const cd = Math.max(1, w.cooldownMs);
    row.cooldownFrac = Math.max(0, Math.min(1, 1 - w.cooldownRemaining / cd));
  }
  return n;
}
