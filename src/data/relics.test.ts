import { describe, expect, it } from 'vitest';
import { RELICS, RELIC_KEYS, type RelicDef, type RelicKey } from './relics';

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
