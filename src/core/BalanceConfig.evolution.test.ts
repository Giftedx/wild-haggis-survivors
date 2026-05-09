import { describe, expect, it } from 'vitest';
import { EVOLUTION_RECIPES } from './BalanceConfig';
import { WEAPON_DEFS } from '../data/weapons';
import { PASSIVE_KEYS } from '../data/upgrades';
import { EN_STRINGS, t, type LocaleTree } from './i18n';
import { SCS_STRINGS } from './i18n.scs';

describe('EVOLUTION_RECIPES', () => {
  it('has 9 evolution recipes (all weapons except bagpipes)', () => {
    expect(EVOLUTION_RECIPES).toHaveLength(9);
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

/**
 * P1.4 — bagpipes is utility-only with no legendary form. Player-facing
 * copy must not promise "every weapon evolves" (the achievement
 * description, the variant unlock label, the orphan banter leaf). These
 * fences pin the truth-up: regression here means a future copy edit
 * accidentally re-introduced the false promise the audit caught.
 */
describe('P1.4 — bagpipes utility-only player-facing copy', () => {
  /** Walk a banter sub-tree and assert no `evo_bagpipes` key exists at any depth. */
  function assertNoEvoBagpipesLeaf(tree: LocaleTree | undefined, locale: 'en' | 'scs'): void {
    if (!tree || typeof tree !== 'object') return;
    for (const [key, value] of Object.entries(tree)) {
      expect(
        key,
        `${locale} i18n: orphan evo_bagpipes leaf — bagpipes has no evolution`,
      ).not.toBe('evo_bagpipes');
      if (value && typeof value === 'object') {
        assertNoEvoBagpipesLeaf(value as LocaleTree, locale);
      }
    }
  }

  it('Burns Wee Beastie achievement description does not promise "every weapon" evolves', () => {
    const desc = t('achievement.ach_burns_beastie_unlock.description');
    // Hard string-match guard. Any future edit that puts "every weapon"
    // back in the same line trips the test loudly.
    expect(desc.toLowerCase(), `EN achievement copy implies all 9 weapons evolve: ${desc}`)
      .not.toContain('every weapon');
    // Truth-anchor: the line must reference the nine legendary forms
    // the recipe table actually delivers (post Sgian Dubh / Sgian Geal
    // addition 2026-05-09 lifted the count from 8 to 9).
    expect(desc.toLowerCase()).toContain('nine');
  });

  it('no orphan evo_bagpipes leaf in EN banter (data/banter.ts has no pool)', () => {
    const banter = (EN_STRINGS.ui as LocaleTree).banter as LocaleTree;
    assertNoEvoBagpipesLeaf(banter, 'en');
  });

  it('no orphan evo_bagpipes leaf in SCS banter (mirrors EN deletion)', () => {
    const banter = (SCS_STRINGS.ui as LocaleTree).banter as LocaleTree;
    assertNoEvoBagpipesLeaf(banter, 'scs');
  });
});
