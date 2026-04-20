import { describe, it, expect } from 'vitest';
import { haggisHunterDrawer } from './haggisHunterFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('haggisHunterFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(haggisHunterDrawer.enemyKey).toBe('haggis_hunter');
    expect(haggisHunterDrawer.canvasSize).toBe(48);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    for (const s of ['idle', 'walking', 'hurt', 'dying'] as const) {
      expect(haggisHunterDrawer.authoredStates.has(s)).toBe(true);
    }
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of haggisHunterDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = haggisHunterDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const idle0 = haggisHunterDrawer.getFrame('idle', 0);
    expect(haggisHunterDrawer.getFrame('attacking' as AnimationState, 0)).toEqual(idle0);
    expect(haggisHunterDrawer.getFrame('celebrating' as AnimationState, 0)).toEqual(idle0);
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = haggisHunterDrawer.getFrame('idle', 0);
    expect(haggisHunterDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
