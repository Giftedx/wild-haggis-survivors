import { describe, expect, it } from 'vitest';
import { wickerHaggisDrawer } from './wickerHaggisFrames';

describe('wickerHaggisFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(wickerHaggisDrawer.enemyKey).toBe('wicker_haggis');
    expect(wickerHaggisDrawer.canvasSize).toBe(56);
  });

  it('authors all four standard states', () => {
    expect(wickerHaggisDrawer.authoredStates.has('idle')).toBe(true);
    expect(wickerHaggisDrawer.authoredStates.has('walking')).toBe(true);
    expect(wickerHaggisDrawer.authoredStates.has('hurt')).toBe(true);
    expect(wickerHaggisDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of wickerHaggisDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        expect(wickerHaggisDrawer.getFrame(state, f), `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('hurt frame applies bodyX recoil', () => {
    expect((wickerHaggisDrawer.getFrame('hurt', 0).bodyX ?? 0)).not.toBe(0);
  });
});
