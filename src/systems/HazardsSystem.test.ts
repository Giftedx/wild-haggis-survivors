import { describe, it, expect } from 'vitest';
import { pickHazardForBiome, isHazardDamageEligible } from './HazardsSystem';
import { HAZARDS, HAZARD_KEYS, type HazardKey } from '../data/hazards';
import type { BiomeId } from '../data/biomes';

describe('pickHazardForBiome (biome → hazard mapping)', () => {
  it('maps bog → peat_pit', () => {
    expect(pickHazardForBiome('bog')).toBe('peat_pit');
  });

  it('maps pine → falling_slate', () => {
    expect(pickHazardForBiome('pine')).toBe('falling_slate');
  });

  it('maps loch → burn_water', () => {
    expect(pickHazardForBiome('loch')).toBe('burn_water');
  });

  it('maps heather → loose_scree', () => {
    expect(pickHazardForBiome('heather')).toBe('loose_scree');
  });

  it('returns null when no biome is active', () => {
    expect(pickHazardForBiome(null)).toBe(null);
  });

  it('returns null for an unknown biome (defensive)', () => {
    // Cast through unknown so a future biome that has no hazard yet
    // routes through the same defensive null branch.
    expect(pickHazardForBiome('not_a_biome' as unknown as BiomeId)).toBe(null);
  });
});

describe('HAZARDS catalog (config integrity)', () => {
  it('exposes exactly four hazards', () => {
    expect(HAZARD_KEYS).toHaveLength(4);
    expect(Object.keys(HAZARDS)).toHaveLength(4);
  });

  it('each catalog entry self-references its own key', () => {
    for (const key of HAZARD_KEYS) {
      expect(HAZARDS[key].key).toBe(key);
    }
  });

  it('each hazard maps to a distinct biome (1:1 coverage)', () => {
    const biomes = HAZARD_KEYS.map((k) => HAZARDS[k].biome);
    expect(new Set(biomes).size).toBe(4);
    expect(biomes.sort()).toEqual(['bog', 'heather', 'loch', 'pine']);
  });

  it('texture keys follow the validator-locked hazard_* prefix', () => {
    for (const key of HAZARD_KEYS) {
      expect(HAZARDS[key].texture).toMatch(/^hazard_/);
    }
  });

  it('damage values sit in a reasonable 1..30 band', () => {
    for (const key of HAZARD_KEYS) {
      const dmg = HAZARDS[key].damage;
      expect(dmg).toBeGreaterThanOrEqual(1);
      expect(dmg).toBeLessThanOrEqual(30);
    }
  });

  it('hitbox radii sit in a reasonable 4..32 px band', () => {
    for (const key of HAZARD_KEYS) {
      const r = HAZARDS[key].hitboxRadius;
      expect(r).toBeGreaterThanOrEqual(4);
      expect(r).toBeLessThanOrEqual(32);
    }
  });

  it('lifetimes are all positive and finite', () => {
    for (const key of HAZARD_KEYS) {
      expect(HAZARDS[key].lifetimeMs).toBeGreaterThan(0);
      expect(Number.isFinite(HAZARDS[key].lifetimeMs)).toBe(true);
    }
  });

  it('spawn intervals are all positive and finite', () => {
    for (const key of HAZARD_KEYS) {
      expect(HAZARDS[key].spawnIntervalMs).toBeGreaterThan(0);
      expect(Number.isFinite(HAZARDS[key].spawnIntervalMs)).toBe(true);
    }
  });

  it('falling_slate has the shortest lifetime (telegraphed slab)', () => {
    const slateLifetime = HAZARDS.falling_slate.lifetimeMs;
    for (const key of HAZARD_KEYS) {
      if (key === 'falling_slate') continue;
      expect(slateLifetime).toBeLessThanOrEqual(HAZARDS[key].lifetimeMs);
    }
  });

  it('burn_water has the lowest damage (chip damage, easy to wade out)', () => {
    const burnDamage = HAZARDS.burn_water.damage;
    for (const key of HAZARD_KEYS) {
      if (key === 'burn_water') continue;
      expect(burnDamage).toBeLessThanOrEqual(HAZARDS[key].damage);
    }
  });

  it('falling_slate has the highest damage (deadly slab)', () => {
    const slateDamage = HAZARDS.falling_slate.damage;
    for (const key of HAZARD_KEYS) {
      if (key === 'falling_slate') continue;
      expect(slateDamage).toBeGreaterThanOrEqual(HAZARDS[key].damage);
    }
  });

  it('every hazard.biome value is a valid BiomeId', () => {
    const valid: ReadonlySet<BiomeId> = new Set<BiomeId>(['bog', 'loch', 'pine', 'heather']);
    for (const key of HAZARD_KEYS) {
      expect(valid.has(HAZARDS[key].biome)).toBe(true);
    }
  });

  it('round-trips: every biome resolves to a hazard whose biome matches', () => {
    const biomes: BiomeId[] = ['bog', 'loch', 'pine', 'heather'];
    for (const b of biomes) {
      const k = pickHazardForBiome(b) as HazardKey;
      expect(k).not.toBeNull();
      expect(HAZARDS[k].biome).toBe(b);
    }
  });
});

describe('isHazardDamageEligible (telegraph + cooldown + iframe gate)', () => {
  it('open-gate: telegraph elapsed, cooldown ready, no iframes → eligible', () => {
    expect(isHazardDamageEligible(0, 0, false)).toBe(true);
  });

  it('blocks during the telegraph window', () => {
    expect(isHazardDamageEligible(150, 0, false)).toBe(false);
  });

  it('blocks while the per-hazard hit cooldown is still ticking', () => {
    expect(isHazardDamageEligible(0, 800, false)).toBe(false);
  });

  it('blocks when the player is iframed (dash or Burn-Leap)', () => {
    expect(isHazardDamageEligible(0, 0, true)).toBe(false);
  });

  it('only opens when ALL three gates are open simultaneously', () => {
    // Combinatorial: 8 (state) × {arrival, cooldown, iframe} cases — only
    // (0, 0, false) opens; the other 7 must block.
    const cases: Array<[number, number, boolean, boolean]> = [
      [0, 0, false, true],   // all three open → eligible
      [0, 0, true, false],   // iframed
      [0, 1, false, false],  // cooldown
      [0, 1, true, false],
      [1, 0, false, false],  // telegraph
      [1, 0, true, false],
      [1, 1, false, false],
      [1, 1, true, false],
    ];
    for (const [arrival, cooldown, iframed, expected] of cases) {
      expect(isHazardDamageEligible(arrival, cooldown, iframed)).toBe(expected);
    }
  });

  it('treats negative arrival/cooldown the same as zero (over-decremented timers)', () => {
    expect(isHazardDamageEligible(-10, -5, false)).toBe(true);
  });
});
