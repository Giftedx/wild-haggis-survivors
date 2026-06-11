import { describe, expect, it } from 'vitest';
import { buildNodeMapState } from '../systems/NodeMapSystem';
import type { NodeDef, NodeType } from '../data/nodeTypes';
import {
  NODE_ICON_FILL,
  NODE_ICON_VISITED_ALPHA,
  computeNodeMapBarLayout,
  nodeMapProgressPosition,
} from './nodeMapUiLayout';

function make(type: NodeType, key = type): NodeDef {
  return { key, type, nameKey: 'n', weightInBank: 1, actAffinity: [1], data: {} };
}

describe('NODE_ICON_FILL', () => {
  it('provides a colour for every node type', () => {
    const types: NodeType[] = ['encounter', 'shrine', 'wee_trader', 'hidden', 'bargain', 'rest', 'elite'];
    for (const t of types) {
      expect(NODE_ICON_FILL[t]).toBeGreaterThanOrEqual(0);
      expect(NODE_ICON_FILL[t]).toBeLessThanOrEqual(0xffffff);
    }
  });
});

describe('computeNodeMapBarLayout', () => {
  const nodes = [make('encounter'), make('shrine'), make('rest'), make('elite')];
  const positions = [
    { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }, { x: 300, y: 0 },
  ];
  const state = buildNodeMapState(1, nodes, positions);

  it('anchors the bar top-right to the anchor point (bgX + bgW = anchorX)', () => {
    const layout = computeNodeMapBarLayout(state, 0, { anchorX: 1280, anchorY: 20, uiScale: 1 });
    expect(layout.bgX + layout.bgW).toBe(1280);
    expect(layout.bgY).toBe(20);
  });

  it('produces one icon per node', () => {
    const layout = computeNodeMapBarLayout(state, 0, { anchorX: 1280, anchorY: 20, uiScale: 1 });
    expect(layout.icons).toHaveLength(4);
  });

  it('icon types match the node order', () => {
    const layout = computeNodeMapBarLayout(state, 0, { anchorX: 1280, anchorY: 20, uiScale: 1 });
    expect(layout.icons.map((i) => i.type)).toEqual(['encounter', 'shrine', 'rest', 'elite']);
  });

  it('flags the current icon exactly once', () => {
    const layout = computeNodeMapBarLayout(state, 2, { anchorX: 1280, anchorY: 20, uiScale: 1 });
    const currents = layout.icons.filter((i) => i.current);
    expect(currents).toHaveLength(1);
    expect(currents[0].index).toBe(2);
  });

  it('reflects the map\'s visited flags', () => {
    const s = buildNodeMapState(1, nodes, positions);
    s.visited[0] = true;
    s.visited[1] = true;
    const layout = computeNodeMapBarLayout(s, 2, { anchorX: 1280, anchorY: 20, uiScale: 1 });
    expect(layout.icons.map((i) => i.visited)).toEqual([true, true, false, false]);
  });

  it('scales linearly with uiScale (double scale ≈ double size)', () => {
    const at1 = computeNodeMapBarLayout(state, 0, { anchorX: 1280, anchorY: 20, uiScale: 1 });
    const at2 = computeNodeMapBarLayout(state, 0, { anchorX: 1280, anchorY: 20, uiScale: 2 });
    expect(at2.bgW).toBeCloseTo(at1.bgW * 2);
    expect(at2.bgH).toBeCloseTo(at1.bgH * 2);
    expect(at2.icons[0].size).toBeCloseTo(at1.icons[0].size * 2);
  });

  it('clamps uiScale below 0.5 to stay legible', () => {
    const tiny = computeNodeMapBarLayout(state, 0, { anchorX: 1280, anchorY: 20, uiScale: 0.1 });
    const half = computeNodeMapBarLayout(state, 0, { anchorX: 1280, anchorY: 20, uiScale: 0.5 });
    expect(tiny.bgW).toBeCloseTo(half.bgW);
  });

  it('compact mode (expanded:false) returns empty icons', () => {
    const compact = computeNodeMapBarLayout(state, 0, {
      anchorX: 1280, anchorY: 20, uiScale: 1, expanded: false,
    });
    expect(compact.icons).toHaveLength(0);
  });
});

describe('nodeMapProgressPosition', () => {
  it('1-based cursor on a non-empty path', () => {
    expect(nodeMapProgressPosition(0, 4)).toEqual({ current: 1, total: 4 });
    expect(nodeMapProgressPosition(2, 4)).toEqual({ current: 3, total: 4 });
    expect(nodeMapProgressPosition(4, 5)).toEqual({ current: 5, total: 5 });
  });

  it('handles an empty path cleanly', () => {
    expect(nodeMapProgressPosition(0, 0)).toEqual({ current: 0, total: 0 });
  });

  it('never reports past the total', () => {
    expect(nodeMapProgressPosition(99, 4)).toEqual({ current: 4, total: 4 });
  });
});

describe('layout constants', () => {
  it('visited alpha is between 0 and 1', () => {
    expect(NODE_ICON_VISITED_ALPHA).toBeGreaterThan(0);
    expect(NODE_ICON_VISITED_ALPHA).toBeLessThan(1);
  });
});
