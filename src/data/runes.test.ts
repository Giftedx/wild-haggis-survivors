import { describe, expect, it } from 'vitest';
import { RUNES, RUNE_RARITY, type RuneDef } from './runes';

describe('RUNES catalogue — biome-conditional (U1 Task 1)', () => {
  it('haar_rune carries biome_fog condition + +100% dmg effect', () => {
    const r = RUNES.haar_rune;
    expect(r.conditionKey).toBe('biome_fog');
    expect(r.effects).toHaveLength(1);
    expect(r.effects[0]!.key).toBe('dmg_mult');
    expect(r.effects[0]!.params.mult).toBe(2.0); // +100% = ×2
  });

  it('peat_rune has biome_bog + multi-effect (dmg boost, speed penalty)', () => {
    const r = RUNES.peat_rune;
    expect(r.conditionKey).toBe('biome_bog');
    expect(r.effects.length).toBeGreaterThanOrEqual(2);
    const keys = r.effects.map((e) => e.key);
    expect(keys).toContain('dmg_mult');
    expect(keys).toContain('speed_mult');
  });

  it('all 10 biome runes present with nameKey, flavourKey, glyph', () => {
    const biomeIds = [
      'haar_rune', 'peat_rune', 'heather_rune', 'loch_rune', 'cairn_rune',
      'gloaming_rune', 'frost_rune', 'seawrack_rune', 'kirkyard_rune', 'edinburgh_rune',
    ];
    for (const id of biomeIds) {
      const r = RUNES[id];
      expect(r, `missing ${id}`).toBeDefined();
      expect(r!.nameKey).toMatch(/^runes\./);
      expect(r!.flavourKey).toMatch(/^runes\./);
      expect(r!.glyph).toMatch(/^rune_/);
    }
  });

  it('all biome runes expose frozen readonly shape', () => {
    const r = RUNES.haar_rune;
    expect(Object.isFrozen(r.effects)).toBe(true);
  });

  it('RUNE_RARITY is "rune"', () => {
    expect(RUNE_RARITY).toBe('rune');
  });

  it('each rune id matches its map key', () => {
    for (const [key, def] of Object.entries(RUNES) as [string, RuneDef][]) {
      expect(def.id).toBe(key);
    }
  });
});

describe('RUNES catalogue — state-conditional (U1 Task 2)', () => {
  it('thirst_rune has hp_low + dmg_mult effect', () => {
    const r = RUNES.thirst_rune;
    expect(r.conditionKey).toBe('hp_low');
    expect(r.effects[0]!.key).toBe('dmg_mult');
    expect(r.effects[0]!.params.mult).toBe(1.3);
  });

  it('all 10 state runes present', () => {
    const ids = [
      'thirst_rune', 'flush_rune', 'drover_rune', 'piper_rune', 'trek_rune',
      'warden_rune', 'combo_rune', 'lucky_streak_rune', 'fastburn_rune', 'evolved_rune',
    ];
    for (const id of ids) {
      expect(RUNES[id], `missing ${id}`).toBeDefined();
    }
  });
});
