import { describe, it, expect } from 'vitest';
import {
  filterHealCardsWhenFull,
  resolveLuckBonus,
  resolveCardCount,
  LUCK_BONUS_SPORRAN,
  LUCK_BONUS_PER_LUCKY_HEATHER_LEVEL,
} from './levelUpDraw';
import type { UpgradeCard } from '../../data/upgrades';
import type { SaveData } from '../../utils/save';

function healCard(stat: 'heal' | 'healPercent'): UpgradeCard {
  return {
    id: `test_${stat}`,
    name: `test.${stat}.name`,
    description: `test.${stat}.desc`,
    rarity: 'common',
    effect: { type: 'stat_boost', stat, value: 1 },
    icon: '',
  } as unknown as UpgradeCard;
}

function statCard(stat: string): UpgradeCard {
  return {
    id: `test_${stat}`,
    name: `test.${stat}.name`,
    description: `test.${stat}.desc`,
    rarity: 'common',
    effect: { type: 'stat_boost', stat, value: 1 },
    icon: '',
  } as unknown as UpgradeCard;
}

function weaponCard(): UpgradeCard {
  return {
    id: 'test_weapon',
    name: 'test.weapon.name',
    description: 'test.weapon.desc',
    rarity: 'common',
    effect: { type: 'weapon_unlock', weaponKey: 'thistle_shot' },
    icon: '',
  } as unknown as UpgradeCard;
}

function saveWithUpgrades(upgrades: Record<string, number>): Pick<SaveData, 'upgrades'> {
  return { upgrades };
}

describe('filterHealCardsWhenFull', () => {
  it('returns a copy of the pool when HP is not full', () => {
    const pool = [healCard('heal'), healCard('healPercent'), statCard('maxHp')];
    const out = filterHealCardsWhenFull(pool, false);
    expect(out).toEqual(pool);
    expect(out).not.toBe(pool); // separate reference — caller mutates freely
  });

  it('drops both heal and healPercent cards when HP is full', () => {
    const pool = [healCard('heal'), healCard('healPercent'), statCard('maxHp'), weaponCard()];
    const out = filterHealCardsWhenFull(pool, true);
    expect(out).toHaveLength(2);
    expect(out.map((c) => c.id)).toEqual(['test_maxHp', 'test_weapon']);
  });

  it('keeps non-stat_boost heal-adjacent cards (weapon_unlock etc.)', () => {
    // Only stat_boost heal / healPercent are filtered — a hypothetical
    // "heal_on_hit" passive would remain (different effect.type).
    const pool = [statCard('heal'), weaponCard()];
    const out = filterHealCardsWhenFull(pool, true);
    // heal card filtered, weapon stays.
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('test_weapon');
  });

  it('empty pool stays empty', () => {
    expect(filterHealCardsWhenFull([], true)).toEqual([]);
    expect(filterHealCardsWhenFull([], false)).toEqual([]);
  });
});

describe('resolveLuckBonus', () => {
  it('returns 0 when no luck sources are active', () => {
    expect(resolveLuckBonus(saveWithUpgrades({}), [], 0)).toBe(0);
  });

  it('adds the sporran flat bonus when the passive is owned', () => {
    expect(resolveLuckBonus(saveWithUpgrades({}), ['sporran'], 0)).toBe(LUCK_BONUS_SPORRAN);
  });

  it('adds lucky_heather per-level', () => {
    // 2 levels of lucky_heather → 2 * 10 = 20.
    expect(resolveLuckBonus(saveWithUpgrades({ lucky_heather: 2 }), [], 0))
      .toBe(2 * LUCK_BONUS_PER_LUCKY_HEATHER_LEVEL);
  });

  it('adds the in-run player luck bonus', () => {
    expect(resolveLuckBonus(saveWithUpgrades({}), [], 7)).toBe(7);
  });

  it('sums all three sources', () => {
    const out = resolveLuckBonus(
      saveWithUpgrades({ lucky_heather: 3 }),
      ['sporran'],
      5,
    );
    expect(out).toBe(LUCK_BONUS_SPORRAN + 3 * LUCK_BONUS_PER_LUCKY_HEATHER_LEVEL + 5);
  });

  it('clamps negative player luck to 0 (defensive)', () => {
    expect(resolveLuckBonus(saveWithUpgrades({}), [], -100)).toBe(0);
  });

  it('clamps negative lucky_heather levels to 0 (corrupted save)', () => {
    expect(resolveLuckBonus(saveWithUpgrades({ lucky_heather: -5 }), [], 0)).toBe(0);
  });

  it('ignores unrelated passives', () => {
    expect(resolveLuckBonus(saveWithUpgrades({}), ['kilt', 'irn_bru'], 0)).toBe(0);
  });
});

describe('resolveCardCount', () => {
  it('returns the base count when extra_choice is not owned', () => {
    expect(resolveCardCount(saveWithUpgrades({}), 3)).toBe(3);
    expect(resolveCardCount(saveWithUpgrades({ extra_choice: 0 }), 3)).toBe(3);
  });

  it('adds +1 when extra_choice is owned (any level > 0)', () => {
    expect(resolveCardCount(saveWithUpgrades({ extra_choice: 1 }), 3)).toBe(4);
    // Only binary: level >= 1 gives +1, no per-level stacking.
    expect(resolveCardCount(saveWithUpgrades({ extra_choice: 5 }), 3)).toBe(4);
  });

  it('never returns less than 1', () => {
    expect(resolveCardCount(saveWithUpgrades({}), 0)).toBe(1);
    expect(resolveCardCount(saveWithUpgrades({}), -5)).toBe(1);
  });

  it('floors fractional base counts', () => {
    expect(resolveCardCount(saveWithUpgrades({}), 3.9)).toBe(3);
  });
});
