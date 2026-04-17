import { describe, it, expect } from 'vitest';
import { resolveEliteChance, ELITE_CHANCE_CAP } from './eliteChance';
import { BALANCE } from '../core/BalanceConfig';

describe('resolveEliteChance — base + pressure × weight', () => {
  it('zero kill pressure × weight 1 returns the base elite chance', () => {
    expect(resolveEliteChance(0, 1)).toBeCloseTo(BALANCE.enemy.ELITE_SPAWN_CHANCE, 10);
  });

  it('full kill pressure × weight 1 adds the full pressure bonus', () => {
    const expected =
      BALANCE.enemy.ELITE_SPAWN_CHANCE + BALANCE.director.killPressureEliteBonusMax;
    expect(resolveEliteChance(1, 1)).toBeCloseTo(expected, 10);
  });

  it('caps at ELITE_CHANCE_CAP when everything spikes', () => {
    // Weight ×4 with full pressure blows well past the cap.
    expect(resolveEliteChance(1, 4)).toBe(ELITE_CHANCE_CAP);
  });

  it('weight multiplier scales the whole expression (pressure + base) — below cap', () => {
    // Use a low weight pair so the result stays clear of the 0.24 cap.
    const base = resolveEliteChance(0.5, 0.5);
    const doubled = resolveEliteChance(0.5, 1.0);
    expect(doubled).toBeCloseTo(base * 2, 10);
  });

  it('weight below 1 shrinks the chance below the base', () => {
    const shrunk = resolveEliteChance(0, 0.5);
    expect(shrunk).toBeCloseTo(BALANCE.enemy.ELITE_SPAWN_CHANCE * 0.5, 10);
  });

  it('never exceeds the cap across sampled inputs', () => {
    for (let pressure = 0; pressure <= 1; pressure += 0.1) {
      for (let weight = 0; weight <= 5; weight += 0.5) {
        expect(resolveEliteChance(pressure, weight)).toBeLessThanOrEqual(ELITE_CHANCE_CAP);
      }
    }
  });
});
