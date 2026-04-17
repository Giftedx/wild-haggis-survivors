import { describe, it, expect } from 'vitest';
import {
  applyWeaponEvolutionStats,
  EVOLVED_DAMAGE_MUL,
  EVOLVED_COOLDOWN_MUL,
  EVOLVED_COOLDOWN_FLOOR_MS,
  EVOLVED_AOE_MUL,
  EVOLVED_MIN_PROJECTILE_COUNT,
  EVOLVED_MIN_PIERCE,
} from './weaponEvolutionStats';

describe('applyWeaponEvolutionStats', () => {
  const baseline = {
    damage: 20,
    cooldownMs: 1000,
    projectileCount: 1,
    aoeRadius: 40,
    pierce: 0,
  };

  it('multiplies damage by EVOLVED_DAMAGE_MUL (and ceils)', () => {
    const s = applyWeaponEvolutionStats(baseline);
    expect(s.damage).toBe(Math.ceil(20 * EVOLVED_DAMAGE_MUL));
  });

  it('multiplies cooldown down by EVOLVED_COOLDOWN_MUL (evolution is faster)', () => {
    const s = applyWeaponEvolutionStats(baseline);
    expect(s.cooldownMs).toBeCloseTo(1000 * EVOLVED_COOLDOWN_MUL, 10);
  });

  it('cooldown clamps at EVOLVED_COOLDOWN_FLOOR_MS for very fast weapons', () => {
    const s = applyWeaponEvolutionStats({ ...baseline, cooldownMs: 100 });
    expect(s.cooldownMs).toBe(EVOLVED_COOLDOWN_FLOOR_MS);
  });

  it('bumps projectileCount up to the floor, never down', () => {
    expect(applyWeaponEvolutionStats({ ...baseline, projectileCount: 1 }).projectileCount)
      .toBe(EVOLVED_MIN_PROJECTILE_COUNT);
    // 4 already exceeds the floor — should pass through unchanged.
    expect(applyWeaponEvolutionStats({ ...baseline, projectileCount: 4 }).projectileCount).toBe(4);
  });

  it('bumps pierce up to the floor, never down', () => {
    expect(applyWeaponEvolutionStats({ ...baseline, pierce: 0 }).pierce).toBe(EVOLVED_MIN_PIERCE);
    expect(applyWeaponEvolutionStats({ ...baseline, pierce: 5 }).pierce).toBe(5);
  });

  it('multiplies aoeRadius by EVOLVED_AOE_MUL', () => {
    const s = applyWeaponEvolutionStats(baseline);
    expect(s.aoeRadius).toBeCloseTo(40 * EVOLVED_AOE_MUL, 10);
  });

  it('does not mutate the input object', () => {
    const orig = { ...baseline };
    applyWeaponEvolutionStats(orig);
    expect(orig).toEqual(baseline);
  });

  it('documented "~3.5× effective DPS" — damage × fire-rate × projectile-count minimum', () => {
    // Effective DPS ratio (roughly) = damage_mul / cooldown_mul × projectileCount_mul
    // For a 1-count base: 1.35 / 0.72 × 2 ≈ 3.75×. Confirm > 3× and < 5×.
    const dps = (EVOLVED_DAMAGE_MUL / EVOLVED_COOLDOWN_MUL) * EVOLVED_MIN_PROJECTILE_COUNT;
    expect(dps).toBeGreaterThan(3);
    expect(dps).toBeLessThan(5);
  });
});
