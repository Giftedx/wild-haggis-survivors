import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { AchievementManager } from './AchievementManager';
import { globalEventBus } from './GlobalEventBus';
import { SaveManager } from './SaveManager';
import { MemoryStorage } from '../test/MemoryStorage';
import { BOSSES, ENEMY_TYPES } from '../data/enemies';
import { createDefaultSave, writeSave } from '../utils/save';
import { ROUTES } from '../data/routes';
import { VARIANT_KEYS } from '../data/variants';

function allCodexKeysSorted(): string[] {
  const s = new Set<string>();
  for (const k of Object.keys(ENEMY_TYPES)) s.add(k);
  for (const b of BOSSES) s.add(b.key);
  return [...s].sort();
}

describe('AchievementManager', () => {
  let storage: MemoryStorage;
  let save: SaveManager;
  let mgr: AchievementManager;

  beforeEach(() => {
    storage = new MemoryStorage();
    save = new SaveManager({ storage, key: 'ach_test' });
    save.save({
      saveVersion: 9,
      totalKills: 0,
      totalKillsSpent: 0,
      dailyChallenge: null,
      unlockedWeapons: [],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
      hasCompletedTutorial: true,
      hasSeenDriftTutorial: false,
      hasSeenEliteAffixTip: false,
      hasSeenMoorMomentTip: false,
      hasSeenCeilidhChainTip: false,
      hasSeenStandingStonesTip: false,
      hasSeenAncestralEchoTip: false,
      moorMomentsLifetime: 0,
      runHistory: [],
      codexCulledKeys: [],
    });
    mgr = new AchievementManager(save);
    mgr.start();
  });

  afterEach(() => {
    mgr.stop();
  });

  it('unlocks ach_kills_1000 when meta kill total reaches 1000', () => {
    save.save({ ...save.load(), totalKills: 1000 });
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: 'tourist',
      xpValue: 1,
      wasBoss: false,
      wasElite: false,
    });
    expect(save.load().unlockedAchievements).toContain('ach_kills_1000');
  });

  it('unlocks ach_survive_10m when run clock crosses 600s', () => {
    globalEventBus.emit('GLOBAL_RUN_TIME_SEC', { gameTimeSec: 600, wholeSecond: 600 });
    expect(save.load().unlockedAchievements).toContain('ach_survive_10m');
  });

  it('unlocks ach_defeat_taxman on taxman boss kill', () => {
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: 'taxman',
      xpValue: 100,
      wasBoss: true,
      wasElite: false,
    });
    expect(save.load().unlockedAchievements).toContain('ach_defeat_taxman');
  });

  it('emits ACHIEVEMENT_UNLOCKED once per id', () => {
    const titles: string[] = [];
    const off = globalEventBus.on('ACHIEVEMENT_UNLOCKED', (p) => titles.push(p.title));
    globalEventBus.emit('GLOBAL_RUN_TIME_SEC', { gameTimeSec: 700, wholeSecond: 700 });
    globalEventBus.emit('GLOBAL_RUN_TIME_SEC', { gameTimeSec: 701, wholeSecond: 701 });
    off();
    expect(titles.filter((t) => t === 'Heather Marathon')).toHaveLength(1);
  });

  it('unlocks ach_survive_5m at 300s', () => {
    globalEventBus.emit('GLOBAL_RUN_TIME_SEC', { gameTimeSec: 300, wholeSecond: 300 });
    expect(save.load().unlockedAchievements).toContain('ach_survive_5m');
  });

  it('unlocks ach_full_run at 900s', () => {
    globalEventBus.emit('GLOBAL_RUN_TIME_SEC', { gameTimeSec: 900, wholeSecond: 900 });
    expect(save.load().unlockedAchievements).toContain('ach_full_run');
  });

  it('unlocks ach_kills_5000 when meta kill total reaches 5000', () => {
    save.save({ ...save.load(), totalKills: 5000 });
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: 'tourist',
      xpValue: 1,
      wasBoss: false,
      wasElite: false,
    });
    expect(save.load().unlockedAchievements).toContain('ach_kills_5000');
  });

  it('unlocks ach_first_victory on victory run end', () => {
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory',
      gameTimeSec: 900,
      enemiesKilled: 500,
    });
    expect(save.load().unlockedAchievements).toContain('ach_first_victory');
  });

  it('does not unlock ach_first_victory on death', () => {
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death',
      gameTimeSec: 200,
      enemiesKilled: 50,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_first_victory');
  });

  it('unlocks ach_first_evolution on weapon evolve event', () => {
    globalEventBus.emit('GLOBAL_WEAPON_EVOLVED', {
      weaponKey: 'thistle_shot',
      evolvedKey: 'thistle_storm',
    });
    expect(save.load().unlockedAchievements).toContain('ach_first_evolution');
  });

  it('unlocks ach_combo_100 when combo milestone fires at 100', () => {
    globalEventBus.emit('GLOBAL_COMBO_MILESTONE', { count: 100 });
    expect(save.load().unlockedAchievements).toContain('ach_combo_100');
  });

  it('does not unlock ach_combo_100 below the 100 threshold', () => {
    globalEventBus.emit('GLOBAL_COMBO_MILESTONE', { count: 99 });
    expect(save.load().unlockedAchievements).not.toContain('ach_combo_100');
  });

  it('unlocks ach_moor_hearth_30 after 30 moor moments (lifetime)', () => {
    for (let i = 0; i < 30; i++) {
      globalEventBus.emit('GLOBAL_MOOR_MOMENT', {
        momentId: 'peat_glint',
        atHomeBiome: false,
        biomeId: 'bog',
      });
    }
    expect(save.load().moorMomentsLifetime).toBe(30);
    expect(save.load().unlockedAchievements).toContain('ach_moor_hearth_30');
  });

  it('unlocks ach_all_bosses when every boss killed in one run', () => {
    // Derive bossKeys from BOSSES so adding a boss never silently drifts
    // this test (caught 2026-04-28 after each_uisge shipped without the
    // hand-maintained list being updated). AchievementManager.ts:84
    // unlocks at runBossKills.size >= BOSSES.length, so emit one kill per
    // boss key in the source-of-truth list.
    const bossKeys = BOSSES.map(b => b.key);
    for (const key of bossKeys) {
      globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
        enemyKey: key,
        xpValue: 100,
        wasBoss: true,
        wasElite: false,
      });
    }
    expect(save.load().unlockedAchievements).toContain('ach_all_bosses');
  });

  it('unlocks ach_codex_half when crossing half the bestiary', () => {
    const keys = allCodexKeysSorted();
    const total = keys.length;
    const half = Math.max(1, Math.ceil(total * 0.5));
    save.save({ ...save.load(), codexCulledKeys: keys.slice(0, half - 1) });
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: keys[half - 1],
      xpValue: 1,
      wasBoss: false,
      wasElite: false,
    });
    expect(save.load().unlockedAchievements).toContain('ach_codex_half');
    expect(save.load().unlockedAchievements).not.toContain('ach_codex_loremaster');
  });

  it('unlocks ach_codex_loremaster when the codex is complete', () => {
    const keys = allCodexKeysSorted();
    const total = keys.length;
    save.save({ ...save.load(), codexCulledKeys: keys.slice(0, total - 1) });
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: keys[total - 1],
      xpValue: 1,
      wasBoss: false,
      wasElite: false,
    });
    expect(save.load().unlockedAchievements).toContain('ach_codex_loremaster');
  });

  it('records codex first cull once per enemy key and emits CODEX_FIRST_CULL', () => {
    const firstCulls: string[] = [];
    const u = globalEventBus.on('CODEX_FIRST_CULL', (p) => firstCulls.push(p.enemyKey));
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: 'tourist',
      xpValue: 1,
      wasBoss: false,
      wasElite: false,
    });
    expect(save.load().codexCulledKeys).toContain('tourist');
    expect(firstCulls).toEqual(['tourist']);
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: 'tourist',
      xpValue: 1,
      wasBoss: false,
      wasElite: false,
    });
    expect(firstCulls).toEqual(['tourist']);
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
      enemyKey: 'chef',
      xpValue: 2,
      wasBoss: false,
      wasElite: false,
    });
    expect(save.load().codexCulledKeys.sort()).toEqual(['chef', 'tourist']);
    expect(firstCulls).toEqual(['tourist', 'chef']);
    u();
  });

  it('clears run boss kills between runs', () => {
    // Kill 3 bosses in first run
    for (const key of ['gordon', 'tour_bus', 'the_laird']) {
      globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
        enemyKey: key, xpValue: 100, wasBoss: true, wasElite: false,
      });
    }
    // End run (clears boss tracking)
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 300, enemiesKilled: 100,
    });
    // Kill 2 bosses in second run — total is only 2, not 5
    for (const key of ['hunter_general', 'taxman']) {
      globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
        enemyKey: key, xpValue: 100, wasBoss: true, wasElite: false,
      });
    }
    expect(save.load().unlockedAchievements).not.toContain('ach_all_bosses');
  });
});

/**
 * Achievements whose unlock predicate reads the gameplay save via
 * `loadSave()` directly (not the injected SaveManager) — Standing
 * Stones, Ancestral Echoes, Ceilidh Chain. These need a real
 * `localStorage` shim because `loadSave` hits the `whs_save` key on
 * `globalThis.localStorage`, not the per-test SaveManager storage.
 */
describe('AchievementManager — gameplay-save-driven unlocks', () => {
  let storage: MemoryStorage;
  let save: SaveManager;
  let mgr: AchievementManager;
  let originalLocalStorage: Storage | undefined;

  beforeEach(async () => {
    storage = new MemoryStorage();
    save = new SaveManager({ storage, key: 'ach_test' });
    save.save({
      saveVersion: 9,
      totalKills: 0,
      totalKillsSpent: 0,
      dailyChallenge: null,
      unlockedWeapons: [],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
      hasCompletedTutorial: true,
      hasSeenDriftTutorial: false,
      hasSeenEliteAffixTip: false,
      hasSeenMoorMomentTip: false,
      hasSeenCeilidhChainTip: false,
      hasSeenStandingStonesTip: false,
      hasSeenAncestralEchoTip: false,
      moorMomentsLifetime: 0,
      runHistory: [],
      codexCulledKeys: [],
    });

    // Install an in-memory localStorage so loadSave/writeSave hit a
    // sandbox we control — node env has no real localStorage.
    originalLocalStorage = (globalThis as { localStorage?: Storage }).localStorage;
    const memMap = new Map<string, string>();
    (globalThis as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => memMap.get(k) ?? null,
      setItem: (k: string, v: string) => { memMap.set(k, v); },
      removeItem: (k: string) => { memMap.delete(k); },
      clear: () => { memMap.clear(); },
      key: () => null,
      get length() { return memMap.size; },
    } as Storage;

    mgr = new AchievementManager(save);
    mgr.start();
  });

  afterEach(() => {
    mgr.stop();
    if (originalLocalStorage === undefined) {
      delete (globalThis as { localStorage?: Storage }).localStorage;
    } else {
      (globalThis as { localStorage: Storage }).localStorage = originalLocalStorage;
    }
  });

  function seedGameplaySave(extras: Record<string, unknown>): void {
    const base = createDefaultSave();
    writeSave({ ...base, ...extras } as ReturnType<typeof createDefaultSave>);
  }

  it('unlocks ach_stone_circle when all three boons have been picked', () => {
    seedGameplaySave({ standingStonesPicked: { mending: 1, fire: 1, haste: 1 } });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 400, enemiesKilled: 100,
    });
    expect(save.load().unlockedAchievements).toContain('ach_stone_circle');
  });

  it('does NOT unlock ach_stone_circle when one boon is missing', () => {
    seedGameplaySave({ standingStonesPicked: { mending: 5, fire: 5 } });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 400, enemiesKilled: 100,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_stone_circle');
  });

  it('unlocks ach_echo_touched on first Ancestral Echo touch', () => {
    seedGameplaySave({ ancestralEchoesTouched: 1 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 60, enemiesKilled: 10,
    });
    expect(save.load().unlockedAchievements).toContain('ach_echo_touched');
  });

  it('unlocks ach_relic_seeker on first Reliquary curio pick', () => {
    seedGameplaySave({ reliquaryCuriosPicked: { flint_charm: 1 } });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 400, enemiesKilled: 50,
    });
    expect(save.load().unlockedAchievements).toContain('ach_relic_seeker');
  });

  it('does NOT unlock ach_relic_seeker when no relic has been picked', () => {
    seedGameplaySave({ reliquaryCuriosPicked: {} });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 400, enemiesKilled: 50,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_relic_seeker');
  });

  it('does NOT unlock ach_echo_touched when count is 0', () => {
    seedGameplaySave({ ancestralEchoesTouched: 0 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 60, enemiesKilled: 10,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_echo_touched');
  });

  it('unlocks ach_ceilidh_commander at 15 lifetime pulses', () => {
    seedGameplaySave({ ceilidhPulsesLifetime: 15 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 300, enemiesKilled: 120,
    });
    expect(save.load().unlockedAchievements).toContain('ach_ceilidh_commander');
  });

  it('does NOT unlock ach_ceilidh_commander at 14 pulses', () => {
    seedGameplaySave({ ceilidhPulsesLifetime: 14 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 300, enemiesKilled: 120,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_ceilidh_commander');
  });

  it('unlocks ach_doric_unlock at 1 no-heal victory (V2 T1)', () => {
    seedGameplaySave({ runsWithoutHealingCircleCompleted: 1 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 250,
    });
    expect(save.load().unlockedAchievements).toContain('ach_doric_unlock');
  });

  it('does NOT unlock ach_doric_unlock at 0 no-heal victories', () => {
    seedGameplaySave({ runsWithoutHealingCircleCompleted: 0 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 250,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_doric_unlock');
  });

  it('unlocks ach_peerie_unlock at 1 coastal-only victory (V2 T2)', () => {
    seedGameplaySave({ runsInCoastalOnlyCompleted: 1 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 250,
    });
    expect(save.load().unlockedAchievements).toContain('ach_peerie_unlock');
  });

  it('does NOT unlock ach_peerie_unlock at 0 coastal-only victories', () => {
    seedGameplaySave({ runsInCoastalOnlyCompleted: 0 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 250,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_peerie_unlock');
  });

  it('unlocks ach_burns_beastie_unlock at 1 Burns Night full-evo victory (E1 T11)', () => {
    seedGameplaySave({ burnsNightFullEvoRunsCompleted: 1 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 250,
    });
    expect(save.load().unlockedAchievements).toContain('ach_burns_beastie_unlock');
  });

  it('does NOT unlock ach_burns_beastie_unlock when only runsWithAllEvolutionsCompleted is non-zero', () => {
    // E1 T11 severed the deed from the raw full-evo counter; Burns
    // Night must be the gate.
    seedGameplaySave({ runsWithAllEvolutionsCompleted: 1, burnsNightFullEvoRunsCompleted: 0 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 250,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_burns_beastie_unlock');
  });

  it('does NOT unlock ach_burns_beastie_unlock at 0 Burns Night full-evo victories', () => {
    seedGameplaySave({ burnsNightFullEvoRunsCompleted: 0 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 250,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_burns_beastie_unlock');
  });

  it('unlocks ach_walk_every_road when route history covers all 6 routes', () => {
const allRoutes = ROUTES.map((r, i) => ({
      slot: r.slot,
      routeKey: r.key,
      atGameTimeSec: 300 + i * 10,
      defaultedBySetting: false,
    }));
    seedGameplaySave({
      runHistory: [{
        timestamp: 1, isVictory: true, timeSurvivedSec: 900, enemiesKilled: 200,
        weaponKeys: ['thistle_shot'], variantKey: 'classic', bestCombo: 5, goldEarned: 50,
        seedCode: 'AAAA', routes: allRoutes,
      }],
    });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 200,
    });
    expect(save.load().unlockedAchievements).toContain('ach_walk_every_road');
  });

  it('does NOT unlock ach_walk_every_road with only some routes seen', () => {
    seedGameplaySave({
      runHistory: [{
        timestamp: 1, isVictory: true, timeSurvivedSec: 900, enemiesKilled: 200,
        weaponKeys: ['thistle_shot'], variantKey: 'classic', bestCombo: 5, goldEarned: 50,
        seedCode: 'AAAA',
        routes: [
          { slot: 'A', routeKey: 'round_the_loch', atGameTimeSec: 305, defaultedBySetting: false },
        ],
      }],
    });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 200,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_walk_every_road');
  });

  it('unlocks ach_ironmoor_victor when last entry is ironmoor + victory', () => {
    seedGameplaySave({
      runHistory: [{
        timestamp: 1, isVictory: true, timeSurvivedSec: 900, enemiesKilled: 200,
        weaponKeys: ['thistle_shot'], variantKey: 'classic', bestCombo: 5, goldEarned: 50,
        seedCode: 'AAAA', ironmoor: true,
      }],
    });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 200,
    });
    expect(save.load().unlockedAchievements).toContain('ach_ironmoor_victor');
  });

  it('does NOT unlock ach_ironmoor_victor on a non-ironmoor victory', () => {
    seedGameplaySave({
      runHistory: [{
        timestamp: 1, isVictory: true, timeSurvivedSec: 900, enemiesKilled: 200,
        weaponKeys: ['thistle_shot'], variantKey: 'classic', bestCombo: 5, goldEarned: 50,
        seedCode: 'AAAA',
      }],
    });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 200,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_ironmoor_victor');
  });

  it('unlocks ach_laird_victor when last winning entry uses the laird variant', () => {
    seedGameplaySave({
      runHistory: [{
        timestamp: 1, isVictory: true, timeSurvivedSec: 900, enemiesKilled: 200,
        weaponKeys: ['thistle_shot'], variantKey: 'laird', bestCombo: 5, goldEarned: 50,
        seedCode: 'AAAA',
      }],
    });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 200,
    });
    expect(save.load().unlockedAchievements).toContain('ach_laird_victor');
  });

  it('unlocks ach_full_herd when every variant is in unlockedVariants', () => {
seedGameplaySave({ unlockedVariants: [...VARIANT_KEYS] });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 60, enemiesKilled: 10,
    });
    expect(save.load().unlockedAchievements).toContain('ach_full_herd');
  });

  it('does NOT unlock ach_full_herd when one variant is missing', () => {
    seedGameplaySave({ unlockedVariants: VARIANT_KEYS.slice(0, -1) });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 60, enemiesKilled: 10,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_full_herd');
  });

  it('unlocks ach_past_the_bell when bestEndlessSeconds is positive', () => {
    seedGameplaySave({ bestEndlessSeconds: 5 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 920, enemiesKilled: 250,
    });
    expect(save.load().unlockedAchievements).toContain('ach_past_the_bell');
  });

  it('does NOT unlock ach_past_the_bell when bestEndlessSeconds is 0', () => {
    seedGameplaySave({ bestEndlessSeconds: 0 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 200,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_past_the_bell');
  });

  it('unlocks ach_endless_endurance at 60s past the bell', () => {
    seedGameplaySave({ bestEndlessSeconds: 60 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 1000, enemiesKilled: 300,
    });
    expect(save.load().unlockedAchievements).toContain('ach_endless_endurance');
  });

  it('does NOT unlock ach_endless_endurance at 59s', () => {
    seedGameplaySave({ bestEndlessSeconds: 59 });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 1000, enemiesKilled: 300,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_endless_endurance');
  });

  it('unlocks ach_cursed_victor when a victorious run carries a curseKey', () => {
    seedGameplaySave({
      runHistory: [{
        timestamp: 1, isVictory: true, timeSurvivedSec: 900, enemiesKilled: 200,
        weaponKeys: ['thistle_shot'], variantKey: 'classic', bestCombo: 5, goldEarned: 50,
        seedCode: 'AAAA', curseKey: 'thin_hide',
      }],
    });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 200,
    });
    expect(save.load().unlockedAchievements).toContain('ach_cursed_victor');
  });

  it('does NOT unlock ach_cursed_victor when the cursed run was a loss', () => {
    seedGameplaySave({
      runHistory: [{
        timestamp: 1, isVictory: false, timeSurvivedSec: 400, enemiesKilled: 80,
        weaponKeys: ['thistle_shot'], variantKey: 'classic', bestCombo: 5, goldEarned: 50,
        seedCode: 'AAAA', curseKey: 'thin_hide',
      }],
    });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death', gameTimeSec: 400, enemiesKilled: 80,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_cursed_victor');
  });

  it('does NOT unlock ach_cursed_victor when the victory had no curse', () => {
    seedGameplaySave({
      runHistory: [{
        timestamp: 1, isVictory: true, timeSurvivedSec: 900, enemiesKilled: 200,
        weaponKeys: ['thistle_shot'], variantKey: 'classic', bestCombo: 5, goldEarned: 50,
        seedCode: 'AAAA',
      }],
    });
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'victory', gameTimeSec: 900, enemiesKilled: 200,
    });
    expect(save.load().unlockedAchievements).not.toContain('ach_cursed_victor');
  });
});
