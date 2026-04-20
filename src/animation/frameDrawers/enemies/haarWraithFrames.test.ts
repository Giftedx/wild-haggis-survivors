import { describe, it, expect } from 'vitest';
import { haarWraithDrawer } from './haarWraithFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('haarWraithFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(haarWraithDrawer.enemyKey).toBe('haar_wraith');
    expect(haarWraithDrawer.canvasSize).toBe(44);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(haarWraithDrawer.authoredStates.has('idle')).toBe(true);
    expect(haarWraithDrawer.authoredStates.has('walking')).toBe(true);
    expect(haarWraithDrawer.authoredStates.has('hurt')).toBe(true);
    expect(haarWraithDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of haarWraithDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = haarWraithDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = haarWraithDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(haarWraithDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = haarWraithDrawer.getFrame('idle', 0);
    expect(haarWraithDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
