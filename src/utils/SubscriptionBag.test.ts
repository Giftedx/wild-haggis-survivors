import { describe, it, expect, vi } from 'vitest';
import { SubscriptionBag } from './SubscriptionBag';

function makeEmitter() {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();
  return {
    on(event: string, fn: (...args: any[]) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    },
    off(event: string, fn?: (...args: any[]) => void) {
      if (fn) listeners.get(event)?.delete(fn);
    },
    emit(event: string, ...args: any[]) {
      listeners.get(event)?.forEach(fn => fn(...args));
    },
    listenerCount(event: string) {
      return listeners.get(event)?.size ?? 0;
    },
  };
}

describe('SubscriptionBag', () => {
  describe('add + dispose', () => {
    it('calls unsub on dispose', () => {
      const bag = new SubscriptionBag();
      const unsub = vi.fn();
      bag.add(unsub);
      expect(unsub).not.toHaveBeenCalled();
      bag.dispose();
      expect(unsub).toHaveBeenCalledOnce();
    });

    it('calls multiple unsubs in LIFO order', () => {
      const bag = new SubscriptionBag();
      const order: number[] = [];
      bag.add(() => order.push(1));
      bag.add(() => order.push(2));
      bag.add(() => order.push(3));
      bag.dispose();
      expect(order).toEqual([3, 2, 1]);
    });

    it('swallows errors in unsub callbacks', () => {
      const bag = new SubscriptionBag();
      const good = vi.fn();
      bag.add(() => { throw new Error('boom'); });
      bag.add(good);
      bag.dispose();
      expect(good).toHaveBeenCalledOnce();
    });
  });

  describe('listen + dispose', () => {
    it('registers listener and removes on dispose', () => {
      const bag = new SubscriptionBag();
      const emitter = makeEmitter();
      const handler = vi.fn();
      bag.listen(emitter, 'hit', handler);
      expect(emitter.listenerCount('hit')).toBe(1);
      emitter.emit('hit', 42);
      expect(handler).toHaveBeenCalledWith(42);
      bag.dispose();
      expect(emitter.listenerCount('hit')).toBe(0);
    });

    it('handles emitter.off throwing gracefully', () => {
      const bag = new SubscriptionBag();
      const badEmitter = {
        on: vi.fn(),
        off: () => { throw new Error('destroyed'); },
      };
      bag.listen(badEmitter, 'x', vi.fn());
      expect(() => bag.dispose()).not.toThrow();
    });
  });

  describe('add-after-dispose safety', () => {
    it('immediately calls unsub when added after dispose', () => {
      const bag = new SubscriptionBag();
      bag.dispose();
      const unsub = vi.fn();
      bag.add(unsub);
      expect(unsub).toHaveBeenCalledOnce();
    });

    it('swallows error in post-dispose unsub', () => {
      const bag = new SubscriptionBag();
      bag.dispose();
      expect(() => bag.add(() => { throw new Error('late'); })).not.toThrow();
    });
  });

  describe('double-dispose idempotent', () => {
    it('only calls unsubs once on repeated dispose', () => {
      const bag = new SubscriptionBag();
      const unsub = vi.fn();
      bag.add(unsub);
      bag.dispose();
      bag.dispose();
      bag.dispose();
      expect(unsub).toHaveBeenCalledOnce();
    });
  });
});
