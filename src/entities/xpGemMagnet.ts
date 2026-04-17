/**
 * Pure speed formula for a magnetised XP gem heading toward the
 * player. Once the gem is within the pickup radius the magnet kicks
 * in and accelerates: far from the player the speed starts at 800,
 * and it ramps down linearly with distance down to a floor of 400
 * so very close gems don't overshoot.
 *
 * The effect feels snappy (the gem "jumps" to you from range) while
 * staying predictable close in. Lifted from XPGem.updateMagnet so
 * the 400/800 tuning is unit-testable and the minimum-speed floor
 * is explicit.
 */

/** Floor — magnetised gems never fly slower than this. */
export const XP_GEM_MAGNET_MIN_SPEED = 400;
/** Base speed at zero distance (before the slope is subtracted). */
export const XP_GEM_MAGNET_BASE_SPEED = 800;
/** Speed reduction per pixel of distance (applied before the floor). */
export const XP_GEM_MAGNET_SLOPE = 2;

export function xpGemMagnetSpeed(distance: number): number {
  return Math.max(
    XP_GEM_MAGNET_MIN_SPEED,
    XP_GEM_MAGNET_BASE_SPEED - distance * XP_GEM_MAGNET_SLOPE,
  );
}
