import { describe, expect, it } from 'vitest';
import { cailleachBossDrawer } from './cailleachBossFrames';

describe('cailleachBossFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(cailleachBossDrawer.enemyKey).toBe('cailleach_boss');
    expect(cailleachBossDrawer.canvasSize).toBe(80);
  });

  it('authors all four standard states', () => {
    expect(cailleachBossDrawer.authoredStates.has('idle')).toBe(true);
    expect(cailleachBossDrawer.authoredStates.has('walking')).toBe(true);
    expect(cailleachBossDrawer.authoredStates.has('hurt')).toBe(true);
    expect(cailleachBossDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of cailleachBossDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        expect(cailleachBossDrawer.getFrame(state, f), `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('hurt frame applies bodyX recoil', () => {
    expect((cailleachBossDrawer.getFrame('hurt', 0).bodyX ?? 0)).not.toBe(0);
  });

  it('dying frames increase breathY', () => {
    const dy0 = cailleachBossDrawer.getFrame('dying', 0);
    const dy2 = cailleachBossDrawer.getFrame('dying', 2);
    expect((dy2.breathY ?? 0)).toBeGreaterThan((dy0.breathY ?? 0));
  });
});
