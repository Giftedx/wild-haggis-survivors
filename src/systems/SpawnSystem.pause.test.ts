import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class Sprite {}
  class DummyGroup {}
  class DummyEmitter {}
  const __m = {
      Physics: { Arcade: { Sprite } },
      GameObjects: { Group: DummyGroup },
      Events: { EventEmitter: DummyEmitter },
    };
  return { default: __m, ...__m };
});

describe('SpawnSystem boss deferral respects TimeManager pause', () => {
  it('does not flush pending boss spawns while gameplay paused', async () => {
    const { SpawnSystem } = await import('./SpawnSystem');

    const calls: string[] = [];
    const scene: any = {
      getTimeManager: () => ({ isGameplayPaused: () => true }),
      getSecondsPastBell: () => 0,
    };

    const ss: any = Object.create(SpawnSystem.prototype);
    ss.scene = scene;
    ss.pendingBossSpawns = [() => calls.push('spawned')];
    ss.syncWaveDirectorFromTimeline = vi.fn();
    ss.checkBossSpawns = vi.fn();
    ss.spawnBurst = vi.fn();
    ss.pool = { getChildren: () => [], children: { entries: [] } };
    ss.gameTimeSec = 0;
    ss.spawnTimer = 0;
    ss.spawnInterval = 999999;

    ss.update(16, 0, 0);
    expect(calls).toEqual([]);
    expect(ss.pendingBossSpawns).toHaveLength(1);
  });

  it('flushes pending boss spawns once gameplay unpauses', async () => {
    const { SpawnSystem } = await import('./SpawnSystem');

    let paused = true;
    const calls: string[] = [];
    const scene: any = {
      getTimeManager: () => ({ isGameplayPaused: () => paused }),
      getSecondsPastBell: () => 0,
    };

    const ss: any = Object.create(SpawnSystem.prototype);
    ss.scene = scene;
    ss.pendingBossSpawns = [() => calls.push('spawned')];
    ss.syncWaveDirectorFromTimeline = vi.fn();
    ss.checkBossSpawns = vi.fn();
    ss.spawnBurst = vi.fn();
    ss.pool = { getChildren: () => [], children: { entries: [] } };
    ss.gameTimeSec = 0;
    ss.spawnTimer = 0;
    ss.spawnInterval = 999999;

    ss.update(16, 0, 0);
    expect(calls).toEqual([]);
    expect(ss.pendingBossSpawns).toHaveLength(1);

    paused = false;
    ss.update(16, 0, 0);
    expect(calls).toEqual(['spawned']);
    expect(ss.pendingBossSpawns).toHaveLength(0);
  });

  it('flushes multiple queued boss spawns in FIFO order on the same unpaused tick', async () => {
    const { SpawnSystem } = await import('./SpawnSystem');

    let paused = true;
    const calls: string[] = [];
    const scene: any = {
      getTimeManager: () => ({ isGameplayPaused: () => paused }),
      getSecondsPastBell: () => 0,
    };

    const ss: any = Object.create(SpawnSystem.prototype);
    ss.scene = scene;
    ss.pendingBossSpawns = [
      () => calls.push('first'),
      () => calls.push('second'),
    ];
    ss.syncWaveDirectorFromTimeline = vi.fn();
    ss.checkBossSpawns = vi.fn();
    ss.spawnBurst = vi.fn();
    ss.pool = { getChildren: () => [], children: { entries: [] } };
    ss.gameTimeSec = 0;
    ss.spawnTimer = 0;
    ss.spawnInterval = 999999;

    paused = false;
    ss.update(16, 0, 0);
    expect(calls).toEqual(['first', 'second']);
    expect(ss.pendingBossSpawns).toHaveLength(0);
  });
});

