import { describe, expect, it } from 'vitest';
import { cuSithDrawer } from './cuSithFrames';

describe('cuSithFrames', () => {
  it('declares the expected enemyKey + canvas size', () => {
    expect(cuSithDrawer.enemyKey).toBe('cu_sith');
    expect(cuSithDrawer.canvasSize).toBe(44);
  });

  it('authors all four standard states', () => {
    expect(cuSithDrawer.authoredStates.has('idle')).toBe(true);
    expect(cuSithDrawer.authoredStates.has('walking')).toBe(true);
    expect(cuSithDrawer.authoredStates.has('hurt')).toBe(true);
    expect(cuSithDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns a non-null frame for every authored state index', () => {
    for (const state of cuSithDrawer.authoredStates) {
      for (let f = 0; f < 5; f++) {
        const frame = cuSithDrawer.getFrame(state, f);
        expect(frame, `state=${state} f=${f}`).not.toBeNull();
      }
    }
  });

  it('walking stride uses ±2 px leg offsets (bullock-size legend cue)', () => {
    const walk0 = cuSithDrawer.getFrame('walking', 0);
    const walk2 = cuSithDrawer.getFrame('walking', 2);
    expect(Math.abs(walk0.leftLegY ?? 0)).toBe(2);
    expect(Math.abs(walk0.rightLegY ?? 0)).toBe(2);
    expect(Math.abs(walk2.leftLegY ?? 0)).toBe(2);
    expect(Math.abs(walk2.rightLegY ?? 0)).toBe(2);
  });
});
