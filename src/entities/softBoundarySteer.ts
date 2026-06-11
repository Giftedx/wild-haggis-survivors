/**
 * Pure soft-boundary steering for the player.
 *
 * Wild Haggis Survivors has no hard world walls — when the player
 * nears the edge they slow down and get a gentle push back toward
 * the centre. This avoids the "bounce off a brick wall" feel while
 * still keeping the run on-map. Two effects are layered:
 *
 *   edgeMul    — a movement-speed multiplier that scales linearly
 *                from 1 at EDGE_MARGIN px inward down to
 *                MIN_EDGE_MUL at the very edge. The floor means the
 *                player can *always* keep moving at ~15% speed, so
 *                being pushed to a corner never deadlocks input.
 *   pushX/Y    — a flat force applied only when the player is within
 *                PUSH_THRESHOLD px of the edge, pushing them back
 *                toward the centre. Separate from edgeMul so the
 *                drift + momentum feel stays predictable.
 *
 * Lifted verbatim out of Player.update() so it can be unit-tested
 * without a Phaser scene. The same math ran fine for a year; extracting
 * it doesn't change behaviour.
 */

export const EDGE_MARGIN = 150;
export const PUSH_THRESHOLD = 20;
export const PUSH_STRENGTH = 50;
export const MIN_EDGE_MUL = 0.15;

export interface SoftBoundarySteer {
  /** Speed multiplier in [MIN_EDGE_MUL, 1]. */
  edgeMul: number;
  /** Flat X force (in speed units) pushing toward centre when very near edge. */
  pushX: number;
  /** Flat Y force (in speed units) pushing toward centre when very near edge. */
  pushY: number;
}

export function softBoundarySteer(
  x: number,
  y: number,
  worldWidth: number,
  worldHeight: number,
): SoftBoundarySteer {
  let edgeMul = 1;
  if (x < EDGE_MARGIN) edgeMul = Math.min(edgeMul, x / EDGE_MARGIN);
  if (y < EDGE_MARGIN) edgeMul = Math.min(edgeMul, y / EDGE_MARGIN);
  if (x > worldWidth - EDGE_MARGIN) edgeMul = Math.min(edgeMul, (worldWidth - x) / EDGE_MARGIN);
  if (y > worldHeight - EDGE_MARGIN) edgeMul = Math.min(edgeMul, (worldHeight - y) / EDGE_MARGIN);
  edgeMul = Math.max(MIN_EDGE_MUL, edgeMul);

  let pushX = 0;
  let pushY = 0;
  if (x < PUSH_THRESHOLD) pushX = PUSH_STRENGTH;
  if (x > worldWidth - PUSH_THRESHOLD) pushX = -PUSH_STRENGTH;
  if (y < PUSH_THRESHOLD) pushY = PUSH_STRENGTH;
  if (y > worldHeight - PUSH_THRESHOLD) pushY = -PUSH_STRENGTH;

  return { edgeMul, pushX, pushY };
}
