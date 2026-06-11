import { describe, expect, it } from 'vitest';
import { ninthLegionDrawer } from './ninthLegionFrames';

describe('ninthLegionFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(ninthLegionDrawer.enemyKey).toBe('ninth_legion');
    expect(ninthLegionDrawer.canvasSize).toBe(80);
  });

  it('authors all four standard states', () => {
    expect(ninthLegionDrawer.authoredStates.has('idle')).toBe(true);
    expect(ninthLegionDrawer.authoredStates.has('walking')).toBe(true);
    expect(ninthLegionDrawer.authoredStates.has('hurt')).toBe(true);
    expect(ninthLegionDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of ninthLegionDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        expect(ninthLegionDrawer.getFrame(state, f), `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('hurt frame applies bodyX recoil', () => {
    expect((ninthLegionDrawer.getFrame('hurt', 0).bodyX ?? 0)).not.toBe(0);
  });
});
