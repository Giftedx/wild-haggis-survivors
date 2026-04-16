import { describe, expect, it, vi } from 'vitest';
import { RunPersistenceBridge, type RunPersistenceHooks } from './RunPersistenceBridge';

/**
 * Harness covers the snapshot shape (schema drift is a known risk class
 * — see R2 in HUGE_INITIATIVES_MASTER_PLAN) and the persist-during-RUN_END
 * skip. The window pagehide / beforeunload listeners are deliberately
 * skipped here; e2e/resume.spec.ts covers the integrated save→reload path.
 */

function buildState(
  counters: {
    kills?: number;
    bossKills?: number;
    bossGold?: number;
    coinGold?: number;
    revival?: boolean;
    owned?: string[];
    evolved?: string[];
  } = {},
) {
  const state = {
    kills: counters.kills ?? 0,
    bossKills: counters.bossKills ?? 0,
    bossGold: counters.bossGold ?? 0,
    coinGold: counters.coinGold ?? 0,
    revival: counters.revival ?? false,
    owned: counters.owned ?? [],
    evolved: counters.evolved ?? [],
  };
  return state;
}

function buildHooks(
  state: ReturnType<typeof buildState>,
  overrides: { runEnd?: boolean; sceneActive?: boolean } = {},
) {
  const saveManager = {
    saveActiveRun: vi.fn(),
  };
  const weapons = {
    getWeapons: () => [
      { config: { key: 'thistle_shot' }, level: 3, evolved: false, evolutionKey: undefined },
      { config: { key: 'claymore' }, level: 5, evolved: true, evolutionKey: 'legendary_claymore' },
    ],
    replaceWeaponsFromRun: vi.fn(),
  };
  const timeManager = { has: vi.fn((k: string) => k === 'RUN_END' && !!overrides.runEnd) };
  const hooks: RunPersistenceHooks = {
    getPlayer: () =>
      ({
        x: 123.5,
        y: 456.25,
        getHp: () => 60,
        getMaxHp: () => 100,
        getDashCharges: () => 1,
        getDashCooldownMs: () => 500,
        getShieldCooldownMs: () => 0,
        onLevelUp: vi.fn(),
        setResumeHealth: vi.fn(),
        setResumeShieldCooldown: vi.fn(),
        setResumeDashState: vi.fn(),
      }) as never,
    getXPSystem: () =>
      ({
        getCurrentXP: () => 42,
        getLevel: () => 5,
        hydrateRunState: vi.fn(),
      }) as never,
    getWeaponSystem: () => weapons as never,
    getSpawnSystem: () =>
      ({
        getGameTimeSec: () => 180.5,
        getSpawnedBossKeys: () => ['gordon'],
        applyResumeTime: vi.fn(),
      }) as never,
    getJuice: () =>
      ({
        getBestCombo: () => 100,
        getComboCount: () => 20,
        getComboTimerRemainingMs: () => 800,
      }) as never,
    getTimeManager: () => timeManager as never,
    getRunStatsTracker: () =>
      ({
        snapshot: () => ({ thistle_shot: 5000 }),
        restore: vi.fn(),
      }) as never,
    getMoorMoments: () => ({ pushAfterResume: vi.fn() }) as never,
    getLevelUpFlow: () => ({ applyPassiveEffect: vi.fn() }) as never,
    getSaveManager: () => saveManager as never,
    getActiveVariant: () => ({ key: 'moor_runner' }) as never,
    getKillCount: () => state.kills,
    getBossKillCount: () => state.bossKills,
    getBossGoldEarned: () => state.bossGold,
    getCoinGoldEarned: () => state.coinGold,
    getRevivalAvailable: () => state.revival,
    getOwnedPassives: () => state.owned,
    getEvolvedWeapons: () => state.evolved,
    setKillCount: (n) => {
      state.kills = n;
    },
    setBossKillCount: (n) => {
      state.bossKills = n;
    },
    setBossGoldEarned: (n) => {
      state.bossGold = n;
    },
    setCoinGoldEarned: (n) => {
      state.coinGold = n;
    },
    setRevivalAvailable: (v) => {
      state.revival = v;
    },
    setOwnedPassives: (p) => {
      state.owned = p;
    },
    setEvolvedWeapons: (e) => {
      state.evolved = e;
    },
    isSceneActive: () => overrides.sceneActive ?? true,
  };
  return { hooks, saveManager, timeManager, weapons };
}

describe('RunPersistenceBridge', () => {
  describe('collect', () => {
    it('snapshots counters + systems into an IRunState shape', () => {
      const state = buildState({
        kills: 250,
        bossKills: 2,
        bossGold: 400,
        coinGold: 125,
        revival: true,
        owned: ['greaves'],
        evolved: ['claymore'],
      });
      const { hooks } = buildHooks(state);
      const snapshot = new RunPersistenceBridge(hooks).collect();
      expect(snapshot).toEqual({
        gameTimeSec: 180.5,
        playerX: 123.5,
        playerY: 456.25,
        playerHealth: 60,
        playerMaxHp: 100,
        currentXp: 42,
        currentLevel: 5,
        acquiredWeapons: [
          { key: 'thistle_shot', level: 3, evolved: false, evolutionKey: '' },
          { key: 'claymore', level: 5, evolved: true, evolutionKey: 'legendary_claymore' },
        ],
        selectedVariantKey: 'moor_runner',
        killCount: 250,
        ownedPassives: ['greaves'],
        evolvedWeaponKeys: ['claymore'],
        bossKillCount: 2,
        bossGoldEarned: 400,
        coinGoldEarned: 125,
        revivalAvailable: true,
        bestCombo: 100,
        comboCount: 20,
        comboTimerMs: 800,
        dashCharges: 1,
        dashCooldownMs: 500,
        weaponDamage: { thistle_shot: 5000 },
        spawnedBossKeys: ['gordon'],
        shieldCooldownMs: 0,
      });
    });

    it('defensive-copies owned/evolved arrays (mutation is safe)', () => {
      const owned = ['a', 'b'];
      const evolved = ['c'];
      const { hooks } = buildHooks(buildState({ owned, evolved }));
      const snapshot = new RunPersistenceBridge(hooks).collect();
      expect(snapshot.ownedPassives).not.toBe(owned);
      expect(snapshot.evolvedWeaponKeys).not.toBe(evolved);
    });
  });

  describe('persist', () => {
    it('saves via SaveManager under normal conditions', () => {
      const { hooks, saveManager } = buildHooks(buildState());
      new RunPersistenceBridge(hooks).persist();
      expect(saveManager.saveActiveRun).toHaveBeenCalledOnce();
    });

    it('skips during RUN_END (stale snapshot would reappear on relaunch)', () => {
      const { hooks, saveManager } = buildHooks(buildState(), { runEnd: true });
      new RunPersistenceBridge(hooks).persist();
      expect(saveManager.saveActiveRun).not.toHaveBeenCalled();
    });

    it('swallows save errors (best-effort path)', () => {
      const { hooks, saveManager } = buildHooks(buildState());
      saveManager.saveActiveRun.mockImplementation(() => {
        throw new Error('localStorage full');
      });
      expect(() => new RunPersistenceBridge(hooks).persist()).not.toThrow();
    });
  });

  describe('applyResume', () => {
    it('pushes counter state back through setter hooks', () => {
      const state = buildState();
      const { hooks } = buildHooks(state);
      new RunPersistenceBridge(hooks).applyResume({
        gameTimeSec: 0,
        playerX: 0,
        playerY: 0,
        playerHealth: 50,
        playerMaxHp: 100,
        currentXp: 10,
        currentLevel: 3,
        acquiredWeapons: [],
        selectedVariantKey: 'classic',
        killCount: 77,
        ownedPassives: ['greaves'],
        evolvedWeaponKeys: ['claymore'],
        bossKillCount: 1,
        bossGoldEarned: 50,
        coinGoldEarned: 30,
        revivalAvailable: true,
        bestCombo: 0,
        comboCount: 0,
        comboTimerMs: 0,
        dashCharges: 2,
        dashCooldownMs: 0,
        weaponDamage: {},
        spawnedBossKeys: [],
        shieldCooldownMs: 0,
      } as never);
      expect(state.kills).toBe(77);
      expect(state.bossKills).toBe(1);
      expect(state.bossGold).toBe(50);
      expect(state.coinGold).toBe(30);
      expect(state.revival).toBe(true);
      expect(state.owned).toEqual(['greaves']);
    });

    it('clamps negative counters to 0 (defensive against malformed saves)', () => {
      const state = buildState();
      const { hooks } = buildHooks(state);
      new RunPersistenceBridge(hooks).applyResume({
        killCount: 0,
        bossKillCount: -5,
        bossGoldEarned: -100,
        coinGoldEarned: -1,
        ownedPassives: [],
        evolvedWeaponKeys: [],
        acquiredWeapons: [],
        currentLevel: 1,
        currentXp: 0,
        selectedVariantKey: 'classic',
        gameTimeSec: 0,
        playerX: 0,
        playerY: 0,
        playerHealth: 50,
        playerMaxHp: 100,
        bestCombo: 0,
        comboCount: 0,
        comboTimerMs: 0,
        dashCharges: 0,
        dashCooldownMs: 0,
        weaponDamage: {},
        spawnedBossKeys: [],
        shieldCooldownMs: 0,
      } as never);
      expect(state.bossKills).toBe(0);
      expect(state.bossGold).toBe(0);
      expect(state.coinGold).toBe(0);
    });
  });
});
