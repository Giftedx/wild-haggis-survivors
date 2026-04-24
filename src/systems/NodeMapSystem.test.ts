import { describe, expect, it } from 'vitest';
import {
  ACT_1_BANK,
  ACT_2_BANK,
  ACT_3_STRETCH_1_BANK,
  ACT_3_STRETCH_2_BANK,
  ACT_3_STRETCH_3_BANK,
} from '../data/nodeBanks';
import type { NodeDef, NodeType } from '../data/nodeTypes';
import { createRNG } from '../utils/rng';
import { generateNodePath, placeNodes, clampPosition } from './NodeMapSystem';

function countBy(nodes: readonly NodeDef[]): Record<NodeType, number> {
  const out: Record<NodeType, number> = {
    encounter: 0, shrine: 0, wee_trader: 0, hidden: 0, bargain: 0, rest: 0, elite: 0,
  };
  for (const n of nodes) out[n.type]++;
  return out;
}

describe('generateNodePath — constraints', () => {
  it('returns between 3 and 5 nodes by default', () => {
    for (let seed = 1; seed < 100; seed++) {
      const path = generateNodePath(ACT_1_BANK, 1, createRNG(seed));
      expect(path.length).toBeGreaterThanOrEqual(3);
      expect(path.length).toBeLessThanOrEqual(5);
    }
  });

  it('respects an explicit nodeCount', () => {
    const path = generateNodePath(ACT_1_BANK, 1, createRNG(42), { nodeCount: 4 });
    expect(path).toHaveLength(4);
  });

  it('always includes at least one encounter', () => {
    for (let seed = 1; seed < 100; seed++) {
      const path = generateNodePath(ACT_1_BANK, 1, createRNG(seed));
      expect(countBy(path).encounter).toBeGreaterThanOrEqual(1);
    }
  });

  it('never includes more than one elite per path', () => {
    for (let seed = 1; seed < 100; seed++) {
      const path = generateNodePath(ACT_2_BANK, 2, createRNG(seed));
      expect(countBy(path).elite).toBeLessThanOrEqual(1);
    }
  });

  it('never includes both bargain and rest in the same path', () => {
    for (let seed = 1; seed < 100; seed++) {
      const path = generateNodePath(ACT_2_BANK, 2, createRNG(seed));
      const c = countBy(path);
      expect(c.bargain > 0 && c.rest > 0).toBe(false);
    }
  });

  it('is deterministic given the same seed', () => {
    const a = generateNodePath(ACT_1_BANK, 1, createRNG(12345));
    const b = generateNodePath(ACT_1_BANK, 1, createRNG(12345));
    expect(a.map((n) => n.key)).toEqual(b.map((n) => n.key));
  });

  it('differs across seeds (probabilistic — at least one mismatch over many seeds)', () => {
    const samples = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const path = generateNodePath(ACT_1_BANK, 1, createRNG(seed), { nodeCount: 4 });
      samples.add(path.map((n) => n.key).join(','));
    }
    expect(samples.size).toBeGreaterThan(1);
  });

  it('never duplicates a node within a path', () => {
    for (let seed = 1; seed < 100; seed++) {
      const path = generateNodePath(ACT_1_BANK, 1, createRNG(seed));
      const keys = path.map((n) => n.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('only picks nodes whose actAffinity contains the requested act', () => {
    const merged: NodeDef[] = [...ACT_1_BANK, ...ACT_3_STRETCH_1_BANK];
    for (let seed = 1; seed < 30; seed++) {
      const path = generateNodePath(merged, 1, createRNG(seed));
      for (const n of path) expect(n.actAffinity).toContain(1);
    }
  });

  it('throws when the bank has no encounters eligible for the act', () => {
    const bargainOnly: NodeDef[] = ACT_1_BANK.filter((n) => n.type === 'bargain');
    expect(() => generateNodePath(bargainOnly, 1, createRNG(1))).toThrow(/encounter/i);
  });

  it('throws when the bank is empty', () => {
    expect(() => generateNodePath([], 1, createRNG(1))).toThrow(/empty/i);
  });

  it('works for every shipped bank without throwing', () => {
    const cases: Array<{ bank: readonly NodeDef[]; act: 1 | 2 | 3 }> = [
      { bank: ACT_1_BANK, act: 1 },
      { bank: ACT_2_BANK, act: 2 },
      { bank: ACT_3_STRETCH_1_BANK, act: 3 },
      { bank: ACT_3_STRETCH_2_BANK, act: 3 },
      { bank: ACT_3_STRETCH_3_BANK, act: 3 },
    ];
    for (const { bank, act } of cases) {
      for (let seed = 1; seed <= 20; seed++) {
        const path = generateNodePath(bank, act, createRNG(seed));
        expect(path.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('placeNodes — world placement', () => {
  it('produces exactly `count` positions', () => {
    const pos = placeNodes(4, { x: 0, y: 0 }, createRNG(1));
    expect(pos).toHaveLength(4);
  });

  it('separates adjacent nodes by roughly the target distance', () => {
    const pos = placeNodes(5, { x: 0, y: 0 }, createRNG(7), { separation: 1000 });
    for (let i = 1; i < pos.length; i++) {
      const dx = pos[i].x - pos[i - 1].x;
      const dy = pos[i].y - pos[i - 1].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      expect(d).toBeGreaterThan(800);
      expect(d).toBeLessThan(1200);
    }
  });

  it('is deterministic given the same seed', () => {
    const a = placeNodes(3, { x: 100, y: 200 }, createRNG(999));
    const b = placeNodes(3, { x: 100, y: 200 }, createRNG(999));
    expect(a).toEqual(b);
  });

  it('clamps to world bounds when supplied', () => {
    const pos = placeNodes(5, { x: 0, y: 0 }, createRNG(1), {
      separation: 5000,
      worldBounds: { minX: -1500, minY: -1500, maxX: 1500, maxY: 1500 },
    });
    for (const p of pos) {
      expect(p.x).toBeGreaterThanOrEqual(-1500);
      expect(p.x).toBeLessThanOrEqual(1500);
      expect(p.y).toBeGreaterThanOrEqual(-1500);
      expect(p.y).toBeLessThanOrEqual(1500);
    }
  });
});

describe('clampPosition', () => {
  it('clamps inside bounds unchanged', () => {
    expect(clampPosition({ x: 5, y: 5 }, { minX: 0, minY: 0, maxX: 10, maxY: 10 })).toEqual({ x: 5, y: 5 });
  });

  it('clamps x and y to bounds when outside', () => {
    expect(clampPosition({ x: 20, y: -5 }, { minX: 0, minY: 0, maxX: 10, maxY: 10 })).toEqual({ x: 10, y: 0 });
  });
});
