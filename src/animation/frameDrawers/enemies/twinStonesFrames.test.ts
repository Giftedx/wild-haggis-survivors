import { describe, expect, it } from 'vitest';
import { twinStonesDrawer } from './twinStonesFrames';

describe('twinStonesFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(twinStonesDrawer.enemyKey).toBe('twin_stones');
    expect(twinStonesDrawer.canvasSize).toBe(56);
  });

  it('authors all four standard states', () => {
    expect(twinStonesDrawer.authoredStates.has('idle')).toBe(true);
    expect(twinStonesDrawer.authoredStates.has('walking')).toBe(true);
    expect(twinStonesDrawer.authoredStates.has('hurt')).toBe(true);
    expect(twinStonesDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of twinStonesDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        expect(twinStonesDrawer.getFrame(state, f), `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('hurt frame applies bodyX recoil', () => {
    expect((twinStonesDrawer.getFrame('hurt', 0).bodyX ?? 0)).not.toBe(0);
  });
});
