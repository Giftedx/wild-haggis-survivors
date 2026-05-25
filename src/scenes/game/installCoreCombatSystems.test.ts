import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  let lastWeaponSystem: {
    stormcrownHook?: (enemy: { applyFreeze: ReturnType<typeof vi.fn> }, isCrit: boolean) => void;
  } | null = null;

  class MockSpawnSystem {
    private group = {};
    setSpawnIntervalMult = vi.fn();
    getEnemyGroup() { return this.group; }
  }

  class MockWeaponSystem {
    stormcrownHook?: (enemy: { applyFreeze: ReturnType<typeof vi.fn> }, isCrit: boolean) => void;
    setCurseCooldownMul = vi.fn();
    setHitDamageModifier = vi.fn();
    constructor() {
      lastWeaponSystem = {
        stormcrownHook: undefined,
      };
    }
    setStormcrownOnHitHook(hook: (enemy: { applyFreeze: ReturnType<typeof vi.fn> }, isCrit: boolean) => void) {
      this.stormcrownHook = hook;
      lastWeaponSystem = { stormcrownHook: hook };
    }
  }

  return {
    MockSpawnSystem,
    MockWeaponSystem,
    StatusFxPool: vi.fn(),
    XPSystem: vi.fn(),
    refreshSettings: vi.fn(),
    getLastWeaponSystem: () => lastWeaponSystem,
  };
});

vi.mock('../../systems/StatusFxPool', () => ({ StatusFxPool: mocks.StatusFxPool }));
vi.mock('../../systems/SpawnSystem', () => ({ SpawnSystem: mocks.MockSpawnSystem }));
vi.mock('../../systems/WeaponSystem', () => ({ WeaponSystem: mocks.MockWeaponSystem }));
vi.mock('../../systems/XPSystem', () => ({ XPSystem: mocks.XPSystem }));
vi.mock('../../entities/Enemy', () => ({ Enemy: { refreshSettings: mocks.refreshSettings } }));
vi.mock('../../systems/music/ProceduralMusicEngine', () => ({
  musicEngine: {
    getMsSinceLastQuarterNote: () => 0,
    getQuarterNotePeriodMs: () => 500,
  },
}));

describe('installCoreCombatSystems', () => {
  it('wires Stormcrown crit procs as a full-speed freeze for the configured duration', async () => {
    const { installCoreCombatSystems } = await import('./installCoreCombatSystems');
    const driver = {
      stormcrownFreezeDurationMs: 500,
      tryStormcrownFreeze: vi.fn(() => true),
      modifyWeaponDamage: (n: number) => n,
      modifyEliteDamage: (n: number) => n,
      modifyFishermensNetDamage: (n: number) => n,
      modifyBodhranBeatDamage: (n: number) => n,
      modifyStormcrownDamage: (n: number) => n,
    };
    const rng = { next: vi.fn(() => 0) };
    installCoreCombatSystems({
      scene: { getRunRng: () => rng } as never,
      runModifiers: { spawnIntervalMult: 1, weaponCooldownMult: 1 } as never,
      bossHpTracker: null,
      getRelicEffectDriver: () => driver as never,
    });

    const enemy = { applyFreeze: vi.fn() };
    mocks.getLastWeaponSystem()?.stormcrownHook?.(enemy, true);

    expect(driver.tryStormcrownFreeze).toHaveBeenCalledWith(rng, true);
    expect(enemy.applyFreeze).toHaveBeenCalledWith(0, 500);
  });
});