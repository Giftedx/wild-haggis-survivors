/**
 * Pure palette constants for the two world-hazard zone types:
 *
 *   Lava (damaging) — red-orange base with a brighter amber pulse glow.
 *   Heal (restorative) — deep green base with a brighter lime pulse glow.
 *
 * Each zone has a base ellipse (static tint/alpha) and a pulsing
 * glow ellipse on top. The base + glow alphas are separate so the
 * pulse has room to breathe under the base. Pulled from HazardZones
 * so palette tweaks don't require touching spawn logic.
 */

export interface HazardZonePalette {
  baseColor: number;
  baseAlpha: number;
  glowColor: number;
  glowAlpha: number;
}

export const HAZARD_ZONE_LAVA: HazardZonePalette = {
  baseColor: 0xcc3300,
  baseAlpha: 0.4,
  glowColor: 0xff6600,
  glowAlpha: 0.2,
};

export const HAZARD_ZONE_HEAL: HazardZonePalette = {
  baseColor: 0x22aa44,
  baseAlpha: 0.2,
  glowColor: 0x44dd66,
  glowAlpha: 0.1,
};

/**
 * Slick (Buckfast bottle break) — dark olive-green base with an amber
 * highlight pulse. Reads as "spilled sticky wine" rather than "poison"
 * so players associate it with the ned enemy, not with a damage tile.
 */
export const HAZARD_ZONE_SLICK: HazardZonePalette = {
  baseColor: 0x2a3a10,
  baseAlpha: 0.5,
  glowColor: 0xccaa22,
  glowAlpha: 0.2,
};

/**
 * Fog (haar_wraith dispel) — pale blue-grey mist. Low contrast by
 * design so it visually "drifts" rather than demanding attention.
 * Reads as weather, not hazard; the mechanical bite is halved pickup
 * radius while the player stands in it, not damage.
 */
export const HAZARD_ZONE_FOG: HazardZonePalette = {
  baseColor: 0xc8d0dc,
  baseAlpha: 0.35,
  glowColor: 0xe8eef4,
  glowAlpha: 0.18,
};
