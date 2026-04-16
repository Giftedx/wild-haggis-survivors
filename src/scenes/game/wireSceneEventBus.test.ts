import { afterEach, describe, expect, it, vi } from 'vitest';
import { wireSceneEventBus } from './wireSceneEventBus';
import { globalEventBus } from '../../core/GlobalEventBus';

/**
 * wireSceneEventBus: installs three run-scoped toast subscriptions on
 * the global event bus. Dispose fn must remove all of them so scene
 * reuse doesn't double-subscribe (which would fire each toast twice).
 */
describe('wireSceneEventBus', () => {
  const showToast = vi.fn();
  const hooks = {
    getJuice: () => ({ showToast } as never),
  };

  afterEach(() => {
    showToast.mockReset();
  });

  it('fires an achievement toast with the payload title', () => {
    const dispose = wireSceneEventBus(hooks);
    globalEventBus.emit('ACHIEVEMENT_UNLOCKED', { id: 'deed_1', title: 'Hard as Granite' });
    expect(showToast).toHaveBeenCalledTimes(1);
    const [msg, tint] = showToast.mock.calls[0] ?? [];
    expect(msg).toContain('Hard as Granite');
    expect(tint).toBe('#ffdd88');
    dispose();
  });

  it('fires a boss-enraged toast', () => {
    const dispose = wireSceneEventBus(hooks);
    globalEventBus.emit('bossEnraged', 'gordon');
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0]?.[1]).toBe('#ff4444');
    dispose();
  });

  it('fires a codex-first-cull toast with the enemy display name', () => {
    const dispose = wireSceneEventBus(hooks);
    globalEventBus.emit('CODEX_FIRST_CULL', { enemyKey: 'tourist' });
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0]?.[1]).toBe('#aaddff');
    dispose();
  });

  it('dispose() removes every subscription', () => {
    const dispose = wireSceneEventBus(hooks);
    dispose();
    globalEventBus.emit('ACHIEVEMENT_UNLOCKED', { id: 'x', title: 'y' });
    globalEventBus.emit('bossEnraged', 'gordon');
    globalEventBus.emit('CODEX_FIRST_CULL', { enemyKey: 'tourist' });
    expect(showToast).not.toHaveBeenCalled();
  });

  it('second wire after dispose works cleanly (no double-fire)', () => {
    const disposeA = wireSceneEventBus(hooks);
    disposeA();
    const disposeB = wireSceneEventBus(hooks);
    globalEventBus.emit('bossEnraged', 'tour_bus');
    expect(showToast).toHaveBeenCalledTimes(1); // only the B subscription
    disposeB();
  });
});
