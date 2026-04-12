import { describe, expect, it, vi } from 'vitest';
import {
  WAVE_TIMELINE,
  getActiveWaveTimelineEntry,
} from '../core/BalanceConfig';

vi.mock('./AudioSystem', () => ({
  audio: { playBossWarning: vi.fn() },
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
    getLength() { return this._children.length; }
    countActive(value?: boolean) {
      const v = value === undefined ? true : value;
      return this._children.filter(c => c.active === v).length;
    }
    clear() { this._children = []; }
  }
  return {
    default: {
      Events: { EventEmitter: EE },
      Math: {
        Between: (a: number, b: number) => Math.floor((a + b) / 2),
        FloatBetween: (a: number, b: number) => (a + b) / 2,
        Clamp: (v: number, min: number, max: number) => Math.min(max, Math.max(min, v)),
      },
      GameObjects: { Group },
    },
  };
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

describe('Wave timeline director', () => {
  it('WAVE_TIMELINE is sorted by timeSec and ends with full roster milestone', () => {
    for (let i = 1; i < WAVE_TIMELINE.length; i++) {
      expect(WAVE_TIMELINE[i].timeSec).toBeGreaterThanOrEqual(WAVE_TIMELINE[i - 1].timeSec);
    }
    const last = WAVE_TIMELINE[WAVE_TIMELINE.length - 1];
    expect(last.enemyKeys).toContain('deep_fryer');
    expect(last.burstSize).toBeGreaterThanOrEqual(2);
  });

  it('getActiveWaveTimelineEntry switches interval, burst, and enemy pool at thresholds', () => {
    const a0 = getActiveWaveTimelineEntry(0);
    const aPre = getActiveWaveTimelineEntry(89.99);
    const a90 = getActiveWaveTimelineEntry(90);
    expect(aPre.timeSec).toBe(a0.timeSec);
    expect(a90.timeSec).toBe(90);
    expect(a90.intervalSec).not.toBe(a0.intervalSec);
    expect(a90.burstSize).toBeGreaterThanOrEqual(a0.burstSize);
    expect(a0.enemyKeys).toEqual(['tourist']);
    expect(a90.enemyKeys).toContain('chef');
    expect(a90.enemyKeys).toContain('tourist');
  });

  it('SpawnSystem mirrors director state after sync', () => {
    const ss: any = new SpawnSystem(makeScene() as any);
    const seg = getActiveWaveTimelineEntry(600);
    ss.gameTimeSec = 600;
    ss.syncWaveDirectorFromTimeline();
    expect(ss.spawnInterval).toBe(seg.intervalSec);
    expect(ss.burstSize).toBe(seg.burstSize);
    expect(ss.directorEnemyKeys).toEqual([...seg.enemyKeys]);
  });

  it('director state at late gameTimeSec matches final timeline segment', () => {
    const ss: any = new SpawnSystem(makeScene() as any);
    ss.gameTimeSec = 950;
    ss.syncWaveDirectorFromTimeline();
    const seg = getActiveWaveTimelineEntry(950);
    expect(ss.getSpawnIntervalSec()).toBe(seg.intervalSec);
    expect(ss.getBurstSize()).toBe(seg.burstSize);
    expect(ss.directorEnemyKeys).toEqual([...seg.enemyKeys]);
  });
});
