/**
 * Pure 2-state fill style for the tiny cooldown bar under each HUD
 * weapon tile.
 *
 *   ready    → bright green at 85% alpha — the weapon will fire next frame
 *   charging → cool blue at 50% alpha    — weapon still cooling down
 *
 * Pulled out of HUD.updateWeaponSlots so the ready/charging pair
 * reads as two named palette entries instead of a ternary, and the
 * alpha difference (ready is more saturated than charging) is
 * pinned by a test.
 */

export interface HudCooldownBarStyle {
  fillColor: number;
  alpha: number;
}

export const HUD_COOLDOWN_READY: HudCooldownBarStyle = {
  fillColor: 0x44cc44,
  alpha: 0.85,
};

export const HUD_COOLDOWN_CHARGING: HudCooldownBarStyle = {
  fillColor: 0x005eb8,
  alpha: 0.5,
};

export function resolveHudCooldownBarStyle(isReady: boolean): HudCooldownBarStyle {
  return isReady ? HUD_COOLDOWN_READY : HUD_COOLDOWN_CHARGING;
}
