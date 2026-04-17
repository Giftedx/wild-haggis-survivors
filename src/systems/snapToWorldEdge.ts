/**
 * Pure "snap to nearest world edge" utility.
 *
 * SpawnSystem picks spawn positions on the camera's off-screen
 * perimeter, then clamps into the world rect. If the clamp pushes
 * the point into the visible area (which happens when the player
 * stands near a world corner), we need to shove it back to the
 * nearest world edge so enemies don't pop in on-screen. This helper
 * performs that shove in isolation so the logic is unit-testable
 * without spinning up a Phaser scene.
 */

export interface Point2D {
  x: number;
  y: number;
}

export function snapToNearestWorldEdge(
  x: number,
  y: number,
  worldWidth: number,
  worldHeight: number,
): Point2D {
  const distToLeft = x;
  const distToRight = worldWidth - x;
  const distToTop = y;
  const distToBottom = worldHeight - y;
  const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
  if (minDist === distToLeft) return { x: 0, y };
  if (minDist === distToRight) return { x: worldWidth, y };
  if (minDist === distToTop) return { x, y: 0 };
  return { x, y: worldHeight };
}
