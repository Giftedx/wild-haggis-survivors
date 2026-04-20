import { describe, it, expect } from 'vitest';
import { seelieDrawer } from './seelieFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('seelieFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(seelieDrawer.enemyKey).toBe('seelie_piper');
    expect(seelieDrawer.canvasSize).toBe(40);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(seelieDrawer.authoredStates.has('idle')).toBe(true);
    expect(seelieDrawer.authoredStates.has('walking')).toBe(true);
    expect(seelieDrawer.authoredStates.has('hurt')).toBe(true);
    expect(seelieDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of seelieDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = seelieDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = seelieDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(seelieDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = seelieDrawer.getFrame('idle', 0);
    expect(seelieDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
