import { describe, it, expect } from 'vitest';
import { eagleDrawer } from './eagleFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('eagleFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(eagleDrawer.enemyKey).toBe('eagle');
    expect(eagleDrawer.canvasSize).toBe(56);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(eagleDrawer.authoredStates.has('idle')).toBe(true);
    expect(eagleDrawer.authoredStates.has('walking')).toBe(true);
    expect(eagleDrawer.authoredStates.has('hurt')).toBe(true);
    expect(eagleDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of eagleDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = eagleDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const idle0 = eagleDrawer.getFrame('idle', 0);
    expect(eagleDrawer.getFrame('attacking' as AnimationState, 0)).toEqual(idle0);
    expect(eagleDrawer.getFrame('celebrating' as AnimationState, 0)).toEqual(idle0);
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = eagleDrawer.getFrame('idle', 0);
    expect(eagleDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
