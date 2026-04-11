import { describe, expect, it } from 'vitest';
import {
  PASSIVE_CARDS,
  STAT_CARDS,
  WEAPON_CARDS,
  buildCardPool,
} from './upgrades';
import { EVOLUTION_RECIPES } from '../core/BalanceConfig';
import { evolutionRecipeToUpgradeCard } from '../core/evolutionChest';

describe('upgrade card icon contracts', () => {
  it('does not use xp_gem placeholder for static card definitions', () => {
    const staticCards = [...WEAPON_CARDS, ...PASSIVE_CARDS, ...STAT_CARDS];
    expect(staticCards.every((card) => card.icon !== 'xp_gem')).toBe(true);
  });

  it('uses weapon HUD icon keys for generated level-up cards', () => {
    const pool = buildCardPool(['thistle_shot'], [], { thistle_shot: 2 }, []);
    const levelCard = pool.find((card) => card.id.startsWith('levelup_thistle_shot_'));
    expect(levelCard).toBeTruthy();
    expect(levelCard!.icon).toBe('wicon_thistle_shot');
  });

  it('maps evolution chest cards to evolved weapon icon keys', () => {
    for (const recipe of EVOLUTION_RECIPES) {
      const evoCard = evolutionRecipeToUpgradeCard(recipe);
      expect(evoCard.icon).toBe(`wicon_${recipe.evolvedWeapon}`);
    }
  });

  it('uses weapon definition display names on level-up cards', () => {
    const pool = buildCardPool(['bagpipes'], [], { bagpipes: 2 }, []);
    const levelCard = pool.find((c) => c.id === 'levelup_bagpipes_3');
    expect(levelCard?.name).toBe('Ceòl Mòr Bagpipes Lv3');
  });

  it('names evolution prep passive from passive card titles', () => {
    const pool = buildCardPool(['thistle_shot'], ['sporran'], { thistle_shot: 4 }, []);
    const levelCard = pool.find((c) => c.id === 'levelup_thistle_shot_5');
    expect(levelCard?.description).toContain('Sporran');
    expect(levelCard?.description).toContain('treasure chest');
  });

  it('assigns dedicated icons for cooldown and knockback stat cards', () => {
    const cd = STAT_CARDS.find((c) => c.id === 'boost_cooldown');
    const kb = STAT_CARDS.find((c) => c.id === 'boost_knockback');
    expect(cd?.icon).toBe('ucard_stat_cooldown');
    expect(kb?.icon).toBe('ucard_stat_knockback');
  });
});

