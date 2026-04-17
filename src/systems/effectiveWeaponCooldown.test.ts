import { describe, it, expect } from 'vitest';
import {
  resolveEffectiveCooldownMs,
  MIN_ATTACK_SPEED_MULTIPLIER,
} from './effectiveWeaponCooldown';
import { BALANCE } from '../core/BalanceConfig';

describe('resolveEffectiveCooldownMs', () => {
  it('no modifiers → returns the base cooldown unchanged', () => {
    expect(resolveEffectiveCooldownMs(1000, 1, 0, 1)).toBe(1000);
  });

  it('attack speed 2 halves the cooldown', () => {
    expect(resolveEffectiveCooldownMs(1000, 2, 0, 1)).toBe(500);
  });

  it('30% cooldown reduction takes 30% off the base', () => {
    expect(resolveEffectiveCooldownMs(1000, 1, 0.3, 1)).toBeCloseTo(700, 10);
  });

  it('curse multiplier scales the base cooldown linearly', () => {
    expect(resolveEffectiveCooldownMs(1000, 1, 0, 1.5)).toBe(1500);
    expect(resolveEffectiveCooldownMs(1000, 1, 0, 0.5)).toBe(500);
  });

  it('clamps at the absolute floor under heavy stacking', () => {
    // asp=5, CDR=0.9 → 1000 * 0.1 / 5 = 20ms, below the floor.
    expect(resolveEffectiveCooldownMs(1000, 5, 0.9, 1))
      .toBe(BALANCE.weapons.minEffectiveCooldownMs);
  });

  it('floors attack speed at MIN_ATTACK_SPEED_MULTIPLIER before dividing', () => {
    // asp=0 would divide by zero; the clamp rescues it.
    const result = resolveEffectiveCooldownMs(1000, 0, 0, 1);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(1000 / MIN_ATTACK_SPEED_MULTIPLIER); // == 20000
  });

  it('negative attack speed is also rescued to the floor', () => {
    const result = resolveEffectiveCooldownMs(1000, -5, 0, 1);
    expect(result).toBe(1000 / MIN_ATTACK_SPEED_MULTIPLIER);
  });

  it('modifiers compose multiplicatively (asp × CDR × curse)', () => {
    // 1000 base × (1 - 0.5) CDR × 1.2 curse / 2 asp = 300
    expect(resolveEffectiveCooldownMs(1000, 2, 0.5, 1.2)).toBeCloseTo(300, 10);
  });
});
