import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import { ALL_SPORRAN_CARDS } from '../data/sporranCards';
import { createRNG } from '../utils/rng';
import {
  SPORRAN_DRAW_COUNT,
  SPORRAN_PICK_COUNT,
  applySporranPicks,
  drawSporran,
  type SporranCard,
} from './sporranDeck';

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
});

describe('ALL_SPORRAN_CARDS pool integrity', () => {
  it('contains exactly 12 cards (Phase 1.5 — quirk_haggis_blooded lifted)', () => {
    expect(ALL_SPORRAN_CARDS).toHaveLength(12);
  });

  it('splits as 5 curses + 4 boons + 3 quirks', () => {
    const counts = { curse: 0, boon: 0, quirk: 0 };
    for (const card of ALL_SPORRAN_CARDS) counts[card.kind]++;
    expect(counts).toEqual({ curse: 5, boon: 4, quirk: 3 });
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
});
