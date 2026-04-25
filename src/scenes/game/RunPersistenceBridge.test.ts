import { describe, expect, it, vi } from 'vitest';
import { RunPersistenceBridge, type RunPersistenceHooks } from './RunPersistenceBridge';
import { RunScoreState } from './RunScoreState';
import { RunActState } from './RunActState';
import { defaultModifiers } from '../../core/RunModifiers';

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
    relics?: string[];
    ironmoor?: boolean;
  } = {},
) {
  const score = new RunScoreState();
  score.killCount = counters.kills ?? 0;
  score.bossKillCount = counters.bossKills ?? 0;
  score.bossGoldEarned = counters.bossGold ?? 0;
  score.coinGoldEarned = counters.coinGold ?? 0;
  const flags = {
    revival: counters.revival ?? false,
    owned: counters.owned ?? [],
    evolved: counters.evolved ?? [],
    relics: counters.relics ?? [],
  };
  const actState = new RunActState();
  const modifiers = defaultModifiers();
  const ironmoor = counters.ironmoor ?? false;
  return { score, flags, actState, modifiers, ironmoor };
}

function buildHooks(
  stateBundle: ReturnType<typeof buildState>,
  overrides: { runEnd?: boolean; sceneActive?: boolean } = {},
) {
  const { score, flags } = stateBundle;
  const saveManager = {
    saveActiveRun: vi.fn(),
  };
  const weapons = {
    getWeapons: () => [
      { config: { key: 'thistle_shot' }, level: 3, evolved: false, evolutionKey: undefined },
      { config: { key: 'claymore' }, level: 5, evolved: true, evolutionKey: 'legendary_claymore' },
    ],
    replaceWeaponsFromRun: vi.fn(),
    setCurseCooldownMul: vi.fn(),
  };
  const xpSystem = {
    getCurrentXP: () => 42,
    getLevel: () => 5,
    hydrateRunState: vi.fn(),
    setDropValueMultiplier: vi.fn(),
  };
  const spawnSystem = {
    getGameTimeSec: () => 180.5,
    getSpawnedBossKeys: () => ['gordon'],
    applyResumeTime: vi.fn(),
    setSpawnIntervalMult: vi.fn(),
    setEliteWeightMultiplier: vi.fn(),
    setEnemyHpMultiplier: vi.fn(),
  };
  const timeManager = {
    has: vi.fn((k: string) => k === 'RUN_END' && !!overrides.runEnd),
    scheduleRealTime: vi.fn(),
  };
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
    getXPSystem: () => xpSystem as never,
    getWeaponSystem: () => weapons as never,
    getSpawnSystem: () => spawnSystem as never,
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
    getRunScore: () => score,
    getRunActState: () => stateBundle.actState,
    getRunModifiers: () => stateBundle.modifiers,
    isIronmoorRun: () => stateBundle.ironmoor,
    getRevivalAvailable: () => flags.revival,
    getOwnedPassives: () => flags.owned,
    getEvolvedWeapons: () => flags.evolved,
    getHeldRelicKeys: () => flags.relics,
    setRevivalAvailable: (v) => {
      flags.revival = v;
    },
    setOwnedPassives: (p) => {
      flags.owned = p;
    },
    setEvolvedWeapons: (e) => {
      flags.evolved = e;
    },
    restoreHeldRelics: (keys) => {
      flags.relics = [...keys];
    },
    isSceneActive: () => overrides.sceneActive ?? true,
  };
  return { hooks, saveManager, timeManager, weapons, xpSystem, spawnSystem, score, flags };
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
        coinGoldSpent: 0,
        revivalAvailable: true,
        bestCombo: 100,
        comboCount: 20,
        comboTimerMs: 800,
        dashCharges: 1,
        dashCooldownMs: 500,
        weaponDamage: { thistle_shot: 5000 },
        spawnedBossKeys: ['gordon'],
        shieldCooldownMs: 0,
        actState: {
          currentAct: 1,
          actStartTimeSec: 0,
          pickerHistory: [],
        },
        ironmoor: false,
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

    it('snapshots held relic keys in slot order when present', () => {
      const state = buildState({ relics: ['sporran_of_holding', 'bronze_clasp'] });
      const { hooks } = buildHooks(state);
      const snapshot = new RunPersistenceBridge(hooks).collect();
      expect(snapshot.heldRelicKeys).toEqual(['sporran_of_holding', 'bronze_clasp']);
      expect(snapshot.heldRelicKeys).not.toBe(state.flags.relics);
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
    it('pushes counter state back into RunScoreState', () => {
      const state = buildState();
      const { hooks, score, flags } = buildHooks(state);
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
        heldRelicKeys: ['sporran_of_holding'],
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
      expect(score.killCount).toBe(77);
      expect(score.bossKillCount).toBe(1);
      expect(score.bossGoldEarned).toBe(50);
      expect(score.coinGoldEarned).toBe(30);
      expect(flags.revival).toBe(true);
      expect(flags.owned).toEqual(['greaves']);
      expect(flags.relics).toEqual(['sporran_of_holding']);
    });

    it('snapshots the run-scoped ironmoor flag (locked-in, not live setting)', () => {
      const state = buildState({ ironmoor: true });
      const { hooks } = buildHooks(state);
      const snapshot = new RunPersistenceBridge(hooks).collect();
      expect(snapshot.ironmoor).toBe(true);
    });

    it('restores RunActState + re-applies route modifierDeltas from pickerHistory', () => {
      const state = buildState();
      const { hooks, weapons, timeManager } = buildHooks(state);
      // Mock spawnSystem on hooks so we can assert setSpawnIntervalMult was called.
      const spawnSys = {
        getGameTimeSec: () => 0,
        getSpawnedBossKeys: () => [],
        applyResumeTime: vi.fn(),
        setSpawnIntervalMult: vi.fn(),
      };
      hooks.getSpawnSystem = () => spawnSys as never;
      new RunPersistenceBridge(hooks).applyResume({
        killCount: 0,
        bossKillCount: 1,
        bossGoldEarned: 0,
        coinGoldEarned: 0,
        ownedPassives: [],
        evolvedWeaponKeys: [],
        acquiredWeapons: [],
        currentLevel: 1,
        currentXp: 0,
        selectedVariantKey: 'classic',
        gameTimeSec: 360,
        playerX: 0,
        playerY: 0,
        playerHealth: 50,
        playerMaxHp: 100,
        weaponDamage: {},
        spawnedBossKeys: ['gordon'],
        shieldCooldownMs: 0,
        actState: {
          currentAct: 2,
          actStartTimeSec: 300,
          pickerHistory: [
            {
              slot: 'A',
              routeKey: 'through_the_kirkyard',
              atGameTimeSec: 300,
              defaultedBySetting: false,
            },
          ],
        },
      } as never);
      // Act state mirrors the snapshot — no re-picker fires on the re-killed gordon.
      expect(state.actState.currentAct).toBe(2);
      expect(state.actState.actStartTimeSec).toBe(300);
      expect(state.actState.pickerHistory).toHaveLength(1);
      expect(state.actState.pickerHistory[0].routeKey).toBe('through_the_kirkyard');
      // runModifiers route log + multiplier replayed.
      expect(state.modifiers.routePicks).toHaveLength(1);
      expect(state.modifiers.spawnIntervalMult).toBe(0.7);
      // SpawnSystem + WeaponSystem caches resynced (the core bug fix).
      expect(spawnSys.setSpawnIntervalMult).toHaveBeenCalledWith(0.7);
      expect(weapons.setCurseCooldownMul).toHaveBeenCalledWith(1);
      expect(timeManager.scheduleRealTime).toHaveBeenCalledWith(30_000, expect.any(Function));
    });

    it('does not restore an expired timed route modifier', () => {
      const state = buildState();
      const { hooks, spawnSystem, timeManager } = buildHooks(state);
      new RunPersistenceBridge(hooks).applyResume({
        killCount: 0,
        ownedPassives: [],
        evolvedWeaponKeys: [],
        acquiredWeapons: [],
        currentLevel: 1,
        currentXp: 0,
        selectedVariantKey: 'classic',
        gameTimeSec: 391,
        playerX: 0,
        playerY: 0,
        playerHealth: 50,
        playerMaxHp: 100,
        weaponDamage: {},
        spawnedBossKeys: [],
        shieldCooldownMs: 0,
        actState: {
          currentAct: 2,
          actStartTimeSec: 300,
          pickerHistory: [
            {
              slot: 'A',
              routeKey: 'through_the_kirkyard',
              atGameTimeSec: 300,
              defaultedBySetting: false,
            },
          ],
        },
      } as never);
      expect(state.modifiers.spawnIntervalMult).toBe(1);
      expect(spawnSystem.setSpawnIntervalMult).toHaveBeenCalledWith(1);
      expect(timeManager.scheduleRealTime).not.toHaveBeenCalled();
    });

    it('restores timed XP route state with remaining duration', () => {
      const state = buildState();
      const { hooks, xpSystem, timeManager } = buildHooks(state);
      new RunPersistenceBridge(hooks).applyResume({
        killCount: 0,
        ownedPassives: [],
        evolvedWeaponKeys: [],
        acquiredWeapons: [],
        currentLevel: 1,
        currentXp: 0,
        selectedVariantKey: 'classic',
        gameTimeSec: 615,
        playerX: 0,
        playerY: 0,
        playerHealth: 50,
        playerMaxHp: 100,
        weaponDamage: {},
        spawnedBossKeys: [],
        shieldCooldownMs: 0,
        actState: {
          currentAct: 3,
          actStartTimeSec: 600,
          pickerHistory: [
            {
              slot: 'B',
              routeKey: 'stand_yer_ground',
              atGameTimeSec: 600,
              defaultedBySetting: false,
            },
          ],
        },
      } as never);
      expect(xpSystem.setDropValueMultiplier).toHaveBeenCalledWith(2);
      expect(timeManager.scheduleRealTime).toHaveBeenCalledWith(15_000, expect.any(Function));
    });

    it('restores persistent route side-effect caches without replaying one-shot rewards', () => {
      const state = buildState();
      const { hooks, spawnSystem } = buildHooks(state);
      new RunPersistenceBridge(hooks).applyResume({
        killCount: 0,
        ownedPassives: [],
        evolvedWeaponKeys: [],
        acquiredWeapons: [],
        currentLevel: 1,
        currentXp: 0,
        selectedVariantKey: 'classic',
        gameTimeSec: 700,
        playerX: 0,
        playerY: 0,
        playerHealth: 50,
        playerMaxHp: 100,
        weaponDamage: {},
        spawnedBossKeys: [],
        shieldCooldownMs: 0,
        actState: {
          currentAct: 3,
          actStartTimeSec: 600,
          pickerHistory: [
            {
              slot: 'A',
              routeKey: 'up_the_brae',
              atGameTimeSec: 300,
              defaultedBySetting: false,
            },
            {
              slot: 'B',
              routeKey: 'buckie_pitstop',
              atGameTimeSec: 600,
              defaultedBySetting: false,
            },
          ],
        },
      } as never);
      expect(spawnSystem.setEliteWeightMultiplier).toHaveBeenCalledWith(1.5);
      expect(spawnSystem.setEnemyHpMultiplier).toHaveBeenCalledWith(1.1);
    });

    it('round-trips currentNodeIndex + nodeOutcomes through actState (T101 sub-fix)', () => {
      const state = buildState();
      const { hooks } = buildHooks(state);
      // Seed live actState with some node visits, snapshot, then restore on a
      // fresh actState to confirm the values survive serialise → coerce → restore.
      state.actState.currentNodeIndex = 2;
      state.actState.recordNodeOutcome({
        nodeKey: 'a1_rest_bothy',
        visitedAtGameTimeSec: 120,
      });
      state.actState.recordNodeOutcome({
        nodeKey: 'a1_shrine_cairn',
        chosenRewardKey: 'buff_damage',
        visitedAtGameTimeSec: 180,
      });

      const snapshot = new RunPersistenceBridge(hooks).collect();
      expect(snapshot.actState?.currentNodeIndex).toBe(2);
      expect(snapshot.actState?.nodeOutcomes).toEqual([
        { nodeKey: 'a1_rest_bothy', visitedAtGameTimeSec: 120 },
        { nodeKey: 'a1_shrine_cairn', chosenRewardKey: 'buff_damage', visitedAtGameTimeSec: 180 },
      ]);

      // Reset live actState then re-apply the snapshot — restored values must match.
      state.actState.reset();
      new RunPersistenceBridge(hooks).applyResume({
        ...snapshot,
      } as never);
      expect(state.actState.currentNodeIndex).toBe(2);
      expect(state.actState.nodeOutcomes).toEqual([
        { nodeKey: 'a1_rest_bothy', visitedAtGameTimeSec: 120 },
        { nodeKey: 'a1_shrine_cairn', chosenRewardKey: 'buff_damage', visitedAtGameTimeSec: 180 },
      ]);
    });

    it('round-trips the rolled nodeMap with visited[] preserved (T101)', () => {
      const state = buildState();
      const { hooks } = buildHooks(state);
      // Stub a NodeMapState into actState — keys come from ACT_1_BANK so
      // the lookup-by-key path resolves the NodeDefs back. visited[] is
      // mid-progress so the round-trip must keep it intact.
      const nodes = [
        { key: 'a1_thistle_ambush' },
        { key: 'a1_shrine_cairn' },
        { key: 'a1_rest_bothy' },
      ] as never;
      const positions = [
        { x: 100, y: 200 },
        { x: 800, y: 350 },
        { x: 1500, y: 500 },
      ];
      state.actState.currentActNodeMap = {
        act: 1,
        nodes,
        worldPositions: positions,
        visited: [true, false, false],
      };
      state.actState.currentNodeIndex = 1;

      const snapshot = new RunPersistenceBridge(hooks).collect();
      expect(snapshot.actState?.nodeMap).toEqual({
        act: 1,
        nodeKeys: ['a1_thistle_ambush', 'a1_shrine_cairn', 'a1_rest_bothy'],
        worldPositions: positions,
        visited: [true, false, false],
      });

      // Reset and re-apply → live actState rebuilds the same map state.
      state.actState.reset();
      let suppressed = 0;
      hooks.suppressNextNodeMapRoll = () => { suppressed++; };
      new RunPersistenceBridge(hooks).applyResume({ ...snapshot } as never);
      expect(suppressed).toBe(1);
      expect(state.actState.currentActNodeMap).not.toBeNull();
      const restored = state.actState.currentActNodeMap!;
      expect(restored.act).toBe(1);
      expect(restored.nodes.map((n) => n.key)).toEqual([
        'a1_thistle_ambush', 'a1_shrine_cairn', 'a1_rest_bothy',
      ]);
      expect(restored.worldPositions).toEqual(positions);
      expect(restored.visited).toEqual([true, false, false]);
    });

    it('omits nodeMap from snapshot when no act-map has been rolled yet (T101)', () => {
      const { hooks } = buildHooks(buildState());
      const snapshot = new RunPersistenceBridge(hooks).collect();
      expect(snapshot.actState?.nodeMap).toBeUndefined();
    });

    it('falls back to re-roll when restored nodeMap references an unknown key (T101)', () => {
      const state = buildState();
      const { hooks } = buildHooks(state);
      let suppressed = 0;
      hooks.suppressNextNodeMapRoll = () => { suppressed++; };
      new RunPersistenceBridge(hooks).applyResume({
        killCount: 0,
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
        weaponDamage: {},
        spawnedBossKeys: [],
        shieldCooldownMs: 0,
        actState: {
          currentAct: 1,
          actStartTimeSec: 0,
          pickerHistory: [],
          nodeMap: {
            act: 1,
            nodeKeys: ['a1_does_not_exist'],
            worldPositions: [{ x: 0, y: 0 }],
            visited: [false],
          },
        },
      } as never);
      // Lookup failed → live actState's currentActNodeMap stays null and
      // the suppression hook never fires — GameScene re-rolls normally.
      expect(state.actState.currentActNodeMap).toBeNull();
      expect(suppressed).toBe(0);
    });

    it('omits currentNodeIndex + nodeOutcomes from snapshot when default-zero (no orphan keys)', () => {
      const { hooks } = buildHooks(buildState());
      const snapshot = new RunPersistenceBridge(hooks).collect();
      expect(snapshot.actState?.currentNodeIndex).toBeUndefined();
      expect(snapshot.actState?.nodeOutcomes).toBeUndefined();
    });

    it('round-trips active TempBuffBag entries via snapshotEntries (T101 follow-up)', async () => {
      // Use the real TempBuffBag + a fake Player so the round-trip exercises
      // the registry (apply → revert pair) end-to-end.
      const { TempBuffBag } = await import('../../systems/TempBuffBag');
      const bag = new TempBuffBag();
      const playerFake = {
        x: 0, y: 0,
        getHp: () => 60, getMaxHp: () => 100,
        getDashCharges: () => 0, getDashCooldownMs: () => 0,
        getShieldCooldownMs: () => 0,
        onLevelUp: vi.fn(),
        setResumeHealth: vi.fn(),
        setResumeShieldCooldown: vi.fn(),
        setResumeDashState: vi.fn(),
        damage: 0,
        addDamageMultiplier: vi.fn(function (this: { damage: number }, d: number) { this.damage += d; }),
      };
      // Hand-bind so `this` survives the registry's arrow-function calls.
      playerFake.addDamageMultiplier = playerFake.addDamageMultiplier.bind(playerFake);

      const state = buildState();
      const { hooks } = buildHooks(state);
      hooks.getPlayer = () => playerFake as never;
      hooks.getTempBuffBag = () => bag;

      // Live: apply a damage buff via the registry path.
      const { applyShrineBuff } = await import('../../systems/shrineBuffRegistry');
      applyShrineBuff(bag, 'buff_damage', 600, { player: playerFake } as never);
      expect(bag.activeCount()).toBe(1);
      expect(playerFake.damage).toBeCloseTo(0.25);

      const snapshot = new RunPersistenceBridge(hooks).collect();
      expect(snapshot.tempBuffs).toEqual([
        { key: 'buff_damage', remainingMs: 600 },
      ]);

      // Reset bag + player + actState; re-apply snapshot. Buff re-attaches.
      const freshBag = new TempBuffBag();
      const freshPlayer = { ...playerFake, damage: 0 };
      freshPlayer.addDamageMultiplier = (function (this: typeof freshPlayer, d: number) {
        this.damage += d;
      }).bind(freshPlayer);
      hooks.getTempBuffBag = () => freshBag;
      hooks.getPlayer = () => freshPlayer as never;
      state.actState.reset();
      new RunPersistenceBridge(hooks).applyResume({ ...snapshot } as never);
      expect(freshBag.activeCount()).toBe(1);
      expect(freshPlayer.damage).toBeCloseTo(0.25);

      // Tick past expiry → revert lands on the fresh player.
      freshBag.tick(700);
      expect(freshBag.activeCount()).toBe(0);
      expect(freshPlayer.damage).toBeCloseTo(0);
    });

    it('omits tempBuffs from snapshot when bag is empty (no orphan key)', () => {
      const { hooks } = buildHooks(buildState());
      const snapshot = new RunPersistenceBridge(hooks).collect();
      expect(snapshot.tempBuffs).toBeUndefined();
    });

    it('clamps negative counters to 0 (defensive against malformed saves)', () => {
      const state = buildState();
      const { hooks, score } = buildHooks(state);
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
      expect(score.bossKillCount).toBe(0);
      expect(score.bossGoldEarned).toBe(0);
      expect(score.coinGoldEarned).toBe(0);
    });
  });
});
