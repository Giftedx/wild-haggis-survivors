/**
 * Pure 2-state palettes for the six hand-tinted MainMenu buttons.
 *
 * Each button on the main menu has a distinct hue that nods at its
 * destination — abandon is a slate (sad blue-grey), daily is whisky
 * gold, meta is green (coin/money hue), chronicle leans purple (ink
 * + paper), deeds is warm brown (parchment), options is blue. A
 * single palette per button bundles the idle fill + hover fill so
 * the pointerover / pointerout handlers never drift apart.
 *
 * The Start button (primary CTA) uses a runtime lighten() on
 * COLORS.SCOTTISH_BLUE, not a hand-picked hover — it's intentionally
 * excluded from this module.
 */

export interface MenuButtonPalette {
  idle: number;
  hover: number;
}

export const MAIN_MENU_ABANDON_PALETTE: MenuButtonPalette = {
  idle: 0x3a4357, hover: 0x4a5568,
};

export const MAIN_MENU_DAILY_PALETTE: MenuButtonPalette = {
  idle: 0x8b6914, hover: 0xa87e1a,
};

export const MAIN_MENU_META_PALETTE: MenuButtonPalette = {
  idle: 0x2d6a3e, hover: 0x3a8f4f,
};

export const MAIN_MENU_CHRONICLE_PALETTE: MenuButtonPalette = {
  idle: 0x3a2c52, hover: 0x4a3865,
};

export const MAIN_MENU_DEEDS_PALETTE: MenuButtonPalette = {
  idle: 0x523a2c, hover: 0x6a4a38,
};

export const MAIN_MENU_OPTIONS_PALETTE: MenuButtonPalette = {
  idle: 0x2d3e62, hover: 0x3d4e72,
};
