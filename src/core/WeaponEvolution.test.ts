import { describe, expect, it } from 'vitest';
import { evolutionRecipeToUpgradeCard, findEligibleChestEvolution } from './evolutionChest';

describe('weapon evolution (chest-gated)', () => {
  it('finds a recipe when base is max level and passive is owned', () => {
    const r = findEligibleChestEvolution(
      ['thistle_shot'],
      ['sporran'],
      { thistle_shot: 5 },
      []
    );
    expect(r).not.toBeNull();
    expect(r!.baseWeapon).toBe('thistle_shot');
    expect(r!.requiredPassive).toBe('sporran');
    expect(r!.evolvedWeapon).toBe('thistle_storm');
  });

  it('does not offer the same fusion twice after the base is marked evolved', () => {
    const once = findEligibleChestEvolution(
      ['thistle_shot'],
      ['sporran'],
      { thistle_shot: 5 },
      []
    );
    expect(once).not.toBeNull();
    const twice = findEligibleChestEvolution(
      ['thistle_shot'],
      ['sporran'],
      { thistle_shot: 5 },
      ['thistle_shot']
    );
    expect(twice).toBeNull();
  });

  it('builds an evolve_weapon card pointing at base + evolution ids', () => {
    const r = findEligibleChestEvolution(
      ['bagpipe_blast'],
      ['whisky_flask'],
      { bagpipe_blast: 5 },
      []
    );
    expect(r).not.toBeNull();
    const card = evolutionRecipeToUpgradeCard(r!);
    expect(card.effect.type).toBe('evolve_weapon');
    if (card.effect.type === 'evolve_weapon') {
      expect(card.effect.weaponKey).toBe('bagpipe_blast');
      expect(card.effect.evolutionKey).toBe('highland_fling');
    }
  });

  it('requires max weapon level (5) before chest fusion', () => {
    const low = findEligibleChestEvolution(
      ['thistle_shot'],
      ['sporran'],
      { thistle_shot: 4 },
      []
    );
    expect(low).toBeNull();
  });
});
