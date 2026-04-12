import { describe, expect, it, vi } from 'vitest';
import { SaveManager, type IRunState } from './SaveManager';
import {
  createGameplaySessionGuard,
  finalizeResumeStartup,
  readPendingResumeRun,
} from './GameSessionLifecycle';
import { MemoryStorage } from '../test/MemoryStorage';

const makeRun = (overrides?: Partial<IRunState>): IRunState => ({
  gameTimeSec: 120,
  playerX: 200,
  playerY: 300,
  playerHealth: 42,
  playerMaxHp: 100,
  currentXp: 200,
  currentLevel: 4,
  acquiredWeapons: [{ key: 'thistle_shot', level: 2, evolved: false, evolutionKey: '' }],
  selectedVariantKey: 'classic',
  killCount: 55,
  ownedPassives: [],
  evolvedWeaponKeys: [],
  ...overrides,
});

describe('GameSessionLifecycle', () => {
  it('keeps suspended run intact until startup is committed', () => {
    const mgr = new SaveManager({ storage: new MemoryStorage(), key: 'meta' });
    const suspended = makeRun({ gameTimeSec: 600, currentLevel: 10 });
    mgr.saveActiveRun(suspended);

    const pending = readPendingResumeRun(mgr.load().activeRun);
    expect(pending?.gameTimeSec).toBe(600);

    // Simulated startup failure path: no commit means no mutation.
    expect(mgr.load().activeRun?.gameTimeSec).toBe(600);
    expect(mgr.load().activeRun?.currentLevel).toBe(10);
  });

  it('replaces old suspended snapshot with fresh state on commit', () => {
    const mgr = new SaveManager({ storage: new MemoryStorage(), key: 'meta' });
    const suspended = makeRun({ gameTimeSec: 600 });
    const fresh = makeRun({ gameTimeSec: 605, currentXp: 250 });
    mgr.saveActiveRun(suspended);

    const pending = readPendingResumeRun(mgr.load().activeRun);
    finalizeResumeStartup(pending, () => mgr.saveActiveRun(fresh));

    expect(mgr.load().activeRun?.gameTimeSec).toBe(605);
    expect(mgr.load().activeRun?.currentXp).toBe(250);
  });

  it('ends gameplay session at most once even with repeated teardown calls', () => {
    const endSession = vi.fn();
    const guard = createGameplaySessionGuard(endSession);

    guard.endIfStarted();
    expect(endSession).not.toHaveBeenCalled();

    guard.markStarted();
    expect(guard.hasStarted()).toBe(true);
    guard.endIfStarted();
    guard.endIfStarted();

    expect(endSession).toHaveBeenCalledTimes(1);
    expect(guard.hasStarted()).toBe(false);
  });
});
