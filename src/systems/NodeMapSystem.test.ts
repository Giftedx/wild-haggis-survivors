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
import {
  buildNodeMapState,
  clampPosition,
  directionToNextNode,
  findTriggerableNode,
  generateNodePath,
  NodeMapSystem,
  placeNodes,
} from './NodeMapSystem';

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

function makeFixtureMap(): ReturnType<typeof buildNodeMapState> {
  const nodes: NodeDef[] = [
    { key: 'n0', type: 'encounter', nameKey: 'n', weightInBank: 1, actAffinity: [1], data: {} },
    { key: 'n1', type: 'shrine', nameKey: 'n', weightInBank: 1, actAffinity: [1], data: {} },
    { key: 'n2', type: 'rest', nameKey: 'n', weightInBank: 1, actAffinity: [1], data: {} },
  ];
  const positions = [
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 200 },
  ];
  return buildNodeMapState(1, nodes, positions);
}

describe('findTriggerableNode', () => {
  it('returns null when no node is within range', () => {
    const map = makeFixtureMap();
    expect(findTriggerableNode(map, { x: 1000, y: 1000 })).toBeNull();
  });

  it('returns the node inside trigger range', () => {
    const map = makeFixtureMap();
    const hit = findTriggerableNode(map, { x: 10, y: 0 });
    expect(hit?.index).toBe(0);
    expect(hit?.distance).toBeCloseTo(10);
  });

  it('skips visited nodes', () => {
    const map = makeFixtureMap();
    map.visited[0] = true;
    const hit = findTriggerableNode(map, { x: 10, y: 0 });
    expect(hit).toBeNull();
  });

  it('ties resolve by index (earlier wins)', () => {
    const map = makeFixtureMap();
    // Move player exactly equidistant between n1 (200,0) and n2 (200,200)
    const hit = findTriggerableNode(map, { x: 200, y: 100 }, 150);
    // n1 is index 1, n2 is index 2 — earlier index wins on tie
    expect(hit?.index).toBe(1);
  });

  it('honours a custom trigger radius', () => {
    const map = makeFixtureMap();
    const tight = findTriggerableNode(map, { x: 50, y: 0 }, 40);
    expect(tight).toBeNull();
    const loose = findTriggerableNode(map, { x: 50, y: 0 }, 60);
    expect(loose?.index).toBe(0);
  });
});

describe('directionToNextNode', () => {
  it('returns angle + distance + index of the first un-visited node', () => {
    const map = makeFixtureMap();
    const dir = directionToNextNode(map, { x: 0, y: 0 });
    expect(dir?.targetIndex).toBe(0);
    expect(dir?.distance).toBe(0);
  });

  it('skips visited nodes and points at the next un-visited one', () => {
    const map = makeFixtureMap();
    map.visited[0] = true;
    const dir = directionToNextNode(map, { x: 0, y: 0 });
    expect(dir?.targetIndex).toBe(1);
    expect(dir?.angle).toBeCloseTo(0); // n1 is east of origin
  });

  it('returns null when every node is visited', () => {
    const map = makeFixtureMap();
    map.visited = [true, true, true];
    expect(directionToNextNode(map, { x: 0, y: 0 })).toBeNull();
  });
});

describe('NodeMapSystem class', () => {
  it('fires listener exactly once per tick-within-range before visit', () => {
    const sys = new NodeMapSystem();
    const map = makeFixtureMap();
    sys.setMap(map);
    const triggered: number[] = [];
    sys.setTriggerListener((idx) => { triggered.push(idx); });
    sys.tick({ x: 1000, y: 1000 }); // out of range
    sys.tick({ x: 10, y: 0 });      // in range of n0
    expect(triggered).toEqual([0]);
  });

  it('fires a node trigger once while the node event is unresolved', () => {
    const sys = new NodeMapSystem();
    sys.setMap(makeFixtureMap());
    const triggered: number[] = [];
    sys.setTriggerListener((idx) => { triggered.push(idx); });
    sys.tick({ x: 10, y: 0 });
    sys.tick({ x: 10, y: 0 });
    sys.tick({ x: 10, y: 0 });
    expect(triggered).toEqual([0]);
    sys.markVisited(0);
    sys.tick({ x: 10, y: 0 });
    expect(triggered).toEqual([0]); // no new trigger — node is visited
  });

  it('retries a trigger when the listener explicitly rejects it', () => {
    const sys = new NodeMapSystem();
    sys.setMap(makeFixtureMap());
    const triggered: number[] = [];
    let accepted = false;
    sys.setTriggerListener((idx) => {
      triggered.push(idx);
      return accepted;
    });
    sys.tick({ x: 10, y: 0 });
    sys.tick({ x: 10, y: 0 });
    accepted = true;
    sys.tick({ x: 10, y: 0 });
    sys.tick({ x: 10, y: 0 });
    expect(triggered).toEqual([0, 0, 0]);
  });

  it('no-ops with no map or no listener', () => {
    const sys = new NodeMapSystem();
    expect(() => sys.tick({ x: 0, y: 0 })).not.toThrow();
    sys.setMap(makeFixtureMap());
    expect(() => sys.tick({ x: 0, y: 0 })).not.toThrow();
  });

  it('markVisited ignores out-of-range indices', () => {
    const sys = new NodeMapSystem();
    sys.setMap(makeFixtureMap());
    expect(() => sys.markVisited(-1)).not.toThrow();
    expect(() => sys.markVisited(99)).not.toThrow();
    expect(sys.getMap()?.visited).toEqual([false, false, false]);
  });

  it('reset clears map + listener + radius', () => {
    const sys = new NodeMapSystem();
    sys.setMap(makeFixtureMap());
    sys.setTriggerListener(() => {});
    sys.setTriggerRadius(500);
    sys.reset();
    expect(sys.getMap()).toBeNull();
    const fired: number[] = [];
    sys.setMap(makeFixtureMap());
    sys.setTriggerListener((i) => { fired.push(i); });
    sys.tick({ x: 10, y: 0 });
    // listener reassigned after reset — should still fire
    expect(fired).toEqual([0]);
  });
});
