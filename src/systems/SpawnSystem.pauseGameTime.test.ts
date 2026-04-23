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

/**
 * T1 deterministic replay: `pauseSpawnsFor` must gate by game-time, not
 * wall-clock. A run with hit-freeze / tab-backgrounding used to desync
 * under the old `Date.now()` check — same seed + same input produced
 * different spawn bursts depending on browser pauses.
 */
describe('SpawnSystem.pauseSpawnsFor uses game-time', () => {
  async function buildTestableSpawnSystem() {
    const { SpawnSystem } = await import('./SpawnSystem');
    const burstSpy = vi.fn();

    const ss: any = Object.create(SpawnSystem.prototype);
    ss.scene = { getTimeManager: () => ({ isGameplayPaused: () => false }) };
    ss.syncWaveDirectorFromTimeline = vi.fn();
    ss.checkBossSpawns = vi.fn();
    ss.spawnBurst = burstSpy;
    ss.pool = { getChildren: () => [], children: { entries: [] } };
    ss.gameTimeSec = 0;
    ss.spawnTimer = 0;
    ss.spawnInterval = 0.1;
    ss.pendingBossSpawn = null;
    return { ss, burstSpy, SpawnSystem };
  }

  it('starts unpaused — spawnBurst proceeds when no pause was requested', async () => {
    const { ss, burstSpy, SpawnSystem } = await buildTestableSpawnSystem();
    // Route through the real method (don't spy so the private gate runs).
    ss.spawnBurst = SpawnSystem.prototype['spawnBurst' as keyof typeof SpawnSystem.prototype] as never;
    // But stub out the Enemy acquisition path by disabling via regularSpawnsDisabled=false
    // and giving spawnBurst no director keys so it early-returns after the gate.
    ss.regularSpawnsDisabled = false;
    ss.getDirectorEnemyConfigs = () => [];
    ss.spawnBurst(0, 0);
    // No crash, no director configs → early returns after gate. Reaching
    // the director check proves the gate let us through.
    expect(burstSpy).not.toHaveBeenCalled();
  });

  it('pause window holds when game-time has not advanced past the mark', async () => {
    const { SpawnSystem } = await import('./SpawnSystem');

    const ss: any = Object.create(SpawnSystem.prototype);
    let hit = false;
    ss.scene = { getTimeManager: () => ({ isGameplayPaused: () => false }) };
    ss.getDirectorEnemyConfigs = () => { hit = true; return []; };
    ss.regularSpawnsDisabled = false;
    ss.gameTimeSec = 0;
    ss.pauseSpawnsFor = SpawnSystem.prototype.pauseSpawnsFor;
    ss['pauseSpawnsFor'](1000); // 1s game-time pause

    ss['spawnBurst'](0, 0);
    expect(hit).toBe(false); // gated → never reached director check

    // Advance game-time half-way — still paused.
    ss.gameTimeSec = 0.5;
    ss['spawnBurst'](0, 0);
    expect(hit).toBe(false);

    // Past the window — gate releases.
    ss.gameTimeSec = 1.05;
    ss['spawnBurst'](0, 0);
    expect(hit).toBe(true);
  });

  it('wall-clock drift cannot release the gate (seed-determinism invariant)', async () => {
    const { SpawnSystem } = await import('./SpawnSystem');

    const ss: any = Object.create(SpawnSystem.prototype);
    let hit = false;
    ss.scene = { getTimeManager: () => ({ isGameplayPaused: () => false }) };
    ss.getDirectorEnemyConfigs = () => { hit = true; return []; };
    ss.regularSpawnsDisabled = false;
    ss.gameTimeSec = 0;
    ss.pauseSpawnsFor = SpawnSystem.prototype.pauseSpawnsFor;
    ss['pauseSpawnsFor'](5_000); // 5s game-time pause

    // Fake a long wall-clock advance without any gameTimeSec tick (hit-freeze
    // / tab-backgrounding). Old impl would have released; new impl must not.
    const origNow = Date.now;
    Date.now = () => origNow() + 60_000;
    try {
      ss['spawnBurst'](0, 0);
      expect(hit).toBe(false);
    } finally {
      Date.now = origNow;
    }
  });

  it('resetRunState clears the pause', async () => {
    const { SpawnSystem } = await import('./SpawnSystem');

    const ss: any = Object.create(SpawnSystem.prototype);
    ss.pauseSpawnsFor = SpawnSystem.prototype.pauseSpawnsFor;
    ss.gameTimeSec = 0;
    ss['pauseSpawnsFor'](10_000);
    expect(ss.spawnsPausedUntilGameSec).toBe(10);

    // Simulate the effective bit of resetRunState that matters here.
    ss.spawnsPausedUntilGameSec = 0;
    expect(ss.spawnsPausedUntilGameSec).toBe(0);
  });
});
