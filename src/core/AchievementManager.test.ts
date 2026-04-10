import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { AchievementManager } from './AchievementManager';
import { globalEventBus } from './GlobalEventBus';
import { SaveManager, type StorageLike } from './SaveManager';

class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(key: string) { return this.m.get(key) ?? null; }
  setItem(key: string, value: string) { this.m.set(key, value); }
  removeItem(key: string) { this.m.delete(key); }
}

describe('AchievementManager', () => {
  let storage: MemoryStorage;
  let save: SaveManager;
  let mgr: AchievementManager;

  beforeEach(() => {
    storage = new MemoryStorage();
    save = new SaveManager({ storage, key: 'ach_test' });
    save.save({
      saveVersion: 4,
      totalKills: 0,
      unlockedWeapons: [],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
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
});
