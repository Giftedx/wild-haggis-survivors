import { describe, expect, it, vi } from 'vitest';
import { CAIRN_FIRST_SPAWN_SEC } from './CairnStackingScheduler';
import { installCairnSystems } from './installCairnSystems';

vi.mock('../../utils/save', () => ({
  bumpCairnBlessing: vi.fn(() => 0),
  loadSave: vi.fn(() => ({ ancestralEchoesTouched: 0 })),
}));

describe('installCairnSystems', () => {
  it('restores cairn stacking progress from active-run resume state', () => {
    const { cairnStacking } = installCairnSystems({
      getRng: () => ({ int: vi.fn(() => 0) }) as never,
      getPlayer: () => ({ active: true, x: 0, y: 0 }) as never,
      getVictoryPending: () => false,
      getJuice: () => ({
        showToast: vi.fn(),
        showMoorMomentBurst: vi.fn(),
        flashWhite: vi.fn(),
      }) as never,
      getBanter: () => null,
      spawnCairnStone: vi.fn(),
      caption: vi.fn(),
      openCairnBoonPicker: vi.fn(),
      cairnResume: {
        stoneCount: 2,
        spawnedCount: 2,
        nextSpawnAtSec: 540,
      },
      getCairns: () => [],
      getRngSample: () => 0.5,
      getOldDroverRevealedCount: () => 0,
      onWalkOver: vi.fn(),
      onSpriteCreate: vi.fn(),
      onSpriteDestroy: vi.fn(),
    });

    expect(cairnStacking.getStoneCount()).toBe(2);
    expect(cairnStacking.getSpawnedCount()).toBe(2);
    expect(cairnStacking.getNextSpawnAtSec()).toBe(540);
    expect(cairnStacking.isSpawnPending()).toBe(false);
  });

  it('keeps fresh-run cairn stacking defaults when no resume state exists', () => {
    const { cairnStacking } = installCairnSystems({
      getRng: () => ({ int: vi.fn(() => 0) }) as never,
      getPlayer: () => ({ active: true, x: 0, y: 0 }) as never,
      getVictoryPending: () => false,
      getJuice: () => ({
        showToast: vi.fn(),
        showMoorMomentBurst: vi.fn(),
        flashWhite: vi.fn(),
      }) as never,
      getBanter: () => null,
      spawnCairnStone: vi.fn(),
      caption: vi.fn(),
      openCairnBoonPicker: vi.fn(),
      cairnResume: null,
      getCairns: () => [],
      getRngSample: () => 0.5,
      getOldDroverRevealedCount: () => 0,
      onWalkOver: vi.fn(),
      onSpriteCreate: vi.fn(),
      onSpriteDestroy: vi.fn(),
    });

    expect(cairnStacking.getStoneCount()).toBe(0);
    expect(cairnStacking.getSpawnedCount()).toBe(0);
    expect(cairnStacking.getNextSpawnAtSec()).toBe(CAIRN_FIRST_SPAWN_SEC);
    expect(cairnStacking.isSpawnPending()).toBe(false);
  });
});
