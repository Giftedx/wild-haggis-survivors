import { describe, expect, it, vi } from 'vitest';
import { getActiveWaveTimelineEntry } from '../core/BalanceConfig';

vi.mock('./AudioSystem', () => ({
  audio: { playBossArrival: vi.fn() },
}));

vi.mock('phaser', () => {
  class EE {
    removeAllListeners() {}
  }
  class Group {
    private _children: any[] = [];
    get children() { return { entries: this._children }; }
    add(obj: any) { this._children.push(obj); return obj; }
    getChildren() { return this._children; }
    getFirstDead(_?: boolean) { return this._children.find(c => !c.active) ?? null; }
    countActive(value?: boolean) {
      const v = value === undefined ? true : value;
      return this._children.filter(c => c.active === v).length;
    }
  }
  const __m = {
      Events: { EventEmitter: EE },
      Math: {},
      GameObjects: { Group },
    };
  return { default: __m, ...__m };
});

vi.mock('../entities/Enemy', () => {
  class Enemy {
    active = false;
    constructor(_s?: any, _x?: any, _y?: any) {}
    isBoss() { return false; }
    static acquireFromPool() { return null; }
  }
  return { Enemy };
});

import { SpawnSystem } from './SpawnSystem';

function makeScene() {
  class SimpleGroup {
    private _children: any[] = [];
    get children() { return { entries: this._children }; }
    add(obj: any) { this._children.push(obj); return obj; }
    getChildren() { return this._children; }
    getFirstDead(_?: boolean) { return this._children.find(c => !c.active) ?? null; }
    countActive(value?: boolean) {
      const v = value === undefined ? true : value;
      return this._children.filter(c => c.active === v).length;
    }
  }
  return {
    add: { group: () => new SimpleGroup() },
    cameras: { main: { width: 800, height: 600, zoom: 1, shake: () => {} } },
    scale: { width: 800, height: 600 },
    tweens: { add: () => {} },
    getTimeManager: () => ({ isGameplayPaused: () => false }),
    getUpdateTickers: () => ({ addOnce: () => ({ cancel() {} }) }),
    getPlayer: () => ({ x: 0, y: 0 }),
  };
}

describe('SpawnSystem time travel (dev)', () => {
  it('jumping from t=0 to t=900 matches late-game wave director entry', () => {
    const ss = new SpawnSystem(makeScene() as any);
    const before = getActiveWaveTimelineEntry(0);
    expect(ss.getSpawnIntervalSec()).toBe(before.intervalSec);

    const expected = getActiveWaveTimelineEntry(900);
    ss.timeTravelToSeconds(900);

    expect(ss.getGameTimeSec()).toBe(900);
    expect(ss.getSpawnIntervalSec()).toBe(expected.intervalSec);
    expect(ss.getBurstSize()).toBe(expected.burstSize);
    expect((ss as any).directorEnemyKeys).toEqual([...expected.enemyKeys]);
  });
});
