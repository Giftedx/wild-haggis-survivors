import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BALANCE, getActiveWaveTimelineEntry } from '../core/BalanceConfig';
import { BOSSES } from '../data/enemies';

vi.mock('./AudioSystem', () => ({
  audio: { playBossArrival: vi.fn() },
}));

vi.mock('phaser', () => {
  class EE {
    removeAllListeners() {}
  }
  class Group {
    private _children: { active: boolean; isBoss(): boolean }[] = [];
    get children() { return { entries: this._children }; }
    add(obj: { active: boolean; isBoss(): boolean }) { this._children.push(obj); return obj; }
    getChildren() { return this._children; }
    getFirstDead() { return this._children.find(c => !c.active) ?? null; }
    getLength() { return this._children.length; }
    countActive(v = true) { return this._children.filter(c => c.active === v).length; }
    clear() { this._children = []; }
  }
  const __m = {
      Events: { EventEmitter: EE },
      Math: {
        Between: (a: number, b: number) => Math.floor((a + b) / 2),
        FloatBetween: (a: number, b: number) => (a + b) / 2,
        Clamp: (v: number, min: number, max: number) => Math.min(max, Math.max(min, v)),
      },
      GameObjects: { Group },
    };
  return { default: __m, ...__m };
});

vi.mock('../entities/Enemy', () => {
  class Enemy {
    active = false;
    constructor() {}
    isBoss() { return false; }
    static acquireFromPool() { return null; }
  }
  return { Enemy };
});

import { SpawnSystem } from './SpawnSystem';

function makeScene(): any {
  return {
    add: { group: () => ({ children: { entries: [] }, add: vi.fn(), getChildren: () => [], getFirstDead: () => null, countActive: () => 0, clear: vi.fn() }) },
    cameras: { main: { width: 800, height: 600, zoom: 1, shake: vi.fn() } },
    scale: { width: 800, height: 600 },
    tweens: { add: vi.fn() },
    getTimeManager: () => ({ isGameplayPaused: () => false }),
    getUpdateTickers: () => ({ addOnce: () => ({ cancel() {} }) }),
    getPlayer: () => ({ x: 0, y: 0 }),
  };
}

describe('SpawnSystem.applyResumeTime', () => {
  let ss: SpawnSystem;

  beforeEach(() => {
    ss = new SpawnSystem(makeScene());
  });

  it('syncs director to resumed time', () => {
    ss.applyResumeTime(120);
    const seg = getActiveWaveTimelineEntry(120);
    expect(ss.getSpawnIntervalSec()).toBe(seg.intervalSec);
    expect(ss.getBurstSize()).toBe(seg.burstSize);
  });

  it('resets spawn timer to 0', () => {
    (ss as any).spawnTimer = 5;
    ss.applyResumeTime(60);
    expect(ss.getSpawnTimerSec()).toBe(0);
  });

  it('marks past bosses as spawned when no explicit keys given', () => {
    // V2 — exclude manualSpawn bosses (Cailleach Gauntlet) which use a
    // -1 sentinel; they never seed the spawnedBossKeys set on resume
    // because the gauntlet trigger lives outside the time-based path.
    const earlyBosses = BOSSES.filter(b => !b.manualSpawn && b.spawnTimeSec <= 300);
    ss.applyResumeTime(300);
    for (const b of earlyBosses) {
      expect(ss.getSpawnedBossKeys()).toContain(b.key);
    }
  });

  it('uses explicit spawnedBossKeys when provided', () => {
    ss.applyResumeTime(700, ['gordon']);
    const keys = ss.getSpawnedBossKeys();
    expect(keys).toContain('gordon');
    // tour_bus spawns at 600s — without explicit list it would be included,
    // but explicit list should override automatic detection
    expect(keys).not.toContain('tour_bus');
  });

  it('sets run-win finale state when resuming past RUN_WIN_TIME_SEC', () => {
    ss.applyResumeTime(BALANCE.run.RUN_WIN_TIME_SEC + 10);
    expect((ss as any).runWinFinaleStarted).toBe(true);
    expect((ss as any).regularSpawnsDisabled).toBe(true);
  });

  it('does not set finale state when resuming before RUN_WIN_TIME_SEC', () => {
    ss.applyResumeTime(60);
    expect((ss as any).runWinFinaleStarted).toBe(false);
    expect((ss as any).regularSpawnsDisabled).toBe(false);
  });

  it('clamps negative time to 0', () => {
    ss.applyResumeTime(-10);
    expect(ss.getGameTimeSec()).toBe(0);
  });
});

describe('SpawnSystem.getSpawnStallReason', () => {
  it('returns PAUSED when gameplay is paused', () => {
    const scene = makeScene();
    scene.getTimeManager = () => ({ isGameplayPaused: () => true });
    const ss = new SpawnSystem(scene);
    expect(ss.getSpawnStallReason()).toBe('PAUSED');
  });

  it('returns RUN_FINALE when regular spawns disabled', () => {
    const ss = new SpawnSystem(makeScene());
    (ss as any).regularSpawnsDisabled = true;
    expect(ss.getSpawnStallReason()).toBe('RUN_FINALE');
  });

  it('returns INTERVAL_WAIT when spawn timer < interval', () => {
    const ss = new SpawnSystem(makeScene());
    (ss as any).spawnTimer = 0;
    (ss as any).spawnInterval = 1.5;
    expect(ss.getSpawnStallReason()).toBe('INTERVAL_WAIT');
  });

  it('returns null when ready to spawn', () => {
    const ss = new SpawnSystem(makeScene());
    (ss as any).spawnTimer = 99;
    (ss as any).spawnInterval = 0.1;
    expect(ss.getSpawnStallReason()).toBeNull();
  });
});
