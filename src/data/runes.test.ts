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

describe('RUNES catalogue — action-chain (U1 Task 3)', () => {
  it('echo_rune carries every_nth_kill:10 conditionKey (param embedded)', () => {
    const r = RUNES.echo_rune;
    expect(r.conditionKey).toBe('every_nth_kill:10');
    expect(r.effects[0]!.key).toBe('healing_thistle_spawn');
  });

  it('cascade_rune carries kill_cascade + stacking damage', () => {
    const r = RUNES.cascade_rune;
    expect(r.conditionKey).toBe('kill_cascade');
    expect(r.effects[0]!.key).toBe('dmg_stack');
    expect(r.effects[0]!.params.maxStacks).toBe(10);
  });

  it('all 10 action-chain runes present', () => {
    const ids = [
      'echo_rune', 'cascade_rune', 'chorus_rune', 'storm_rune', 'ceilidh_chain_rune',
      'drift_rune', 'lairds_rune', 'thistle_crown_rune', 'song_rune', 'pilgrim_rune',
    ];
    for (const id of ids) {
      expect(RUNES[id], `missing ${id}`).toBeDefined();
    }
  });
});

describe('RUNES catalogue — integrity (U1 Task 4)', () => {
  it('exactly 30 runes catalogued', () => {
    expect(Object.keys(RUNES)).toHaveLength(30);
  });

  it('all rune ids unique', () => {
    const ids = Object.values(RUNES).map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all conditionKeys are drawn from the known union (no typos)', () => {
    const allowed = new Set<string>([
      'biome_fog', 'biome_bog', 'biome_heather', 'near_water_hazard', 'near_cairn',
      'biome_dusk', 'biome_cold', 'biome_coastal', 'post_bell', 'biome_urban',
      'hp_low', 'hp_high', 'relics_full', 'weapon_bagpipes', 'run_early',
      'run_late', 'combo_high', 'chests_many', 'dash_recent_2s', 'evolved_multi',
      'every_nth_kill:10', 'kill_cascade', 'three_types_in_5s', 'crit_on_weakened',
      'pickup_chain_5s', 'dashed_5s_ago', 'kill_named_elite', 'kill_on_thistle',
      'music_bass_active', 'visited_3_nodes',
    ]);
    for (const r of Object.values(RUNES)) {
      expect(allowed.has(r.conditionKey), `unknown conditionKey ${r.conditionKey} on ${r.id}`).toBe(true);
    }
  });

  it('every rune carries at least one effect', () => {
    for (const r of Object.values(RUNES)) {
      expect(r.effects.length).toBeGreaterThan(0);
    }
  });

  it('10 biome + 10 state + 10 action-chain distribution', () => {
    // Light sanity: the three known bucket-identifying conditions exist in
    // the expected counts (stand-ins for 3×10 split).
    const byType = { biome: 0, state: 0, chain: 0 };
    for (const r of Object.values(RUNES)) {
      if (r.conditionKey.startsWith('biome_') || r.conditionKey.startsWith('near_') || r.conditionKey === 'post_bell') byType.biome++;
      else if (['hp_low', 'hp_high', 'relics_full', 'weapon_bagpipes', 'run_early', 'run_late', 'combo_high', 'chests_many', 'dash_recent_2s', 'evolved_multi'].includes(r.conditionKey)) byType.state++;
      else byType.chain++;
    }
    expect(byType).toEqual({ biome: 10, state: 10, chain: 10 });
  });
});
