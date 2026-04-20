import { describe, it, expect } from 'vitest';
import { angryScotsmanDrawer } from './angryScotsmanFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('angryScotsmanFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(angryScotsmanDrawer.enemyKey).toBe('angry_scotsman');
    expect(angryScotsmanDrawer.canvasSize).toBe(52);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(angryScotsmanDrawer.authoredStates.has('idle')).toBe(true);
    expect(angryScotsmanDrawer.authoredStates.has('walking')).toBe(true);
    expect(angryScotsmanDrawer.authoredStates.has('hurt')).toBe(true);
    expect(angryScotsmanDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of angryScotsmanDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = angryScotsmanDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = angryScotsmanDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(angryScotsmanDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = angryScotsmanDrawer.getFrame('idle', 0);
    expect(angryScotsmanDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
