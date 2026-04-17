import { describe, expect, it, beforeEach } from 'vitest';
import {
  CURSES,
  consumePendingCurse,
  getCurseByKey,
  peekPendingCurse,
  setPendingCurse,
} from './curses';
import { defaultModifiers } from '../core/RunModifiers';
import { DEFAULT_LOCALE, setLocale, t } from '../core/i18n';

describe('CURSES data', () => {
  it('every curse has stable i18n keys + a non-trivial gold bonus', () => {
    for (const c of CURSES) {
      expect(c.nameKey).toMatch(/^curse\.[a-z_]+\.name$/);
      expect(c.descKey).toMatch(/^curse\.[a-z_]+\.desc$/);
      expect(c.goldBonusPct).toBeGreaterThan(0);
    }
  });

  it('keys are unique', () => {
    const keys = CURSES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  /**
   * Catches the typo-id bug class — a misspelled name/desc key resolves
   * to the literal key string at runtime, leaving the curse tile blank.
   * Every i18n path on a curse def must exist in EN.
   */
  it('every curse name + desc key resolves in EN', () => {
    setLocale(DEFAULT_LOCALE);
    try {
      for (const c of CURSES) {
        expect(t(c.nameKey), `nameKey for ${c.key}`).not.toBe(c.nameKey);
        expect(t(c.descKey), `descKey for ${c.key}`).not.toBe(c.descKey);
      }
    } finally {
      setLocale(DEFAULT_LOCALE);
    }
  });
});

describe('curse.apply — modifies only its own lever + goldMult', () => {
  it('heavy_legs slows the player and boosts gold', () => {
    const m = defaultModifiers();
    getCurseByKey('heavy_legs')!.apply(m);
    expect(m.moveSpeedMult).toBeCloseTo(0.88);
    expect(m.goldMult).toBeCloseTo(1.30);
    expect(m.startHpRatio).toBe(1);
    expect(m.damageTakenMult).toBe(1);
    expect(m.spawnIntervalMult).toBe(1);
  });

  it('thin_hide inflates incoming damage and boosts gold', () => {
    const m = defaultModifiers();
    getCurseByKey('thin_hide')!.apply(m);
    expect(m.damageTakenMult).toBeCloseTo(1.25);
    expect(m.goldMult).toBeCloseTo(1.40);
    expect(m.moveSpeedMult).toBe(1);
  });

  it('restless_spirits compresses spawn interval by ~17% (≈ +20% rate)', () => {
    const m = defaultModifiers();
    getCurseByKey('restless_spirits')!.apply(m);
    expect(m.spawnIntervalMult).toBeCloseTo(1 / 1.20);
    expect(m.goldMult).toBeCloseTo(1.35);
  });

  it('empty_larder trims starting HP pool and boosts gold', () => {
    const m = defaultModifiers();
    getCurseByKey('empty_larder')!.apply(m);
    expect(m.startHpRatio).toBeCloseTo(0.80);
    expect(m.goldMult).toBeCloseTo(1.25);
  });

  it('windless_pipes slows weapon cooldowns and boosts gold', () => {
    const m = defaultModifiers();
    getCurseByKey('windless_pipes')!.apply(m);
    expect(m.weaponCooldownMult).toBeCloseTo(1.18);
    expect(m.goldMult).toBeCloseTo(1.35);
    // Other levers untouched.
    expect(m.moveSpeedMult).toBe(1);
    expect(m.startHpRatio).toBe(1);
    expect(m.damageTakenMult).toBe(1);
    expect(m.spawnIntervalMult).toBe(1);
  });

  it('unknown curse key returns null', () => {
    expect(getCurseByKey('not_a_curse')).toBeNull();
    expect(getCurseByKey(null)).toBeNull();
    expect(getCurseByKey(undefined)).toBeNull();
  });
});

describe('pending curse state', () => {
  beforeEach(() => {
    setPendingCurse(null);
  });

  it('consume returns set value once then clears', () => {
    setPendingCurse('thin_hide');
    expect(peekPendingCurse()).toBe('thin_hide');
    expect(consumePendingCurse()).toBe('thin_hide');
    expect(consumePendingCurse()).toBeNull();
    expect(peekPendingCurse()).toBeNull();
  });

  it('peek does not clear', () => {
    setPendingCurse('heavy_legs');
    expect(peekPendingCurse()).toBe('heavy_legs');
    expect(peekPendingCurse()).toBe('heavy_legs');
    expect(consumePendingCurse()).toBe('heavy_legs');
  });
});
