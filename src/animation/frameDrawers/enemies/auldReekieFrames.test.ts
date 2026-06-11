import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { auldReekieDrawer } from './auldReekieFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('auldReekieFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(auldReekieDrawer.enemyKey).toBe('auld_reekie');
    expect(auldReekieDrawer.canvasSize).toBe(60);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(auldReekieDrawer.authoredStates.has('idle')).toBe(true);
    expect(auldReekieDrawer.authoredStates.has('walking')).toBe(true);
    expect(auldReekieDrawer.authoredStates.has('hurt')).toBe(true);
    expect(auldReekieDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of auldReekieDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = auldReekieDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = auldReekieDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(auldReekieDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = auldReekieDrawer.getFrame('idle', 0);
    expect(auldReekieDrawer.getFrame('idle', 99)).toEqual(idle0);
  });

  it('dying frames sink progressively (ghost descends through floor)', () => {
    const d0 = auldReekieDrawer.getFrame('dying', 0);
    const d1 = auldReekieDrawer.getFrame('dying', 1);
    const d2 = auldReekieDrawer.getFrame('dying', 2);
    expect((d1.breathY ?? 0)).toBeGreaterThan((d0.breathY ?? 0));
    expect((d2.breathY ?? 0)).toBeGreaterThan((d1.breathY ?? 0));
  });
});
