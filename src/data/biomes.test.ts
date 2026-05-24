import { describe, it, expect } from 'vitest';
import { BIOMES, BIOME_IDS, pickBiomeAssignment } from './biomes';
import { createRNG } from '../utils/rng';

describe('biomes data', () => {
  it('defines all eleven biomes with required fields (Black Bog added)', () => {
    expect(BIOME_IDS.length).toBe(11);
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

  it('coastal biome is registered (B5 Phase 1a)', () => {
    expect(BIOME_IDS).toContain('coastal');
    const coastal = BIOMES.coastal;
    expect(coastal.modifier).toBe('coastalTide');
    expect(coastal.nameKey).toBe('biomes.coastal.name');
  });

  it('haar biome is registered (B5 Phase 1b)', () => {
    expect(BIOME_IDS).toContain('haar');
    const haar = BIOMES.haar;
    expect(haar.modifier).toBe('haarConcealment');
    expect(haar.nameKey).toBe('biomes.haar.name');
    // Charter §4.3 / Risk 7: capped at 0.7 not 1.0 for silhouette-first
    // readability. Test fence locks the cap.
    expect(haar.ambientHaarDensity).toBe(0.7);
  });

  it('frost biome is registered (B5 Phase 2)', () => {
    expect(BIOME_IDS).toContain('frost');
    const frost = BIOMES.frost;
    expect(frost.modifier).toBe('frostBite');
    expect(frost.nameKey).toBe('biomes.frost.name');
    // Charter §4.4 — Cairngorms in winter is the lowest moodTimbre
    // (most grounded/grave). Lock the floor so a balance edit
    // cannot brighten it without a design pass.
    expect(frost.moodTimbre).toBeLessThan(BIOMES.bog.moodTimbre);
  });

  it('spawn weight multipliers are all positive', () => {
    for (const id of BIOME_IDS) {
      for (const [, mul] of Object.entries(BIOMES[id].spawnWeightMods)) {
        expect(mul).toBeGreaterThan(0);
      }
    }
  });

  it('ambientHaarDensity sits in [0, 1] for every biome', () => {
    for (const id of BIOME_IDS) {
      const density = BIOMES[id].ambientHaarDensity;
      expect(density).toBeGreaterThanOrEqual(0);
      expect(density).toBeLessThanOrEqual(1);
    }
  });

  it('haar carries highest ambient density; ordering haar > coastal > loch > bog > 0; pine and heather stay dry', () => {
    // Haar is signature Scottish sea/water mist. The dedicated 'haar'
    // biome is the densest (0.7 — capped per Risk 7). Coastal sits
    // next (sea-spray haar rolling inland), then loch, then bog. Pine
    // and heather stay dry. Locking the ordering prevents a balance
    // edit from sneaking haar back into dry biomes without a design
    // review.
    expect(BIOMES.haar.ambientHaarDensity).toBeGreaterThan(BIOMES.coastal.ambientHaarDensity);
    expect(BIOMES.coastal.ambientHaarDensity).toBeGreaterThan(BIOMES.loch.ambientHaarDensity);
    expect(BIOMES.loch.ambientHaarDensity).toBeGreaterThan(BIOMES.bog.ambientHaarDensity);
    expect(BIOMES.bog.ambientHaarDensity).toBeGreaterThan(0);
    expect(BIOMES.pine.ambientHaarDensity).toBe(0);
    expect(BIOMES.heather.ambientHaarDensity).toBe(0);
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

  // Charter §6 Risk 6 — "dead biome" guard. A biome registered in
  // BIOMES but never selected by Voronoi seeding leaves any rune
  // depending on it permanently ungrounded. Sweep enough seeds that
  // the probability of missing any biome is ~0; assert every BiomeId
  // appears at least once. Deterministic because each RNG seed is
  // fixed.
  it('every biome appears at least once across 200 deterministic seeds', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const ids = pickBiomeAssignment(createRNG(seed), 6);
      for (const id of ids) seen.add(id);
      if (seen.size === BIOME_IDS.length) break;
    }
    for (const id of BIOME_IDS) {
      expect(seen, `biome '${id}' never appeared in 200-seed sweep — dead biome`).toContain(id);
    }
  });
});
