import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evolutionRecipeToUpgradeCard, findEligibleChestEvolution } from './evolutionChest';
import { EVOLUTION_RECIPES } from './BalanceConfig';
import { WEAPON_DEFS } from '../data/weapons';
import { t } from './i18n';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

  it('offers william_blade when claymore is maxed with tartan_sash', () => {
    const r = findEligibleChestEvolution(
      ['claymore'],
      ['tartan_sash'],
      { claymore: 5 },
      []
    );
    expect(r).not.toBeNull();
    expect(r!.evolvedWeapon).toBe('william_blade');
    expect(r!.requiredPassive).toBe('tartan_sash');
  });

  // ---- Regression fence: every EVOLUTION_RECIPE is internally consistent ----

  it.each(EVOLUTION_RECIPES.map((r) => [r.evolvedWeapon, r]))(
    'recipe "%s" has a valid base weapon, passive, and i18n keys',
    (_label, recipe) => {
      // Base weapon exists in WEAPON_DEFS
      expect(Object.keys(WEAPON_DEFS)).toContain(recipe.baseWeapon);
      // i18n keys resolve (t() returns the raw key if missing — a missing key
      // means the resolved string equals the key itself)
      expect(t(recipe.nameKey)).not.toBe(recipe.nameKey);
      expect(t(recipe.descriptionKey)).not.toBe(recipe.descriptionKey);
    }
  );

  it('covers all 10 evolution recipes (not accidentally truncated)', () => {
    expect(EVOLUTION_RECIPES.length).toBe(10);
  });
});

describe('weapon icon texture consistency (static check)', () => {
  // Icons were extracted out of BootScene.ts into src/art/sprites/icons/
  // as part of the 2026-04-19 asset refactor; the 2026-05-08 Phase 2.2
  // restructure further split weapons.ts into per-icon files under
  // weapons/. Scan all relevant sources so this check stays green
  // across further moves.
  const weaponsDir = join(__dirname, '..', 'art', 'sprites', 'icons', 'weapons');
  const weaponSources = readdirSync(weaponsDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => readFileSync(join(weaponsDir, f), 'utf-8'));
  const sources = [
    readFileSync(join(__dirname, '..', 'scenes', 'BootScene.ts'), 'utf-8'),
    readFileSync(join(__dirname, '..', 'art', 'sprites', 'icons', 'weapons.ts'), 'utf-8'),
    ...weaponSources,
  ].join('\n');

  it('every base weapon has an icon texture baked somewhere', () => {
    for (const key of Object.keys(WEAPON_DEFS)) {
      const iconKey = `wicon_${key}`;
      expect(
        sources.includes(`'${iconKey}'`),
        `Missing weapon icon texture: ${iconKey}`,
      ).toBe(true);
    }
  });

  it('every evolved weapon has an icon texture baked somewhere', () => {
    for (const r of EVOLUTION_RECIPES) {
      const iconKey = `wicon_${r.evolvedWeapon}`;
      expect(
        sources.includes(`'${iconKey}'`),
        `Missing evolved weapon icon: ${iconKey}`,
      ).toBe(true);
    }
  });
});
