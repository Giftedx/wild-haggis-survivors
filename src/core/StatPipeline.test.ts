import { describe, expect, it } from 'vitest';
import { StatComposer } from './StatComposer';
import { listMetaShopItemKeys } from '../data/metaShopItems';
import { PLAYER } from '../config';
import { BALANCE } from './BalanceConfig';
import type { ISaveData } from './SaveManager';

const pristine: ISaveData = {
  saveVersion: 9,
  totalKills: 0,
  totalKillsSpent: 0,
  dailyChallenge: null,
  unlockedWeapons: [],
  unlockedUpgrades: [],
  activeRun: null,
  unlockedAchievements: [],
  hasCompletedTutorial: false,
  hasSeenDriftTutorial: false,
  hasSeenEliteAffixTip: false,
  hasSeenMoorMomentTip: false,
  moorMomentsLifetime: 0,
  runHistory: [],
  codexCulledKeys: [],
};

describe('stat pipeline: meta upgrades → ComposedPlayerStats', () => {
  it('pristine save produces baseline config values', () => {
    const s = StatComposer.getPlayerStats(pristine);
    expect(s.speed).toBe(PLAYER.SPEED);
    expect(s.maxHp).toBe(PLAYER.MAX_HP);
    expect(s.pickupRadius).toBe(PLAYER.PICKUP_RADIUS);
    expect(s.damagePctBonus).toBe(0);
    expect(s.hpRegen).toBe(0);
    expect(s.critBonus).toBe(0);
    expect(s.cooldownReduction).toBe(0);
    expect(s.xpGainBonus).toBe(0);
    expect(s.armorBonus).toBe(0);
    expect(s.dashCooldownReduction).toBe(0);
  });

  it('every meta shop item key produces a non-baseline stat when purchased', () => {
    // For each item, purchasing it alone should change at least one stat
    for (const key of listMetaShopItemKeys()) {
      const s = StatComposer.getPlayerStats({
        ...pristine,
        unlockedUpgrades: [key],
      });
      const baseline = StatComposer.getPlayerStats(pristine);

      const changed =
        s.speed !== baseline.speed ||
        s.maxHp !== baseline.maxHp ||
        s.pickupRadius !== baseline.pickupRadius ||
        s.damagePctBonus !== baseline.damagePctBonus ||
        s.hpRegen !== baseline.hpRegen ||
        s.critBonus !== baseline.critBonus ||
        s.cooldownReduction !== baseline.cooldownReduction ||
        s.xpGainBonus !== baseline.xpGainBonus ||
        s.armorBonus !== baseline.armorBonus ||
        s.dashCooldownReduction !== baseline.dashCooldownReduction;

      expect(changed, `Meta upgrade "${key}" had no stat effect`).toBe(true);
    }
  });

  it('all tier-2 upgrades stack on top of tier-1', () => {
    const t1Only = StatComposer.getPlayerStats({
      ...pristine,
      unlockedUpgrades: ['speed_tier_1', 'health_tier_1', 'damage_tier_1'],
    });
    const t1t2 = StatComposer.getPlayerStats({
      ...pristine,
      unlockedUpgrades: [
        'speed_tier_1', 'speed_tier_2',
        'health_tier_1', 'health_tier_2',
        'damage_tier_1', 'damage_tier_2',
      ],
    });

    expect(t1t2.speed).toBeGreaterThan(t1Only.speed);
    expect(t1t2.maxHp).toBeGreaterThan(t1Only.maxHp);
    expect(t1t2.damagePctBonus).toBeGreaterThan(t1Only.damagePctBonus);
  });

  it('full meta loadout produces reasonable stat values (no overflow/NaN)', () => {
    const allKeys = listMetaShopItemKeys();
    const s = StatComposer.getPlayerStats({
      ...pristine,
      unlockedUpgrades: [...allKeys],
    });

    expect(Number.isFinite(s.speed)).toBe(true);
    expect(Number.isFinite(s.maxHp)).toBe(true);
    expect(s.speed).toBeGreaterThan(0);
    expect(s.maxHp).toBeGreaterThan(0);
    expect(s.damagePctBonus).toBeLessThan(1); // shouldn't double damage from meta alone
    expect(s.cooldownReduction).toBeLessThan(1); // shouldn't reach 100% CDR
    expect(s.dashCooldownReduction).toBeLessThan(1);
  });

  it('composed stats include BALANCE.player fields (dash, hitbox, shield)', () => {
    const s = StatComposer.getPlayerStats(pristine);
    expect(s.dashCooldownMs).toBe(BALANCE.player.dashCooldownMs);
    expect(s.dashSpeed).toBe(BALANCE.player.dashSpeed);
    expect(s.baseHitboxRadius).toBe(BALANCE.player.baseHitboxRadius);
    expect(s.shieldCooldownMs).toBe(BALANCE.player.shieldCooldownMs);
  });
});
