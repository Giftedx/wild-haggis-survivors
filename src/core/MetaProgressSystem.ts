import { globalEventBus } from './GlobalEventBus';
import { SaveManager } from './SaveManager';

/**
 * MetaProgressSystem — global meta progression layer.
 * Initialized once at boot; listens to GlobalEventBus and persists meta stats.
 */
export class MetaProgressSystem {
  private save: SaveManager;
  private started = false;
  private unsub: (() => void) | null = null;

  constructor(saveManager?: SaveManager) {
    this.save = saveManager ?? new SaveManager();
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.unsub = globalEventBus.on('GLOBAL_ENEMY_KILLED', () => {
      this.save.update((cur) => ({
        ...cur,
        totalKills: cur.totalKills + 1,
      }));
    });
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.unsub?.();
    this.unsub = null;
  }

  /** For UI / menus. */
  getSaveManager(): SaveManager {
    return this.save;
  }
}

/** Singleton instance used by the game. */
export const metaProgressSystem = new MetaProgressSystem();

