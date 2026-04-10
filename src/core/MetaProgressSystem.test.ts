import { describe, expect, it } from 'vitest';

import { globalEventBus } from './GlobalEventBus';
import { MetaProgressSystem } from './MetaProgressSystem';
import { SaveManager, type StorageLike } from './SaveManager';

class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(key: string) { return this.m.get(key) ?? null; }
  setItem(key: string, value: string) { this.m.set(key, value); }
  removeItem(key: string) { this.m.delete(key); }
}

describe('MetaProgressSystem', () => {
  it('increments persistent totalKills on GLOBAL_ENEMY_KILLED without gameplay importing SaveManager', async () => {
    const storage = new MemoryStorage();
    const save = new SaveManager({ storage, key: 'meta' });
    const sys = new MetaProgressSystem(save);

    sys.start();
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', { enemyKey: 'tourist', xpValue: 1, wasBoss: false, wasElite: false });
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', { enemyKey: 'chef', xpValue: 2, wasBoss: false, wasElite: false });

    expect(save.load().totalKills).toBe(2);
    sys.stop();
  });
});

