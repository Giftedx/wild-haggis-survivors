import { describe, it, expect } from 'vitest';
import { kelpieDrawer } from './kelpieFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('kelpieFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(kelpieDrawer.enemyKey).toBe('kelpie');
    expect(kelpieDrawer.canvasSize).toBe(48);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(kelpieDrawer.authoredStates.has('idle')).toBe(true);
    expect(kelpieDrawer.authoredStates.has('walking')).toBe(true);
    expect(kelpieDrawer.authoredStates.has('hurt')).toBe(true);
    expect(kelpieDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of kelpieDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = kelpieDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = kelpieDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(kelpieDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = kelpieDrawer.getFrame('idle', 0);
    expect(kelpieDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
