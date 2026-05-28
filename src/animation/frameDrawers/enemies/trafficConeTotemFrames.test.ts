import { describe, it, expect } from 'vitest';
import { expectValidEnemyBodyFrame } from './enemyFrameTestHelpers';
import { trafficConeTotemDrawer } from './trafficConeTotemFrames';
import { getFrameCountForState } from '../../frameClock';

describe('trafficConeTotemFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(trafficConeTotemDrawer.enemyKey).toBe('traffic_cone_totem');
    expect(trafficConeTotemDrawer.canvasSize).toBe(44);
  });

  it('authors idle/hurt/dying but not walking (speed-0 rooted enemy)', () => {
    expect(trafficConeTotemDrawer.authoredStates.has('idle')).toBe(true);
    expect(trafficConeTotemDrawer.authoredStates.has('hurt')).toBe(true);
    expect(trafficConeTotemDrawer.authoredStates.has('dying')).toBe(true);
    expect(trafficConeTotemDrawer.authoredStates.has('walking')).toBe(false);
  });

  it('returns valid frames for every authored state', () => {
    for (const state of ['idle', 'hurt', 'dying'] as const) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = trafficConeTotemDrawer.getFrame(state, f);
        expectValidEnemyBodyFrame(frame, `${state}:${f}`);
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const idle0 = trafficConeTotemDrawer.getFrame('idle', 0);
    for (const state of ['walking', 'attacking', 'celebrating'] as const) {
      expect(trafficConeTotemDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = trafficConeTotemDrawer.getFrame('idle', 0);
    expect(trafficConeTotemDrawer.getFrame('idle', 99)).toEqual(idle0);
  });

  it('dying topples progressively — breathY sinks and bodyX leans further each frame', () => {
    const d0 = trafficConeTotemDrawer.getFrame('dying', 0);
    const d1 = trafficConeTotemDrawer.getFrame('dying', 1);
    const d2 = trafficConeTotemDrawer.getFrame('dying', 2);
    expect(d1.breathY!).toBeGreaterThan(d0.breathY!);
    expect(d2.breathY!).toBeGreaterThan(d1.breathY!);
    expect(d2.bodyX!).toBeLessThan(d0.bodyX!);
  });

  it('hurt flinches back (negative bodyX)', () => {
    expect(trafficConeTotemDrawer.getFrame('hurt', 0).bodyX!).toBeLessThan(0);
  });
});
