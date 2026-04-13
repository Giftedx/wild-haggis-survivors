import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { AchievementManager } from './AchievementManager';
import { globalEventBus } from './GlobalEventBus';
import { SaveManager } from './SaveManager';
import { MemoryStorage } from '../test/MemoryStorage';

describe('AchievementManager', () => {
  let storage: MemoryStorage;
  let save: SaveManager;
  let mgr: AchievementManager;

  beforeEach(() => {
    storage = new MemoryStorage();
    save = new SaveManager({ storage, key: 'ach_test' });
    save.save({
      saveVersion: 8,
      totalKills: 0,
      totalKillsSpent: 0,
      dailyChallenge: null,
      unlockedWeapons: [],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
      hasCompletedTutorial: true,
      hasSeenDriftTutorial: false,
      runHistory: [],
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

  it('unlocks ach_all_bosses when 5 distinct bosses killed in one run', () => {
    const bossKeys = ['gordon', 'tour_bus', 'the_laird', 'hunter_general', 'taxman'];
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
