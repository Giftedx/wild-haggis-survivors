export type Unsubscribe = () => void;

type MinimalEmitter = {
  on: (event: string, fn: (...args: any[]) => void, context?: any) => unknown;
  off: (event: string, fn?: (...args: any[]) => void, context?: any, once?: boolean) => unknown;
};

/**
 * SubscriptionBag — centralizes teardown for event listeners.
 *
 * Usage:
 * - `subs.add(() => emitter.off(...))`
 * - `subs.listen(emitter, 'event', handler)`
 * - Call `subs.dispose()` in destroy().
 */
export class SubscriptionBag {
  private unsubs: Unsubscribe[] = [];
  private disposed = false;

  add(unsub: Unsubscribe): void {
    if (this.disposed) {
      // If a caller registers after disposal, immediately tear it down
      // to avoid "zombie" listeners.
      try { unsub(); } catch { /* ignore */ }
      return;
    }
    this.unsubs.push(unsub);
  }

  listen<T extends MinimalEmitter>(
    emitter: T,
    eventName: string,
    handler: (...args: any[]) => void,
    context?: any
  ): void {
    emitter.on(eventName, handler, context);
    this.add(() => {
      try {
        emitter.off(eventName, handler, context);
      } catch {
        // Swallow errors on teardown — teardown must be best-effort and safe.
      }
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (let i = this.unsubs.length - 1; i >= 0; i--) {
      try {
        this.unsubs[i]();
      } catch {
        // ignore
      }
    }
    this.unsubs = [];
  }
}

