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
