import { describe, expect, it } from 'vitest';
import { stormCailleachDrawer } from './stormCailleachFrames';

describe('stormCailleachFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(stormCailleachDrawer.enemyKey).toBe('storm_cailleach');
    expect(stormCailleachDrawer.canvasSize).toBe(72);
  });

  it('authors all four standard states', () => {
    expect(stormCailleachDrawer.authoredStates.has('idle')).toBe(true);
    expect(stormCailleachDrawer.authoredStates.has('walking')).toBe(true);
    expect(stormCailleachDrawer.authoredStates.has('hurt')).toBe(true);
    expect(stormCailleachDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of stormCailleachDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        expect(stormCailleachDrawer.getFrame(state, f), `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('idle uses ≥2 px breathY (agitated storm energy)', () => {
    const idle0 = stormCailleachDrawer.getFrame('idle', 0);
    expect(Math.abs(idle0.breathY ?? 0)).toBeGreaterThanOrEqual(2);
  });

  it('hurt frame applies bodyX recoil', () => {
    expect((stormCailleachDrawer.getFrame('hurt', 0).bodyX ?? 0)).not.toBe(0);
  });
});
