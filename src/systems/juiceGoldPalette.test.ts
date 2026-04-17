import { describe, it, expect } from 'vitest';
import {
  JUICE_BOSS_DEATH_GOLDS,
  JUICE_BOSS_DEATH_RING_PRIMARY,
  JUICE_BOSS_DEATH_RING_SECONDARY,
  JUICE_EVOLUTION_GOLDS,
  JUICE_EVOLUTION_RING_GOLDS,
  JUICE_EVOLUTION_BEAM_COLOR,
  JUICE_EVOLUTION_BANNER_LINE_COLOR,
  JUICE_EVOLUTION_BANNER_BG_COLOR,
} from './juiceGoldPalette';

describe('juice gold palettes — shape invariants', () => {
  it('boss-death palette is a 4-colour set with no duplicates', () => {
    expect(JUICE_BOSS_DEATH_GOLDS.length).toBe(4);
    expect(new Set(JUICE_BOSS_DEATH_GOLDS).size).toBe(4);
  });

  it('evolution palette is a 4-colour set with no duplicates', () => {
    expect(JUICE_EVOLUTION_GOLDS.length).toBe(4);
    expect(new Set(JUICE_EVOLUTION_GOLDS).size).toBe(4);
  });

  it('evolution ring palette is 3 distinct shades (light → dark layering)', () => {
    expect(JUICE_EVOLUTION_RING_GOLDS.length).toBe(3);
    expect(new Set(JUICE_EVOLUTION_RING_GOLDS).size).toBe(3);
  });
});

describe('juice gold palettes — semantic invariants', () => {
  it('boss-death ring primary and secondary are drawn from the boss-death gold set', () => {
    expect(JUICE_BOSS_DEATH_GOLDS).toContain(JUICE_BOSS_DEATH_RING_PRIMARY);
    expect(JUICE_BOSS_DEATH_GOLDS).toContain(JUICE_BOSS_DEATH_RING_SECONDARY);
  });

  it('evolution ring shades are drawn from within the evolution palette family', () => {
    // Not a strict subset — but each ring colour should appear in the main
    // evolution palette or its boss-death cousin (both are "gold").
    const familiarGolds = new Set([
      ...JUICE_EVOLUTION_GOLDS,
      ...JUICE_BOSS_DEATH_GOLDS,
    ]);
    for (const c of JUICE_EVOLUTION_RING_GOLDS) {
      expect(familiarGolds.has(c)).toBe(true);
    }
  });

  it('banner line matches beam colour (both are the warm evolution gold)', () => {
    expect(JUICE_EVOLUTION_BANNER_LINE_COLOR).toBe(JUICE_EVOLUTION_BEAM_COLOR);
  });

  it('banner backdrop is a dark tone (not in the gold family)', () => {
    expect(JUICE_EVOLUTION_BANNER_BG_COLOR).toBe(0x2a1a00);
    expect(JUICE_EVOLUTION_GOLDS).not.toContain(JUICE_EVOLUTION_BANNER_BG_COLOR);
  });
});
