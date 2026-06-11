import { describe, expect, it } from 'vitest';
import { findEligibleChestEvolution, evolutionRecipeToUpgradeCard } from './evolutionChest';
import { EVOLUTION_RECIPES, EVOLUTION_MIN_WEAPON_LEVEL } from './BalanceConfig';

describe('findEligibleChestEvolution', () => {
  it('returns null when no weapons are owned', () => {
    expect(findEligibleChestEvolution([], [], {}, [])).toBeNull();
  });

  it('returns null when weapon is below min level', () => {
    expect(findEligibleChestEvolution(
      ['thistle_shot'], ['sporran'],
      { thistle_shot: EVOLUTION_MIN_WEAPON_LEVEL - 1 }, []
    )).toBeNull();
  });

  it('returns null when required passive is not owned', () => {
    expect(findEligibleChestEvolution(
      ['thistle_shot'], [],
      { thistle_shot: EVOLUTION_MIN_WEAPON_LEVEL }, []
    )).toBeNull();
  });

  it('returns first eligible recipe when weapon + passive + level are met', () => {
    const result = findEligibleChestEvolution(
      ['thistle_shot'], ['sporran'],
      { thistle_shot: EVOLUTION_MIN_WEAPON_LEVEL }, []
    );
    expect(result).not.toBeNull();
    expect(result!.baseWeapon).toBe('thistle_shot');
    expect(result!.evolvedWeapon).toBe('thistle_storm');
  });

  it('skips already-evolved weapons', () => {
    const result = findEligibleChestEvolution(
      ['thistle_shot'], ['sporran'],
      { thistle_shot: EVOLUTION_MIN_WEAPON_LEVEL }, ['thistle_shot']
    );
    expect(result).toBeNull();
  });

  it('returns second eligible recipe when first is already evolved', () => {
    const result = findEligibleChestEvolution(
      ['thistle_shot', 'bagpipe_blast'],
      ['sporran', 'whisky_flask'],
      { thistle_shot: EVOLUTION_MIN_WEAPON_LEVEL, bagpipe_blast: EVOLUTION_MIN_WEAPON_LEVEL },
      ['thistle_shot']
    );
    expect(result).not.toBeNull();
    expect(result!.baseWeapon).toBe('bagpipe_blast');
  });

  it('respects FIFO order of EVOLUTION_RECIPES', () => {
    // When multiple are eligible, returns the first in registry order
    const result = findEligibleChestEvolution(
      ['thistle_shot', 'bagpipe_blast'],
      ['sporran', 'whisky_flask'],
      { thistle_shot: EVOLUTION_MIN_WEAPON_LEVEL, bagpipe_blast: EVOLUTION_MIN_WEAPON_LEVEL },
      []
    );
    expect(result!.baseWeapon).toBe(EVOLUTION_RECIPES[0].baseWeapon);
  });
});

describe('evolutionRecipeToUpgradeCard', () => {
  it('creates a legendary upgrade card from a recipe', () => {
    const recipe = EVOLUTION_RECIPES[0];
    const card = evolutionRecipeToUpgradeCard(recipe);
    expect(card.rarity).toBe('legendary');
    expect(card.id).toBe(`evolve_${recipe.evolvedWeapon}`);
    expect(card.effect.type).toBe('evolve_weapon');
    expect(card.icon).toBe(`wicon_${recipe.evolvedWeapon}`);
  });

  it('uses i18n keys from the recipe', () => {
    const recipe = EVOLUTION_RECIPES[0];
    const card = evolutionRecipeToUpgradeCard(recipe);
    expect(card.name).toBe(recipe.nameKey);
    expect(card.description).toBe(recipe.descriptionKey);
  });
});
