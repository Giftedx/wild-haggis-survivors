import { describe, it, expect } from 'vitest';
import { tourBusDrawer } from './tourBusFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('tourBusFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(tourBusDrawer.enemyKey).toBe('tour_bus');
    expect(tourBusDrawer.canvasSize).toBe(96);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(tourBusDrawer.authoredStates.has('idle')).toBe(true);
    expect(tourBusDrawer.authoredStates.has('walking')).toBe(true);
    expect(tourBusDrawer.authoredStates.has('hurt')).toBe(true);
    expect(tourBusDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of tourBusDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = tourBusDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = tourBusDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(tourBusDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = tourBusDrawer.getFrame('idle', 0);
    expect(tourBusDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
