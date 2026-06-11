import { describe, expect, it } from 'vitest';
import { nuckelaveeDrawer } from './nuckelaveeFrames';

describe('nuckelaveeFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(nuckelaveeDrawer.enemyKey).toBe('nuckelavee');
    expect(nuckelaveeDrawer.canvasSize).toBe(96);
  });

  it('authors all four standard states', () => {
    expect(nuckelaveeDrawer.authoredStates.has('idle')).toBe(true);
    expect(nuckelaveeDrawer.authoredStates.has('walking')).toBe(true);
    expect(nuckelaveeDrawer.authoredStates.has('hurt')).toBe(true);
    expect(nuckelaveeDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of nuckelaveeDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        expect(nuckelaveeDrawer.getFrame(state, f), `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('walking uses ≥2 px bodyX swing (heavy loping gait)', () => {
    const walk0 = nuckelaveeDrawer.getFrame('walking', 0);
    expect(Math.abs(walk0.bodyX ?? 0)).toBeGreaterThanOrEqual(2);
  });

  it('hurt frame applies bodyX recoil', () => {
    expect((nuckelaveeDrawer.getFrame('hurt', 0).bodyX ?? 0)).not.toBe(0);
  });
});
