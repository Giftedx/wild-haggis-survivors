import { COLORS } from '../config';

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
export function resolveGameOverPanelTheme(isVictory: boolean): GameOverPanelTheme {
  if (isVictory) {
    return {
      titleColor: '#d4a017',
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
