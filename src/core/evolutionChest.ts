import {
  EVOLUTION_MIN_WEAPON_LEVEL,
  EVOLUTION_RECIPES,
  type EvolutionRecipeDef,
} from './BalanceConfig';
import type { UpgradeCard } from '../data/upgrades';

/** First matching recipe the player can claim from a chest (FIFO by registry order). */
export function findEligibleChestEvolution(
  ownedWeaponKeys: string[],
  ownedPassiveKeys: string[],
  weaponLevels: Record<string, number>,
  evolvedWeaponKeys: string[]
): EvolutionRecipeDef | null {
  for (const r of EVOLUTION_RECIPES) {
    if (evolvedWeaponKeys.includes(r.baseWeapon)) continue;
    if (!ownedWeaponKeys.includes(r.baseWeapon)) continue;
    if ((weaponLevels[r.baseWeapon] ?? 0) < EVOLUTION_MIN_WEAPON_LEVEL) continue;
    if (!ownedPassiveKeys.includes(r.requiredPassive)) continue;
    return r;
  }
  return null;
}

export function evolutionRecipeToUpgradeCard(r: EvolutionRecipeDef): UpgradeCard {
  return {
    id: `evolve_${r.evolvedWeapon}`,
    name: r.nameKey,
    description: r.descriptionKey,
    rarity: 'legendary',
    icon: 'xp_gem',
    effect: {
      type: 'evolve_weapon',
      weaponKey: r.baseWeapon,
      evolutionKey: r.evolvedWeapon,
    },
  };
}
