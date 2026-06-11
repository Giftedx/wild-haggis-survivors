/**
 * Phaser-free targeting math for `FiannaSpirit` (R1 M4.5 P5).
 *
 * Extracted so vitest (node env) can exercise the nearest-enemy pick
 * without dragging in the Phaser module tree. `Enemy` stays a generic
 * shape via the `FiannaTargetable` interface so tests supply plain
 * objects, not class instances.
 */
export interface FiannaTargetable {
  readonly x: number;
  readonly y: number;
  readonly active: boolean;
  isBoss(): boolean;
}

export function pickNearestEnemy<T extends FiannaTargetable>(
  x: number,
  y: number,
  enemies: readonly T[],
): T | null {
  let best: T | null = null;
  let bestDistSq = Infinity;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.active || e.isBoss()) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      best = e;
    }
  }
  return best;
}
