import { describe, expect, it } from 'vitest';
import { EVOLUTION_RECIPES } from './BalanceConfig';
import { WEAPON_DEFS } from '../data/weapons';
import { PASSIVE_KEYS } from '../data/upgrades';
import { t } from './i18n';

describe('EVOLUTION_RECIPES', () => {
  it('has 7 evolution recipes (all weapons except bagpipes)', () => {
    expect(EVOLUTION_RECIPES).toHaveLength(7);
  });

  it('every recipe references a valid base weapon', () => {
    const weaponKeys = Object.keys(WEAPON_DEFS);
    for (const recipe of EVOLUTION_RECIPES) {
      expect(weaponKeys, `Unknown base weapon: ${recipe.baseWeapon}`)
        .toContain(recipe.baseWeapon);
    }
  });

  it('every recipe references a valid passive key', () => {
    for (const recipe of EVOLUTION_RECIPES) {
      expect(PASSIVE_KEYS, `Unknown passive: ${recipe.requiredPassive}`)
        .toContain(recipe.requiredPassive);
    }
  });

  it('every recipe has unique base weapon and evolved weapon', () => {
    const bases = new Set(EVOLUTION_RECIPES.map((r) => r.baseWeapon));
    const evolveds = new Set(EVOLUTION_RECIPES.map((r) => r.evolvedWeapon));
    expect(bases.size).toBe(EVOLUTION_RECIPES.length);
    expect(evolveds.size).toBe(EVOLUTION_RECIPES.length);
  });

  it('every recipe has valid i18n name and description keys', () => {
    for (const recipe of EVOLUTION_RECIPES) {
      const name = t(recipe.nameKey);
      const desc = t(recipe.descriptionKey);
      expect(name, `${recipe.evolvedWeapon} nameKey not found`).not.toBe(recipe.nameKey);
      expect(desc, `${recipe.evolvedWeapon} descriptionKey not found`).not.toBe(recipe.descriptionKey);
    }
  });

  it('no passive is used by more than one evolution', () => {
    const passives = EVOLUTION_RECIPES.map((r) => r.requiredPassive);
    expect(new Set(passives).size).toBe(EVOLUTION_RECIPES.length);
  });

  it('bagpipes has no evolution recipe', () => {
    const hasBagpipes = EVOLUTION_RECIPES.some((r) => r.baseWeapon === 'bagpipes');
    expect(hasBagpipes).toBe(false);
  });
});
