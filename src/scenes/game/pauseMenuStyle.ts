/**
 * Pure style resolver for PauseMenu.open — four decisions:
 *
 *   title size       — "34px" on short viewports, "46px" otherwise
 *   title stroke     — thicker in high-contrast; slightly thinner on short viewports
 *   title colour     — gold (normal) or amber-gold (HC)
 *   backdrop alpha   — darker in HC to keep foreground legible
 *
 * Viewport height < 420 qualifies as "short" — below that the default
 * 46px title would crowd the stats block.
 */

/** Height below which the pause title shrinks. */
export const PAUSE_SHORT_VIEWPORT_HEIGHT = 420;
/** Title font size — short variant. */
export const PAUSE_TITLE_SIZE_SHORT = '34px';
/** Title font size — wide viewport variant. */
export const PAUSE_TITLE_SIZE_WIDE = '46px';

import { COLORS, COLORS_CSS } from '../../config';

export const PAUSE_TITLE_COLOR = COLORS_CSS.WHISKY_GOLD;
export const PAUSE_TITLE_COLOR_HC = '#ffe08a';

export interface PauseMenuStyle {
  titlePx: string;
  titleStroke: number;
  titleColor: string;
  backdropAlpha: number;
  shortViewport: boolean;
}

export function resolvePauseMenuStyle(viewportHeight: number, highContrast: boolean): PauseMenuStyle {
  const shortViewport = viewportHeight < PAUSE_SHORT_VIEWPORT_HEIGHT;
  const titlePx = shortViewport ? PAUSE_TITLE_SIZE_SHORT : PAUSE_TITLE_SIZE_WIDE;
  const titleStroke = shortViewport
    ? (highContrast ? 6 : 4)
    : (highContrast ? 8 : 5);
  const titleColor = highContrast ? PAUSE_TITLE_COLOR_HC : PAUSE_TITLE_COLOR;
  const backdropAlpha = highContrast ? 0.95 : 0.85;
  return { titlePx, titleStroke, titleColor, backdropAlpha, shortViewport };
}

// ── Pause menu action buttons ────────────────────────────────────────
//
// Two buttons sit at the bottom of the pause overlay: a primary
// Resume (Scottish blue CTA) and a secondary Quit (neutral grey).
// Each has a fill + hover fill.

export interface PauseButtonPalette {
  idle: number;
  hover: number;
}

export const PAUSE_RESUME_BUTTON_PALETTE: PauseButtonPalette = {
  idle: COLORS.SCOTTISH_BLUE,
  hover: 0x0077dd,
};

export const PAUSE_QUIT_BUTTON_PALETTE: PauseButtonPalette = {
  idle: 0x444444,
  hover: 0x555555,
};

// ── Secondary text colours (HC-aware) ───────────────────────────────
//
// Two smaller text blocks on the pause overlay lift / dim with the
// accessibility toggle: the active-curse line (warm pink) and the
// elite-affix reference list (cool slate). Each pair follows the
// HC-ON / HC-OFF convention already established by the title.

export const PAUSE_CURSE_LINE_COLOR = '#c49bbf';
export const PAUSE_CURSE_LINE_COLOR_HC = '#f5d0e8';
export const PAUSE_ELITE_REF_COLOR = '#6a7a88';
export const PAUSE_ELITE_REF_COLOR_HC = '#a8b8c8';

export function resolvePauseCurseLineColor(highContrast: boolean): string {
  return highContrast ? PAUSE_CURSE_LINE_COLOR_HC : PAUSE_CURSE_LINE_COLOR;
}

export function resolvePauseEliteRefColor(highContrast: boolean): string {
  return highContrast ? PAUSE_ELITE_REF_COLOR_HC : PAUSE_ELITE_REF_COLOR;
}
