/**
 * Pure predicate: is the player currently immune to environmental
 * hazard damage?
 *
 * Composes all four immunity sources so HazardZones (static lava /
 * heal patches) and HazardsSystem (dynamic biome-conditioned hazards)
 * can share one gate and never drift. Pre-2026-04-28 the two systems
 * inlined different subsets of these checks — HazardZones gated 4,
 * HazardsSystem gated 2 (missing post-hit iframes + assist-mode
 * invincibility). This helper closes that gap.
 *
 * Sources:
 * - `postHitIframed` — iFrameController active (post-enemy-contact
 *   invuln window)
 * - `dashInvincible` — `Player.isDashInvincible()` (active dash window)
 * - `hazardLeaping` — `Player.isHazardLeaping()` (Burn-Leap relic
 *   hazard immunity)
 * - `assistInvincible` — `isInvincibilityEnabled()` from SettingsManager
 *   (Assist Mode accessibility toggle)
 *
 * Inputs are plain booleans so the helper is unit-testable without a
 * Phaser scene + Player + SettingsManager stack.
 */
export function isPlayerHazardImmune(
  postHitIframed: boolean,
  dashInvincible: boolean,
  hazardLeaping: boolean,
  assistInvincible: boolean,
): boolean {
  return postHitIframed || dashInvincible || hazardLeaping || assistInvincible;
}
