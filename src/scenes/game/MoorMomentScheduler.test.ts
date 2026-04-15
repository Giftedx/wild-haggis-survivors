import { describe, expect, it, vi } from 'vitest';
import { MoorMomentScheduler, type MoorMomentSchedulerHooks } from './MoorMomentScheduler';
import { MOOR_MOMENT_FIRST_SEC, MOOR_MOMENT_GAP_BASE_SEC } from '../../data/moorMoments';
import { createRNG } from '../../utils/rng';

type PlayerStub = { active: boolean; x: number; y: number; heal: ReturnType<typeof vi.fn>; getXpMultiplier: () => number; grantMoorMomentMagnet: ReturnType<typeof vi.fn> };

function makeHooks(overrides: Partial<MoorMomentSchedulerHooks> = {}): {
  hooks: MoorMomentSchedulerHooks;
  juice: { showMoorMomentBurst: ReturnType<typeof vi.fn>; showToast: ReturnType<typeof vi.fn>; flashWhite: ReturnType<typeof vi.fn> };
  xpSystem: { getLevel: () => number; grantBonusXp: ReturnType<typeof vi.fn> };
  sfx: { tryPlay: ReturnType<typeof vi.fn> };
} {
  const player: PlayerStub = {
    active: true,
    x: 0,
    y: 0,
    heal: vi.fn(),
    getXpMultiplier: () => 1,
    grantMoorMomentMagnet: vi.fn(),
  };
  const juice = { showMoorMomentBurst: vi.fn(), showToast: vi.fn(), flashWhite: vi.fn() };
  const xpSystem = { getLevel: () => 5, grantBonusXp: vi.fn() };
  const sfx = { tryPlay: vi.fn() };

  const baseHooks: MoorMomentSchedulerHooks = {
    getRunRng: () => createRNG(42),
    getPlayer: () => player as unknown as ReturnType<MoorMomentSchedulerHooks['getPlayer']>,
    getVictoryPending: () => false,
    getCurrentBiomeId: () => null,
    getTutorialSystem: () => undefined,
    getRunModifiers: () => ({ goldMult: 1, moveSpeedMult: 1, startHpRatio: 1, spawnIntervalMult: 1, damageTakenMult: 1 }),
    getXPSystem: () => xpSystem as unknown as ReturnType<MoorMomentSchedulerHooks['getXPSystem']>,
    getJuice: () => juice as unknown as ReturnType<MoorMomentSchedulerHooks['getJuice']>,
    getBanter: () => null,
    getSFXManager: () => sfx as unknown as ReturnType<MoorMomentSchedulerHooks['getSFXManager']>,
    addCoinGold: vi.fn(),
    caption: vi.fn(),
  };
  return { hooks: { ...baseHooks, ...overrides }, juice, xpSystem, sfx };
}

describe('MoorMomentScheduler', () => {
  it('does not fire before FIRST_SEC', () => {
    const { hooks, juice } = makeHooks();
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();

    scheduler.tick(MOOR_MOMENT_FIRST_SEC - 1);

    expect(juice.showMoorMomentBurst).not.toHaveBeenCalled();
  });

  it('fires at FIRST_SEC and defers the next by at least GAP_BASE', () => {
    const { hooks, juice } = makeHooks();
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();

    scheduler.tick(MOOR_MOMENT_FIRST_SEC);

    expect(juice.showMoorMomentBurst).toHaveBeenCalledTimes(1);

    // No second fire within the first few seconds after the first.
    scheduler.tick(MOOR_MOMENT_FIRST_SEC + MOOR_MOMENT_GAP_BASE_SEC - 1);
    expect(juice.showMoorMomentBurst).toHaveBeenCalledTimes(1);
  });

  it('does not fire while victory is pending', () => {
    const { hooks, juice } = makeHooks({ getVictoryPending: () => true });
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();

    scheduler.tick(MOOR_MOMENT_FIRST_SEC + 60);

    expect(juice.showMoorMomentBurst).not.toHaveBeenCalled();
  });

  it('does not fire while player is inactive (e.g. dead)', () => {
    const inactivePlayer = {
      active: false,
      x: 0,
      y: 0,
      heal: vi.fn(),
      getXpMultiplier: () => 1,
      grantMoorMomentMagnet: vi.fn(),
    };
    const { hooks, juice } = makeHooks({
      getPlayer: () => inactivePlayer as unknown as ReturnType<MoorMomentSchedulerHooks['getPlayer']>,
    });
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();

    scheduler.tick(MOOR_MOMENT_FIRST_SEC + 30);

    expect(juice.showMoorMomentBurst).not.toHaveBeenCalled();
  });

  it('pushAfterResume defers next fire past the resumed time', () => {
    const { hooks, juice } = makeHooks();
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();

    // Simulate: save at t=300s, resume.
    scheduler.pushAfterResume(300);

    // Ticking at 360s must not fire (next is resumeTime + 65 = 365 earliest).
    scheduler.tick(360);
    expect(juice.showMoorMomentBurst).not.toHaveBeenCalled();

    // At 366s (past the 65-second resume buffer), it fires.
    scheduler.tick(366);
    expect(juice.showMoorMomentBurst).toHaveBeenCalledTimes(1);
  });

  it('pushAfterResume is safe to call before first tick', () => {
    // Regression guard for commit 0ff288b: moorMoments was undefined during
    // applyResumeHydration because the scheduler was constructed later in
    // create(). The class MUST be callable immediately after construction.
    const { hooks } = makeHooks();
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();
    expect(() => scheduler.pushAfterResume(120)).not.toThrow();
  });
});
