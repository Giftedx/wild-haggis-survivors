import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

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
    getFirstDead(_create?: boolean) { return this._children.find(c => !c.active) ?? null; }
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
      Math: {},
      GameObjects: { Group },
    },
  };
});

vi.mock('../entities/Enemy', () => {
  const MAX = 400;
  class Enemy {
    active = false;
    constructor(_s?: any, _x?: any, _y?: any) {}
    isBoss() { return false; }
    static acquireFromPool(pool: any, _scene: any) {
      let e = pool.getFirstDead(false);
      if (e) return e;
      if (pool.countActive(true) >= MAX) return null;
      e = new Enemy();
      pool.add(e);
      return e;
    }
  }
  return { Enemy };
});

import { SpawnSystem } from './SpawnSystem';
import * as enemies from '../data/enemies';
import type { EnemyConfig } from '../data/enemies';

/** Keep in sync with `config.ENEMIES.MAX_ACTIVE` */
const ENEMIES_MAX = 400;

function makeScene(tm: { isGameplayPaused: () => boolean }) {
  class SimpleGroup {
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
    add: {
      group: () => new SimpleGroup(),
    },
    cameras: { main: { width: 800, height: 600, zoom: 1, shake: () => {} } },
    scale: { width: 800, height: 600 },
    tweens: { add: () => {} },
    getTimeManager: () => tm,
    getUpdateTickers: () => ({ addOnce: () => ({ cancel() {} }) }),
    getPlayer: () => ({ x: 0, y: 0 }),
  };
}

describe('SpawnSystem.getSpawnStallReason priority', () => {
  let paused = false;
  const tm = { isGameplayPaused: () => paused };

  beforeEach(() => {
    paused = false;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PAUSED beats POOL_SATURATED', () => {
    paused = true;
    const scene: any = makeScene(tm);
    const ss = new SpawnSystem(scene);
    vi.spyOn(ss.getEnemyGroup() as any, 'countActive').mockReturnValue(ENEMIES_MAX);
    (ss as any).spawnTimer = 99;
    (ss as any).spawnInterval = 0.1;
    expect(ss.getSpawnStallReason()).toBe('PAUSED');
  });

  it('PAUSED beats RUN_FINALE', () => {
    paused = true;
    const scene: any = makeScene(tm);
    const ss = new SpawnSystem(scene);
    (ss as any).regularSpawnsDisabled = true;
    (ss as any).spawnTimer = 99;
    (ss as any).spawnInterval = 0.1;
    expect(ss.getSpawnStallReason()).toBe('PAUSED');
  });

  it('RUN_FINALE beats POOL_SATURATED', () => {
    const scene: any = makeScene(tm);
    const ss = new SpawnSystem(scene);
    (ss as any).regularSpawnsDisabled = true;
    vi.spyOn(ss.getEnemyGroup() as any, 'countActive').mockReturnValue(ENEMIES_MAX);
    (ss as any).spawnTimer = 99;
    (ss as any).spawnInterval = 0.1;
    expect(ss.getSpawnStallReason()).toBe('RUN_FINALE');
  });

  it('POOL_SATURATED when boss is active and pool is full (boss does not mask stall)', () => {
    vi.spyOn(SpawnSystem.prototype, 'isBossActive').mockReturnValue(true);
    const scene: any = makeScene(tm);
    const ss = new SpawnSystem(scene);
    (ss as any).pendingBossSpawn = () => {};
    vi.spyOn(ss.getEnemyGroup() as any, 'countActive').mockReturnValue(ENEMIES_MAX);
    (ss as any).spawnTimer = 99;
    (ss as any).spawnInterval = 0.1;
    expect(ss.getSpawnStallReason()).toBe('POOL_SATURATED');
  });

  it('POOL_SATURATED when pool is at cap (no higher-priority stall)', () => {
    const scene: any = makeScene(tm);
    const ss = new SpawnSystem(scene);
    vi.spyOn(ss.getEnemyGroup() as any, 'countActive').mockReturnValue(ENEMIES_MAX);
    (ss as any).spawnTimer = 99;
    (ss as any).spawnInterval = 0.1;
    expect(ss.getSpawnStallReason()).toBe('POOL_SATURATED');
  });

  it('INTERVAL_WAIT beats NO_TYPES_AVAILABLE', () => {
    const scene: any = makeScene(tm);
    const ss = new SpawnSystem(scene);
    vi.spyOn(ss.getEnemyGroup() as any, 'countActive').mockReturnValue(0);
    (ss as any).spawnTimer = 0;
    (ss as any).spawnInterval = 9;
    vi.spyOn(enemies, 'getEnemyConfigsByKeys').mockReturnValue([]);
    expect(ss.getSpawnStallReason()).toBe('INTERVAL_WAIT');
  });

  it('NO_TYPES_AVAILABLE when timer is satisfied but no enemy types', () => {
    const scene: any = makeScene(tm);
    const ss = new SpawnSystem(scene);
    vi.spyOn(ss.getEnemyGroup() as any, 'countActive').mockReturnValue(0);
    (ss as any).spawnTimer = 5;
    (ss as any).spawnInterval = 1;
    vi.spyOn(enemies, 'getEnemyConfigsByKeys').mockReturnValue([]);
    expect(ss.getSpawnStallReason()).toBe('NO_TYPES_AVAILABLE');
  });

  it('returns null when a burst is ready (timer, types, pool)', () => {
    const scene: any = makeScene(tm);
    const ss = new SpawnSystem(scene);
    vi.spyOn(ss.getEnemyGroup() as any, 'countActive').mockReturnValue(0);
    (ss as any).spawnTimer = 2;
    (ss as any).spawnInterval = 1;
    vi.spyOn(enemies, 'getEnemyConfigsByKeys').mockReturnValue([{ key: 'tourist' } as EnemyConfig]);
    expect(ss.getSpawnStallReason()).toBeNull();
  });
});
