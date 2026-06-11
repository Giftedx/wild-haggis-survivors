/**
 * runStartCeremony — gating + scheduling contract.
 *
 * The helper is a thin adapter, but the gating story is non-trivial:
 *   - replay playback OR resume short-circuits everything
 *   - active curse delays Gran's open by 1.2s
 *   - Burns Night swaps the banter tag and fires a stinger
 *   - Hogmanay fires a different stinger
 *   - Burns platter only schedules once and only inside the window
 *   - Late-firing platter callback respects the spawned-flag guard
 *
 * The seasonal manager is mocked at the helper boundary
 * (`burnsNightEffects`) so the dates we feed in don't have to match
 * the real Burns Night window.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../systems/seasonal/burnsNightEffects', async () => {
  const actual = await vi.importActual<typeof import('../../systems/seasonal/burnsNightEffects')>(
    '../../systems/seasonal/burnsNightEffects',
  );
  return {
    ...actual,
    seasonalRunStartCeremony: vi.fn(() => null),
    shouldSpawnBurnsPlatter: vi.fn(() => false),
  };
});

import { installRunStartCeremony } from './runStartCeremony';
import {
  BURNS_PLATTER_SPAWN_MS,
  seasonalRunStartCeremony,
  shouldSpawnBurnsPlatter,
} from '../../systems/seasonal/burnsNightEffects';

const seasonalMock = seasonalRunStartCeremony as unknown as ReturnType<typeof vi.fn>;
const shouldSpawnMock = shouldSpawnBurnsPlatter as unknown as ReturnType<typeof vi.fn>;

interface ScheduledCall {
  delayMs: number;
  fire: () => void;
}

function makeDeps(overrides: Partial<Parameters<typeof installRunStartCeremony>[0]> = {}) {
  const scheduled: ScheduledCall[] = [];
  let burnsPlatterSpawned = false;
  const audio = {
    playBurnsPipesStinger: vi.fn(),
    playHogmanayBellsStinger: vi.fn(),
  };
  const banter = { request: vi.fn() };
  const pickupSpawner = { spawnBurnsPlatter: vi.fn() };

  const deps = {
    isReplayPlayback: false,
    isResume: false,
    activeCurseKey: null,
    disableSeasonalEvents: false,
    now: new Date('2026-01-25T12:00:00Z'),
    scheduleSceneDelay: vi.fn((delayMs: number, cb: () => void) => {
      scheduled.push({ delayMs, fire: cb });
    }),
    getBurnsPlatterSpawned: () => burnsPlatterSpawned,
    setBurnsPlatterSpawned: () => {
      burnsPlatterSpawned = true;
    },
    getPickupSpawner: () => pickupSpawner,
    banter,
    audio,
    ...overrides,
  };

  return { deps, scheduled, audio, banter, pickupSpawner, getBurnsPlatterSpawned: () => burnsPlatterSpawned };
}

beforeEach(() => {
  seasonalMock.mockReset();
  shouldSpawnMock.mockReset();
  seasonalMock.mockReturnValue(null);
  shouldSpawnMock.mockReturnValue(false);
});

describe('installRunStartCeremony', () => {
  it('schedules nothing during replay playback', () => {
    const { deps } = makeDeps({ isReplayPlayback: true });
    installRunStartCeremony(deps);
    expect(deps.scheduleSceneDelay).not.toHaveBeenCalled();
  });

  it('schedules nothing on resume', () => {
    const { deps } = makeDeps({ isResume: true });
    installRunStartCeremony(deps);
    expect(deps.scheduleSceneDelay).not.toHaveBeenCalled();
  });

  it('schedules Gran-open at 1200ms with no curse and no seasonal event', () => {
    const { deps, scheduled, audio, banter } = makeDeps();
    installRunStartCeremony(deps);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]!.delayMs).toBe(1200);
    scheduled[0]!.fire();
    expect(audio.playBurnsPipesStinger).not.toHaveBeenCalled();
    expect(audio.playHogmanayBellsStinger).not.toHaveBeenCalled();
    expect(banter.request).toHaveBeenCalledWith('gran_commentary', { tag: 'run_start' });
  });

  it('delays Gran-open to 2400ms when a curse is active', () => {
    const { deps, scheduled } = makeDeps({ activeCurseKey: 'cailleach_winter' });
    installRunStartCeremony(deps);
    expect(scheduled[0]!.delayMs).toBe(2400);
  });

  it('fires Burns Night pipes stinger and seasonal banter tag inside the window', () => {
    seasonalMock.mockReturnValue({
      eventKey: 'burns_night',
      stingerId: 'burns_pipes_in',
      banterContext: 'gran_commentary',
      banterTag: 'seasonal_event',
      bannerKey: 'seasonalEvent.burns_night.ceremony_banner',
    });
    const { deps, scheduled, audio, banter } = makeDeps();
    installRunStartCeremony(deps);
    scheduled[0]!.fire();
    expect(audio.playBurnsPipesStinger).toHaveBeenCalledTimes(1);
    expect(audio.playHogmanayBellsStinger).not.toHaveBeenCalled();
    expect(banter.request).toHaveBeenCalledWith('gran_commentary', { tag: 'seasonal_event' });
  });

  it('fires Hogmanay bells stinger when ceremony id matches', () => {
    seasonalMock.mockReturnValue({
      eventKey: 'hogmanay',
      stingerId: 'hogmanay_bells',
      banterContext: 'gran_commentary',
      banterTag: 'seasonal_event',
      bannerKey: 'seasonalEvent.hogmanay.ceremony_banner',
    });
    const { deps, scheduled, audio } = makeDeps();
    installRunStartCeremony(deps);
    scheduled[0]!.fire();
    expect(audio.playHogmanayBellsStinger).toHaveBeenCalledTimes(1);
    expect(audio.playBurnsPipesStinger).not.toHaveBeenCalled();
  });

  it('does NOT schedule the platter outside the Burns Night window', () => {
    shouldSpawnMock.mockReturnValue(false);
    const { deps, scheduled } = makeDeps();
    installRunStartCeremony(deps);
    expect(scheduled).toHaveLength(1); // only the Gran-open
  });

  it('schedules the platter at BURNS_PLATTER_SPAWN_MS during Burns Night', () => {
    shouldSpawnMock.mockReturnValue(true);
    const { deps, scheduled, pickupSpawner, getBurnsPlatterSpawned } = makeDeps();
    installRunStartCeremony(deps);
    expect(scheduled).toHaveLength(2);
    const platter = scheduled[1]!;
    expect(platter.delayMs).toBe(BURNS_PLATTER_SPAWN_MS);
    platter.fire();
    expect(pickupSpawner.spawnBurnsPlatter).toHaveBeenCalledTimes(1);
    expect(getBurnsPlatterSpawned()).toBe(true);
  });

  it('platter callback no-ops if the spawned flag is already set (mid-flight reset guard)', () => {
    shouldSpawnMock.mockReturnValue(true);
    let spawned = true; // simulate reset already flipped flag
    const pickupSpawner = { spawnBurnsPlatter: vi.fn() };
    const { deps, scheduled } = makeDeps({
      getBurnsPlatterSpawned: () => spawned,
      setBurnsPlatterSpawned: () => {
        spawned = true;
      },
      getPickupSpawner: () => pickupSpawner,
    });
    // shouldSpawn already gates on the flag, but for this test we want to
    // simulate the flag being set BETWEEN scheduling and firing — so we
    // manually re-enable scheduling by making shouldSpawn return true.
    spawned = false;
    installRunStartCeremony(deps);
    spawned = true; // flip BEFORE the fire
    scheduled[1]!.fire();
    expect(pickupSpawner.spawnBurnsPlatter).not.toHaveBeenCalled();
  });

  it('platter callback no-ops if pickupSpawner has been torn down', () => {
    shouldSpawnMock.mockReturnValue(true);
    const { deps, scheduled, getBurnsPlatterSpawned } = makeDeps({
      getPickupSpawner: () => null,
    });
    installRunStartCeremony(deps);
    scheduled[1]!.fire();
    expect(getBurnsPlatterSpawned()).toBe(false);
  });

  it('passes the disableSeasonalEvents flag through to the seasonal lookups', () => {
    const { deps } = makeDeps({ disableSeasonalEvents: true });
    installRunStartCeremony(deps);
    expect(seasonalMock).toHaveBeenCalledWith(deps.now, true);
    expect(shouldSpawnMock).toHaveBeenCalledWith(deps.now, true, false);
  });
});
