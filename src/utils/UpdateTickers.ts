export type TickerMode = 'scaled' | 'raw';

type OnceTicker = {
  remainingMs: number;
  cancelled: boolean;
  fired: boolean;
  fire: () => void;
};

type IntervalTicker = {
  remainingMs: number;
  intervalMs: number;
  repeatsRemaining: number | null; // null = forever
  cancelled: boolean;
  fire: () => void;
};

export type TickerHandle = {
  cancel: () => void;
  readonly cancelled: boolean;
};

/**
 * UpdateTickers — deterministic, frame-ticked timers for gameplay and UI.
 *
 * - **scaled**: tick with scaled delta (freezes when timeScale=0 / gameplay paused)
 * - **raw**: tick with raw delta (continues during gameplay pause / timeScale=0)
 *
 * The caller controls which delta is passed to each tick method; no callbacks
 * are scheduled onto Phaser's event loop.
 */
export class UpdateTickers {
  private scaledOnce: OnceTicker[] = [];
  private rawOnce: OnceTicker[] = [];
  private scaledIntervals: IntervalTicker[] = [];
  private rawIntervals: IntervalTicker[] = [];

  addOnce(mode: TickerMode, delayMs: number, fn: () => void): TickerHandle {
    const t: OnceTicker = {
      remainingMs: Math.max(0, delayMs),
      cancelled: false,
      fired: false,
      fire: fn,
    };
    (mode === 'scaled' ? this.scaledOnce : this.rawOnce).push(t);
    return {
      cancel: () => { t.cancelled = true; },
      get cancelled() { return t.cancelled; },
    };
  }

  addInterval(mode: TickerMode, intervalMs: number, fn: () => void, opts?: { repeats?: number | null; startDelayMs?: number }): TickerHandle {
    const interval = Math.max(1, intervalMs);
    const repeats = opts?.repeats ?? null;
    const startDelay = opts?.startDelayMs ?? interval;
    const t: IntervalTicker = {
      remainingMs: Math.max(0, startDelay),
      intervalMs: interval,
      repeatsRemaining: repeats === null ? null : Math.max(0, repeats),
      cancelled: false,
      fire: fn,
    };
    (mode === 'scaled' ? this.scaledIntervals : this.rawIntervals).push(t);
    return {
      cancel: () => { t.cancelled = true; },
      get cancelled() { return t.cancelled; },
    };
  }

  tickScaled(deltaMs: number): void {
    this.tick(this.scaledOnce, this.scaledIntervals, deltaMs);
  }

  tickRaw(deltaMs: number): void {
    this.tick(this.rawOnce, this.rawIntervals, deltaMs);
  }

  clear(): void {
    this.scaledOnce = [];
    this.rawOnce = [];
    this.scaledIntervals = [];
    this.rawIntervals = [];
  }

  private tick(once: OnceTicker[], intervals: IntervalTicker[], deltaMs: number): void {
    if (deltaMs <= 0) return;

    // One-shots
    for (let i = once.length - 1; i >= 0; i--) {
      const t = once[i];
      if (t.cancelled || t.fired) {
        once.splice(i, 1);
        continue;
      }
      t.remainingMs -= deltaMs;
      if (t.remainingMs <= 0) {
        t.fired = true;
        try { t.fire(); } finally { once.splice(i, 1); }
      }
    }

    // Intervals
    for (let i = intervals.length - 1; i >= 0; i--) {
      const t = intervals[i];
      if (t.cancelled) { intervals.splice(i, 1); continue; }

      t.remainingMs -= deltaMs;
      while (t.remainingMs <= 0 && !t.cancelled) {
        if (t.repeatsRemaining !== null && t.repeatsRemaining <= 0) {
          intervals.splice(i, 1);
          break;
        }
        try { t.fire(); } finally {
          if (t.repeatsRemaining !== null) t.repeatsRemaining--;
        }
        t.remainingMs += t.intervalMs;
        if (t.repeatsRemaining !== null && t.repeatsRemaining <= 0) {
          intervals.splice(i, 1);
          break;
        }
      }
    }
  }
}

