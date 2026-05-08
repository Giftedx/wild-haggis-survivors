import { describe, expect, it, vi } from 'vitest';
import { wireXpSystemListeners } from './wireXpSystemListeners';

// Minimal event emitter to avoid importing Phaser (whose ESM build
// touches `window` at eval time and breaks node-env vitest — see
// CLAUDE.md gotcha "Phaser imports break in node-env vitest").
function makeEmitter() {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>();
  return {
    on(name: string, fn: (...args: unknown[]) => void) {
      const arr = handlers.get(name) ?? [];
      arr.push(fn);
      handlers.set(name, arr);
    },
    emit(name: string, ...args: unknown[]) {
      for (const fn of handlers.get(name) ?? []) fn(...args);
    },
  };
}

/**
 * Live GameScene.create() ordering passes `this.levelUpFlow` to the
 * wire helper at line ~1167, but that field is declared `!:` and not
 * constructed until ~line 1318. Without lazy resolution the
 * destructured ref would capture `undefined` and the first
 * `levelup` / `echoReady` callback would throw.
 */
describe('wireXpSystemListeners', () => {
  it('levelup resolves levelUpFlow lazily (wire fires before construct)', () => {
    const events = makeEmitter();
    const handleLevelUp = vi.fn();
    const notifyCelebrate = vi.fn();
    const requestBanter = vi.fn();
    const caption = vi.fn();
    let liveLevelUpFlow: { handleLevelUp: typeof handleLevelUp; handleEcho: ReturnType<typeof vi.fn> } | undefined;

    wireXpSystemListeners({
      xpSystem: { events } as never,
      getLevelUpFlow: () => liveLevelUpFlow as never,
      player: { notifyCelebrate } as never,
      getBanter: () => ({ request: requestBanter }) as never,
      getActiveVariantKey: () => 'classic_haggis',
      caption,
    });

    liveLevelUpFlow = { handleLevelUp, handleEcho: vi.fn() };

    events.emit('levelup', 5);
    expect(handleLevelUp).toHaveBeenCalledWith(5);
    expect(notifyCelebrate).toHaveBeenCalled();
    expect(requestBanter).toHaveBeenCalledWith('level_up', { tag: 'classic_haggis' });
    expect(caption).toHaveBeenCalled();
  });

  it('echoReady resolves levelUpFlow lazily', () => {
    const events = makeEmitter();
    const handleEcho = vi.fn();
    const caption = vi.fn();
    let liveLevelUpFlow: { handleLevelUp: ReturnType<typeof vi.fn>; handleEcho: typeof handleEcho } | undefined;

    wireXpSystemListeners({
      xpSystem: { events } as never,
      getLevelUpFlow: () => liveLevelUpFlow as never,
      player: { notifyCelebrate: vi.fn() } as never,
      getBanter: () => null,
      getActiveVariantKey: () => undefined,
      caption,
    });

    liveLevelUpFlow = { handleLevelUp: vi.fn(), handleEcho };

    events.emit('echoReady');
    expect(handleEcho).toHaveBeenCalled();
    expect(caption).toHaveBeenCalled();
  });

  it('null banter (e.g. early run-start before construction) is safe', () => {
    const events = makeEmitter();
    let liveBanter: { request: ReturnType<typeof vi.fn> } | null = null;
    wireXpSystemListeners({
      xpSystem: { events } as never,
      getLevelUpFlow: () => ({ handleLevelUp: vi.fn(), handleEcho: vi.fn() }) as never,
      player: { notifyCelebrate: vi.fn() } as never,
      getBanter: () => liveBanter as never,
      getActiveVariantKey: () => undefined,
      caption: vi.fn(),
    });

    expect(() => events.emit('levelup', 1)).not.toThrow();
    liveBanter = { request: vi.fn() };
    events.emit('levelup', 2);
    expect(liveBanter.request).toHaveBeenCalled();
  });
});
