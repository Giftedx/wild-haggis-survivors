export type GlobalEnemyKilledPayload = {
  enemyKey: string;
  xpValue: number;
  wasBoss: boolean;
  wasElite: boolean;
};

export type GlobalEvents = {
  GLOBAL_ENEMY_KILLED: GlobalEnemyKilledPayload;
};

type Handler<T> = (payload: T) => void;

class GlobalEventBus {
  private listeners = new Map<keyof GlobalEvents, Set<Handler<any>>>();

  on<K extends keyof GlobalEvents>(event: K, handler: Handler<GlobalEvents[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler as Handler<any>);
    return () => this.off(event, handler);
  }

  off<K extends keyof GlobalEvents>(event: K, handler: Handler<GlobalEvents[K]>): void {
    this.listeners.get(event)?.delete(handler as Handler<any>);
  }

  emit<K extends keyof GlobalEvents>(event: K, payload: GlobalEvents[K]): void {
    for (const h of this.listeners.get(event) ?? []) {
      h(payload);
    }
  }
}

/** Process-wide singleton (survives scene restarts). */
export const globalEventBus = new GlobalEventBus();

