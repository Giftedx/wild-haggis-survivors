import { describe, it, expect } from 'vitest';
import { barghestDrawer } from './barghestFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('barghestFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(barghestDrawer.enemyKey).toBe('barghest');
    expect(barghestDrawer.canvasSize).toBe(44);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(barghestDrawer.authoredStates.has('idle')).toBe(true);
    expect(barghestDrawer.authoredStates.has('walking')).toBe(true);
    expect(barghestDrawer.authoredStates.has('hurt')).toBe(true);
    expect(barghestDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of barghestDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = barghestDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = barghestDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(barghestDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = barghestDrawer.getFrame('idle', 0);
    expect(barghestDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
