/**
 * Pure palette for the tiny cozy campfire drawn below the main-menu
 * button cluster. Five colours layered from darkest (charcoal base)
 * to brightest (core ember), with a warm smoke tone and the ember-
 * particle colour on top.
 *
 * Extracted so any future tweak to the hearth mood lands in one
 * place, and so tests can pin the "core is brightest, base is
 * darkest" visual-weight ordering.
 */

export interface MainMenuHearthPalette {
  /** Dark charcoal ellipse under the fire — the "ground". */
  base: number;
  baseAlpha: number;
  /** Outer warm glow halo. */
  glowOuter: number;
  glowOuterAlpha: number;
  /** Inner bright glow. */
  glowInner: number;
  glowInnerAlpha: number;
  /** Hottest core ember. */
  core: number;
  coreAlpha: number;
  /** Smoke wisp tint (fades up from the fire). */
  smoke: number;
  /** Rising ember particle colour. */
  ember: number;
  emberAlpha: number;
}

export const MAIN_MENU_HEARTH: MainMenuHearthPalette = {
  base: 0x3a2410,
  baseAlpha: 0.85,
  glowOuter: 0xff7a1a,
  glowOuterAlpha: 0.25,
  glowInner: 0xffc255,
  glowInnerAlpha: 0.55,
  core: 0xff8833,
  coreAlpha: 0.88,
  smoke: 0xccbbaa,
  ember: 0xff8833,
  emberAlpha: 0.7,
};
