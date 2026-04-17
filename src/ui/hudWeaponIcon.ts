/**
 * Fallback chain for the HUD weapon-slot icon texture.
 *
 * The HUD renders one 40×40 icon per equipped weapon. Each weapon can
 * be either base (`wicon_{key}`) or evolved (`wicon_{evolutionKey}`).
 * Evolutions ship with bespoke icons, but a mod / unexpected save
 * could carry an evolutionKey without a matching texture — in that
 * case we fall back to the base icon, then to the thistle-shot icon
 * (which is guaranteed by BootScene) so the slot never renders as
 * Phaser's magenta missing-texture square.
 *
 * Pure on its inputs; callers pass a `textureExists` predicate so the
 * helper is testable without a Phaser env.
 */

export interface HudWeaponIconInput {
  /** Weapon key (e.g. `thistle_shot`). */
  key: string;
  /** True when the player has the evolved form. */
  evolved?: boolean;
  /** Evolution weapon key when `evolved` is true. */
  evolutionKey?: string;
}

/** Last-resort fallback texture — guaranteed to exist from BootScene. */
export const HUD_WEAPON_ICON_FALLBACK = 'wicon_thistle_shot';

export function resolveWeaponIconKey(
  weapon: HudWeaponIconInput,
  textureExists: (key: string) => boolean,
): string {
  if (weapon.evolved && weapon.evolutionKey) {
    const evoKey = `wicon_${weapon.evolutionKey}`;
    if (textureExists(evoKey)) return evoKey;
  }
  const baseKey = `wicon_${weapon.key}`;
  if (textureExists(baseKey)) return baseKey;
  return HUD_WEAPON_ICON_FALLBACK;
}
