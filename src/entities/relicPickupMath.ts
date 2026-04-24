/**
 * Pure proximity + lifetime helpers for RelicPickup (R1 M2 T16).
 *
 * Split from the Phaser-bound entity so the decision math tests in a
 * node-env vitest run without touching the Phaser module.
 */

/** Pickup radius in pixels — matches Reliquary for consistency. */
export const RELIC_PICKUP_RADIUS_PX = 34;

/**
 * Lifetime in ms before a dropped Relic despawns if not collected.
 * Spec §6 drop-roll flow: "pickup entity lives 60 s before despawning
 * (urgency without instant-lose)".
 */
export const RELIC_PICKUP_LIFETIME_MS = 60_000;

/**
 * Squared proximity check — avoids a sqrt when we only need a boolean.
 * Distances below the radius return true (inclusive).
 */
export function isWithinPickupRange(
  px: number,
  py: number,
  rx: number,
  ry: number,
  radius: number = RELIC_PICKUP_RADIUS_PX,
): boolean {
  const dx = px - rx;
  const dy = py - ry;
  return dx * dx + dy * dy <= radius * radius;
}

/** True once the pickup has outlived its 60s window and should be cleaned up. */
export function isDespawned(elapsedMs: number, lifetimeMs: number = RELIC_PICKUP_LIFETIME_MS): boolean {
  return elapsedMs >= lifetimeMs;
}
