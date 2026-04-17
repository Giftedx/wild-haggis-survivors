import { describe, expect, it, vi } from 'vitest';

vi.mock('../systems/AudioSystem', () => ({
  audio: { playBossWarning: vi.fn(), playXPCollect: vi.fn() },
}));

vi.mock('../entities/XPGem', () => ({
  XPGem: class XPGem {
    constructor(_scene: unknown) {}
    collect() { return 0; }
  },
}));

vi.mock('phaser', () => {
  class EE {
    private handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
    on(ev: string, fn: (...args: unknown[]) => void) {
      (this.handlers[ev] ??= []).push(fn);
      return this;
    }
    emit(ev: string, ...args: unknown[]) {
      for (const fn of this.handlers[ev] ?? []) fn(...args);
    }
    removeAllListeners() { this.handlers = {}; }
  }
  class Group {
    private _children: unknown[] = [];
    get children() { return { entries: this._children }; }
    add(obj: unknown) { this._children.push(obj); return obj; }
    getChildren() { return this._children; }
    getFirstDead(_?: boolean) { return (this._children as { active?: boolean }[]).find(c => !c.active) ?? null; }
    getLength() { return this._children.length; }
    countActive(value?: boolean) {
      const v = value === undefined ? true : value;
      return (this._children as { active: boolean }[]).filter(c => c.active === v).length;
    }
  }
  return {
    default: {
      Events: { EventEmitter: EE },
      Math: {},
      GameObjects: { Group },
    },
  };
});

vi.mock('../entities/Enemy', () => {
  class Enemy {
    active = false;
    constructor(_s?: unknown, _x?: unknown, _y?: unknown) {}
    isBoss() { return false; }
    static acquireFromPool() { return null; }
  }
  return { Enemy };
});

import { getActiveWaveTimelineEntry } from './BalanceConfig';
import { SaveManager, type IRunState } from './SaveManager';
import { SpawnSystem } from '../systems/SpawnSystem';
import { XPSystem } from '../systems/XPSystem';
import { MemoryStorage } from '../test/MemoryStorage';

function makeSpawnScene() {
  class SimpleGroup {
    private _children: unknown[] = [];
    get children() { return { entries: this._children }; }
    add(obj: unknown) { this._children.push(obj); return obj; }
    getChildren() { return this._children; }
    getFirstDead(_?: boolean) { return (this._children as { active?: boolean }[]).find(c => !c.active) ?? null; }
    countActive(value?: boolean) {
      const v = value === undefined ? true : value;
      return (this._children as { active: boolean }[]).filter(c => c.active === v).length;
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

const tenMinuteRun = (): IRunState => ({
  gameTimeSec: 600,
  playerX: 400,
  playerY: 300,
  playerHealth: 55,
  playerMaxHp: 100,
  currentXp: 1200,
  currentLevel: 7,
  acquiredWeapons: [
    { key: 'thistle_shot', level: 4, evolved: false, evolutionKey: '' },
    { key: 'bagpipe_blast', level: 2, evolved: false, evolutionKey: '' },
  ],
  selectedVariantKey: 'classic',
  killCount: 900,
  ownedPassives: [],
  evolvedWeaponKeys: [],
  spawnedBossKeys: [],
  shieldCooldownMs: 0,
});

describe('Run hydration (mid-run persistence)', () => {
  it('serializes activeRun, simulates anti-scum clear before hydrate, then reloads clean meta', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 't' });
    mgr.save({
      saveVersion: 9,
      totalKills: 10,
      totalKillsSpent: 0,
      dailyChallenge: null,
      unlockedWeapons: [],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
      hasCompletedTutorial: true,
      hasSeenDriftTutorial: false,
      hasSeenEliteAffixTip: false,
      hasSeenMoorMomentTip: false,
      hasSeenCeilidhChainTip: false,
      hasSeenStandingStonesTip: false,
      hasSeenAncestralEchoTip: false,
      moorMomentsLifetime: 0,
      runHistory: [],
      codexCulledKeys: [],
    });
    mgr.saveActiveRun(tenMinuteRun());

    const disk1 = mgr.load();
    expect(disk1.activeRun?.gameTimeSec).toBe(600);
    expect(disk1.activeRun?.acquiredWeapons).toHaveLength(2);

    const snapshot = disk1.activeRun!;
    mgr.save({ ...disk1, activeRun: null });
    expect(mgr.load().activeRun).toBeNull();

    expect(snapshot.currentLevel).toBe(7);
    expect(snapshot.currentXp).toBe(1200);
    expect(snapshot.acquiredWeapons.map((w) => w.key).sort()).toEqual(['bagpipe_blast', 'thistle_shot']);
    expect(snapshot.shieldCooldownMs).toBe(0);
  });

  it('applyResumeTime(600) snaps SpawnSystem director to 10-minute timeline entry', () => {
    const ss = new SpawnSystem(makeSpawnScene() as never);
    const expected = getActiveWaveTimelineEntry(600);
    ss.applyResumeTime(600);
    expect(ss.getGameTimeSec()).toBe(600);
    expect(ss.getSpawnIntervalSec()).toBe(expected.intervalSec);
    expect(ss.getBurstSize()).toBe(expected.burstSize);
    expect((ss as unknown as { directorEnemyKeys: string[] }).directorEnemyKeys).toEqual([...expected.enemyKeys]);
  });

  it('applyResumeTime honors persisted spawned boss keys (prevents duplicate finale re-spawn)', () => {
    const ss = new SpawnSystem(makeSpawnScene() as never);
    // 920s means finale time has passed; without persisted keys, taxman would
    // be considered unspawned until 1500s timeline boss check.
    ss.applyResumeTime(920, ['taxman']);
    expect(ss.getSpawnedBossKeys()).toContain('taxman');
  });

  it('applyResumeTime treats persisted empty boss list as authoritative', () => {
    const ss = new SpawnSystem(makeSpawnScene() as never);
    ss.applyResumeTime(600, []);
    expect(ss.getSpawnedBossKeys()).toEqual([]);
  });

  it('XPSystem.hydrateRunState restores bar without emitting levelup', () => {
    const scene = {
      getSFXManager: () => ({ tryPlay: (_k: string, fn: () => void) => { fn(); }, clear: () => {} }),
      add: {
        group: (opts: { classType: new (_s: unknown) => unknown }) => {
          const pool: unknown[] = [];
          return {
            add(x?: unknown) {
              const o = x ?? new opts.classType(scene);
              pool.push(o);
              return o;
            },
            getChildren: () => pool,
            getLength: () => pool.length,
            getFirstDead: () => null,
          };
        },
      },
      tweens: { killTweensOf: () => {} },
    };
    const xp = new XPSystem(scene as never);
    let levelups = 0;
    xp.events.on('levelup', () => { levelups++; });
    xp.hydrateRunState(11, 333);
    expect(xp.getLevel()).toBe(11);
    expect(xp.getCurrentXP()).toBe(333);
    expect(levelups).toBe(0);
  });
});
