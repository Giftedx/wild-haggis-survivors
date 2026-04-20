import { describe, it, expect } from 'vitest';
import { tomeWraithDrawer } from './tomeWraithFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('tomeWraithFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(tomeWraithDrawer.enemyKey).toBe('tome_wraith');
    expect(tomeWraithDrawer.canvasSize).toBe(40);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(tomeWraithDrawer.authoredStates.has('idle')).toBe(true);
    expect(tomeWraithDrawer.authoredStates.has('walking')).toBe(true);
    expect(tomeWraithDrawer.authoredStates.has('hurt')).toBe(true);
    expect(tomeWraithDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of tomeWraithDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = tomeWraithDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = tomeWraithDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(tomeWraithDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = tomeWraithDrawer.getFrame('idle', 0);
    expect(tomeWraithDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
