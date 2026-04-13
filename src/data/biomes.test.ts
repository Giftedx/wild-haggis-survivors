import { describe, it, expect } from 'vitest';
import { BIOMES, BIOME_IDS, pickBiomeAssignment } from './biomes';
import { createRNG } from '../utils/rng';

describe('biomes data', () => {
  it('defines all four biomes with required fields', () => {
    for (const id of BIOME_IDS) {
      const def = BIOMES[id];
      expect(def.id).toBe(id);
      expect(def.nameKey).toMatch(/^biomes\./);
      expect(def.entryToastKey).toMatch(/^biomes\./);
      expect(def.toastColor).toMatch(/^#/);
      expect(typeof def.tint).toBe('number');
      expect(def.moodTimbre).toBeGreaterThanOrEqual(0);
      expect(def.moodTimbre).toBeLessThanOrEqual(1);
    }
  });

  it('spawn weight multipliers are all positive', () => {
    for (const id of BIOME_IDS) {
      for (const [, mul] of Object.entries(BIOMES[id].spawnWeightMods)) {
        expect(mul).toBeGreaterThan(0);
      }
    }
  });
});

describe('pickBiomeAssignment', () => {
  it('produces the requested count', () => {
    const ids = pickBiomeAssignment(createRNG(42), 6);
    expect(ids.length).toBe(6);
  });

  it('guarantees at least 3 unique biomes when seedCount >= 3', () => {
    const ids = pickBiomeAssignment(createRNG(1), 5);
    const unique = new Set(ids);
    expect(unique.size).toBeGreaterThanOrEqual(3);
  });

  it('is deterministic per seed', () => {
    const a = pickBiomeAssignment(createRNG(12345), 5);
    const b = pickBiomeAssignment(createRNG(12345), 5);
    expect(a).toEqual(b);
  });

  it('only emits valid biome ids', () => {
    const ids = pickBiomeAssignment(createRNG(7), 6);
    for (const id of ids) {
      expect(BIOME_IDS).toContain(id);
    }
  });
});
