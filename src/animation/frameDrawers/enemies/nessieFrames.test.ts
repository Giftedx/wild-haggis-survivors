import { describe, expect, it } from 'vitest';
import { nessieDrawer } from './nessieFrames';

describe('nessieFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(nessieDrawer.enemyKey).toBe('nessie');
    expect(nessieDrawer.canvasSize).toBe(64);
  });

  it('authors all four standard states', () => {
    expect(nessieDrawer.authoredStates.has('idle')).toBe(true);
    expect(nessieDrawer.authoredStates.has('walking')).toBe(true);
    expect(nessieDrawer.authoredStates.has('hurt')).toBe(true);
    expect(nessieDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of nessieDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        expect(nessieDrawer.getFrame(state, f), `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('hurt frame applies bodyX recoil', () => {
    expect((nessieDrawer.getFrame('hurt', 0).bodyX ?? 0)).not.toBe(0);
  });

  it('dying frames sink the neck (increasing breathY)', () => {
    const dy0 = nessieDrawer.getFrame('dying', 0);
    const dy2 = nessieDrawer.getFrame('dying', 2);
    expect((dy2.breathY ?? 0)).toBeGreaterThan((dy0.breathY ?? 0));
  });
});
