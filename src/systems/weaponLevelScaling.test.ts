import { describe, it, expect } from 'vitest';
import {
  computeLevelScaledWeaponStats,
  WEAPON_COOLDOWN_FLOOR_MS,
} from './weaponLevelScaling';
import type { WeaponDef } from '../data/weapons';

function makeDef(overrides: Partial<WeaponDef> = {}): WeaponDef {
  return {
    key: 'thistle_shot',
    nameKey: 'weapon.thistle_shot.name',
    descriptionKey: 'weapon.thistle_shot.description',
    name: 'Test',
    description: 'Test',
    behavior: 'projectile',
    cooldownMs: 1000,
    damage: 10,
    projectileSpeed: 300,
    projectileCount: 1,
    pierce: 0,
    range: 500,
    aoeRadius: 20,
    arcDegrees: 0,
    knockback: 0,
    levelScaling: {
      damage: 1.25,
      cooldown: 0.88,
      countAt: [3, 5],
      pierce: 1,
      radius: 1.1,
    },
    ...overrides,
  };
}

describe('computeLevelScaledWeaponStats', () => {
  it('level 1 returns the base stats (no scaling applied yet)', () => {
    const def = makeDef();
    const s = computeLevelScaledWeaponStats(def, 1);
    expect(s.damage).toBe(10);
    expect(s.cooldownMs).toBe(1000);
    expect(s.pierce).toBe(0);
    expect(s.aoeRadius).toBe(20);
  });

  it('level 2 applies one tick of each multiplier', () => {
    const def = makeDef();
    const s = computeLevelScaledWeaponStats(def, 2);
    expect(s.damage).toBe(Math.ceil(10 * 1.25));
    expect(s.cooldownMs).toBeCloseTo(1000 * 0.88, 10);
    expect(s.pierce).toBe(1);
    expect(s.aoeRadius).toBeCloseTo(20 * 1.1, 10);
  });

  it('damage is always ceil()ed (integer damage at every level)', () => {
    const def = makeDef({ damage: 1, levelScaling: {
      damage: 1.01, cooldown: 1, countAt: [], pierce: 0, radius: 1,
    } });
    // 1 * 1.01 = 1.01 → ceil → 2
    expect(computeLevelScaledWeaponStats(def, 2).damage).toBe(2);
  });

  it('cooldown clamps at WEAPON_COOLDOWN_FLOOR_MS even at very high levels', () => {
    const def = makeDef({ cooldownMs: 1000, levelScaling: {
      damage: 1, cooldown: 0.5, countAt: [], pierce: 0, radius: 1,
    } });
    // 1000 * 0.5^20 = vanishingly small → should floor at 200
    expect(computeLevelScaledWeaponStats(def, 21).cooldownMs).toBe(WEAPON_COOLDOWN_FLOOR_MS);
  });

  it('pierce grows linearly by s.pierce per level', () => {
    const def = makeDef({ pierce: 2, levelScaling: {
      damage: 1, cooldown: 1, countAt: [], pierce: 3, radius: 1,
    } });
    expect(computeLevelScaledWeaponStats(def, 4).pierce).toBe(2 + 3 * 3);
  });

  it('aoeRadius scales multiplicatively from level 1', () => {
    const def = makeDef({ aoeRadius: 10, levelScaling: {
      damage: 1, cooldown: 1, countAt: [], pierce: 0, radius: 2,
    } });
    // level 3: 10 * 2^2 = 40
    expect(computeLevelScaledWeaponStats(def, 3).aoeRadius).toBe(40);
  });
});
