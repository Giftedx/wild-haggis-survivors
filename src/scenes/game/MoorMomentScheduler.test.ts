import { describe, expect, it, vi } from 'vitest';
import {
  MoorMomentScheduler,
  resolveBurnsTagForBiome,
  type MoorMomentSchedulerHooks,
} from './MoorMomentScheduler';
import { MOOR_MOMENT_FIRST_SEC, MOOR_MOMENT_GAP_BASE_SEC } from '../../data/moorMoments';
import { createRNG } from '../../utils/rng';
import { defaultModifiers } from '../../core/RunModifiers';

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
    getRunModifiers: () => defaultModifiers(),
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

  it('addCoinGold fires when a moor moment grants gold', () => {
    const addCoinGold = vi.fn();
    const { hooks } = makeHooks({ addCoinGold });
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();

    // Run repeated ticks; first moment fires at FIRST_SEC.
    scheduler.tick(MOOR_MOMENT_FIRST_SEC);

    // We can't predict which moment fired without committing to a seed,
    // but the harness's getRunModifiers/goldMult is 1, so any gold reward
    // should turn into a positive addCoinGold call. All non-magnet
    // reward kinds either grant gold (kind=gold) or substitute gold
    // when grant fallback kicks in. xp/heal/magnet may not call gold.
    // To make this test deterministic, run several ticks until a gold
    // reward fires (worst case after a few iterations).
    let attempts = 0;
    let lastSec = MOOR_MOMENT_FIRST_SEC;
    while (addCoinGold.mock.calls.length === 0 && attempts < 12) {
      lastSec += 200; // skip past the gap each time
      scheduler.tick(lastSec);
      attempts++;
    }
    // At least one of the first dozen-ish moments must have been gold-bearing.
    expect(addCoinGold).toHaveBeenCalled();
  });

  it('flushes a flashWhite + showToast on every fire', () => {
    const { hooks, juice } = makeHooks();
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();

    scheduler.tick(MOOR_MOMENT_FIRST_SEC);
    expect(juice.flashWhite).toHaveBeenCalledTimes(1);
    expect(juice.showToast).toHaveBeenCalledTimes(1);
  });

  it('falls back to gold when xp would push past max level', () => {
    const addCoinGold = vi.fn();
    const xpSystem = { getLevel: () => 99, grantBonusXp: vi.fn() };
    const { hooks } = makeHooks({
      addCoinGold,
      getXPSystem: () => xpSystem as unknown as ReturnType<MoorMomentSchedulerHooks['getXPSystem']>,
    });
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();

    // Iterate until we hit an xp moment — the gold fallback path requires it.
    let lastSec = MOOR_MOMENT_FIRST_SEC;
    let attempts = 0;
    while (xpSystem.grantBonusXp.mock.calls.length === 0 && addCoinGold.mock.calls.length === 0 && attempts < 30) {
      scheduler.tick(lastSec);
      lastSec += 200;
      attempts++;
    }
    // grantBonusXp must NEVER fire at max level.
    expect(xpSystem.grantBonusXp).not.toHaveBeenCalled();
    // The fallback always converts the foregone xp to gold.
    expect(addCoinGold).toHaveBeenCalled();
  });

  it('emits GLOBAL_MOOR_MOMENT on every fire', async () => {
    const { hooks, juice } = makeHooks();
    const { globalEventBus } = await import('../../core/GlobalEventBus');
    const moments: string[] = [];
    const off = globalEventBus.on('GLOBAL_MOOR_MOMENT', (p) => moments.push(p.momentId));
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();
    scheduler.tick(MOOR_MOMENT_FIRST_SEC);
    off();
    expect(juice.showMoorMomentBurst).toHaveBeenCalled();
    expect(moments).toHaveLength(1);
  });
});

describe('resolveBurnsTagForBiome', () => {
  it('maps loch + home_loch to loch_moment', () => {
    expect(resolveBurnsTagForBiome('loch')).toBe('loch_moment');
    expect(resolveBurnsTagForBiome('home_loch')).toBe('loch_moment');
  });

  it('maps heather + pine (and their home forms) to highland_moment', () => {
    expect(resolveBurnsTagForBiome('heather')).toBe('highland_moment');
    expect(resolveBurnsTagForBiome('home_heather')).toBe('highland_moment');
    expect(resolveBurnsTagForBiome('pine')).toBe('highland_moment');
    expect(resolveBurnsTagForBiome('home_pine')).toBe('highland_moment');
  });

  it('returns null for bog + home_bog (no Burns canon for bogs)', () => {
    expect(resolveBurnsTagForBiome('bog')).toBe(null);
    expect(resolveBurnsTagForBiome('home_bog')).toBe(null);
  });

  it('returns null for undefined + unknown tags', () => {
    expect(resolveBurnsTagForBiome(undefined)).toBe(null);
    expect(resolveBurnsTagForBiome('')).toBe(null);
    expect(resolveBurnsTagForBiome('mystery_tag')).toBe(null);
  });
});

describe('MoorMomentScheduler burns_citation co-fire', () => {
  it('requests burns_citation once per Burns-relevant biome tag per run', () => {
    const banterRequest = vi.fn();
    const banter = { request: banterRequest };
    const { hooks } = makeHooks({
      getBanter: () => banter as unknown as ReturnType<MoorMomentSchedulerHooks['getBanter']>,
      getCurrentBiomeId: () => 'loch',
    });
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();

    // Fire three moor moments back-to-back in loch biome.
    let tickSec = MOOR_MOMENT_FIRST_SEC;
    for (let i = 0; i < 3; i++) {
      scheduler.tick(tickSec);
      tickSec += 200;
    }

    const burnsCalls = banterRequest.mock.calls.filter((c) => c[0] === 'burns_citation');
    expect(burnsCalls).toHaveLength(1);
    expect(burnsCalls[0]).toEqual(['burns_citation', { tag: 'loch_moment' }]);
  });

  it('does not request burns_citation for bog biome', () => {
    const banterRequest = vi.fn();
    const banter = { request: banterRequest };
    const { hooks } = makeHooks({
      getBanter: () => banter as unknown as ReturnType<MoorMomentSchedulerHooks['getBanter']>,
      getCurrentBiomeId: () => 'bog',
    });
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();

    scheduler.tick(MOOR_MOMENT_FIRST_SEC);

    const burnsCalls = banterRequest.mock.calls.filter((c) => c[0] === 'burns_citation');
    expect(burnsCalls).toHaveLength(0);
  });

  it('re-opens Burns tags on reset (new run)', () => {
    const banterRequest = vi.fn();
    const banter = { request: banterRequest };
    const { hooks } = makeHooks({
      getBanter: () => banter as unknown as ReturnType<MoorMomentSchedulerHooks['getBanter']>,
      getCurrentBiomeId: () => 'heather',
    });
    const scheduler = new MoorMomentScheduler(hooks);
    scheduler.reset();

    scheduler.tick(MOOR_MOMENT_FIRST_SEC);
    scheduler.reset();
    scheduler.tick(MOOR_MOMENT_FIRST_SEC);

    const burnsCalls = banterRequest.mock.calls.filter((c) => c[0] === 'burns_citation');
    expect(burnsCalls).toHaveLength(2);
    expect(burnsCalls[0]).toEqual(['burns_citation', { tag: 'highland_moment' }]);
    expect(burnsCalls[1]).toEqual(['burns_citation', { tag: 'highland_moment' }]);
  });
});
