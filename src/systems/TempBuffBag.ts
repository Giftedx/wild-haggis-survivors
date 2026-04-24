/**
 * TempBuffBag — holds time-limited player stat buffs and reverts them
 * on expiry. Used by the Moor Road shrine nodes (M1 F4) to stand up a
 * "shrines feel different from relics" palette: shorter, more intense
 * deltas that revert when the timer runs out.
 *
 * Entries are opaque to the bag — callers supply the `apply` closure
 * which does the stat mutation and returns a matching `revert` closure.
 * The bag just tracks durations and calls `revert` when `remainingMs`
 * hits zero. This keeps the bag free of any Player / WeaponSystem import.
 *
 * Scene restart clears the bag WITHOUT reverting: on restart the Player
 * is rebuilt from scratch, so reverting into the old (now-stale) stat
 * state would silently mis-apply. `clear()` drops entries; `reset()` is
 * an alias that also resets the bag's internal accumulator (no-op today
 * but reserved for future state).
 */

export interface TempBuffEntry {
  /** Stable identifier — matches the shrine candidate key (e.g. `buff_damage`). */
  readonly key: string;
  /** Remaining lifetime in ms. Ticks toward zero on every `tick(delta)`. */
  remainingMs: number;
  /** Invoked once when the timer expires (or when `clear()` is called with revertAll). */
  readonly revert: () => void;
}

export class TempBuffBag {
  private entries: TempBuffEntry[] = [];

  /**
   * Add a timed buff.
   *
   * @param key Stable identifier for the buff (shrine candidate key).
   * @param durationMs Lifetime in ms; clamped to a minimum of 1 so the buff
   *   doesn't expire on the same frame it's added.
   * @param apply Invoked immediately to mutate stats. Must return a revert
   *   closure that undoes the same mutation. Deltas should be captured in
   *   the closure so revert subtracts exactly what apply added (e.g. if a
   *   stat is cap-clamped, capture the clamped actual delta).
   */
  add(key: string, durationMs: number, apply: () => () => void): void {
    const revert = apply();
    this.entries.push({
      key,
      remainingMs: Math.max(1, durationMs),
      revert,
    });
  }

  /**
   * Advance every entry by `deltaMs`. Entries whose timer reaches zero have
   * their `revert` closure invoked and are removed from the bag. Iterating
   * backward makes the in-place splice safe.
   */
  tick(deltaMs: number): void {
    if (deltaMs <= 0) return;
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const e = this.entries[i];
      e.remainingMs -= deltaMs;
      if (e.remainingMs <= 0) {
        e.revert();
        this.entries.splice(i, 1);
      }
    }
  }

  /**
   * Revert every active entry and empty the bag. Use at run-end if the
   * Player will persist across the teardown (it does not in WHS — Player
   * is reconstructed on scene restart — so `clear()` is the usual call).
   */
  revertAll(): void {
    for (const e of this.entries) e.revert();
    this.entries = [];
  }

  /**
   * Empty the bag WITHOUT reverting. Matches WHS's scene-restart path:
   * the Player is rebuilt fresh, so reverting stats on the stale instance
   * would be a no-op at best and a mis-apply at worst.
   */
  clear(): void {
    this.entries = [];
  }

  /** Number of currently-live buffs. */
  activeCount(): number {
    return this.entries.length;
  }

  /** True when the given key has at least one active entry. */
  has(key: string): boolean {
    for (const e of this.entries) if (e.key === key) return true;
    return false;
  }

  /**
   * Snapshot of current entries — for HUD / pause-menu display. Returns a
   * shallow copy so the caller can't mutate internal state.
   */
  snapshot(): readonly TempBuffEntry[] {
    return this.entries.slice();
  }
}
