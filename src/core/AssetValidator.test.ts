import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  collectRequiredTextureRequirements,
  findMissingTextureKeys,
  MISSING_PLACEHOLDER_KEY,
} from './AssetValidator';
import { MODE_CONFIG } from '../systems/AmbientWeatherSystem';
import {
  FLORA_BY_BIOME,
  HEATHER_URBAN_PROPS,
  SEASONAL_FLORA_INJECTIONS,
  STORY_PROPS_BY_BIOME,
} from '../systems/FloraScatter';

describe('AssetValidator', () => {
  it('collects non-empty requirements including core gameplay keys', () => {
    const reqs = collectRequiredTextureRequirements();
    const keys = new Set(reqs.map((r) => r.key));
    expect(keys.has('tourist')).toBe(true);
    expect(keys.has('boss_taxman')).toBe(true);
    expect(keys.has('thistle')).toBe(true);
    expect(keys.has('xp_gem')).toBe(true);
    expect(keys.has('wicon_thistle_shot')).toBe(true);
    expect(keys.has('relic_sporran')).toBe(true);
    expect(keys.has('hud_shield')).toBe(true);
    expect(keys.has('hud_dash_pip_full')).toBe(true);
    expect(keys.has('player_mood_victory_bounce')).toBe(true);
    expect(keys.has('wildlife_rook_idle')).toBe(true);
    expect(keys.has('fx_weapon_william_blade_wave')).toBe(true);
    expect(keys.has('deco_pictish_stone')).toBe(true);
    expect(keys.has('croft_brownie_bowl')).toBe(true);
    expect(keys.has('pickup_chest_legendary')).toBe(true);
    expect(keys.has('hud_status_comfort')).toBe(true);
    expect(keys.has(MISSING_PLACEHOLDER_KEY)).toBe(false);
  });

  it('detects missing textures via texture manager predicate', () => {
    const exists = (k: string) => k !== 'tourist' && k !== 'wicon_bagpipe_blast';
    const missing = findMissingTextureKeys(exists);
    const missingKeys = missing.map((m) => m.key);
    expect(missingKeys).toContain('tourist');
    expect(missingKeys).toContain('wicon_bagpipe_blast');
    expect(missing.every((m) => m.category.length > 0)).toBe(true);
  });

  it('locks every ambient weather texture key', () => {
    const requiredTextureKeys = collectRequiredTextureRequirements().map((r) => r.key);

    for (const [mode, config] of Object.entries(MODE_CONFIG)) {
      expect(
        requiredTextureKeys,
        `missing validator requirement for ${mode}: ${config.textureKey}`
      ).toContain(config.textureKey);
    }
  });

  it('locks every FloraScatter prop texture key', () => {
    const requiredTextureKeys = new Set(
      collectRequiredTextureRequirements().map((requirement) => requirement.key),
    );
    const propTextureKeys = [
      ...Object.values(FLORA_BY_BIOME).flatMap((entries) =>
        entries.map(([textureKey]) => textureKey),
      ),
      ...HEATHER_URBAN_PROPS,
      ...SEASONAL_FLORA_INJECTIONS.map((injection) => injection.key),
      ...Object.values(STORY_PROPS_BY_BIOME).flat(),
    ];

    for (const textureKey of propTextureKeys) {
      expect(
        requiredTextureKeys.has(textureKey),
        `AssetValidator does not require ${textureKey}`,
      ).toBe(true);
    }
  });

  it('does not transcribe decoration texture keys', () => {
    const source = readFileSync(new URL('./AssetValidator.ts', import.meta.url), 'utf8');

    expect(source).not.toMatch(/['"]deco_/);
  });

  it('reports no missing when predicate accepts all required keys', () => {
    const reqs = collectRequiredTextureRequirements();
    expect(findMissingTextureKeys(() => true, reqs)).toEqual([]);
  });
});
