import { describe, expect, it } from 'vitest';
import { stoorWormDrawer } from './stoorWormFrames';

describe('stoorWormFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(stoorWormDrawer.enemyKey).toBe('stoor_worm');
    expect(stoorWormDrawer.canvasSize).toBe(100);
  });

  it('authors all four standard states', () => {
    expect(stoorWormDrawer.authoredStates.has('idle')).toBe(true);
    expect(stoorWormDrawer.authoredStates.has('walking')).toBe(true);
    expect(stoorWormDrawer.authoredStates.has('hurt')).toBe(true);
    expect(stoorWormDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of stoorWormDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        expect(stoorWormDrawer.getFrame(state, f), `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('idle uses ≥2 px breathY (ocean-scale swell)', () => {
    const idle0 = stoorWormDrawer.getFrame('idle', 0);
    expect(Math.abs(idle0.breathY ?? 0)).toBeGreaterThanOrEqual(2);
  });

  it('hurt applies large bodyX recoil (≥3 px for a sea-serpent)', () => {
    expect(Math.abs(stoorWormDrawer.getFrame('hurt', 0).bodyX ?? 0)).toBeGreaterThanOrEqual(3);
  });
});
