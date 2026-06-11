import { describe, expect, it, vi } from 'vitest';
import { bindHubMenuKeyboardNav } from './hubMenuKeyboardNav';

describe('bindHubMenuKeyboardNav', () => {
  it('routes digit keys to activateIndex on the current nav', () => {
    const listeners = new Map<string, Set<(e: KeyboardEvent) => void>>();
    const kb = {
      on: vi.fn((ev: string, fn: (e: KeyboardEvent) => void) => {
        const set = listeners.get(ev) ?? new Set();
        set.add(fn);
        listeners.set(ev, set);
      }),
      off: vi.fn((ev: string, fn: (e: KeyboardEvent) => void) => {
        listeners.get(ev)?.delete(fn);
      }),
    };
    const scene = { input: { keyboard: kb } } as never;
    const nav = {
      getEntryCount: () => 2,
      activateIndex: vi.fn(),
      step: vi.fn(),
      activateCurrent: vi.fn(),
    };
    const unbind = bindHubMenuKeyboardNav(scene, () => nav as never);
    const handler = [...(listeners.get('keydown') ?? [])][0];
    expect(handler).toBeDefined();
    const ev = { key: '2', preventDefault: vi.fn() } as unknown as KeyboardEvent;
    handler(ev);
    expect(nav.activateIndex).toHaveBeenCalledWith(1);
    expect(ev.preventDefault).toHaveBeenCalled();
    unbind();
    expect(kb.off).toHaveBeenCalledWith('keydown', handler);
  });

  it('honours isBlocked and skips nav', () => {
    const listeners = new Map<string, Set<(e: KeyboardEvent) => void>>();
    const kb = {
      on: vi.fn((ev: string, fn: (e: KeyboardEvent) => void) => {
        const set = listeners.get(ev) ?? new Set();
        set.add(fn);
        listeners.set(ev, set);
      }),
      off: vi.fn(),
    };
    const scene = { input: { keyboard: kb } } as never;
    const nav = { getEntryCount: () => 1, activateCurrent: vi.fn() };
    bindHubMenuKeyboardNav(scene, () => nav as never, { isBlocked: () => true });
    const handler = [...(listeners.get('keydown') ?? [])][0];
    const ev = { key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent;
    handler(ev);
    expect(nav.activateCurrent).not.toHaveBeenCalled();
  });
});
