import { describe, expect, it } from 'vitest';
import { eachUisgeDrawer } from './eachUisgeFrames';

describe('eachUisgeFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(eachUisgeDrawer.enemyKey).toBe('each_uisge');
    expect(eachUisgeDrawer.canvasSize).toBe(80);
  });

  it('authors all four standard states', () => {
    expect(eachUisgeDrawer.authoredStates.has('idle')).toBe(true);
    expect(eachUisgeDrawer.authoredStates.has('walking')).toBe(true);
    expect(eachUisgeDrawer.authoredStates.has('hurt')).toBe(true);
    expect(eachUisgeDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of eachUisgeDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        expect(eachUisgeDrawer.getFrame(state, f), `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('walking uses leg offsets (equine gait)', () => {
    const walk0 = eachUisgeDrawer.getFrame('walking', 0);
    expect((walk0.leftLegY ?? 0)).not.toBe(0);
    expect((walk0.rightLegY ?? 0)).not.toBe(0);
  });

  it('hurt frame applies bodyX recoil', () => {
    expect((eachUisgeDrawer.getFrame('hurt', 0).bodyX ?? 0)).not.toBe(0);
  });
});
