import { describe, expect, it } from 'vitest';

import { globalEventBus } from './GlobalEventBus';
import { MetaProgressSystem } from './MetaProgressSystem';
import { SaveManager } from './SaveManager';
import { MemoryStorage } from '../test/MemoryStorage';

function makeSys(): { sys: MetaProgressSystem; save: SaveManager } {
  const storage = new MemoryStorage();
  const save = new SaveManager({ storage, key: 'meta' });
  return { sys: new MetaProgressSystem(save), save };
}

function emitKill(): void {
  globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
    enemyKey: 'tourist', xpValue: 1, wasBoss: false, wasElite: false,
  });
}

describe('MetaProgressSystem', () => {
  it('increments persistent totalKills on GLOBAL_ENEMY_KILLED without gameplay importing SaveManager', () => {
    const { sys, save } = makeSys();

    sys.start();
    emitKill();
    emitKill();

    // Kills are batched in-memory and flushed at most once per second under
    // load (prevents localStorage write storms from AoE waves). Run-end
    // emission or stop() force a flush — stop() here to assert the total.
    sys.stop();
    expect(save.load().totalKills).toBe(2);
  });

  it('a fresh start within the flush interval does NOT touch storage on every kill', () => {
    const { sys, save } = makeSys();
    sys.start();
    // Two kills in quick succession — the second should batch, not flush.
    emitKill();
    emitKill();
    // Still 0 in storage because the 1s flush interval hasn't elapsed.
    expect(save.load().totalKills).toBe(0);
    sys.stop();
    // stop() forces a final flush.
    expect(save.load().totalKills).toBe(2);
  });

  it('GLOBAL_RUN_ENDED forces a flush mid-run', () => {
    const { sys, save } = makeSys();
    sys.start();
    emitKill();
    emitKill();
    expect(save.load().totalKills).toBe(0);
    globalEventBus.emit('GLOBAL_RUN_ENDED', {
      outcome: 'death',
      gameTimeSec: 10,
      enemiesKilled: 2,
    });
    // No stop() — pending kills should already be flushed by the run-end hook.
    expect(save.load().totalKills).toBe(2);
    sys.stop();
  });

  it('stop() with no pending kills is a safe no-op', () => {
    const { sys, save } = makeSys();
    sys.start();
    sys.stop();
    expect(save.load().totalKills).toBe(0);
  });

  it('start() is idempotent — second call does not double-subscribe', () => {
    const { sys, save } = makeSys();
    sys.start();
    sys.start(); // second call ignored — see `if (this.started) return`
    emitKill();
    sys.stop();
    // If start() had double-subscribed, one emit would land in two listeners
    // and bump pendingKills to 2 instead of 1.
    expect(save.load().totalKills).toBe(1);
  });

  it('after stop(), no further emits are persisted', () => {
    const { sys, save } = makeSys();
    sys.start();
    emitKill();
    sys.stop();
    expect(save.load().totalKills).toBe(1);
    // Bus emit after stop should be ignored (listener was removed).
    emitKill();
    // No flush trigger available after stop, but the value should not change
    // even if we manually call stop again — there are no pending kills now.
    sys.stop();
    expect(save.load().totalKills).toBe(1);
  });

  it('getSaveManager returns the same instance the system writes to', () => {
    const { sys, save } = makeSys();
    expect(sys.getSaveManager()).toBe(save);
  });
});
