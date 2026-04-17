import { COLORS } from '../config';

/**
 * Pure 3-state style resolver for off-screen enemy edge indicators.
 *
 * Each indicator has a coordinated 4-tuple of visual parameters:
 *
 *   boss     → warm gold, 1.6× pulse scale, strong glow halo
 *   elite    → affix-tinted colour, 1.1× pulse scale, medium glow
 *   regular  → classic red, 1.0× pulse scale, subtle glow
 *
 * Each tier also bumps the glow rectangle's radius offset so bosses
 * feel visually weightier than elites. Pulling the 3-branch match
 * out of EdgeIndicators.update() so the scale-factor + glow-alpha
 * pairing per tier is one data object.
 */

/** Gold used for boss indicators (and the fallback elite tint). */
export const EDGE_INDICATOR_BOSS_COLOR = COLORS.WHISKY_GOLD;
/** Red used for regular enemy indicators. */
export const EDGE_INDICATOR_REGULAR_COLOR = 0xff4444;

export interface EdgeIndicatorStyle {
  color: number;
  scaleMul: number;
  glowAlpha: number;
  glowRadiusOffset: number;
}

export function resolveEdgeIndicatorStyle(
  kind: 'boss' | 'elite' | 'regular',
  eliteTint: number,
): EdgeIndicatorStyle {
  if (kind === 'boss') {
    return {
      color: EDGE_INDICATOR_BOSS_COLOR,
      scaleMul: 1.6,
      glowAlpha: 0.2,
      glowRadiusOffset: 5,
    };
  }
  if (kind === 'elite') {
    return {
      color: eliteTint,
      scaleMul: 1.1,
      glowAlpha: 0.12,
      glowRadiusOffset: 3,
    };
  }
  return {
    color: EDGE_INDICATOR_REGULAR_COLOR,
    scaleMul: 1.0,
    glowAlpha: 0.1,
    glowRadiusOffset: 3,
  };
}
