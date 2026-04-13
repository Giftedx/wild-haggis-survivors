import { describe, it, expect, vi } from 'vitest';
import { globalEventBus } from './GlobalEventBus';

describe('GlobalEventBus', () => {
  it('emits payload to registered listener', () => {
    const handler = vi.fn();
    const unsub = globalEventBus.on('GLOBAL_ENEMY_KILLED', handler);
    const payload = { enemyKey: 'haggis', xpValue: 10, wasBoss: false, wasElite: false };
    globalEventBus.emit('GLOBAL_ENEMY_KILLED', payload);
    expect(handler).toHaveBeenCalledWith(payload);
    unsub();
  });

  it('supports multiple listeners on same event', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const u1 = globalEventBus.on('ACHIEVEMENT_UNLOCKED', h1);
    const u2 = globalEventBus.on('ACHIEVEMENT_UNLOCKED', h2);
    globalEventBus.emit('ACHIEVEMENT_UNLOCKED', { id: 'first_kill', title: 'First Blood' });
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
    u1();
    u2();
  });

  it('on() returns unsubscribe function', () => {
    const handler = vi.fn();
    const unsub = globalEventBus.on('bossEnraged', handler);
    unsub();
    globalEventBus.emit('bossEnraged', 'gordon');
    expect(handler).not.toHaveBeenCalled();
  });

  it('off() removes specific listener', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    globalEventBus.on('bossEnraged', h1);
    const u2 = globalEventBus.on('bossEnraged', h2);
    globalEventBus.off('bossEnraged', h1);
    globalEventBus.emit('bossEnraged', 'nessie');
    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledWith('nessie');
    u2();
  });

  it('off() on unregistered handler is safe no-op', () => {
    const handler = vi.fn();
    expect(() => globalEventBus.off('bossEnraged', handler)).not.toThrow();
  });

  it('emit on event with no listeners is safe no-op', () => {
    expect(() => globalEventBus.emit('TUTORIAL_COMPLETED', {})).not.toThrow();
  });

  it('does not leak between event types', () => {
    const handler = vi.fn();
    const unsub = globalEventBus.on('bossEnraged', handler);
    globalEventBus.emit('ACHIEVEMENT_UNLOCKED', { id: 'x', title: 'y' });
    expect(handler).not.toHaveBeenCalled();
    unsub();
  });
});
