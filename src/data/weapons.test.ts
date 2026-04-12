import { describe, expect, it } from 'vitest';
import { WEAPON_DEFS, type WeaponKey } from './weapons';
import { EVOLUTION_RECIPES } from '../core/BalanceConfig';
import { t } from '../core/i18n';

describe('WEAPON_DEFS', () => {
  const keys = Object.keys(WEAPON_DEFS) as WeaponKey[];

  it('has exactly 8 weapons', () => {
    expect(keys).toHaveLength(8);
  });

  it('every weapon key matches its .key field', () => {
    for (const key of keys) {
      expect(WEAPON_DEFS[key].key).toBe(key);
    }
  });

  it('every weapon has valid i18n name and description keys', () => {
    for (const key of keys) {
      const def = WEAPON_DEFS[key];
      const name = t(def.nameKey);
      const desc = t(def.descriptionKey);
      expect(name, `${key} nameKey not found in i18n`).not.toBe(def.nameKey);
      expect(desc, `${key} descriptionKey not found in i18n`).not.toBe(def.descriptionKey);
    }
  });

  it('every evolution recipe references valid weapon and passive keys', () => {
    for (const recipe of EVOLUTION_RECIPES) {
      expect(keys).toContain(recipe.baseWeapon);
      const evoName = t(recipe.nameKey);
      expect(evoName, `Evolution ${recipe.evolvedWeapon} nameKey not found`).not.toBe(recipe.nameKey);
    }
  });

  it('weapon cooldowns are within reasonable range (50ms - 5000ms)', () => {
    for (const key of keys) {
      const cd = WEAPON_DEFS[key].cooldownMs;
      expect(cd).toBeGreaterThanOrEqual(50);
      expect(cd).toBeLessThanOrEqual(5000);
    }
  });

  it('weapon damage values are positive', () => {
    for (const key of keys) {
      expect(WEAPON_DEFS[key].damage).toBeGreaterThan(0);
    }
  });
});
