import type Phaser from 'phaser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteDef, RoutePick } from '../../data/routes';
import { defaultModifiers } from '../../core/RunModifiers';
import { SettingsManager } from '../../core/SettingsManager';
import type { StorageLike } from '../../core/SaveManager';
import type { ActIntermissionLaunchData } from '../ActIntermissionScene';
import { RunActState } from './RunActState';

const saveMocks = vi.hoisted(() => ({
  addFirstRouteVisit: vi.fn(),
  bumpFirstTimeEvent: vi.fn<(eventId: string) => boolean>(),
  bumpRoutePicked: vi.fn(),
}));

vi.mock('../../utils/save', () => saveMocks);
vi.mock('../ActIntermissionScene', () => ({
  ActIntermissionScene: {
    KEY: 'ActIntermission',
  },
}));

import {
  launchActIntermission,
  type ActIntermissionLauncherHooks,
} from './actIntermissionLauncher';

function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

describe('launchActIntermission route resolve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const claimed = new Set<string>();
    saveMocks.bumpFirstTimeEvent.mockImplementation((eventId) => {
      if (claimed.has(eventId)) return false;
      claimed.add(eventId);
      return true;
    });
  });

  it('claims and requests route first-time banter only on the first resolved pick', () => {
    let launchData: ActIntermissionLaunchData | undefined;
    const request = vi.fn(() => true);
    const hooks = {
      scene: {
        scene: {
          launch: vi.fn((_key: string, data: ActIntermissionLaunchData) => {
            launchData = data;
          }),
        },
      } as unknown as Phaser.Scene,
      spawnSystem: {
        getGameTimeSec: vi.fn(() => 300),
        setSpawnIntervalMult: vi.fn(),
      },
      weaponSystem: {
        setCurseCooldownMul: vi.fn(),
      },
      timeManager: {
        request: vi.fn(),
        release: vi.fn(),
      },
      juice: {
        showToast: vi.fn(),
      },
      banter: { request },
      settingsManager: new SettingsManager({ storage: createMemoryStorage() }),
      runActState: new RunActState(),
      runModifiers: defaultModifiers(),
      replayRecorder: null,
      pendingReplayRoutes: [],
      caption: vi.fn(),
      discoveryRunId: () => 'run:test',
      buildRouteResumeContext: () => {
        throw new Error('route has no onResume callback');
      },
      initNodeMapForAct: vi.fn(),
    } as unknown as ActIntermissionLauncherHooks;

    launchActIntermission(hooks, 1);
    expect(launchData).toBeDefined();
    if (!launchData) throw new Error('Act intermission did not launch');

    const pick: RoutePick = {
      slot: 'A',
      routeKey: 'up_the_brae',
      atGameTimeSec: 300,
      defaultedBySetting: false,
    };
    const route: RouteDef = {
      key: 'up_the_brae',
      slot: 'A',
      labelKey: 'routes.up_the_brae.label',
      descKey: 'routes.up_the_brae.desc',
      modifierDeltas: {},
    };

    request.mockClear();
    launchData.onResolve(pick, route);

    expect(saveMocks.bumpFirstTimeEvent).toHaveBeenCalledTimes(1);
    expect(saveMocks.bumpFirstTimeEvent).toHaveBeenCalledWith('route_up_the_brae_first');
    expect(request.mock.calls).toEqual([
      ['first_time', { tag: 'route_up_the_brae_first' }],
      ['route_picked', { tag: 'up_the_brae' }],
    ]);

    request.mockClear();
    launchData.onResolve(pick, route);

    expect(saveMocks.bumpFirstTimeEvent).toHaveBeenCalledTimes(2);
    expect(request.mock.calls).toEqual([
      ['route_picked', { tag: 'up_the_brae' }],
    ]);
  });
});
