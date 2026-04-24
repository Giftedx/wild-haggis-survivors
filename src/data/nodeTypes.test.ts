import { describe, expect, it } from 'vitest';
import {
  NODE_TYPES,
  isNodeType,
  type NodeDef,
  type NodeOutcome,
  type NodeType,
} from './nodeTypes';

describe('NODE_TYPES', () => {
  it('lists all 7 node types exactly once', () => {
    expect(NODE_TYPES).toEqual([
      'encounter',
      'shrine',
      'wee_trader',
      'hidden',
      'bargain',
      'rest',
      'elite',
    ]);
    expect(new Set(NODE_TYPES).size).toBe(NODE_TYPES.length);
  });

  it('is typed as a readonly tuple — NodeType derives from it', () => {
    const sample: NodeType = 'encounter';
    expect(NODE_TYPES).toContain(sample);
  });
});

describe('isNodeType', () => {
  it('accepts every NODE_TYPES entry', () => {
    for (const t of NODE_TYPES) {
      expect(isNodeType(t)).toBe(true);
    }
  });

  it('rejects unknown strings and non-strings', () => {
    expect(isNodeType('boss')).toBe(false);
    expect(isNodeType('')).toBe(false);
    expect(isNodeType(null)).toBe(false);
    expect(isNodeType(undefined)).toBe(false);
    expect(isNodeType(42)).toBe(false);
    expect(isNodeType({})).toBe(false);
  });
});

describe('NodeDef shape', () => {
  it('accepts a minimal valid NodeDef', () => {
    const def: NodeDef = {
      key: 'test_shrine',
      type: 'shrine',
      nameKey: 'nodes.shrine.test.name',
      weightInBank: 10,
      actAffinity: [1, 2],
      data: {},
    };
    expect(def.key).toBe('test_shrine');
    expect(def.type).toBe('shrine');
  });

  it('permits optional promptKey', () => {
    const def: NodeDef = {
      key: 'test_bargain',
      type: 'bargain',
      nameKey: 'nodes.bargain.test.name',
      promptKey: 'nodes.bargain.test.prompt',
      weightInBank: 5,
      actAffinity: [2, 3],
      data: { hpCost: 10 },
    };
    expect(def.promptKey).toBe('nodes.bargain.test.prompt');
  });
});

describe('NodeOutcome shape', () => {
  it('accepts a visit with no reward', () => {
    const outcome: NodeOutcome = {
      nodeKey: 'test_encounter',
      visitedAtGameTimeSec: 120,
    };
    expect(outcome.chosenRewardKey).toBeUndefined();
  });

  it('accepts a visit with reward selection', () => {
    const outcome: NodeOutcome = {
      nodeKey: 'test_shrine',
      chosenRewardKey: 'buff_damage',
      visitedAtGameTimeSec: 240,
    };
    expect(outcome.chosenRewardKey).toBe('buff_damage');
  });
});
