import { describe, it, expect } from 'vitest';
import {
  TUTORIAL_TIP_CEILIDH_CHAIN,
  TUTORIAL_TIP_STANDING_STONES,
  TUTORIAL_TIP_ANCESTRAL_ECHO,
  type TutorialTipPalette,
} from './tutorialTipPalettes';

const ALL: ReadonlyArray<[string, TutorialTipPalette]> = [
  ['ceilidh', TUTORIAL_TIP_CEILIDH_CHAIN],
  ['standing stones', TUTORIAL_TIP_STANDING_STONES],
  ['ancestral echo', TUTORIAL_TIP_ANCESTRAL_ECHO],
];

describe('tutorialTipPalettes — 3 distinct identity hues', () => {
  it('each tip has a distinct text colour (mechanic identity reads)', () => {
    const colors = ALL.map(([, p]) => p.textColor);
    expect(new Set(colors).size).toBe(ALL.length);
  });

  it('each tip has a distinct bg colour', () => {
    const bgs = ALL.map(([, p]) => p.bgColor);
    expect(new Set(bgs).size).toBe(ALL.length);
  });

  it('every bg has a trailing alpha component (8-char hex or rgba)', () => {
    for (const [name, p] of ALL) {
      // `cc` suffix on 8-char hex == 0.8 alpha — tips should be tinted dark, not opaque.
      expect(p.bgColor.length).toBeGreaterThan(7);
      expect(p.bgColor).toContain('#');
      // Sanity: the literal 'cc' suffix pattern that TutorialSystem relies on.
      expect(p.bgColor.endsWith('cc')).toBe(true);
      void name;
    }
  });
});
