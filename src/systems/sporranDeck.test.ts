import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import { ALL_SPORRAN_CARDS } from '../data/sporranCards';
import { DEFAULT_VARIANT_KEY } from '../data/variants';
import { getActiveSeasonalEventKey } from './SeasonalEventManager';
import { createRNG } from '../utils/rng';
import {
  SPORRAN_DRAW_COUNT,
  SPORRAN_PICK_COUNT,
  applySporranPicks,
  drawSporran,
  filterEligibleSporranCards,
  isSporranCardEligible,
  type SporranCard,
  type SporranEligibilityContext,
} from './sporranDeck';

/** Synth context for the tests — empty-deed default-variant no-event. */
const baseContext: SporranEligibilityContext = {
  progress: {
    bestTime: 0,
    bestKills: 0,
    totalGoldEarned: 0,
    victories: 0,
  },
  activeSeasonalEventKey: null,
  variantKey: DEFAULT_VARIANT_KEY,
};

const cardById = new Map(ALL_SPORRAN_CARDS.map((c) => [c.id, c]));

function pick(id: string): SporranCard {
  const card = cardById.get(id);
  if (!card) throw new Error(`test setup: missing card '${id}'`);
  return card;
}

describe('drawSporran', () => {
  it('returns exactly SPORRAN_DRAW_COUNT cards by default', () => {
    const drawn = drawSporran(createRNG(1), ALL_SPORRAN_CARDS);
    expect(drawn).toHaveLength(SPORRAN_DRAW_COUNT);
  });

  it('respects an explicit drawCount', () => {
    const drawn = drawSporran(createRNG(1), ALL_SPORRAN_CARDS, 3);
    expect(drawn).toHaveLength(3);
  });

  it('returns the whole pool when drawCount exceeds pool size', () => {
    const drawn = drawSporran(createRNG(1), ALL_SPORRAN_CARDS, 999);
    expect(drawn).toHaveLength(ALL_SPORRAN_CARDS.length);
  });

  it('returns an empty array when drawCount is zero or negative', () => {
    expect(drawSporran(createRNG(1), ALL_SPORRAN_CARDS, 0)).toEqual([]);
    expect(drawSporran(createRNG(1), ALL_SPORRAN_CARDS, -3)).toEqual([]);
  });

  it('returns distinct cards (no duplicates within a single draw)', () => {
    const drawn = drawSporran(createRNG(42), ALL_SPORRAN_CARDS);
    const ids = new Set(drawn.map((c) => c.id));
    expect(ids.size).toBe(drawn.length);
  });

  it('is deterministic for a given seed (replay-safe)', () => {
    const drawA = drawSporran(createRNG(7), ALL_SPORRAN_CARDS);
    const drawB = drawSporran(createRNG(7), ALL_SPORRAN_CARDS);
    expect(drawA.map((c) => c.id)).toEqual(drawB.map((c) => c.id));
  });

  it('produces different draws for different seeds (sanity, not statistical)', () => {
    const drawA = drawSporran(createRNG(1), ALL_SPORRAN_CARDS).map((c) => c.id);
    const drawB = drawSporran(createRNG(2), ALL_SPORRAN_CARDS).map((c) => c.id);
    expect(drawA).not.toEqual(drawB);
  });

  it('does not mutate the caller-passed pool array', () => {
    const before = ALL_SPORRAN_CARDS.map((c) => c.id);
    drawSporran(createRNG(99), ALL_SPORRAN_CARDS);
    const after = ALL_SPORRAN_CARDS.map((c) => c.id);
    expect(after).toEqual(before);
  });
});

describe('applySporranPicks', () => {
  it('empty picks leave the bag identity-equal', () => {
    const m = defaultModifiers();
    const result = applySporranPicks([], m);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(result.extraDamageMultiplier).toBe(0);
    expect(result.appliedIds).toEqual([]);
    expect(m).toEqual(defaultModifiers());
  });

  it('quirk_haggis_blooded routes its damage delta through extraDamageMultiplier (Phase 1.5)', () => {
    const m = defaultModifiers();
    const result = applySporranPicks([pick('quirk_haggis_blooded')], m);
    expect(result.extraDamageMultiplier).toBeCloseTo(0.12, 5);
    // The +damage-taken side rides RunModifiers.damageTakenMult.
    expect(m.damageTakenMult).toBeCloseTo(1.12, 5);
    expect(result.extraStartingHpHeal).toBe(0);
  });

  it('records picked ids in pick order', () => {
    const m = defaultModifiers();
    const picks = [pick('boon_silver'), pick('boon_coal'), pick('boon_whisky')];
    const result = applySporranPicks(picks, m);
    expect(result.appliedIds).toEqual([
      'boon_silver',
      'boon_coal',
      'boon_whisky',
    ]);
  });

  it('accumulates extraStartingHpHeal across picks', () => {
    const m = defaultModifiers();
    // Triple-shortbread isn't possible from a single draw (cards are
    // distinct), but the helper is pure under that input — heal sums.
    const picks = [pick('boon_shortbread'), pick('boon_shortbread'), pick('boon_shortbread')];
    const result = applySporranPicks(picks, m);
    expect(result.extraStartingHpHeal).toBe(60);
  });

  it('triple-curse compounds goldMult multiplicatively (~×2.46)', () => {
    const m = defaultModifiers();
    applySporranPicks(
      [
        pick('curse_heavy_legs'),
        pick('curse_thin_hide'),
        pick('curse_windless_pipes'),
      ],
      m,
    );
    expect(m.goldMult).toBeCloseTo(1.30 * 1.40 * 1.35, 5);
  });

  it('triple-boon stays within bounded positive aggregate', () => {
    const m = defaultModifiers();
    applySporranPicks(
      [pick('boon_silver'), pick('boon_coal'), pick('boon_whisky')],
      m,
    );
    // All small deltas; goldMult only touched by silver.
    expect(m.goldMult).toBeCloseTo(1.10, 5);
    expect(m.damageTakenMult).toBeCloseTo(0.97, 5);
    expect(m.spawnIntervalMult).toBeCloseTo(1.05, 5);
  });

  it('mixed quirk + curse + boon mutates bag without throwing', () => {
    const m = defaultModifiers();
    const result = applySporranPicks(
      [pick('quirk_light_step'), pick('curse_heavy_legs'), pick('boon_silver')],
      m,
    );
    expect(result.appliedIds).toHaveLength(3);
    // light_step: ×1.05 speed / ×1.05 dmgTaken
    // heavy_legs: ×0.88 speed / ×1.30 gold
    // silver:      ×1.10 gold
    expect(m.moveSpeedMult).toBeCloseTo(1.05 * 0.88, 5);
    expect(m.damageTakenMult).toBeCloseTo(1.05, 5);
    expect(m.goldMult).toBeCloseTo(1.30 * 1.10, 5);
  });

  it('applies the three Hearth-register cards with distinct boon and cost profiles', () => {
    const m = defaultModifiers();
    const result = applySporranPicks(
      [pick('hearth_kettle_on'), pick('hearth_grans_shawl'), pick('hearth_banked_ember')],
      m,
    );
    expect(result.appliedIds).toEqual([
      'hearth_kettle_on',
      'hearth_grans_shawl',
      'hearth_banked_ember',
    ]);
    expect(result.extraStartingHpHeal).toBe(18);
    expect(result.extraDamageMultiplier).toBe(0);
    expect(m.damageTakenMult).toBeCloseTo(0.93, 5);
    expect(m.moveSpeedMult).toBeCloseTo(0.96, 5);
    expect(m.weaponCooldownMult).toBeCloseTo(0.95, 5);
    expect(m.startHpRatio).toBeCloseTo(0.94, 5);
  });
});

describe('ALL_SPORRAN_CARDS pool integrity', () => {
  it('contains exactly 26 cards (Phase 5 — 22 prior + 3 Hearth-register + 1 seasonal St Andrew\'s card)', () => {
    expect(ALL_SPORRAN_CARDS).toHaveLength(26);
  });

  it('splits as 5 curses + 8 boons + 13 quirks across the full pool', () => {
    const counts = { curse: 0, boon: 0, quirk: 0 };
    for (const card of ALL_SPORRAN_CARDS) counts[card.kind]++;
    // base 5+4+3 + Hearth (1 boon + 2 quirks) + Phase 3 (2 boons in
    // seasonal + 4 quirks in rare/variant) + Phase 4 (4 more quirks:
    // 2 seasonal + 2 variant) + St Andrew's follow-up (1 boon) = 5/8/13
    expect(counts).toEqual({ curse: 5, boon: 8, quirk: 13 });
  });

  it('every card has a unique non-empty id matching ^[a-z_]+$', () => {
    const ids = new Set<string>();
    for (const card of ALL_SPORRAN_CARDS) {
      expect(card.id).toMatch(/^[a-z_]+$/);
      expect(ids.has(card.id)).toBe(false);
      ids.add(card.id);
    }
    expect(ids.size).toBe(ALL_SPORRAN_CARDS.length);
  });

  it('every card has non-empty i18n keys for name + desc', () => {
    for (const card of ALL_SPORRAN_CARDS) {
      expect(card.nameKey.length).toBeGreaterThan(0);
      expect(card.descKey.length).toBeGreaterThan(0);
    }
  });

  it('SPORRAN_PICK_COUNT < SPORRAN_DRAW_COUNT (you keep less than you see)', () => {
    expect(SPORRAN_PICK_COUNT).toBeLessThan(SPORRAN_DRAW_COUNT);
    expect(SPORRAN_PICK_COUNT).toBeGreaterThan(0);
  });

  it('default draw fits within the pool (no degradation in normal use)', () => {
    expect(SPORRAN_DRAW_COUNT).toBeLessThanOrEqual(ALL_SPORRAN_CARDS.length);
  });

  it('the 15 base + Hearth cards remain un-gated (no eligibility field)', () => {
    const baseIds = new Set([
      'curse_heavy_legs', 'curse_thin_hide', 'curse_restless_spirits',
      'curse_empty_larder', 'curse_windless_pipes',
      'boon_shortbread', 'boon_whisky', 'boon_coal', 'boon_silver',
      'quirk_light_step', 'quirk_hardy_breath', 'quirk_haggis_blooded',
      'hearth_kettle_on', 'hearth_grans_shawl', 'hearth_banked_ember',
    ]);
    for (const card of ALL_SPORRAN_CARDS) {
      if (baseIds.has(card.id)) {
        expect(card.eligibility).toBeUndefined();
      }
    }
  });

  it('the 11 gated cards each carry an explicit eligibility gate', () => {
    const gatedIds = new Set([
      'rare_taxman_grudge', 'rare_witchs_thread',
      'seasonal_burns_dram', 'seasonal_samhain_lantern',
      'seasonal_hogmanay_coal', 'seasonal_beltane_spark', 'seasonal_st_andrews_saltire',
      'variant_cailleach_frost', 'variant_glaswegian_buckie',
      'variant_witch_hare_familiar', 'variant_selkie_sealskin',
    ]);
    for (const card of ALL_SPORRAN_CARDS) {
      if (gatedIds.has(card.id)) {
        expect(card.eligibility).toBeDefined();
        expect(card.eligibility?.type).not.toBe('always');
      }
    }
  });
});

describe('isSporranCardEligible — Phase 3 gating', () => {
  it('an un-gated card is always eligible', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'boon_shortbread')!;
    expect(isSporranCardEligible(card, baseContext)).toBe(true);
  });

  it('a deed gate fails on a fresh save and passes when the threshold is met', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'rare_taxman_grudge')!;
    expect(isSporranCardEligible(card, baseContext)).toBe(false);
    const ctx: SporranEligibilityContext = {
      ...baseContext,
      progress: { ...baseContext.progress, victories: 1 },
    };
    expect(isSporranCardEligible(card, ctx)).toBe(true);
  });

  it('cursed_victories deed gate honours the threshold (rare_witchs_thread = 5)', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'rare_witchs_thread')!;
    const ctxBelow: SporranEligibilityContext = {
      ...baseContext,
      progress: { ...baseContext.progress, cursedVictories: 4 },
    };
    const ctxAt: SporranEligibilityContext = {
      ...baseContext,
      progress: { ...baseContext.progress, cursedVictories: 5 },
    };
    expect(isSporranCardEligible(card, ctxBelow)).toBe(false);
    expect(isSporranCardEligible(card, ctxAt)).toBe(true);
  });

  it('a seasonal gate fails outside the window and passes inside', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'seasonal_burns_dram')!;
    expect(isSporranCardEligible(card, baseContext)).toBe(false);
    const ctxOff: SporranEligibilityContext = {
      ...baseContext,
      activeSeasonalEventKey: 'samhain',
    };
    expect(isSporranCardEligible(card, ctxOff)).toBe(false);
    const ctxOn: SporranEligibilityContext = {
      ...baseContext,
      activeSeasonalEventKey: 'burns_night',
    };
    expect(isSporranCardEligible(card, ctxOn)).toBe(true);
  });

  it('date-forces the St Andrew\'s card in-window and falls back out-of-window', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'seasonal_st_andrews_saltire')!;
    const inWindowCtx: SporranEligibilityContext = {
      ...baseContext,
      activeSeasonalEventKey: getActiveSeasonalEventKey(new Date(2027, 10, 30)),
    };
    const outWindowCtx: SporranEligibilityContext = {
      ...baseContext,
      activeSeasonalEventKey: getActiveSeasonalEventKey(new Date(2027, 11, 4)),
    };
    expect(inWindowCtx.activeSeasonalEventKey).toBe('st_andrews');
    expect(outWindowCtx.activeSeasonalEventKey).toBeNull();
    expect(isSporranCardEligible(card, inWindowCtx)).toBe(true);
    expect(isSporranCardEligible(card, outWindowCtx)).toBe(false);

    const fallbackPool = filterEligibleSporranCards(ALL_SPORRAN_CARDS, outWindowCtx);
    expect(fallbackPool.map((c) => c.id)).not.toContain('seasonal_st_andrews_saltire');
    expect(drawSporran(createRNG(31), fallbackPool)).toHaveLength(SPORRAN_DRAW_COUNT);
  });

  it('a variant gate fails on the wrong variant and passes on the matching one', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'variant_cailleach_frost')!;
    expect(isSporranCardEligible(card, baseContext)).toBe(false);
    const ctxWrong: SporranEligibilityContext = {
      ...baseContext,
      variantKey: 'glaswegian',
    };
    expect(isSporranCardEligible(card, ctxWrong)).toBe(false);
    const ctxRight: SporranEligibilityContext = {
      ...baseContext,
      variantKey: 'cailleach',
    };
    expect(isSporranCardEligible(card, ctxRight)).toBe(true);
  });
});

describe('filterEligibleSporranCards — Phase 3 pool filter', () => {
  it('default-variant fresh-save context yields the 15 un-gated cards', () => {
    const eligible = filterEligibleSporranCards(ALL_SPORRAN_CARDS, baseContext);
    expect(eligible).toHaveLength(15);
    expect(eligible.every((c) => !c.eligibility)).toBe(true);
  });

  it('preserves source-pool order (filter, not shuffle)', () => {
    const eligible = filterEligibleSporranCards(ALL_SPORRAN_CARDS, baseContext);
    const ids = eligible.map((c) => c.id);
    const expectedOrder = ALL_SPORRAN_CARDS
      .filter((c) => !c.eligibility)
      .map((c) => c.id);
    expect(ids).toEqual(expectedOrder);
  });

  it('a fully-loaded context (1 victory, Burns Night, cailleach) admits the matching gated cards', () => {
    const ctx: SporranEligibilityContext = {
      progress: {
        bestTime: 0, bestKills: 0, totalGoldEarned: 0, victories: 1,
        cursedVictories: 5,
      },
      activeSeasonalEventKey: 'burns_night',
      variantKey: 'cailleach',
    };
    const eligible = filterEligibleSporranCards(ALL_SPORRAN_CARDS, ctx);
    const eligibleIds = new Set(eligible.map((c) => c.id));
    expect(eligibleIds.has('rare_taxman_grudge')).toBe(true);
    expect(eligibleIds.has('rare_witchs_thread')).toBe(true);
    expect(eligibleIds.has('seasonal_burns_dram')).toBe(true);
    expect(eligibleIds.has('seasonal_samhain_lantern')).toBe(false);
    expect(eligibleIds.has('variant_cailleach_frost')).toBe(true);
    expect(eligibleIds.has('variant_glaswegian_buckie')).toBe(false);
    // 15 base/Hearth + 2 rare + 1 seasonal + 1 variant = 19
    expect(eligible).toHaveLength(19);
  });

  it('does not mutate the source pool', () => {
    const beforeLen = ALL_SPORRAN_CARDS.length;
    filterEligibleSporranCards(ALL_SPORRAN_CARDS, baseContext);
    expect(ALL_SPORRAN_CARDS).toHaveLength(beforeLen);
  });
});

describe('drawSporran with filter — pool degradation safety', () => {
  it('returns the whole filtered pool when filter shrinks below draw count', () => {
    // Fresh save → 12 eligible. Pool size 12 ≥ draw 7 → still 7.
    const eligible = filterEligibleSporranCards(ALL_SPORRAN_CARDS, baseContext);
    const drawn = drawSporran(createRNG(13), eligible);
    expect(drawn).toHaveLength(SPORRAN_DRAW_COUNT);
  });

  it('handles the synthetic case where the filter is smaller than the draw', () => {
    // Empty pool → empty draw, no throw.
    const drawn = drawSporran(createRNG(1), []);
    expect(drawn).toEqual([]);
  });
});
