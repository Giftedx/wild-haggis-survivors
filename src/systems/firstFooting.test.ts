import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import { createRNG } from '../utils/rng';
import {
  FIRST_FOOTING_GIFT_KINDS,
  applyFirstFootingToModifiers,
  rollFirstFootingGift,
} from './firstFooting';

describe('rollFirstFootingGift', () => {
  it('returns null when no seasonal event is active', () => {
    const rng = createRNG(1);
    expect(rollFirstFootingGift(rng, null)).toBeNull();
  });

  it('returns null for non-hogmanay seasonal events', () => {
    const rng = createRNG(1);
    expect(rollFirstFootingGift(rng, 'samhain')).toBeNull();
    expect(rollFirstFootingGift(rng, 'beltane')).toBeNull();
    expect(rollFirstFootingGift(rng, 'burns_night')).toBeNull();
    expect(rollFirstFootingGift(rng, 'st_andrews')).toBeNull();
  });

  it('returns one of the four traditional gifts when hogmanay is active', () => {
    const rng = createRNG(42);
    const gift = rollFirstFootingGift(rng, 'hogmanay');
    expect(gift).not.toBeNull();
    expect(FIRST_FOOTING_GIFT_KINDS).toContain(gift!);
  });

  it('is deterministic for a given seed (replay-safe)', () => {
    const giftA = rollFirstFootingGift(createRNG(7), 'hogmanay');
    const giftB = rollFirstFootingGift(createRNG(7), 'hogmanay');
    expect(giftA).toBe(giftB);
  });
});

describe('applyFirstFootingToModifiers', () => {
  it('null gift leaves modifiers identity-equal', () => {
    const m = defaultModifiers();
    const result = applyFirstFootingToModifiers(null, m);
    expect(result.gift).toBeNull();
    expect(result.extraStartingHpHeal).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('shortbread sets extraStartingHpHeal and leaves modifiers untouched', () => {
    const m = defaultModifiers();
    const result = applyFirstFootingToModifiers('shortbread', m);
    expect(result.gift).toBe('shortbread');
    expect(result.extraStartingHpHeal).toBe(20);
    expect(m).toEqual(defaultModifiers());
  });

  it('whisky multiplies spawnIntervalMult by 1.08 (calmer opening)', () => {
    const m = defaultModifiers();
    applyFirstFootingToModifiers('whisky', m);
    expect(m.spawnIntervalMult).toBeCloseTo(1.08, 5);
  });

  it('coal multiplies damageTakenMult by 0.95', () => {
    const m = defaultModifiers();
    applyFirstFootingToModifiers('coal', m);
    expect(m.damageTakenMult).toBeCloseTo(0.95, 5);
  });

  it('silver multiplies goldMult by 1.15', () => {
    const m = defaultModifiers();
    applyFirstFootingToModifiers('silver', m);
    expect(m.goldMult).toBeCloseTo(1.15, 5);
  });

  it('stacks multiplicatively (defensive — caller should only invoke once)', () => {
    const m = defaultModifiers();
    applyFirstFootingToModifiers('coal', m);
    applyFirstFootingToModifiers('coal', m);
    expect(m.damageTakenMult).toBeCloseTo(0.95 * 0.95, 5);
  });
});
