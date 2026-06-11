import { COLORS_CSS } from '../config';

/**
 * MainMenu cozy-redesign palette — pinned per high-contrast state.
 *
 * Five coordinated colours define the mood:
 *   title        — warm gold (anchored on COLORS_CSS.WHISKY_GOLD)
 *   subdued      — secondary text (taglines)
 *   hint         — tertiary text (seed hints, credit strip)
 *   mountainDark — parallax silhouette base
 *   mountainLight — parallax silhouette top layer
 *
 * High-contrast nudges every value toward higher luminance so the
 * whole scene reads for low-vision players without re-authoring.
 */

export interface MainMenuPalette {
  title: string;
  subdued: string;
  hint: string;
  mountainDark: number;
  mountainLight: number;
}

export const MAIN_MENU_PALETTE_NORMAL: MainMenuPalette = {
  title: COLORS_CSS.WHISKY_GOLD,
  subdued: '#95a5c3',
  hint: '#6a7390',
  mountainDark: 0x131c2a,
  mountainLight: 0x1b2638,
};

export const MAIN_MENU_PALETTE_HC: MainMenuPalette = {
  title: '#ffe08a',
  subdued: '#c8d2e0',
  hint: '#a8b3c8',
  mountainDark: 0x1a2a3a,
  mountainLight: 0x2a3a4a,
};

export function resolveMainMenuPalette(highContrast: boolean): MainMenuPalette {
  return highContrast ? MAIN_MENU_PALETTE_HC : MAIN_MENU_PALETTE_NORMAL;
}
