import { describe, expect, it } from 'vitest';
import { resolveRestEvent } from './restEvent';
import { resolveShrineEvent } from './shrineEvent';
import { resolveBargainEvent } from './bargainEvent';
import { resolveEliteEvent } from './eliteEvent';
import { resolveHiddenEvent } from './hiddenEvent';
import { resolveEncounterEvent } from './encounterEvent';
import { resolveWeeTraderEvent } from './weeTraderEvent';
import { readNumber, readStringArray } from './types';
import { createRNG } from '../../utils/rng';
import type { NodeDef } from '../../data/nodeTypes';

function node(type: NodeDef['type'], data: Readonly<Record<string, unknown>> = {}): NodeDef {
  return { key: `test_${type}`, type, nameKey: 'test', weightInBank: 1, actAffinity: [1], data };
}

const rng = createRNG(42);

// ---------------------------------------------------------------------------
// readNumber / readStringArray helpers
// ---------------------------------------------------------------------------

describe('readNumber', () => {
  it('returns the value when present and finite', () => {
    expect(readNumber({ x: 7 }, 'x', 0)).toBe(7);
  });

  it('returns the fallback for missing key', () => {
    expect(readNumber({}, 'x', 5)).toBe(5);
  });

  it('returns the fallback for non-numeric value', () => {
    expect(readNumber({ x: 'oops' }, 'x', 3)).toBe(3);
  });

  it('returns the fallback for NaN', () => {
    expect(readNumber({ x: NaN }, 'x', 9)).toBe(9);
  });

  it('returns the fallback for Infinity', () => {
    expect(readNumber({ x: Infinity }, 'x', 1)).toBe(1);
  });
});

describe('readStringArray', () => {
  it('returns strings from an array of strings', () => {
    expect(readStringArray({ pool: ['a', 'b'] }, 'pool')).toEqual(['a', 'b']);
  });

  it('returns empty array for missing key', () => {
    expect(readStringArray({}, 'pool')).toEqual([]);
  });

  it('filters out non-string entries', () => {
    expect(readStringArray({ pool: ['a', 42, null, 'b'] }, 'pool')).toEqual(['a', 'b']);
  });

  it('returns empty array for non-array value', () => {
    expect(readStringArray({ pool: 'oops' }, 'pool')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// resolveRestEvent
// ---------------------------------------------------------------------------

describe('resolveRestEvent', () => {
  it('returns default healRatio and rerollTokens when data is empty', () => {
    const spec = resolveRestEvent(node('rest'));
    expect(spec.healRatio).toBeCloseTo(0.3);
    expect(spec.rerollTokens).toBe(1);
  });

  it('clamps healRatio to [0, 1]', () => {
    expect(resolveRestEvent(node('rest', { healRatio: 5 })).healRatio).toBe(1);
    expect(resolveRestEvent(node('rest', { healRatio: -1 })).healRatio).toBe(0);
  });

  it('floors rerollTokens to an integer', () => {
    expect(resolveRestEvent(node('rest', { rerollTokens: 2.9 })).rerollTokens).toBe(2);
  });

  it('clamps negative rerollTokens to 0', () => {
    expect(resolveRestEvent(node('rest', { rerollTokens: -1 })).rerollTokens).toBe(0);
  });

  it('throws for wrong node type', () => {
    expect(() => resolveRestEvent(node('shrine'))).toThrow('is not a rest');
  });
});

// ---------------------------------------------------------------------------
// resolveShrineEvent
// ---------------------------------------------------------------------------

describe('resolveShrineEvent', () => {
  it('returns 3 unique candidates from the pool', () => {
    const spec = resolveShrineEvent(node('shrine', { buffPool: ['a', 'b', 'c', 'd', 'e'] }), createRNG(1));
    expect(spec.candidates).toHaveLength(3);
    const keys = spec.candidates.map((c) => c.key);
    expect(new Set(keys).size).toBe(3);
  });

  it('returns all candidates when pool is smaller than 3', () => {
    const spec = resolveShrineEvent(node('shrine', { buffPool: ['x', 'y'] }), createRNG(1));
    expect(spec.candidates).toHaveLength(2);
  });

  it('returns default durationMs when not specified', () => {
    const spec = resolveShrineEvent(node('shrine', { buffPool: ['a', 'b', 'c'] }), createRNG(1));
    expect(spec.durationMs).toBe(60_000);
  });

  it('uses custom durationMs from node data', () => {
    const spec = resolveShrineEvent(node('shrine', { buffPool: ['a', 'b', 'c'], durationMs: 30_000 }), createRNG(1));
    expect(spec.durationMs).toBe(30_000);
  });

  it('is deterministic for the same seed', () => {
    const a = resolveShrineEvent(node('shrine', { buffPool: ['a', 'b', 'c', 'd'] }), createRNG(99));
    const b = resolveShrineEvent(node('shrine', { buffPool: ['a', 'b', 'c', 'd'] }), createRNG(99));
    expect(a.candidates.map((c) => c.key)).toEqual(b.candidates.map((c) => c.key));
  });

  it('throws for wrong node type', () => {
    expect(() => resolveShrineEvent(node('rest'), rng)).toThrow('is not a shrine');
  });
});

// ---------------------------------------------------------------------------
// resolveBargainEvent
// ---------------------------------------------------------------------------

describe('resolveBargainEvent', () => {
  it('computes HP cost from maxHp × default ratio (0.15)', () => {
    const spec = resolveBargainEvent(node('bargain'), createRNG(1), 100);
    expect(spec.hpCost).toBe(15);
  });

  it('uses custom hpCostRatio from node data', () => {
    const spec = resolveBargainEvent(node('bargain', { hpCostRatio: 0.5 }), createRNG(1), 100);
    expect(spec.hpCost).toBe(50);
  });

  it('clamps hpCost to at least 1', () => {
    const spec = resolveBargainEvent(node('bargain', { hpCostRatio: 0 }), createRNG(1), 100);
    expect(spec.hpCost).toBeGreaterThanOrEqual(1);
  });

  it('classifies relic offer correctly', () => {
    const spec = resolveBargainEvent(node('bargain', { offerPool: ['rare_relic'] }), createRNG(1), 100);
    expect(spec.offerKind).toBe('relic');
  });

  it('classifies weapon_upgrade_token correctly', () => {
    const spec = resolveBargainEvent(node('bargain', { offerPool: ['weapon_upgrade_token'] }), createRNG(1), 100);
    expect(spec.offerKind).toBe('weapon_upgrade_token');
  });

  it('classifies other keys as buff_run', () => {
    const spec = resolveBargainEvent(node('bargain', { offerPool: ['speed_boost'] }), createRNG(1), 100);
    expect(spec.offerKind).toBe('buff_run');
  });

  it('falls back to default pool when offerPool is empty', () => {
    const spec = resolveBargainEvent(node('bargain', { offerPool: [] }), createRNG(1), 100);
    expect(spec.offerKey).toBe('rare_relic');
  });

  it('throws for wrong node type', () => {
    expect(() => resolveBargainEvent(node('rest'), rng, 100)).toThrow('is not a bargain');
  });
});

// ---------------------------------------------------------------------------
// resolveEliteEvent
// ---------------------------------------------------------------------------

describe('resolveEliteEvent', () => {
  it('uses default enemy key when not specified', () => {
    const spec = resolveEliteEvent(node('elite'));
    expect(spec.enemyKey).toBe('haggis_hunter');
  });

  it('uses custom enemy key from node data', () => {
    const spec = resolveEliteEvent(node('elite', { enemyKey: 'kelpie' }));
    expect(spec.enemyKey).toBe('kelpie');
  });

  it('returns default elite multipliers when not specified', () => {
    const spec = resolveEliteEvent(node('elite'));
    expect(spec.eliteMul.hp).toBe(3);
    expect(spec.eliteMul.speed).toBeCloseTo(1.3);
    expect(spec.eliteMul.xp).toBe(3);
  });

  it('reads custom eliteMul from node data', () => {
    const spec = resolveEliteEvent(node('elite', { eliteMul: { hp: 5, speed: 2, xp: 4 } }));
    expect(spec.eliteMul.hp).toBe(5);
    expect(spec.eliteMul.speed).toBe(2);
    expect(spec.eliteMul.xp).toBe(4);
  });

  it('guaranteedRelic is true by default', () => {
    expect(resolveEliteEvent(node('elite')).guaranteedRelic).toBe(true);
  });

  it('guaranteedRelic is false when data.guaranteedRelic is false', () => {
    expect(resolveEliteEvent(node('elite', { guaranteedRelic: false })).guaranteedRelic).toBe(false);
  });

  it('throws for wrong node type', () => {
    expect(() => resolveEliteEvent(node('rest'))).toThrow('is not an elite');
  });
});

// ---------------------------------------------------------------------------
// resolveHiddenEvent
// ---------------------------------------------------------------------------

describe('resolveHiddenEvent', () => {
  it('returns lore_fragment when pool is empty', () => {
    const spec = resolveHiddenEvent(node('hidden', { rewardPool: [] }), createRNG(1));
    expect(spec.kind).toBe('lore_fragment');
  });

  it('returns lore_fragment when pool is missing', () => {
    const spec = resolveHiddenEvent(node('hidden'), createRNG(1));
    expect(spec.kind).toBe('lore_fragment');
  });

  it('returns relic kind when pool yields rare_relic', () => {
    const spec = resolveHiddenEvent(node('hidden', { rewardPool: ['rare_relic'] }), createRNG(1));
    expect(spec.kind).toBe('relic');
  });

  it('returns lore_fragment with rewardKey for non-relic pool entries', () => {
    const spec = resolveHiddenEvent(node('hidden', { rewardPool: ['ancient_tablet'] }), createRNG(1));
    expect(spec.kind).toBe('lore_fragment');
    expect(spec.rewardKey).toBe('ancient_tablet');
  });

  it('throws for wrong node type', () => {
    expect(() => resolveHiddenEvent(node('rest'), rng)).toThrow('is not a hidden');
  });
});

// ---------------------------------------------------------------------------
// resolveEncounterEvent
// ---------------------------------------------------------------------------

describe('resolveEncounterEvent', () => {
  it('parses a well-formed enemyMix', () => {
    const mix = [{ key: 'haggis_hunter', count: 3 }, { key: 'kelpie', count: 1 }];
    const spec = resolveEncounterEvent(node('encounter', { enemyMix: mix }));
    expect(spec.enemyMix).toHaveLength(2);
    expect(spec.enemyMix[0].key).toBe('haggis_hunter');
    expect(spec.enemyMix[0].count).toBe(3);
  });

  it('drops enemy mix entries with non-positive count', () => {
    const mix = [{ key: 'a', count: 0 }, { key: 'b', count: 2 }];
    const spec = resolveEncounterEvent(node('encounter', { enemyMix: mix }));
    expect(spec.enemyMix).toHaveLength(1);
    expect(spec.enemyMix[0].key).toBe('b');
  });

  it('floors fractional counts', () => {
    const mix = [{ key: 'a', count: 2.9 }];
    const spec = resolveEncounterEvent(node('encounter', { enemyMix: mix }));
    expect(spec.enemyMix[0].count).toBe(2);
  });

  it('returns empty enemyMix when data is missing', () => {
    const spec = resolveEncounterEvent(node('encounter'));
    expect(spec.enemyMix).toHaveLength(0);
  });

  it('uses default durationMs when not specified', () => {
    expect(resolveEncounterEvent(node('encounter')).durationMs).toBe(75_000);
  });

  it('uses custom durationMs from node data', () => {
    expect(resolveEncounterEvent(node('encounter', { durationMs: 45_000 })).durationMs).toBe(45_000);
  });

  it('throws for wrong node type', () => {
    expect(() => resolveEncounterEvent(node('rest'))).toThrow('is not an encounter');
  });
});

// ---------------------------------------------------------------------------
// resolveWeeTraderEvent
// ---------------------------------------------------------------------------

describe('resolveWeeTraderEvent', () => {
  it('returns 3 items for the default stock size', () => {
    const spec = resolveWeeTraderEvent(node('wee_trader'), createRNG(1));
    expect(spec.items).toHaveLength(3);
  });

  it('first three items are relic, passive, reroll in order', () => {
    const spec = resolveWeeTraderEvent(node('wee_trader'), createRNG(1));
    expect(spec.items[0].kind).toBe('relic');
    expect(spec.items[1].kind).toBe('passive');
    expect(spec.items[2].kind).toBe('reroll');
  });

  it('prices are within expected ranges', () => {
    const spec = resolveWeeTraderEvent(node('wee_trader'), createRNG(1));
    const [relic, passive, reroll] = spec.items;
    expect(relic.priceGold).toBeGreaterThanOrEqual(80);
    expect(relic.priceGold).toBeLessThanOrEqual(160);
    expect(passive.priceGold).toBeGreaterThanOrEqual(50);
    expect(passive.priceGold).toBeLessThanOrEqual(110);
    expect(reroll.priceGold).toBeGreaterThanOrEqual(30);
    expect(reroll.priceGold).toBeLessThanOrEqual(60);
  });

  it('is deterministic for the same seed', () => {
    const a = resolveWeeTraderEvent(node('wee_trader'), createRNG(77));
    const b = resolveWeeTraderEvent(node('wee_trader'), createRNG(77));
    expect(a.items.map((i) => i.priceGold)).toEqual(b.items.map((i) => i.priceGold));
  });

  it('throws for wrong node type', () => {
    expect(() => resolveWeeTraderEvent(node('rest'), rng)).toThrow('is not a wee_trader');
  });
});
