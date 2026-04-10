import { describe, expect, it } from 'vitest';
import { PLAYER } from '../config';
import { BALANCE } from './BalanceConfig';
import { StatComposer } from './StatComposer';
import type { ISaveData } from './SaveManager';

const pristine: ISaveData = {
  saveVersion: 2,
  totalKills: 0,
  unlockedWeapons: [],
  unlockedUpgrades: [],
};

describe('StatComposer', () => {
  it('returns config-aligned baseline when no meta upgrades are present', () => {
    const s = StatComposer.getPlayerStats(pristine);
    expect(s.speed).toBe(PLAYER.SPEED);
    expect(s.maxHp).toBe(PLAYER.MAX_HP);
    expect(s.driftDegrees).toBe(PLAYER.DRIFT_DEGREES);
    expect(s.pickupRadius).toBe(PLAYER.PICKUP_RADIUS);
    expect(s.dashCooldownMs).toBe(BALANCE.player.dashCooldownMs);
    expect(s.baseHitboxRadius).toBe(BALANCE.player.baseHitboxRadius);
  });

  it('applies speed_tier_1 and health_tier_1 multipliers', () => {
    const s = StatComposer.getPlayerStats({
      ...pristine,
      unlockedUpgrades: [StatComposer.UPGRADE_SPEED_TIER_1, StatComposer.UPGRADE_HEALTH_TIER_1],
    });
    expect(s.speed).toBeCloseTo(PLAYER.SPEED * 1.1, 5);
    expect(s.maxHp).toBeCloseTo(PLAYER.MAX_HP * 1.1, 5);
  });
});
