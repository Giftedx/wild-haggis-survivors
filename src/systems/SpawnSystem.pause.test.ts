import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class Sprite {}
  class DummyGroup {}
  class DummyEmitter {}
  return {
    default: {
      Physics: { Arcade: { Sprite } },
      GameObjects: { Group: DummyGroup },
      Events: { EventEmitter: DummyEmitter },
    },
  };
});

describe('SpawnSystem boss deferral respects TimeManager pause', () => {
  it('does not flush pending boss spawn while gameplay paused', async () => {
    const { SpawnSystem } = await import('./SpawnSystem');

    const calls: string[] = [];
    const scene: any = {
      getTimeManager: () => ({ isGameplayPaused: () => true }),
    };

    const ss: any = Object.create(SpawnSystem.prototype);
    ss.scene = scene;
    ss.pendingBossSpawn = () => calls.push('spawned');
    ss.syncWaveDirectorFromTimeline = vi.fn();
    ss.checkBossSpawns = vi.fn();
    ss.spawnBurst = vi.fn();
    ss.pool = { getChildren: () => [], children: { entries: [] } };
    ss.gameTimeSec = 0;
    ss.spawnTimer = 0;
    ss.spawnInterval = 999999;

    ss.update(16, 0, 0);
    expect(calls).toEqual([]);
    expect(ss.pendingBossSpawn).not.toBeNull();
  });

  it('flushes pending boss spawn once gameplay unpauses', async () => {
    const { SpawnSystem } = await import('./SpawnSystem');

    let paused = true;
    const calls: string[] = [];
    const scene: any = {
      getTimeManager: () => ({ isGameplayPaused: () => paused }),
    };

    const ss: any = Object.create(SpawnSystem.prototype);
    ss.scene = scene;
    ss.pendingBossSpawn = () => calls.push('spawned');
    ss.syncWaveDirectorFromTimeline = vi.fn();
    ss.checkBossSpawns = vi.fn();
    ss.spawnBurst = vi.fn();
    ss.pool = { getChildren: () => [], children: { entries: [] } };
    ss.gameTimeSec = 0;
    ss.spawnTimer = 0;
    ss.spawnInterval = 999999;

    ss.update(16, 0, 0);
    expect(calls).toEqual([]);
    expect(ss.pendingBossSpawn).not.toBeNull();

    paused = false;
    ss.update(16, 0, 0);
    expect(calls).toEqual(['spawned']);
    expect(ss.pendingBossSpawn).toBeNull();
  });
});

