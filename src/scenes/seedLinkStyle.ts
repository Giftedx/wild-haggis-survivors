/**
 * Pure style resolver for the MainMenu's two "enter seed" / "rerun
 * last seed" text links. Both links share an identical visual
 * pattern: a subdued blue-grey idle state that lifts to the warm
 * title colour on hover, with a thicker black stroke on hover to
 * stay legible against the parallax mountains behind them. The
 * high-contrast toggle punches up every colour one notch and adds a
 * pixel to every stroke.
 *
 * Pulling this out of MainMenuScene collapses 4 near-identical
 * pointerover/pointerout ternaries into a single data object.
 */

import { COLORS_CSS } from '../config';

export interface SeedLinkStateStyle {
  color: string;
  stroke: string;
  strokeThickness: number;
}

export interface SeedLinkStyleSet {
  idle: SeedLinkStateStyle;
  hover: SeedLinkStateStyle;
}

const IDLE_COLOR_NORMAL = '#8e9bb8';
const IDLE_COLOR_HC = '#b8c6dc';
const IDLE_STROKE = '#06080c';
const HOVER_STROKE = COLORS_CSS.BLACK;

export function resolveSeedLinkStyle(
  highContrastUi: boolean,
  hoverColor: string,
): SeedLinkStyleSet {
  const idleThickness = highContrastUi ? 3 : 2;
  const hoverThickness = highContrastUi ? 4 : 3;
  return {
    idle: {
      color: highContrastUi ? IDLE_COLOR_HC : IDLE_COLOR_NORMAL,
      stroke: IDLE_STROKE,
      strokeThickness: idleThickness,
    },
    hover: {
      color: hoverColor,
      stroke: HOVER_STROKE,
      strokeThickness: hoverThickness,
    },
  };
}
