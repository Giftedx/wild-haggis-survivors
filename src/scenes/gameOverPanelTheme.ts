import { COLORS, COLORS_CSS } from '../config';

/**
 * Panel-level theme values for GameOverScene. Victory renders in
 * whisky/gold (celebration); death in red/maroon (gravitas). The
 * title also changes size and starting scale so victory eases in
 * from a slight shrink and death eases in from an overshoot.
 *
 * Extracted from GameOverScene.create so the four coordinated
 * branches (title colour, panel stroke, title size, initial title
 * scale) stay in lockstep — a future mode (e.g. special-curse
 * epilogue) only needs one new branch here.
 */
export interface GameOverPanelTheme {
  /** Hex colour string for the title text. */
  titleColor: string;
  /** 0xRRGGBB integer for the panel outline stroke. */
  panelStroke: number;
  /** CSS-style font size for the title text. */
  titleFontSize: string;
  /** Starting scale multiplier — the scene then eases to 1×uiScale. */
  titleStartScale: number;
}

/**
 * Two-branch theme selector. High-contrast mode keeps its own panel
 * stroke (a light blue authored elsewhere), so the `panelStroke`
 * returned here is ONLY used in the normal palette — the scene
 * overrides it with `0x8fb4ff` when hc is on.
 */
/** Array of death-title i18n keys — rotates so each death feels different. */
export const GAME_OVER_DEATH_TITLE_KEYS = [
  'ui.gameOver.death_title',
  'ui.gameOver.death_title_2',
  'ui.gameOver.death_title_3',
  'ui.gameOver.death_title_4',
] as const;

/** Matched pool of death-subtitle i18n keys. */
export const GAME_OVER_DEATH_SUB_KEYS = [
  'ui.gameOver.death_sub',
  'ui.gameOver.death_sub_2',
  'ui.gameOver.death_sub_3',
  'ui.gameOver.death_sub_4',
] as const;

/** i18n keys for the victory title + subtitle. */
export const GAME_OVER_VICTORY_TITLE_KEY = 'ui.gameOver.victory_title';
export const GAME_OVER_VICTORY_SUB_KEY = 'ui.gameOver.victory_sub';

/**
 * Ironmoor banner shown on any Ironmoor run (victory or death). Copy
 * leans into the pride moment on victory and into a compassionate
 * register on death (per the Soul Charter); the tint follows suit.
 */
export interface IronmoorBannerStyle {
  /** i18n key for the banner copy. */
  key: string;
  /** Hex colour string for the banner text. */
  color: string;
}

export function ironmoorBannerStyle(isVictory: boolean): IronmoorBannerStyle {
  return isVictory
    ? { key: 'ui.gameOver.ironmoor_victory_banner', color: '#f7c270' }
    : { key: 'ui.gameOver.ironmoor_death_banner', color: '#c8a0a0' };
}

/**
 * Pick title + subtitle i18n keys for the Game Over screen. Victory
 * always uses the single victory pair; death rotates through four
 * pairs based on the two caller-supplied indices (so the caller owns
 * the RNG and tests stay deterministic).
 *
 * Indices are modulo'd and clamped into the array range — a
 * Phaser.Math.Between(0, 3) caller will always land cleanly, and a
 * mis-configured Between(0, 99) caller still produces a valid key.
 */
export function pickGameOverTitleKeys(
  isVictory: boolean,
  titleIndex: number,
  subIndex: number,
): { titleKey: string; subKey: string } {
  if (isVictory) {
    return { titleKey: GAME_OVER_VICTORY_TITLE_KEY, subKey: GAME_OVER_VICTORY_SUB_KEY };
  }
  const tLen = GAME_OVER_DEATH_TITLE_KEYS.length;
  const sLen = GAME_OVER_DEATH_SUB_KEYS.length;
  const ti = ((Math.floor(titleIndex) % tLen) + tLen) % tLen;
  const si = ((Math.floor(subIndex) % sLen) + sLen) % sLen;
  return {
    titleKey: GAME_OVER_DEATH_TITLE_KEYS[ti],
    subKey: GAME_OVER_DEATH_SUB_KEYS[si],
  };
}

export function resolveGameOverPanelTheme(isVictory: boolean): GameOverPanelTheme {
  if (isVictory) {
    return {
      titleColor: COLORS_CSS.WHISKY_GOLD,
      panelStroke: COLORS.WHISKY_GOLD,
      titleFontSize: '56px',
      titleStartScale: 0.7,
    };
  }
  return {
    titleColor: '#cc3333',
    panelStroke: 0xaa4444,
    titleFontSize: '52px',
    titleStartScale: 1.4,
  };
}
