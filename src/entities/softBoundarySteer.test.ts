import { describe, it, expect } from 'vitest';
import {
  softBoundarySteer,
  EDGE_MARGIN,
  PUSH_THRESHOLD,
  PUSH_STRENGTH,
  MIN_EDGE_MUL,
} from './softBoundarySteer';

const W = 3000;
const H = 3000;

describe('softBoundarySteer — edgeMul', () => {
  it('deep in the middle returns full speed and no push', () => {
    const s = softBoundarySteer(W / 2, H / 2, W, H);
    expect(s.edgeMul).toBe(1);
    expect(s.pushX).toBe(0);
    expect(s.pushY).toBe(0);
  });

  it('exactly at EDGE_MARGIN from a side still returns full speed', () => {
    const s = softBoundarySteer(EDGE_MARGIN, H / 2, W, H);
    expect(s.edgeMul).toBe(1);
  });

  it('halfway into the edge margin slows to ~0.5', () => {
    const s = softBoundarySteer(EDGE_MARGIN / 2, H / 2, W, H);
    expect(s.edgeMul).toBeCloseTo(0.5, 5);
  });

  it('at the exact edge clamps at MIN_EDGE_MUL, never zero', () => {
    const s = softBoundarySteer(0, H / 2, W, H);
    expect(s.edgeMul).toBe(MIN_EDGE_MUL);
  });

  it('far-side edge is symmetric with near-side', () => {
    const left = softBoundarySteer(20, H / 2, W, H);
    const right = softBoundarySteer(W - 20, H / 2, W, H);
    expect(left.edgeMul).toBeCloseTo(right.edgeMul, 5);
  });

  it('two edges compound — corner slowdown takes the minimum of the two', () => {
    const corner = softBoundarySteer(EDGE_MARGIN / 4, EDGE_MARGIN / 4, W, H);
    const singleEdge = softBoundarySteer(EDGE_MARGIN / 4, H / 2, W, H);
    expect(corner.edgeMul).toBeCloseTo(singleEdge.edgeMul, 5);
    // corner shouldn't be additively worse — min() is already the tighter limit.
  });
});

describe('softBoundarySteer — push force', () => {
  it('outside the PUSH_THRESHOLD band, no push applied', () => {
    const s = softBoundarySteer(PUSH_THRESHOLD + 1, H / 2, W, H);
    expect(s.pushX).toBe(0);
    expect(s.pushY).toBe(0);
  });

  it('just past the left push zone gets a positive X push (toward centre)', () => {
    const s = softBoundarySteer(PUSH_THRESHOLD - 1, H / 2, W, H);
    expect(s.pushX).toBe(PUSH_STRENGTH);
  });

  it('just past the right push zone gets a negative X push (toward centre)', () => {
    const s = softBoundarySteer(W - (PUSH_THRESHOLD - 1), H / 2, W, H);
    expect(s.pushX).toBe(-PUSH_STRENGTH);
  });

  it('top + bottom pushes are symmetric in magnitude', () => {
    const top = softBoundarySteer(W / 2, 5, W, H);
    const bottom = softBoundarySteer(W / 2, H - 5, W, H);
    expect(top.pushY).toBe(PUSH_STRENGTH);
    expect(bottom.pushY).toBe(-PUSH_STRENGTH);
  });

  it('corner position stacks both axes of push', () => {
    const s = softBoundarySteer(5, 5, W, H);
    expect(s.pushX).toBe(PUSH_STRENGTH);
    expect(s.pushY).toBe(PUSH_STRENGTH);
  });
});

describe('softBoundarySteer — invariants', () => {
  it('edgeMul stays in [MIN_EDGE_MUL, 1] for every sampled position', () => {
    for (let tx = 0; tx <= 1; tx += 0.05) {
      for (let ty = 0; ty <= 1; ty += 0.05) {
        const s = softBoundarySteer(tx * W, ty * H, W, H);
        expect(s.edgeMul).toBeGreaterThanOrEqual(MIN_EDGE_MUL);
        expect(s.edgeMul).toBeLessThanOrEqual(1);
      }
    }
  });
});
