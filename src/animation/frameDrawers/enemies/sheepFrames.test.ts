import { describe, it, expect } from 'vitest';
import { sheepDrawer } from './sheepFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('sheepFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(sheepDrawer.enemyKey).toBe('sheep');
    expect(sheepDrawer.canvasSize).toBe(36);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(sheepDrawer.authoredStates.has('idle')).toBe(true);
    expect(sheepDrawer.authoredStates.has('walking')).toBe(true);
    expect(sheepDrawer.authoredStates.has('hurt')).toBe(true);
    expect(sheepDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of sheepDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = sheepDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = sheepDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(sheepDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = sheepDrawer.getFrame('idle', 0);
    expect(sheepDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
