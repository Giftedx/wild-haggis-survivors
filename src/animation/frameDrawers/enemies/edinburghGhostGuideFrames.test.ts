import { describe, it, expect } from 'vitest';
import { edinburghGhostGuideDrawer } from './edinburghGhostGuideFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('edinburghGhostGuideFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(edinburghGhostGuideDrawer.enemyKey).toBe('edinburgh_ghost_guide');
    expect(edinburghGhostGuideDrawer.canvasSize).toBe(44);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(edinburghGhostGuideDrawer.authoredStates.has('idle')).toBe(true);
    expect(edinburghGhostGuideDrawer.authoredStates.has('walking')).toBe(true);
    expect(edinburghGhostGuideDrawer.authoredStates.has('hurt')).toBe(true);
    expect(edinburghGhostGuideDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of edinburghGhostGuideDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = edinburghGhostGuideDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = edinburghGhostGuideDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(edinburghGhostGuideDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = edinburghGhostGuideDrawer.getFrame('idle', 0);
    expect(edinburghGhostGuideDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
