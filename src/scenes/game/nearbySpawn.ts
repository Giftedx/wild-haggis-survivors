/**
 * Pure helper for "drop a pickup near the player but not on top of them".
 *
 * Both PickupSpawner.spawnTreasure and .spawnGoldenChest do the same
 * angle + distance roll + world-edge clamp. Extracting makes the
 * minimum-distance floor and the world-padding margin testable
 * without a Phaser scene.
 */

/** Minimum distance from the player where a nearby pickup can spawn. */
export const NEARBY_SPAWN_MIN_DIST = 150;
/** Maximum distance — roll produces [MIN, MIN + RANGE]. */
export const NEARBY_SPAWN_DIST_RANGE = 200;
/** Pickup sprites keep this much margin from the world edge. */
export const NEARBY_SPAWN_EDGE_MARGIN = 50;

export interface NearbyPosInput {
  playerX: number;
  playerY: number;
  worldWidth: number;
  worldHeight: number;
  /** Callback returning `[0, 1)` — injected so tests stay deterministic. */
  rand: () => number;
}

/** Clamp `v` into `[lo, hi]`. */
function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

/**
 * Pick a world-space position a random distance from the player in a
 * random direction, clamped to stay `NEARBY_SPAWN_EDGE_MARGIN` px from
 * each world edge.
 *
 * Returns `{ x, y }`. Pure on its inputs — all randomness comes from
 * the `rand` callback.
 */
export function pickNearbyPosition(input: NearbyPosInput): { x: number; y: number } {
  const angle = input.rand() * Math.PI * 2;
  const dist = NEARBY_SPAWN_MIN_DIST + input.rand() * NEARBY_SPAWN_DIST_RANGE;
  const rawX = input.playerX + Math.cos(angle) * dist;
  const rawY = input.playerY + Math.sin(angle) * dist;
  return {
    x: clamp(rawX, NEARBY_SPAWN_EDGE_MARGIN, input.worldWidth - NEARBY_SPAWN_EDGE_MARGIN),
    y: clamp(rawY, NEARBY_SPAWN_EDGE_MARGIN, input.worldHeight - NEARBY_SPAWN_EDGE_MARGIN),
  };
}
