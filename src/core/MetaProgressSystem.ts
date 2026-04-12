import { globalEventBus } from './GlobalEventBus';
import { SaveManager } from './SaveManager';

/**
 * MetaProgressSystem — global meta progression layer.
 * Initialized once at boot; listens to GlobalEventBus and persists meta stats.
 *
 * Kill-count increments are batched in memory and flushed at most every
 * `FLUSH_INTERVAL_MS` (or on stop / run end) so AoE weapons don't trigger
 * dozens of full localStorage JSON round-trips per frame during dense waves.
 */
export class MetaProgressSystem {
  private save: SaveManager;
  private started = false;
  private unsubs: Array<() => void> = [];

  /** In-memory kill increments awaiting persistence. */
  private pendingKills = 0;
  /** Real-time of last storage flush (wall-clock, not scaled). */
  private lastFlushTime = 0;
  /** At most one storage write per this many ms under continuous kill pressure. */
  private static readonly FLUSH_INTERVAL_MS = 1000;

  constructor(saveManager?: SaveManager) {
    this.save = saveManager ?? new SaveManager();
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.lastFlushTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    this.pendingKills = 0;

    this.unsubs.push(globalEventBus.on('GLOBAL_ENEMY_KILLED', () => {
      this.pendingKills++;
      this.maybeFlush();
    }));

    // Run-end guarantees a flush so the final kill counts hit storage
    // before analytics / achievement consumers read the save.
    this.unsubs.push(globalEventBus.on('GLOBAL_RUN_ENDED', () => {
      this.flushPending();
    }));
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.flushPending();
    for (const u of this.unsubs) u();
    this.unsubs = [];
  }

  private maybeFlush(): void {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - this.lastFlushTime < MetaProgressSystem.FLUSH_INTERVAL_MS) return;
    this.flushPending();
    this.lastFlushTime = now;
  }

  private flushPending(): void {
    if (this.pendingKills === 0) return;
    const delta = this.pendingKills;
    this.pendingKills = 0;
    this.save.update((cur) => ({ ...cur, totalKills: cur.totalKills + delta }));
  }

  /** For UI / menus. */
  getSaveManager(): SaveManager {
    return this.save;
  }
}

/** Singleton instance used by the game. */
export const metaProgressSystem = new MetaProgressSystem();

