/**
 * Pure predicate — is a dive enemy far enough outside the camera
 * view or the world rect that it should self-destruct?
 *
 * Dive enemies (crows) lock their heading and charge in a straight
 * line, so once they're past the camera edge they're never coming
 * back. The margin absorbs the zoom-dependent buffer already baked
 * into the enemy's own size + the balance tuning (BALANCE.enemy.
 * diveDespawnMarginPx) — callers pass the margin directly.
 *
 * Checks two conditions: off the camera view (so the player won't
 * see it again) OR off the world rect (safety net if the camera
 * snaps mid-flight).
 */

export interface CameraBounds {
  scrollX: number;
  scrollY: number;
  width: number;
  height: number;
  zoom: number;
}

export function isDiveOffscreen(
  x: number,
  y: number,
  cam: CameraBounds,
  worldWidth: number,
  worldHeight: number,
  margin: number,
): boolean {
  const z = Math.max(0.001, cam.zoom);
  const viewW = cam.width / z;
  const viewH = cam.height / z;
  const farFromView =
    x < cam.scrollX - margin || x > cam.scrollX + viewW + margin ||
    y < cam.scrollY - margin || y > cam.scrollY + viewH + margin;
  const farFromWorld =
    x < -margin || x > worldWidth + margin ||
    y < -margin || y > worldHeight + margin;
  return farFromView || farFromWorld;
}
