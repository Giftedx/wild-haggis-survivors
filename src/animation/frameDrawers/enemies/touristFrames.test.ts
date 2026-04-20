import { describe, it, expect } from 'vitest';
import { touristDrawer } from './touristFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('touristFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(touristDrawer.enemyKey).toBe('tourist');
    expect(touristDrawer.canvasSize).toBe(48);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(touristDrawer.authoredStates.has('idle')).toBe(true);
    expect(touristDrawer.authoredStates.has('walking')).toBe(true);
    expect(touristDrawer.authoredStates.has('hurt')).toBe(true);
    expect(touristDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of touristDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = touristDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = touristDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(touristDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = touristDrawer.getFrame('idle', 0);
    expect(touristDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
