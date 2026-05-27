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

  it('maps edinburgh_old_town → cobble_gap (B8)', () => {
    expect(pickHazardForBiome('edinburgh_old_town')).toBe('cobble_gap');
  });

  it('maps cairngorm_woods → fallen_pine (B8)', () => {
    expect(pickHazardForBiome('cairngorm_woods')).toBe('fallen_pine');
  });

  it('maps orkney → standing_slab (B8)', () => {
    expect(pickHazardForBiome('orkney')).toBe('standing_slab');
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
  it('exposes exactly twenty-two hazards (B9 drop added corry_maelstrom, shetland_squall, fairy_mist)', () => {
    expect(HAZARD_KEYS).toHaveLength(22);
    expect(Object.keys(HAZARDS)).toHaveLength(22);
  });

  it('each catalog entry self-references its own key', () => {
    for (const key of HAZARD_KEYS) {
      expect(HAZARDS[key].key).toBe(key);
    }
  });

  it('each hazard maps to a distinct biome (1:1 coverage)', () => {
    const biomes = HAZARD_KEYS.map((k) => HAZARDS[k].biome);
    expect(new Set(biomes).size).toBe(22);
    expect(biomes.sort()).toEqual(['ben_nevis', 'black_bog', 'bog', 'cairngorm', 'cairngorm_woods', 'callanish', 'clyde_shipyard', 'coastal', 'corryvreckan', 'edinburgh_old_town', 'fingals_cave', 'frost', 'glasgow_close', 'glen_coe', 'haar', 'heather', 'loch', 'orkney', 'pine', 'shetland_voe', 'skye_fairy_pool', 'trossachs']);
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

  it('ink_pool has the lowest damage (chip damage, wide hazard)', () => {
    const inkDamage = HAZARDS.ink_pool.damage;
    for (const key of HAZARD_KEYS) {
      if (key === 'ink_pool') continue;
      expect(inkDamage).toBeLessThanOrEqual(HAZARDS[key].damage);
    }
  });

  it('molten_slag has the highest damage (liquid metal runoff — no safe stepping)', () => {
    const slagDamage = HAZARDS.molten_slag.damage;
    for (const key of HAZARD_KEYS) {
      if (key === 'molten_slag') continue;
      expect(slagDamage).toBeGreaterThanOrEqual(HAZARDS[key].damage);
    }
  });

  it('every hazard.biome value is a valid BiomeId', () => {
    const valid: ReadonlySet<BiomeId> = new Set<BiomeId>([
      'bog',
      'loch',
      'pine',
      'heather',
      'coastal',
      'haar',
      'frost',
      'cairngorm',
      'glen_coe',
      'clyde_shipyard',
      'black_bog',
      'ben_nevis',
      'glasgow_close',
      'fingals_cave',
      'callanish',
      'trossachs',
      'edinburgh_old_town',
      'cairngorm_woods',
      'orkney',
      'corryvreckan',
      'shetland_voe',
      'skye_fairy_pool',
    ]);
    for (const key of HAZARD_KEYS) {
      expect(valid.has(HAZARDS[key].biome)).toBe(true);
    }
  });

  it('round-trips: every biome resolves to a hazard whose biome matches', () => {
    const biomes: BiomeId[] = ['bog', 'loch', 'pine', 'heather', 'coastal', 'haar', 'frost', 'cairngorm', 'glen_coe', 'clyde_shipyard', 'black_bog', 'ben_nevis', 'glasgow_close', 'fingals_cave', 'callanish', 'trossachs', 'edinburgh_old_town', 'cairngorm_woods', 'orkney', 'corryvreckan', 'shetland_voe', 'skye_fairy_pool'];
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
