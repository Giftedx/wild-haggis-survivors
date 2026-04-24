import { describe, expect, it } from 'vitest';
import {
  ACT_1_BANK,
  ACT_2_BANK,
  ACT_3_STRETCH_1_BANK,
  ACT_3_STRETCH_2_BANK,
  ACT_3_STRETCH_3_BANK,
  ALL_NODE_DEFS,
  getAct3Bank,
  getActBank,
  getNodeDef,
} from './nodeBanks';
import { NODE_TYPES, type NodeType } from './nodeTypes';

const BANKS = [
  // Act 1 + Act 2 are single-bank-per-act → need ≥20 for solver variety.
  { name: 'ACT_1_BANK', bank: ACT_1_BANK, act: 1 as const, minEntries: 20 },
  { name: 'ACT_2_BANK', bank: ACT_2_BANK, act: 2 as const, minEntries: 20 },
  // Act 3 is split across three stretches — each smaller, pooled across the act.
  { name: 'ACT_3_STRETCH_1_BANK', bank: ACT_3_STRETCH_1_BANK, act: 3 as const, minEntries: 10 },
  { name: 'ACT_3_STRETCH_2_BANK', bank: ACT_3_STRETCH_2_BANK, act: 3 as const, minEntries: 10 },
  { name: 'ACT_3_STRETCH_3_BANK', bank: ACT_3_STRETCH_3_BANK, act: 3 as const, minEntries: 10 },
];

describe('node banks — per-bank shape', () => {
  for (const { name, bank, act, minEntries } of BANKS) {
    describe(name, () => {
      it(`has ≥${minEntries} entries for constraint-solver variety`, () => {
        expect(bank.length).toBeGreaterThanOrEqual(minEntries);
      });

      it('covers all 7 node types', () => {
        const present = new Set<NodeType>(bank.map((n) => n.type));
        for (const t of NODE_TYPES) {
          expect(present.has(t)).toBe(true);
        }
      });

      it('every entry can appear in this bank\'s act (actAffinity contains the act)', () => {
        for (const n of bank) {
          expect(n.actAffinity).toContain(act);
        }
      });

      it('every entry has a strictly positive weightInBank', () => {
        for (const n of bank) {
          expect(n.weightInBank).toBeGreaterThan(0);
        }
      });

      it('every entry has a non-empty nameKey', () => {
        for (const n of bank) {
          expect(n.nameKey.length).toBeGreaterThan(0);
        }
      });

      it('every interactive-type entry has a promptKey', () => {
        const interactive: NodeType[] = ['shrine', 'wee_trader', 'hidden', 'bargain'];
        for (const n of bank) {
          if (interactive.includes(n.type)) {
            expect(n.promptKey).toBeDefined();
            expect(n.promptKey!.length).toBeGreaterThan(0);
          }
        }
      });
    });
  }
});

describe('node banks — cross-bank integrity', () => {
  it('every NodeDef.key is globally unique', () => {
    const keys = ALL_NODE_DEFS.map((n) => n.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('ALL_NODE_DEFS equals the concatenation of the five banks', () => {
    expect(ALL_NODE_DEFS.length).toBe(
      ACT_1_BANK.length +
        ACT_2_BANK.length +
        ACT_3_STRETCH_1_BANK.length +
        ACT_3_STRETCH_2_BANK.length +
        ACT_3_STRETCH_3_BANK.length,
    );
  });
});

describe('getActBank', () => {
  it('returns the Act 1 bank', () => {
    expect(getActBank(1)).toBe(ACT_1_BANK);
  });

  it('returns the Act 2 bank', () => {
    expect(getActBank(2)).toBe(ACT_2_BANK);
  });

  it('returns Act 3 stretch 1 as the default Act 3 bank', () => {
    expect(getActBank(3)).toBe(ACT_3_STRETCH_1_BANK);
  });
});

describe('getAct3Bank', () => {
  it('returns stretch 1 bank', () => {
    expect(getAct3Bank(1)).toBe(ACT_3_STRETCH_1_BANK);
  });
  it('returns stretch 2 bank', () => {
    expect(getAct3Bank(2)).toBe(ACT_3_STRETCH_2_BANK);
  });
  it('returns stretch 3 bank', () => {
    expect(getAct3Bank(3)).toBe(ACT_3_STRETCH_3_BANK);
  });
});

describe('getNodeDef', () => {
  it('returns the matching def for a known key', () => {
    const def = getNodeDef('a1_thistle_ambush');
    expect(def?.type).toBe('encounter');
  });

  it('returns undefined for unknown keys', () => {
    expect(getNodeDef('not_a_real_node')).toBeUndefined();
  });
});
