/**
 * Pure palette bundles for the three one-shot tutorial tips shown
 * the first time each late-game mechanic fires. Each tip has a
 * text + background colour that reads as the mechanic's "identity"
 * hue:
 *
 *   ceilidh chain    → green (Ceilidh Chain)
 *   standing stones  → purple (Standing Stones)
 *   ancestral echo   → blue (Ancestral Echo)
 *
 * Pulled out of TutorialSystem so any future one-shot tip can copy
 * the shape instead of re-picking colours, and the three existing
 * tips can't drift into matching hues by accident.
 */

export interface TutorialTipPalette {
  textColor: string;
  bgColor: string;
}

export const TUTORIAL_TIP_CEILIDH_CHAIN: TutorialTipPalette = {
  textColor: '#b8e8a8',
  bgColor: '#0a2010cc',
};

export const TUTORIAL_TIP_STANDING_STONES: TutorialTipPalette = {
  textColor: '#d0c0ff',
  bgColor: '#10082acc',
};

export const TUTORIAL_TIP_ANCESTRAL_ECHO: TutorialTipPalette = {
  textColor: '#b0d4ff',
  bgColor: '#081828cc',
};
