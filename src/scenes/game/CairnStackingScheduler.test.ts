import { describe, expect, it, vi } from 'vitest';
import {
  CairnStackingScheduler,
  type CairnStackingSchedulerHooks,
  CAIRN_STONE_CAP,
  CAIRN_FIRST_SPAWN_SEC,
  CAIRN_GAP_BASE_SEC,
  CAIRN_BOON_MAGNET_FLAT_PX,
  CAIRN_BOON_MAGNET_DURATION_MS,
} from './CairnStackingScheduler';
import { createRNG } from '../../utils/rng';

type PlayerStub = {
  active: boolean;
  x: number;
  y: number;
  heal: ReturnType<typeof vi.fn>;
  getMaxHp: () => number;
  grantMoorMomentMagnet: ReturnType<typeof vi.fn>;
};

interface FixtureBundle {
  hooks: CairnStackingSchedulerHooks;
  juice: {
    showToast: ReturnType<typeof vi.fn>;
    showMoorMomentBurst: ReturnType<typeof vi.fn>;
    flashWhite: ReturnType<typeof vi.fn>;
  };
  banter: { request: ReturnType<typeof vi.fn> };
  spawnSpy: ReturnType<typeof vi.fn>;
  captionSpy: ReturnType<typeof vi.fn>;
  bumpSpy: ReturnType<typeof vi.fn>;
  player: PlayerStub;
}

function makeFixture(
  overrides: Partial<CairnStackingSchedulerHooks> = {},
): FixtureBundle {
  const player: PlayerStub = {
    active: true,
    x: 100,
    y: 200,
    heal: vi.fn(),
    getMaxHp: () => 50,
    grantMoorMomentMagnet: vi.fn(),
  };
  const juice = {
    showToast: vi.fn(),
    showMoorMomentBurst: vi.fn(),
    flashWhite: vi.fn(),
  };
  const banter = { request: vi.fn() };
  const spawnSpy = vi.fn();
  const captionSpy = vi.fn();
  // Default mock: every call returns 1 (subsequent blessing — boon pool,
  // not boon_first). Tests asserting first-blessing routing override
  // this via the `bumpCairnBlessing` field on the hooks payload.
  const bumpSpy = vi.fn().mockReturnValue(1);

  const baseHooks: CairnStackingSchedulerHooks = {
    getRunRng: () => createRNG(42),
    getPlayer: () => player as unknown as ReturnType<CairnStackingSchedulerHooks['getPlayer']>,
    getVictoryPending: () => false,
    getJuice: () =>
      juice as unknown as ReturnType<CairnStackingSchedulerHooks['getJuice']>,
    getBanter: () =>
      banter as unknown as ReturnType<CairnStackingSchedulerHooks['getBanter']>,
    spawnCairnStone: spawnSpy,
    caption: captionSpy,
    bumpCairnBlessing: bumpSpy,
    openCairnBoonPicker: vi.fn(),
  };
  return {
    hooks: { ...baseHooks, ...overrides },
    juice,
    banter,
    spawnSpy,
    captionSpy,
    bumpSpy,
    player,
  };
}

describe('CairnStackingScheduler', () => {
  it('does not spawn before FIRST_SPAWN_SEC', () => {
    const { hooks, spawnSpy } = makeFixture();
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    scheduler.tick(CAIRN_FIRST_SPAWN_SEC - 1);

    expect(spawnSpy).not.toHaveBeenCalled();
    expect(scheduler.getSpawnedCount()).toBe(0);
  });

  it('spawns at FIRST_SPAWN_SEC and defers next by GAP_BASE', () => {
    const { hooks, spawnSpy } = makeFixture();
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    scheduler.tick(CAIRN_FIRST_SPAWN_SEC);

    expect(spawnSpy).toHaveBeenCalledTimes(1);
    expect(scheduler.getSpawnedCount()).toBe(1);
    expect(scheduler.isSpawnPending()).toBe(true);

    // Even past the gap, no second spawn while one is still pending.
    scheduler.tick(CAIRN_FIRST_SPAWN_SEC + CAIRN_GAP_BASE_SEC + 100);
    expect(spawnSpy).toHaveBeenCalledTimes(1);
  });

  it('does not spawn while victory is pending', () => {
    const { hooks, spawnSpy } = makeFixture({ getVictoryPending: () => true });
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    scheduler.tick(CAIRN_FIRST_SPAWN_SEC + 60);

    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it('does not spawn while player is inactive', () => {
    const inactivePlayer: PlayerStub = {
      active: false,
      x: 0,
      y: 0,
      heal: vi.fn(),
      getMaxHp: () => 50,
      grantMoorMomentMagnet: vi.fn(),
    };
    const { hooks, spawnSpy } = makeFixture({
      getPlayer: () =>
        inactivePlayer as unknown as ReturnType<CairnStackingSchedulerHooks['getPlayer']>,
    });
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    scheduler.tick(CAIRN_FIRST_SPAWN_SEC + 30);

    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it('first stone collect fires stack toast + low-priority banter, no boon', () => {
    const { hooks, spawnSpy, juice, banter, player, captionSpy } = makeFixture();
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    scheduler.tick(CAIRN_FIRST_SPAWN_SEC);
    expect(spawnSpy).toHaveBeenCalledTimes(1);

    // Simulate the spawned stone's overlap callback.
    const onCollect = spawnSpy.mock.calls[0][0] as () => void;
    onCollect();

    expect(scheduler.getStoneCount()).toBe(1);
    expect(banter.request).toHaveBeenCalledWith('cairn_moment', { tag: 'stack' });
    expect(player.heal).not.toHaveBeenCalled();
    expect(player.grantMoorMomentMagnet).not.toHaveBeenCalled();
    expect(captionSpy).not.toHaveBeenCalled();
    expect(juice.showMoorMomentBurst).not.toHaveBeenCalled();
    // Stack toast (not boon toast).
    expect(juice.showToast).toHaveBeenCalledTimes(1);
  });

  it('third stone opens boon picker (v2) — burst + flash, then applies picked boon', () => {
    // Wire openCairnBoonPicker to auto-pick full_mend (simulates player
    // choosing the first card). Downstream effects come from _applyBoon.
    const pickerSpy = vi.fn().mockImplementation(
      (_opts: unknown, onPick: (id: string) => void) => onPick('full_mend'),
    );
    const { hooks, spawnSpy, juice, banter, player, captionSpy, bumpSpy } = makeFixture({
      openCairnBoonPicker: pickerSpy,
    });
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    let nextRunSec = CAIRN_FIRST_SPAWN_SEC;
    for (let i = 0; i < CAIRN_STONE_CAP; i++) {
      scheduler.tick(nextRunSec);
      const onCollect = spawnSpy.mock.calls[i][0] as () => void;
      onCollect();
      nextRunSec = scheduler.getNextSpawnAtSec();
    }

    expect(scheduler.getStoneCount()).toBe(CAIRN_STONE_CAP);
    expect(scheduler.getSpawnedCount()).toBe(CAIRN_STONE_CAP);
    // Picker was opened with 3 options.
    expect(pickerSpy).toHaveBeenCalledTimes(1);
    expect(pickerSpy.mock.calls[0][0]).toHaveLength(3);
    // full_mend effect: heal to max HP.
    expect(player.heal).toHaveBeenCalledExactlyOnceWith(player.getMaxHp());
    // Visual effects fire before the picker opens.
    expect(juice.showMoorMomentBurst).toHaveBeenCalledTimes(1);
    expect(juice.flashWhite).toHaveBeenCalledTimes(1);
    // Default fixture's bumpCairnBlessing returns 1 — subsequent blessing
    // routes to the existing `boon` pool, not `boon_first`.
    expect(bumpSpy).toHaveBeenCalledTimes(1);
    expect(banter.request).toHaveBeenCalledWith('cairn_moment', { tag: 'boon' });
    expect(captionSpy).toHaveBeenCalledTimes(1);
  });

  it('first lifetime blessing routes to boon_first sub-pool (pre-bump 0)', () => {
    // Override the bumper to return 0 — the v22 contract for "this is
    // the first Cairn's Blessing the player has ever earned."
    const firstEverBumper = vi.fn().mockReturnValue(0);
    // Auto-pick any boon so _applyBoon fires and routes banter.
    const pickerSpy = vi.fn().mockImplementation(
      (_opts: unknown, onPick: (id: string) => void) => onPick('full_mend'),
    );
    const { hooks, spawnSpy, banter, bumpSpy } = makeFixture({
      bumpCairnBlessing: firstEverBumper,
      openCairnBoonPicker: pickerSpy,
    });
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    let nextRunSec = CAIRN_FIRST_SPAWN_SEC;
    for (let i = 0; i < CAIRN_STONE_CAP; i++) {
      scheduler.tick(nextRunSec);
      const onCollect = spawnSpy.mock.calls[i][0] as () => void;
      onCollect();
      nextRunSec = scheduler.getNextSpawnAtSec();
    }

    expect(firstEverBumper).toHaveBeenCalledTimes(1);
    // The default bumpSpy on the un-overridden fixture is a different
    // mock; assert it was untouched (the override took precedence).
    expect(bumpSpy).not.toHaveBeenCalled();
    expect(banter.request).toHaveBeenCalledWith('cairn_moment', {
      tag: 'boon_first',
    });
  });

  it('first stone collect does NOT bump the lifetime counter (only the third does)', () => {
    const { hooks, spawnSpy, bumpSpy } = makeFixture();
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    scheduler.tick(CAIRN_FIRST_SPAWN_SEC);
    const onCollect = spawnSpy.mock.calls[0][0] as () => void;
    onCollect();

    // Stack edge — no blessing, no counter bump.
    expect(bumpSpy).not.toHaveBeenCalled();
  });

  it('after cap is reached, scheduler stops spawning new stones', () => {
    const { hooks, spawnSpy } = makeFixture();
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    let nextRunSec = CAIRN_FIRST_SPAWN_SEC;
    for (let i = 0; i < CAIRN_STONE_CAP; i++) {
      scheduler.tick(nextRunSec);
      const onCollect = spawnSpy.mock.calls[i][0] as () => void;
      onCollect();
      nextRunSec = scheduler.getNextSpawnAtSec();
    }

    expect(spawnSpy).toHaveBeenCalledTimes(CAIRN_STONE_CAP);
    scheduler.tick(nextRunSec + 9999);
    expect(spawnSpy).toHaveBeenCalledTimes(CAIRN_STONE_CAP);
  });

  it('expired stone clears spawnPending so the next gap can fire', () => {
    const { hooks, spawnSpy } = makeFixture();
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    scheduler.tick(CAIRN_FIRST_SPAWN_SEC);
    const onExpired = spawnSpy.mock.calls[0][1] as () => void;
    onExpired();

    expect(scheduler.isSpawnPending()).toBe(false);
    // Stone count unchanged — expired ≠ collected.
    expect(scheduler.getStoneCount()).toBe(0);
    // But spawnedCount stays at 1 — the slot was used.
    expect(scheduler.getSpawnedCount()).toBe(1);
  });

  it('pushAfterResume defers the next spawn past the resumed time', () => {
    const { hooks, spawnSpy } = makeFixture();
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    scheduler.pushAfterResume(300);

    scheduler.tick(320);
    expect(spawnSpy).not.toHaveBeenCalled();

    // 30 s past resume time = 330. Tick at 331 → fires.
    scheduler.tick(331);
    expect(spawnSpy).toHaveBeenCalledTimes(1);
  });

  it('reset zeroes counts and reseeds the next-spawn time', () => {
    const { hooks, spawnSpy } = makeFixture();
    const scheduler = new CairnStackingScheduler(hooks);
    scheduler.reset();

    scheduler.tick(CAIRN_FIRST_SPAWN_SEC);
    const onCollect = spawnSpy.mock.calls[0][0] as () => void;
    onCollect();

    expect(scheduler.getStoneCount()).toBe(1);
    expect(scheduler.getSpawnedCount()).toBe(1);

    scheduler.reset();

    expect(scheduler.getStoneCount()).toBe(0);
    expect(scheduler.getSpawnedCount()).toBe(0);
    expect(scheduler.isSpawnPending()).toBe(false);
    expect(scheduler.getNextSpawnAtSec()).toBe(CAIRN_FIRST_SPAWN_SEC);
  });

  it('determinism — same RNG seed yields same gap sequence', () => {
    const fix1 = makeFixture();
    const fix2 = makeFixture();
    const s1 = new CairnStackingScheduler(fix1.hooks);
    const s2 = new CairnStackingScheduler(fix2.hooks);
    s1.reset();
    s2.reset();

    s1.tick(CAIRN_FIRST_SPAWN_SEC);
    s2.tick(CAIRN_FIRST_SPAWN_SEC);

    expect(s1.getNextSpawnAtSec()).toBe(s2.getNextSpawnAtSec());
  });
});
