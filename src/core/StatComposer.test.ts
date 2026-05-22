import { describe, expect, it } from 'vitest';
import { PLAYER } from '../config';
import { BALANCE } from './BalanceConfig';
import { StatComposer } from './StatComposer';
import type { ISaveData } from './SaveManager';

const pristine: ISaveData = {
  saveVersion: 10,
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
  hasSeenCeilidhChainTip: false,
  hasSeenStandingStonesTip: false,
  hasSeenAncestralEchoTip: false,
  moorMomentsLifetime: 0,
  runHistory: [],
  codexCulledKeys: [],
  fallenCairns: [],
  oldDroverRevealedCount: 0,
};

describe('StatComposer', () => {
  it('returns config-aligned baseline when no meta upgrades are present', () => {
    const s = StatComposer.getPlayerStats(pristine);
    expect(s.speed).toBe(PLAYER.SPEED);
    expect(s.maxHp).toBe(PLAYER.MAX_HP);
    expect(s.driftDegrees).toBe(PLAYER.DRIFT_DEGREES);
    expect(s.pickupRadius).toBe(PLAYER.PICKUP_RADIUS);
    expect(s.damagePctBonus).toBe(0);
    expect(s.dashCooldownMs).toBe(BALANCE.player.dashCooldownMs);
    expect(s.baseHitboxRadius).toBe(BALANCE.player.baseHitboxRadius);
  });

  it('treats undefined unlockedUpgrades like an empty list', () => {
    const s = StatComposer.getPlayerStats({
      ...pristine,
      unlockedUpgrades: undefined,
    } as unknown as ISaveData);
    expect(s.speed).toBe(PLAYER.SPEED);
    expect(s.maxHp).toBe(PLAYER.MAX_HP);
    expect(s.damagePctBonus).toBe(0);
  });

  it('applies speed_tier_1 and health_tier_1 multipliers', () => {
    const s = StatComposer.getPlayerStats({
      ...pristine,
      unlockedUpgrades: ['speed_tier_1', 'health_tier_1'],
    });
    expect(s.speed).toBeCloseTo(PLAYER.SPEED * 1.1, 5);
    expect(s.maxHp).toBeCloseTo(PLAYER.MAX_HP * 1.1, 5);
  });

  it('applies pickup_tier_1 and damage_tier_1', () => {
    const s = StatComposer.getPlayerStats({
      ...pristine,
      unlockedUpgrades: ['pickup_tier_1', 'damage_tier_1'],
    });
    expect(s.pickupRadius).toBe(PLAYER.PICKUP_RADIUS + 22);
    expect(s.damagePctBonus).toBe(0.05);
  });

  it('stacks tier-2 upgrades on top of tier-1', () => {
    const s = StatComposer.getPlayerStats({
      ...pristine,
      unlockedUpgrades: ['speed_tier_1', 'speed_tier_2', 'damage_tier_1', 'damage_tier_2'],
    });
    expect(s.speed).toBeCloseTo(PLAYER.SPEED * 1.1 * 1.15, 5);
    expect(s.damagePctBonus).toBeCloseTo(0.15, 5);
  });

  it('applies new stat categories (regen, crit, armor, cooldown, xp, dash)', () => {
    const s = StatComposer.getPlayerStats({
      ...pristine,
      unlockedUpgrades: ['regen_tier_1', 'crit_tier_1', 'armor_tier_1', 'cooldown_tier_1', 'xp_tier_1', 'dash_tier_1'],
    });
    expect(s.hpRegen).toBeCloseTo(0.2, 5);
    expect(s.critBonus).toBeCloseTo(0.03, 5);
    expect(s.armorBonus).toBe(2);
    expect(s.cooldownReduction).toBeCloseTo(0.08, 5);
    expect(s.xpGainBonus).toBeCloseTo(0.05, 5);
    expect(s.dashCooldownReduction).toBeCloseTo(0.10, 5);
  });
});
