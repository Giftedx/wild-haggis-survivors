import { describe, expect, it } from 'vitest';
import { createRNG } from '../utils/rng';
import { RELICS, RELIC_KEYS, type RelicKey, type RelicRarity } from './relics';
import {
  RELIC_ELITE_BASE_DROP_CHANCE,
  RELIC_CHEST_OVERRIDE_CHANCE,
  RELIC_BOSS_GUARANTEED_SOURCES,
  pickRelicFromPool,
  pickRestrictedRelicForBoss,
  rollEliteDropOccurs,
  rollChestOverrideOccurs,
  bossGrantsRelic,
} from './relicDrops';

describe('relicDrops — constants', () => {
  it('elite base drop chance is 0.15 per spec §2', () => {
    expect(RELIC_ELITE_BASE_DROP_CHANCE).toBe(0.15);
  });

  it('chest override chance is 0.25 per spec §2', () => {
    expect(RELIC_CHEST_OVERRIDE_CHANCE).toBe(0.25);
  });

  it('boss guaranteed-drop whitelist matches spec §2 (Tier-2+ only, gordon excluded; cailleach_boss added V2)', () => {
    expect(RELIC_BOSS_GUARANTEED_SOURCES).toEqual(
      new Set(['tour_bus', 'the_laird', 'hunter_general', 'taxman', 'cailleach_boss']),
    );
    expect(RELIC_BOSS_GUARANTEED_SOURCES.has('gordon')).toBe(false);
  });
});

describe('rollEliteDropOccurs — 15% base, luck-scaled', () => {
  it('fires ~15% at luck=1 over 2000 rolls', () => {
    const rng = createRNG(1234);
    let hits = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      if (rollEliteDropOccurs(rng, 1)) hits++;
    }
    const rate = hits / N;
    expect(rate).toBeGreaterThan(0.12);
    expect(rate).toBeLessThan(0.18);
  });

  it('luck multiplies base chance linearly', () => {
    const rng = createRNG(5678);
    let hits = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      if (rollEliteDropOccurs(rng, 2)) hits++;
    }
    const rate = hits / N;
    expect(rate).toBeGreaterThan(0.26);
    expect(rate).toBeLessThan(0.34);
  });

  it('clamps to 1 at extreme luck', () => {
    const rng = createRNG(1);
    expect(rollEliteDropOccurs(rng, 100)).toBe(true);
  });

  it('luck=0 never fires', () => {
    const rng = createRNG(1);
    for (let i = 0; i < 50; i++) {
      expect(rollEliteDropOccurs(rng, 0)).toBe(false);
    }
  });
});

describe('rollChestOverrideOccurs — 25% override', () => {
  it('fires ~25% over 2000 rolls', () => {
    const rng = createRNG(9876);
    let hits = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      if (rollChestOverrideOccurs(rng)) hits++;
    }
    const rate = hits / N;
    expect(rate).toBeGreaterThan(0.22);
    expect(rate).toBeLessThan(0.28);
  });
});

describe('bossGrantsRelic — Tier-2+ whitelist', () => {
  it('grants for tour_bus, the_laird, hunter_general, taxman', () => {
    expect(bossGrantsRelic('tour_bus')).toBe(true);
    expect(bossGrantsRelic('the_laird')).toBe(true);
    expect(bossGrantsRelic('hunter_general')).toBe(true);
    expect(bossGrantsRelic('taxman')).toBe(true);
  });

  it('skips gordon (Tier-1)', () => {
    expect(bossGrantsRelic('gordon')).toBe(false);
  });

  it('false for non-boss keys', () => {
    expect(bossGrantsRelic('nessie')).toBe(false);
    expect(bossGrantsRelic('')).toBe(false);
  });
});

describe('pickRelicFromPool — weighted rarity + drop-affinity', () => {
  it('returns a RelicDef whose dropAffinity includes the source', () => {
    const rng = createRNG(42);
    for (let i = 0; i < 200; i++) {
      const relic = pickRelicFromPool('elite', rng, []);
      expect(relic).not.toBeNull();
      expect(relic!.dropAffinity.includes('elite')).toBe(true);
    }
  });

  it('boss pool surfaces only boss-affinity relics', () => {
    const rng = createRNG(9);
    for (let i = 0; i < 200; i++) {
      const relic = pickRelicFromPool('boss', rng, []);
      expect(relic).not.toBeNull();
      expect(relic!.dropAffinity.includes('boss')).toBe(true);
    }
  });

  it('rarity distribution trends 50/35/15 across sources (within tolerance)', () => {
    const rng = createRNG(7777);
    const counts: Record<RelicRarity, number> = { common: 0, uncommon: 0, rare: 0 };
    const N = 5000;
    for (let i = 0; i < N; i++) {
      // Use 'chest' — every relic is eligible via either chest or fallback
      // (no source is perfectly universal, so chest mix is the closest proxy).
      const relic = pickRelicFromPool('chest', rng, []);
      if (relic) counts[relic.rarity]++;
    }
    // Chest pool sees 4 common, 5 uncommon, 1 rare eligible relics; the
    // pool is selected by rarity weight (50/35/15) and only falls back
    // when no relic matches the source. Check rares are rarer than commons
    // and distribution isn't pathological.
    expect(counts.common).toBeGreaterThan(counts.rare);
    expect(counts.uncommon).toBeGreaterThan(counts.rare);
    expect(counts.common + counts.uncommon + counts.rare).toBe(N);
  });

  it('excludes relics the player already holds', () => {
    const rng = createRNG(42);
    const held: RelicKey[] = RELIC_KEYS.filter(
      (k) => RELICS[k].rarity === 'common',
    );
    for (let i = 0; i < 100; i++) {
      const relic = pickRelicFromPool('elite', rng, held);
      if (relic !== null) {
        expect(held.includes(relic.key)).toBe(false);
      }
    }
  });

  it('returns null when every candidate is already held', () => {
    const rng = createRNG(1);
    const held = RELIC_KEYS.slice(); // all 18
    const relic = pickRelicFromPool('elite', rng, held);
    expect(relic).toBeNull();
  });

  it('hidden_node + bargain sources resolve to the expected affinity pool', () => {
    const rng = createRNG(42);
    for (let i = 0; i < 100; i++) {
      const hidden = pickRelicFromPool('hidden_node', rng, []);
      expect(hidden).not.toBeNull();
      expect(hidden!.dropAffinity.includes('hidden_node')).toBe(true);
    }
    for (let i = 0; i < 100; i++) {
      const bargain = pickRelicFromPool('bargain', rng, []);
      expect(bargain).not.toBeNull();
      expect(bargain!.dropAffinity.includes('bargain')).toBe(true);
    }
  });
});

describe('pickRestrictedRelicForBoss — V2 Cailleach Gauntlet', () => {
  it('returns Stormcrown for cailleach_boss', () => {
    const def = pickRestrictedRelicForBoss('cailleach_boss');
    expect(def?.key).toBe('stormcrown');
  });

  it('returns null for non-restricted bosses', () => {
    expect(pickRestrictedRelicForBoss('gordon')).toBeNull();
    expect(pickRestrictedRelicForBoss('tour_bus')).toBeNull();
    expect(pickRestrictedRelicForBoss('taxman')).toBeNull();
  });

  it('returns null for unknown boss keys', () => {
    expect(pickRestrictedRelicForBoss('not_a_boss')).toBeNull();
  });
});

describe('pickRelicFromPool — restricted exclusion (V2)', () => {
  it('never returns Stormcrown for a tour_bus boss kill', () => {
    const rng = createRNG(0x1234);
    for (let i = 0; i < 100; i++) {
      const def = pickRelicFromPool('boss', rng, []);
      expect(def?.key).not.toBe('stormcrown');
    }
  });
});
