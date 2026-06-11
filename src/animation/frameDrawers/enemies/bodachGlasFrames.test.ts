import { describe, expect, it } from 'vitest';
import { bodachGlasDrawer } from './bodachGlasFrames';

describe('bodachGlasFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(bodachGlasDrawer.enemyKey).toBe('bodach_glas');
    expect(bodachGlasDrawer.canvasSize).toBe(44);
  });

  it('authors all four standard states', () => {
    expect(bodachGlasDrawer.authoredStates.has('idle')).toBe(true);
    expect(bodachGlasDrawer.authoredStates.has('walking')).toBe(true);
    expect(bodachGlasDrawer.authoredStates.has('hurt')).toBe(true);
    expect(bodachGlasDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of bodachGlasDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        const frame = bodachGlasDrawer.getFrame(state, f);
        expect(frame, `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('walking stride uses ±1 px leg offsets (slow deliberate gait)', () => {
    const walk0 = bodachGlasDrawer.getFrame('walking', 0);
    const walk2 = bodachGlasDrawer.getFrame('walking', 2);
    expect(Math.abs(walk0.leftLegY ?? 0)).toBe(1);
    expect(Math.abs(walk0.rightLegY ?? 0)).toBe(1);
    expect(Math.abs(walk2.leftLegY ?? 0)).toBe(1);
    expect(Math.abs(walk2.rightLegY ?? 0)).toBe(1);
  });

  it('hurt frame applies bodyX recoil', () => {
    const hurt0 = bodachGlasDrawer.getFrame('hurt', 0);
    expect((hurt0.bodyX ?? 0)).not.toBe(0);
  });
});
