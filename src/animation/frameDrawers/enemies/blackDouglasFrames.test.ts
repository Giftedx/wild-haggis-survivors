import { describe, expect, it } from 'vitest';
import { blackDouglasDrawer } from './blackDouglasFrames';

describe('blackDouglasFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(blackDouglasDrawer.enemyKey).toBe('black_douglas');
    expect(blackDouglasDrawer.canvasSize).toBe(64);
  });

  it('authors all four standard states', () => {
    expect(blackDouglasDrawer.authoredStates.has('idle')).toBe(true);
    expect(blackDouglasDrawer.authoredStates.has('walking')).toBe(true);
    expect(blackDouglasDrawer.authoredStates.has('hurt')).toBe(true);
    expect(blackDouglasDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of blackDouglasDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        expect(blackDouglasDrawer.getFrame(state, f), `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('hurt frame applies bodyX recoil', () => {
    expect((blackDouglasDrawer.getFrame('hurt', 0).bodyX ?? 0)).not.toBe(0);
  });
});
