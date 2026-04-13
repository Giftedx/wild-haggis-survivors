import { describe, it, expect } from 'vitest';
import {
  buildCardPool,
  drawCards,
  WEAPON_CARDS,
  PASSIVE_CARDS,
  STAT_CARDS,
  RARITY_WEIGHTS,
  UpgradeCard,
} from './upgrades';
import { EVOLUTION_RECIPES } from '../core/BalanceConfig';

describe('buildCardPool', () => {
  it('includes stat cards when no weapons/passives owned', () => {
    const pool = buildCardPool([], [], {});
    const statCards = pool.filter(c => c.effect.type === 'stat_boost');
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('includes all weapon cards when none owned and under cap', () => {
    const pool = buildCardPool([], [], {});
    const addWeapon = pool.filter(c => c.effect.type === 'add_weapon');
    expect(addWeapon.length).toBe(WEAPON_CARDS.length);
  });

  it('excludes owned weapons from new-weapon pool', () => {
    const pool = buildCardPool(['bagpipe_blast'], [], { bagpipe_blast: 1 });
    const addWeapon = pool.filter(c =>
      c.effect.type === 'add_weapon' &&
      (c.effect as any).weaponKey === 'bagpipe_blast'
    );
    expect(addWeapon.length).toBe(0);
  });

  it('no new weapons offered when at 6-weapon cap', () => {
    const sixWeapons = ['a', 'b', 'c', 'd', 'e', 'f'];
    const levels: Record<string, number> = {};
    sixWeapons.forEach(k => levels[k] = 1);
    const pool = buildCardPool(sixWeapons, [], levels);
    const addWeapon = pool.filter(c => c.effect.type === 'add_weapon');
    expect(addWeapon.length).toBe(0);
  });

  it('includes level-up cards for owned weapons below max', () => {
    const pool = buildCardPool(['caber_toss'], [], { caber_toss: 2 });
    const levelUp = pool.filter(c =>
      c.effect.type === 'level_weapon' &&
      (c.effect as any).weaponKey === 'caber_toss'
    );
    expect(levelUp.length).toBe(1);
    expect(levelUp[0].id).toBe('levelup_caber_toss_3');
  });

  it('no level-up card for max-level (5) weapon', () => {
    const pool = buildCardPool(['caber_toss'], [], { caber_toss: 5 });
    const levelUp = pool.filter(c =>
      c.effect.type === 'level_weapon' &&
      (c.effect as any).weaponKey === 'caber_toss'
    );
    expect(levelUp.length).toBe(0);
  });

  it('excludes evolved weapons from level-up pool', () => {
    const pool = buildCardPool(['caber_toss'], [], { caber_toss: 3 }, ['caber_toss']);
    const levelUp = pool.filter(c =>
      c.effect.type === 'level_weapon' &&
      (c.effect as any).weaponKey === 'caber_toss'
    );
    expect(levelUp.length).toBe(0);
  });

  it('excludes owned passives', () => {
    const pool = buildCardPool([], ['sporran'], {});
    const addPassive = pool.filter(c =>
      c.effect.type === 'add_passive' &&
      (c.effect as any).passiveKey === 'sporran'
    );
    expect(addPassive.length).toBe(0);
  });

  it('includes unowned passives', () => {
    const pool = buildCardPool([], [], {});
    const addPassive = pool.filter(c => c.effect.type === 'add_passive');
    expect(addPassive.length).toBe(PASSIVE_CARDS.length);
  });

  it('level 4→5 card is legendary rarity for weapons with evolution', () => {
    const weaponWithEvolution = EVOLUTION_RECIPES[0]?.baseWeapon;
    if (!weaponWithEvolution) return;
    const pool = buildCardPool([weaponWithEvolution], [], { [weaponWithEvolution]: 4 });
    const lv5 = pool.find(c => c.id === `levelup_${weaponWithEvolution}_5`);
    expect(lv5).toBeDefined();
    expect(lv5!.rarity).toBe('legendary');
  });
});

describe('drawCards', () => {
  const mockPool: UpgradeCard[] = [
    { id: 'c1', name: 'C1', description: '', rarity: 'common', icon: '', effect: { type: 'stat_boost', stat: 'speed', amount: 5 } },
    { id: 'c2', name: 'C2', description: '', rarity: 'uncommon', icon: '', effect: { type: 'stat_boost', stat: 'speed', amount: 5 } },
    { id: 'c3', name: 'C3', description: '', rarity: 'rare', icon: '', effect: { type: 'stat_boost', stat: 'speed', amount: 5 } },
    { id: 'c4', name: 'C4', description: '', rarity: 'legendary', icon: '', effect: { type: 'stat_boost', stat: 'speed', amount: 5 } },
    { id: 'c5', name: 'C5', description: '', rarity: 'common', icon: '', effect: { type: 'stat_boost', stat: 'speed', amount: 5 } },
  ];

  it('returns all cards when pool ≤ count', () => {
    const result = drawCards(mockPool, 10);
    expect(result.length).toBe(mockPool.length);
  });

  it('returns exactly count cards when pool > count', () => {
    const result = drawCards(mockPool, 3);
    expect(result.length).toBe(3);
  });

  it('no duplicates in draw', () => {
    const result = drawCards(mockPool, 4, 0, () => 0.5);
    const ids = result.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('deterministic with fixed rng', () => {
    let i = 0;
    const rng1 = () => [0.1, 0.5, 0.9][i++ % 3];
    i = 0;
    const r1 = drawCards(mockPool, 3, 0, rng1);
    i = 0;
    const r2 = drawCards(mockPool, 3, 0, rng1);
    expect(r1.map(c => c.id)).toEqual(r2.map(c => c.id));
  });

  it('luck bonus increases rare/legendary weight', () => {
    let rareCount = 0;
    const trials = 500;
    for (let t = 0; t < trials; t++) {
      const result = drawCards(mockPool, 1, 45);
      if (result[0].rarity === 'rare' || result[0].rarity === 'legendary') rareCount++;
    }
    expect(rareCount / trials).toBeGreaterThan(0.3);
  });

  it('common weight floors at 5', () => {
    const result = drawCards(mockPool, 3, 9999, () => 0.01);
    expect(result.length).toBe(3);
  });
});
