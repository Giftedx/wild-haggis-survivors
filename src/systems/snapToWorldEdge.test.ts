import { describe, it, expect } from 'vitest';
import { snapToNearestWorldEdge } from './snapToWorldEdge';

const W = 3000;
const H = 3000;

describe('snapToNearestWorldEdge', () => {
  it('point near the left edge snaps to x=0', () => {
    expect(snapToNearestWorldEdge(100, 500, W, H)).toEqual({ x: 0, y: 500 });
  });

  it('point near the right edge snaps to x=worldWidth', () => {
    expect(snapToNearestWorldEdge(W - 100, 500, W, H)).toEqual({ x: W, y: 500 });
  });

  it('point near the top edge snaps to y=0', () => {
    expect(snapToNearestWorldEdge(500, 100, W, H)).toEqual({ x: 500, y: 0 });
  });

  it('point near the bottom edge snaps to y=worldHeight', () => {
    expect(snapToNearestWorldEdge(500, H - 100, W, H)).toEqual({ x: 500, y: H });
  });

  it('equidistant to multiple edges picks left (first branch in the tie-break ladder)', () => {
    // Exactly at centre → all four distances equal. The ladder prefers left.
    expect(snapToNearestWorldEdge(W / 2, H / 2, W, H).x).toBe(0);
  });

  it('corner-ish point picks the closer axis', () => {
    // 50 from left, 10 from top → top wins.
    const r = snapToNearestWorldEdge(50, 10, W, H);
    expect(r.y).toBe(0);
    expect(r.x).toBe(50);
  });

  it('always returns a point on the world rect perimeter', () => {
    const samples = [
      snapToNearestWorldEdge(100, 200, W, H),
      snapToNearestWorldEdge(W - 10, 500, W, H),
      snapToNearestWorldEdge(500, 50, W, H),
      snapToNearestWorldEdge(300, H - 5, W, H),
    ];
    for (const p of samples) {
      expect(p.x === 0 || p.x === W || p.y === 0 || p.y === H).toBe(true);
    }
  });
});
