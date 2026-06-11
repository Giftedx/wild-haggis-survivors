import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { midgieSwarmDrawer } from './midgieSwarmFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('midgieSwarmFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(midgieSwarmDrawer.enemyKey).toBe('midgie_swarm');
    expect(midgieSwarmDrawer.canvasSize).toBe(26);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(midgieSwarmDrawer.authoredStates.has('idle')).toBe(true);
    expect(midgieSwarmDrawer.authoredStates.has('walking')).toBe(true);
    expect(midgieSwarmDrawer.authoredStates.has('hurt')).toBe(true);
    expect(midgieSwarmDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of midgieSwarmDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = midgieSwarmDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, state + ':' + f);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = midgieSwarmDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(midgieSwarmDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = midgieSwarmDrawer.getFrame('idle', 0);
    expect(midgieSwarmDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
