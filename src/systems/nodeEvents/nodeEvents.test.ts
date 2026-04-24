import { describe, expect, it } from 'vitest';
import type { NodeDef, NodeType } from '../../data/nodeTypes';
import { createRNG } from '../../utils/rng';
import { resolveBargainEvent } from './bargainEvent';
import { resolveEliteEvent } from './eliteEvent';
import { resolveEncounterEvent } from './encounterEvent';
import { resolveHiddenEvent } from './hiddenEvent';
import { resolveRestEvent } from './restEvent';
import { resolveShrineEvent } from './shrineEvent';
import { resolveWeeTraderEvent } from './weeTraderEvent';

function makeNode(
  type: NodeType,
  data: Record<string, unknown> = {},
  key = `${type}_test`,
): NodeDef {
  return {
    key,
    type,
    nameKey: `nodes.${key}.name`,
    weightInBank: 1,
    actAffinity: [1, 2, 3],
    data,
  };
}

// ---- encounter ------------------------------------------------------------

describe('resolveEncounterEvent', () => {
  it('returns the declared enemy mix', () => {
    const node = makeNode('encounter', {
      enemyMix: [{ key: 'tourist', count: 6 }, { key: 'midge', count: 3 }],
      durationMs: 90_000,
    });
    const spec = resolveEncounterEvent(node);
    expect(spec.enemyMix).toEqual([
      { key: 'tourist', count: 6 },
      { key: 'midge', count: 3 },
    ]);
    expect(spec.durationMs).toBe(90_000);
  });

  it('defaults duration to 75s when absent', () => {
    const node = makeNode('encounter', { enemyMix: [] });
    expect(resolveEncounterEvent(node).durationMs).toBe(75_000);
  });

  it('drops malformed mix entries', () => {
    const node = makeNode('encounter', {
      enemyMix: [{ key: 'tourist', count: 3 }, 'not-an-object', { key: 42 }, { count: 5 }, { key: 'ok', count: 0 }],
    });
    expect(resolveEncounterEvent(node).enemyMix).toEqual([{ key: 'tourist', count: 3 }]);
  });

  it('throws when passed a non-encounter node', () => {
    expect(() => resolveEncounterEvent(makeNode('shrine'))).toThrow(/encounter/);
  });
});

// ---- shrine ---------------------------------------------------------------

describe('resolveShrineEvent', () => {
  it('returns three unique candidates when the pool has ≥3', () => {
    const node = makeNode('shrine', {
      buffPool: ['buff_damage', 'buff_speed', 'buff_luck', 'buff_armor', 'buff_regen'],
    });
    const spec = resolveShrineEvent(node, createRNG(1));
    expect(spec.candidates).toHaveLength(3);
    const keys = spec.candidates.map((c) => c.key);
    expect(new Set(keys).size).toBe(3);
  });

  it('returns the full pool when it has fewer than 3 entries', () => {
    const node = makeNode('shrine', { buffPool: ['buff_a', 'buff_b'] });
    expect(resolveShrineEvent(node, createRNG(1)).candidates).toHaveLength(2);
  });

  it('defaults to 60s duration', () => {
    const node = makeNode('shrine', { buffPool: ['b1', 'b2', 'b3'] });
    expect(resolveShrineEvent(node, createRNG(1)).durationMs).toBe(60_000);
  });

  it('is deterministic given the same RNG seed', () => {
    const node = makeNode('shrine', {
      buffPool: ['buff_damage', 'buff_speed', 'buff_luck', 'buff_armor', 'buff_regen'],
    });
    const a = resolveShrineEvent(node, createRNG(42)).candidates.map((c) => c.key);
    const b = resolveShrineEvent(node, createRNG(42)).candidates.map((c) => c.key);
    expect(a).toEqual(b);
  });

  it('throws on non-shrine nodes', () => {
    expect(() => resolveShrineEvent(makeNode('rest'), createRNG(1))).toThrow(/shrine/);
  });
});

// ---- wee_trader -----------------------------------------------------------

describe('resolveWeeTraderEvent', () => {
  it('stocks one of each kind in the first three slots', () => {
    const spec = resolveWeeTraderEvent(makeNode('wee_trader', { stockRoll: 3 }), createRNG(1));
    expect(spec.items.map((i) => i.kind)).toEqual(['relic', 'passive', 'reroll']);
  });

  it('honours stockRoll > 3', () => {
    const spec = resolveWeeTraderEvent(makeNode('wee_trader', { stockRoll: 5 }), createRNG(1));
    expect(spec.items).toHaveLength(5);
  });

  it('prices relics higher than passives and passives higher than rerolls (on average)', () => {
    const spec = resolveWeeTraderEvent(makeNode('wee_trader', { stockRoll: 3 }), createRNG(99));
    const relic = spec.items[0];
    const passive = spec.items[1];
    const reroll = spec.items[2];
    expect(relic.priceGold).toBeGreaterThanOrEqual(80);
    expect(passive.priceGold).toBeGreaterThanOrEqual(50);
    expect(reroll.priceGold).toBeGreaterThanOrEqual(30);
    expect(relic.priceGold).toBeGreaterThanOrEqual(reroll.priceGold);
  });

  it('throws on non-trader nodes', () => {
    expect(() => resolveWeeTraderEvent(makeNode('rest'), createRNG(1))).toThrow(/wee_trader/);
  });
});

// ---- hidden ---------------------------------------------------------------

describe('resolveHiddenEvent', () => {
  it('returns relic when the roll lands on rare_relic', () => {
    const node = makeNode('hidden', { rewardPool: ['rare_relic'] });
    expect(resolveHiddenEvent(node, createRNG(1)).kind).toBe('relic');
  });

  it('returns lore_fragment when the pool is non-relic', () => {
    const node = makeNode('hidden', { rewardPool: ['lore_fragment'] });
    const spec = resolveHiddenEvent(node, createRNG(1));
    expect(spec.kind).toBe('lore_fragment');
    expect(spec.rewardKey).toBe('lore_fragment');
  });

  it('falls back to lore_fragment for an empty pool', () => {
    expect(resolveHiddenEvent(makeNode('hidden', { rewardPool: [] }), createRNG(1)).kind).toBe('lore_fragment');
  });

  it('throws on non-hidden nodes', () => {
    expect(() => resolveHiddenEvent(makeNode('shrine'), createRNG(1))).toThrow(/hidden/);
  });
});

// ---- bargain --------------------------------------------------------------

describe('resolveBargainEvent', () => {
  it('computes HP cost from ratio × maxHp', () => {
    const node = makeNode('bargain', { hpCostRatio: 0.2, offerPool: ['rare_relic'] });
    expect(resolveBargainEvent(node, createRNG(1), 100).hpCost).toBe(20);
  });

  it('floors to at least 1 HP', () => {
    const node = makeNode('bargain', { hpCostRatio: 0.001, offerPool: ['rare_relic'] });
    expect(resolveBargainEvent(node, createRNG(1), 100).hpCost).toBe(1);
  });

  it('classifies offer kind — relic / weapon_upgrade / buff_run', () => {
    const mkPool = (key: string) => makeNode('bargain', { hpCostRatio: 0.1, offerPool: [key] });
    expect(resolveBargainEvent(mkPool('rare_relic'), createRNG(1), 100).offerKind).toBe('relic');
    expect(resolveBargainEvent(mkPool('weapon_upgrade_token'), createRNG(1), 100).offerKind).toBe('weapon_upgrade_token');
    expect(resolveBargainEvent(mkPool('buff_damage_run'), createRNG(1), 100).offerKind).toBe('buff_run');
  });

  it('throws on non-bargain nodes', () => {
    expect(() => resolveBargainEvent(makeNode('rest'), createRNG(1), 100)).toThrow(/bargain/);
  });
});

// ---- rest -----------------------------------------------------------------

describe('resolveRestEvent', () => {
  it('reads ratios from the node', () => {
    const spec = resolveRestEvent(makeNode('rest', { healRatio: 0.5, rerollTokens: 2 }));
    expect(spec.healRatio).toBe(0.5);
    expect(spec.rerollTokens).toBe(2);
  });

  it('clamps healRatio to [0, 1]', () => {
    expect(resolveRestEvent(makeNode('rest', { healRatio: 2 })).healRatio).toBe(1);
    expect(resolveRestEvent(makeNode('rest', { healRatio: -1 })).healRatio).toBe(0);
  });

  it('throws on non-rest nodes', () => {
    expect(() => resolveRestEvent(makeNode('elite'))).toThrow(/rest/);
  });
});

// ---- elite ----------------------------------------------------------------

describe('resolveEliteEvent', () => {
  it('returns the declared enemy + multipliers', () => {
    const node = makeNode('elite', {
      enemyKey: 'chef',
      eliteMul: { hp: 4, speed: 1.3, xp: 3 },
      guaranteedRelic: true,
    });
    const spec = resolveEliteEvent(node);
    expect(spec.enemyKey).toBe('chef');
    expect(spec.eliteMul).toEqual({ hp: 4, speed: 1.3, xp: 3 });
    expect(spec.guaranteedRelic).toBe(true);
  });

  it('defaults missing fields to sane baseline multipliers', () => {
    const spec = resolveEliteEvent(makeNode('elite', { enemyKey: 'chef' }));
    expect(spec.eliteMul).toEqual({ hp: 3, speed: 1.3, xp: 3 });
    expect(spec.guaranteedRelic).toBe(true);
  });

  it('defaults enemyKey when absent', () => {
    expect(resolveEliteEvent(makeNode('elite', {})).enemyKey).toBe('haggis_hunter');
  });

  it('throws on non-elite nodes', () => {
    expect(() => resolveEliteEvent(makeNode('rest'))).toThrow(/elite/);
  });
});
