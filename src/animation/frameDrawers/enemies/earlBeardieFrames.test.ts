import { describe, expect, it } from 'vitest';
import { earlBeardieDrawer } from './earlBeardieFrames';

describe('earlBeardieFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(earlBeardieDrawer.enemyKey).toBe('earl_beardie');
    expect(earlBeardieDrawer.canvasSize).toBe(64);
  });

  it('authors all four standard states', () => {
    expect(earlBeardieDrawer.authoredStates.has('idle')).toBe(true);
    expect(earlBeardieDrawer.authoredStates.has('walking')).toBe(true);
    expect(earlBeardieDrawer.authoredStates.has('hurt')).toBe(true);
    expect(earlBeardieDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of earlBeardieDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        expect(earlBeardieDrawer.getFrame(state, f), `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('hurt frame applies bodyX recoil', () => {
    expect((earlBeardieDrawer.getFrame('hurt', 0).bodyX ?? 0)).not.toBe(0);
  });
});
