import { describe, expect, it } from 'vitest';
import { beithirDrawer } from './beithirFrames';

describe('beithirFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(beithirDrawer.enemyKey).toBe('beithir');
    expect(beithirDrawer.canvasSize).toBe(48);
  });

  it('authors all four standard states', () => {
    expect(beithirDrawer.authoredStates.has('idle')).toBe(true);
    expect(beithirDrawer.authoredStates.has('walking')).toBe(true);
    expect(beithirDrawer.authoredStates.has('hurt')).toBe(true);
    expect(beithirDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of beithirDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        const frame = beithirDrawer.getFrame(state, f);
        expect(frame, `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('walking uses ±1 px bodyX slither (sinuous serpent motion)', () => {
    const walk0 = beithirDrawer.getFrame('walking', 0);
    const walk2 = beithirDrawer.getFrame('walking', 2);
    expect(Math.abs(walk0.bodyX ?? 0)).toBe(1);
    expect(Math.abs(walk2.bodyX ?? 0)).toBe(1);
  });

  it('hurt frame applies bodyX recoil', () => {
    const hurt0 = beithirDrawer.getFrame('hurt', 0);
    expect((hurt0.bodyX ?? 0)).not.toBe(0);
  });

  it('dying frames increase breathY (coil uncurling flat)', () => {
    const dy0 = beithirDrawer.getFrame('dying', 0);
    const dy2 = beithirDrawer.getFrame('dying', 2);
    expect((dy2.breathY ?? 0)).toBeGreaterThan((dy0.breathY ?? 0));
  });
});
