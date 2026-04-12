import { describe, expect, it } from 'vitest';
import { PERMANENT_UPGRADES, getUpgradeCost } from './permanentUpgrades';
import { t } from '../core/i18n';

describe('PERMANENT_UPGRADES', () => {
  it('has at least 7 upgrades', () => {
    expect(PERMANENT_UPGRADES.length).toBeGreaterThanOrEqual(7);
  });

  it('every upgrade has a unique key', () => {
    const keys = PERMANENT_UPGRADES.map((u) => u.key);
    expect(new Set(keys).size).toBe(PERMANENT_UPGRADES.length);
  });

  it('every upgrade has valid i18n name and description keys', () => {
    for (const u of PERMANENT_UPGRADES) {
      const name = t(u.nameKey);
      const desc = t(u.descriptionKey);
      expect(name, `${u.key} nameKey not found`).not.toBe(u.nameKey);
      expect(desc, `${u.key} descriptionKey not found`).not.toBe(u.descriptionKey);
    }
  });

  it('every upgrade has positive max level', () => {
    for (const u of PERMANENT_UPGRADES) {
      expect(u.maxLevel, `${u.key} has non-positive maxLevel`).toBeGreaterThan(0);
    }
  });

  it('getUpgradeCost returns increasing costs for each level', () => {
    for (const u of PERMANENT_UPGRADES) {
      let prevCost = 0;
      for (let level = 1; level <= u.maxLevel; level++) {
        const cost = getUpgradeCost(u, level);
        expect(cost, `${u.key} level ${level} cost should be > previous`)
          .toBeGreaterThan(prevCost);
        prevCost = cost;
      }
    }
  });
});
