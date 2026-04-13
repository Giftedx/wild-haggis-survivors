/**
 * CaptionManager — a pure, testable model for the caption queue.
 *
 * No Phaser dependency: the manager owns timing + deduplication + the
 * stacked "what's currently on screen" list. CaptionOverlay (separate
 * file) renders it. This split lets us unit-test queue behavior without
 * spinning up a scene.
 *
 * Why dedupe by id: many audio events fire in bursts (damage numbers,
 * kill-on-low-HP, combo ticks). Without a short-lived id window, the
 * caption strip would flood. A caption's id is a semantic key
 * ("low_hp", "boss_gordon") — the same id arriving within the dedupe
 * window refreshes the existing caption's timer instead of stacking.
 */

/** One displayable caption. */
export interface ActiveCaption {
  /** Semantic key — callers use the same id for the same event class. */
  readonly id: string;
  /** Localised, player-facing text. */
  readonly message: string;
  /** Remaining ms before fade-out begins. */
  remainingMs: number;
  /** Total duration — so consumers can compute fade progress. */
  readonly totalMs: number;
  /** Optional tint for the caption strip. */
  readonly tint?: string;
}

export interface CaptionManagerOptions {
  /** Max simultaneous captions. Older drop off. */
  readonly maxActive?: number;
  /** How recent an id counts as "refresh not stack". Default 800ms. */
  readonly dedupeWindowMs?: number;
}

export class CaptionManager {
  private readonly active: ActiveCaption[] = [];
  private readonly maxActive: number;
  private readonly dedupeWindowMs: number;

  constructor(opts: CaptionManagerOptions = {}) {
    this.maxActive = opts.maxActive ?? 3;
    this.dedupeWindowMs = opts.dedupeWindowMs ?? 800;
  }

  /**
   * Add a caption. If the same `id` is active and was added recently (within
   * dedupeWindowMs), refresh its timer instead of stacking. Otherwise push,
   * evicting the oldest if we'd exceed maxActive.
   */
  enqueue(id: string, message: string, durationMs: number, tint?: string): void {
    if (durationMs <= 0) return;
    const existingIdx = this.active.findIndex((c) => c.id === id);
    if (existingIdx >= 0) {
      const existing = this.active[existingIdx];
      const elapsed = existing.totalMs - existing.remainingMs;
      if (elapsed <= this.dedupeWindowMs) {
        // Rapid repeat — refresh timer only, keep first text/tint so the
        // caption strip doesn't flicker through identical messages.
        existing.remainingMs = durationMs;
        return;
      }
      // Past dedupe window — same id arriving counts as an intentional
      // update. Replace text + tint + timer.
      this.active.splice(existingIdx, 1);
      this.active.push({ id, message, remainingMs: durationMs, totalMs: durationMs, tint });
      return;
    }
    if (this.active.length >= this.maxActive) {
      // Evict the caption with the least remaining time (nearest to fade).
      let oldestIdx = 0;
      for (let i = 1; i < this.active.length; i++) {
        if (this.active[i].remainingMs < this.active[oldestIdx].remainingMs) {
          oldestIdx = i;
        }
      }
      this.active.splice(oldestIdx, 1);
    }
    this.active.push({
      id,
      message,
      remainingMs: durationMs,
      totalMs: durationMs,
      tint,
    });
  }

  /** Advance timers by `deltaMs`. Removes captions whose time has elapsed. */
  update(deltaMs: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      this.active[i].remainingMs -= deltaMs;
      if (this.active[i].remainingMs <= 0) {
        this.active.splice(i, 1);
      }
    }
  }

  /** Snapshot of current captions — consumers iterate to render. */
  getActive(): readonly ActiveCaption[] {
    return this.active;
  }

  /** Remove every caption immediately. Call on scene restart. */
  clear(): void {
    this.active.length = 0;
  }

  /**
   * Suggested duration for a caption, based on text length. Short enough
   * that screen-full-of-captions feels responsive, long enough that a
   * player can actually read it. 2500ms base + 40ms per character, capped
   * at 6000ms.
   */
  static suggestedDurationMs(message: string): number {
    return Math.min(6000, 2500 + message.length * 40);
  }
}
