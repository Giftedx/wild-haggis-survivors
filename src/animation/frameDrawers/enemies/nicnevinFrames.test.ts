import { describe, expect, it } from 'vitest';
import { nicnevinDrawer } from './nicnevinFrames';

describe('nicnevinFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(nicnevinDrawer.enemyKey).toBe('nicnevin');
    expect(nicnevinDrawer.canvasSize).toBe(80);
  });

  it('authors all four standard states', () => {
    expect(nicnevinDrawer.authoredStates.has('idle')).toBe(true);
    expect(nicnevinDrawer.authoredStates.has('walking')).toBe(true);
    expect(nicnevinDrawer.authoredStates.has('hurt')).toBe(true);
    expect(nicnevinDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of nicnevinDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        const frame = nicnevinDrawer.getFrame(state, f);
        expect(frame, `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('hurt frame applies bodyX recoil', () => {
    const hurt0 = nicnevinDrawer.getFrame('hurt', 0);
    expect((hurt0.bodyX ?? 0)).not.toBe(0);
  });

  it('dying frames increase breathY (gown collapsing)', () => {
    const dy0 = nicnevinDrawer.getFrame('dying', 0);
    const dy2 = nicnevinDrawer.getFrame('dying', 2);
    expect((dy2.breathY ?? 0)).toBeGreaterThan((dy0.breathY ?? 0));
  });
});
