import { COLORS, COLORS_CSS } from '../config';

/**
 * Pure 2-state style resolver for the HUD weapon slot tile.
 *
 * Each of the six weapon tiles has a level pip label in its
 * top-right corner and a 2-pixel border around the tile. When the
 * weapon reaches its evolved form, both switch to a warm gold to
 * celebrate the transformation; otherwise they follow the default
 * palette (white pip, dim grey border) or the high-contrast border
 * override when that accessibility mode is on.
 *
 * The evolved palette is immune to the HC override — the gold tells
 * you the weapon is evolved, and that signal should read the same
 * regardless of accessibility mode.
 */

export interface HudWeaponSlotStyle {
  /** Colour of the level pip / "★" text in the corner. */
  labelColor: string;
  /** Border colour of the slot tile. */
  strokeColor: number;
}

export const WEAPON_SLOT_EVOLVED_LABEL = '#ffdd44';
export const WEAPON_SLOT_NORMAL_LABEL = COLORS_CSS.WHITE;
export const WEAPON_SLOT_EVOLVED_STROKE = COLORS.LEGENDARY;
export const WEAPON_SLOT_DEFAULT_STROKE = 0x666666;

export function resolveHudWeaponSlotStyle(
  evolved: boolean | undefined,
  hcSlotStroke: number | null,
): HudWeaponSlotStyle {
  if (evolved) {
    return {
      labelColor: WEAPON_SLOT_EVOLVED_LABEL,
      strokeColor: WEAPON_SLOT_EVOLVED_STROKE,
    };
  }
  return {
    labelColor: WEAPON_SLOT_NORMAL_LABEL,
    strokeColor: hcSlotStroke ?? WEAPON_SLOT_DEFAULT_STROKE,
  };
}
