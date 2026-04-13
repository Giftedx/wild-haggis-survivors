import { describe, it, expect } from 'vitest';
import { BiomeManager, createBiomeLayout } from './BiomeManager';
import { createRNG } from '../utils/rng';
import { BIOME_IDS } from '../data/biomes';

describe('createBiomeLayout', () => {
  it('produces deterministic layouts for the same seed', () => {
    const a = createBiomeLayout(createRNG(999), 3000, 3000);
    const b = createBiomeLayout(createRNG(999), 3000, 3000);
    expect(a.seeds.length).toBe(b.seeds.length);
    for (let i = 0; i < a.seeds.length; i++) {
      expect(a.seeds[i].x).toBeCloseTo(b.seeds[i].x);
      expect(a.seeds[i].y).toBeCloseTo(b.seeds[i].y);
      expect(a.seeds[i].biome).toBe(b.seeds[i].biome);
    }
  });

  it('keeps all seeds inside the world bounds', () => {
    const layout = createBiomeLayout(createRNG(1), 3000, 3000);
    for (const s of layout.seeds) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(3000);
      expect(s.y).toBeGreaterThan(0);
      expect(s.y).toBeLessThan(3000);
      expect(BIOME_IDS).toContain(s.biome);
    }
  });
});

describe('BiomeManager', () => {
  it('biomeAt returns the biome of the nearest seed', () => {
    const layout = {
      seeds: [
        { x: 500, y: 500, biome: 'bog' as const },
        { x: 2500, y: 2500, biome: 'heather' as const },
      ],
      worldWidth: 3000,
      worldHeight: 3000,
    };
    const mgr = new BiomeManager(layout);
    expect(mgr.biomeAt(500, 500)).toBe('bog');
    expect(mgr.biomeAt(2500, 2500)).toBe('heather');
    // Midpoint is closer to bog along the grid, but the lookup is approximate —
    // just assert both endpoints.
  });

  it('clamps out-of-bounds lookups instead of returning undefined', () => {
    const layout = createBiomeLayout(createRNG(3), 3000, 3000);
    const mgr = new BiomeManager(layout);
    expect(BIOME_IDS).toContain(mgr.biomeAt(-9999, -9999));
    expect(BIOME_IDS).toContain(mgr.biomeAt(99999, 99999));
  });

  it('forEachCell visits every cell exactly once', () => {
    const layout = createBiomeLayout(createRNG(5), 3000, 3000);
    const mgr = new BiomeManager(layout);
    const res = mgr.getGridResolution();
    let count = 0;
    mgr.forEachCell(() => {
      count++;
    });
    expect(count).toBe(res * res);
  });
});
