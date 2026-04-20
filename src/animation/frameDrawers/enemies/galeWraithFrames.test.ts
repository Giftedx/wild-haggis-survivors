import { describe, it, expect } from 'vitest';
import { galeWraithDrawer } from './galeWraithFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('galeWraithFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(galeWraithDrawer.enemyKey).toBe('gale_wraith');
    expect(galeWraithDrawer.canvasSize).toBe(44);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(galeWraithDrawer.authoredStates.has('idle')).toBe(true);
    expect(galeWraithDrawer.authoredStates.has('walking')).toBe(true);
    expect(galeWraithDrawer.authoredStates.has('hurt')).toBe(true);
    expect(galeWraithDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of galeWraithDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = galeWraithDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = galeWraithDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(galeWraithDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = galeWraithDrawer.getFrame('idle', 0);
    expect(galeWraithDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
