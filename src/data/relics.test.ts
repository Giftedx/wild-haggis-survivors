import { describe, expect, it } from 'vitest';
import {
  RARITY_DROP_WEIGHTS,
  RELICS,
  RELIC_KEYS,
  type RelicDef,
  type RelicKey,
  type RelicRarity,
} from './relics';

describe('RELICS — Task 1: 8 common relics', () => {
  it('sporran_of_holding is common and drops from elites', () => {
    const sporran = RELICS.sporran_of_holding;
    expect(sporran.rarity).toBe('common');
    expect(sporran.dropAffinity.includes('elite')).toBe(true);
  });

  it('has exactly 8 common relics', () => {
    const commons = RELIC_KEYS.filter((k) => RELICS[k].rarity === 'common');
    expect(commons).toHaveLength(8);
  });

  it('every common relic has a non-empty dropAffinity and well-formed i18n keys', () => {
    const commons: readonly RelicDef[] = RELIC_KEYS
      .map((k) => RELICS[k])
      .filter((r) => r.rarity === 'common');
    for (const r of commons) {
      expect(r.dropAffinity.length).toBeGreaterThan(0);
      expect(r.nameKey).toMatch(/^relics\.[a-z_]+\.name$/);
      expect(r.effectKey).toMatch(/^relics\.[a-z_]+\.effect$/);
      expect(r.flavourKey).toMatch(/^relics\.[a-z_]+\.flavour$/);
      expect(r.iconSprite).toMatch(/^relic_/);
      expect(typeof r.particleColour).toBe('number');
    }
  });

  it('every relic record entry has a matching key field', () => {
    for (const key of RELIC_KEYS) {
      const k: RelicKey = key;
      expect(RELICS[k].key).toBe(k);
    }
  });
});

describe('RELICS — Task 2: 7 uncommon relics', () => {
  it('has exactly 7 uncommon relics', () => {
    const uncommons = RELIC_KEYS.filter((k) => RELICS[k].rarity === 'uncommon');
    expect(uncommons).toHaveLength(7);
  });

  it('expected uncommon keys are present', () => {
    const expected: readonly RelicKey[] = [
      'cairn_stone',
      'pictish_compass',
      'highland_torque',
      'bodhran_skin',
      'clootie_rag',
      'fishermens_net',
      'midgie_repellent',
    ];
    for (const k of expected) {
      expect(RELICS[k]).toBeDefined();
      expect(RELICS[k].rarity).toBe('uncommon');
      expect(RELICS[k].dropAffinity.length).toBeGreaterThan(0);
    }
  });
});

describe('RELICS — Task 3: 3 rare relics', () => {
  it('has exactly 3 rare relics', () => {
    const rares = RELIC_KEYS.filter((k) => RELICS[k].rarity === 'rare');
    expect(rares).toHaveLength(3);
  });

  it('expected rare keys are present and include boss-drop affinity', () => {
    const expected: readonly RelicKey[] = [
      'grans_teapot',
      'fingals_horn',
      'stone_of_destiny_shard',
    ];
    for (const k of expected) {
      expect(RELICS[k]).toBeDefined();
      expect(RELICS[k].rarity).toBe('rare');
      expect(RELICS[k].dropAffinity.includes('boss')).toBe(true);
    }
  });

  it("Fingal's Horn is activatable from the sporran menu", () => {
    expect(RELICS.fingals_horn.activate).toBe(true);
  });
});

describe('RELICS — Task 4: rarity distribution', () => {
  it('has 18 relics total split 8 common / 7 uncommon / 3 rare', () => {
    expect(RELIC_KEYS).toHaveLength(18);
    const counts: Record<RelicRarity, number> = RELIC_KEYS.reduce(
      (acc, k) => {
        acc[RELICS[k].rarity] += 1;
        return acc;
      },
      { common: 0, uncommon: 0, rare: 0 } as Record<RelicRarity, number>
    );
    expect(counts).toEqual({ common: 8, uncommon: 7, rare: 3 });
  });

  it('drop-pool weights are 50/35/15 and sum to 100', () => {
    expect(RARITY_DROP_WEIGHTS.common).toBe(50);
    expect(RARITY_DROP_WEIGHTS.uncommon).toBe(35);
    expect(RARITY_DROP_WEIGHTS.rare).toBe(15);
    const total =
      RARITY_DROP_WEIGHTS.common +
      RARITY_DROP_WEIGHTS.uncommon +
      RARITY_DROP_WEIGHTS.rare;
    expect(total).toBe(100);
  });

  it('relic keys are unique', () => {
    expect(new Set(RELIC_KEYS).size).toBe(RELIC_KEYS.length);
  });

  it('every relic belongs to a known rarity tier', () => {
    const validRarities: readonly RelicRarity[] = ['common', 'uncommon', 'rare'];
    for (const k of RELIC_KEYS) {
      const r: RelicDef = RELICS[k];
      expect(validRarities).toContain(r.rarity);
    }
  });
});
