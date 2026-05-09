/**
 * BanterSystem — context-reactive Glesga commentary.
 *
 * Mirrors the music Conductor: callers *request* a banter line for a
 * context; the engine decides whether/what/when based on rate-limit,
 * priority, frequency setting, and a no-repeat ring buffer.
 *
 * Output is routed through two existing surfaces:
 *   - JuiceSystem.showToast (primary visual)
 *   - scene.caption(...) (accessibility parity)
 *
 * The system is deliberately side-channel: it never fails loudly, never
 * blocks gameplay, and silently stands down when `banterFrequency = 'off'`.
 *
 * Deterministic by design: takes a `now()` clock + `rng()` so tests
 * exercise every branch without Phaser or timing flake.
 */

import { BANTER_POOLS, BanterContext, BanterPool, BanterTone, getBanterPool } from '../data/banter';
import type { BanterFrequency } from '../core/SettingsManager';

/**
 * Callback emitted after a banter line successfully fires through the
 * sink. Consumers wire this into the C1 Highland Almanac's DiscoveryLog
 * so `recordBanterHeard` bumps per heard line. Fires only for real
 * user-facing emissions — not for dropped / rate-limited / translated-
 * missing requests.
 */
export interface BanterLineFiredEvent {
  readonly key: string;
  readonly context: BanterContext;
  readonly tag?: string;
}

/** Minimum gap (ms) between any two banter lines, per frequency. */
export const BANTER_COOLDOWN_MS: Record<BanterFrequency, number> = {
  off: Number.POSITIVE_INFINITY,
  sparing: 15_000,
  normal: 8_000,
  chatty: 4_000,
};

/** Size of the no-immediate-repeat window (last N lines cannot replay). */
export const BANTER_NO_REPEAT_WINDOW = 8;

export interface BanterSink {
  /** Player-visible toast (primary surface). */
  toast(message: string, color?: string): void;
  /** Accessibility caption — may be a no-op if captions are disabled. */
  caption?(id: string, message: string, tint?: string): void;
}

export interface BanterSystemOptions {
  sink: BanterSink;
  /** Resolves an i18n key to a string — pass `t` from i18n.ts. */
  translate: (key: string) => string;
  /** Monotonic ms clock (perf.now or scene.time.now). */
  now: () => number;
  /** [0,1) random. Defaults to Math.random. */
  rng?: () => number;
  /** Mutable reader — evaluated every request so live setting changes take effect. */
  getFrequency: () => BanterFrequency;
  /**
   * Optional — called once per line that actually reaches the sink.
   * GameScene wires this to `bumpBanterHeard` so the Almanac's Banter
   * book fills in as lines are heard. Thrown errors are swallowed.
   */
  onLineFired?: (event: BanterLineFiredEvent) => void;
}

const TONE_COLORS = {
  hearth: '#b4e2a8',   // warm green — Still Game register
  edge: '#ff8866',     // urgent coral — Limmy bite
} as const;

export class BanterSystem {
  private readonly sink: BanterSink;
  private readonly translate: (key: string) => string;
  private readonly now: () => number;
  private readonly rng: () => number;
  private readonly getFrequency: () => BanterFrequency;
  private readonly onLineFired: ((event: BanterLineFiredEvent) => void) | null;

  private lastFireMs = -Infinity;
  private lastContext: BanterContext | null = null;
  /** Ring buffer of recently-used i18n keys (most recent last). */
  private recent: string[] = [];
  /** Pending request — the highest-priority context seen this tick. */
  private pending: { pool: BanterPool; reqTimeMs: number; tag?: string } | null = null;

  constructor(opts: BanterSystemOptions) {
    this.sink = opts.sink;
    this.translate = opts.translate;
    this.now = opts.now;
    this.rng = opts.rng ?? Math.random;
    this.getFrequency = opts.getFrequency;
    this.onLineFired = opts.onLineFired ?? null;
  }

  /**
   * Request a line for `context`. Returns true if queued/fired, false if
   * ignored (rate-limited, disabled, unknown context, or out-priorit'd).
   *
   * Per-tick: multiple calls compete; highest-priority wins on flush().
   * flush() is called by GameScene.update after all requests land.
   */
  request(context: BanterContext, payload?: { tag?: string }): boolean {
    const freq = this.getFrequency();
    if (freq === 'off') return false;

    const pool = getBanterPool(context);
    if (!pool || pool.keys.length === 0) return false;

    const nowMs = this.now();
    const cooldown = BANTER_COOLDOWN_MS[freq];
    if (nowMs - this.lastFireMs < cooldown) return false;

    // Suppress re-firing the same context back-to-back — if we just did
    // a low_hp line, don't do another until something else has spoken or
    // the cooldown is well past.
    if (this.lastContext === context && nowMs - this.lastFireMs < cooldown * 2) {
      return false;
    }

    if (this.pending && this.pending.pool.priority >= pool.priority) {
      return false;
    }
    this.pending = { pool, reqTimeMs: nowMs, tag: payload?.tag };
    return true;
  }

  /**
   * Commit the highest-priority pending request to the sink. Call once per
   * tick from GameScene.update — batching avoids double-fire when several
   * events land in the same frame (e.g. boss-warn + low-HP together).
   */
  flush(): void {
    if (!this.pending) return;
    const { pool, reqTimeMs, tag } = this.pending;
    this.pending = null;

    const key = this.pickKey(pool, tag);
    if (!key) return;

    const line = this.translate(key);
    if (!line || line === key) return;  // missing translation — stay silent

    const color = TONE_COLORS[pool.tone];
    this.sink.toast(line, color);
    this.sink.caption?.(`banter_${pool.context}`, line, color);

    this.lastFireMs = reqTimeMs;
    this.lastContext = pool.context;
    this.recent.push(key);
    if (this.recent.length > BANTER_NO_REPEAT_WINDOW) this.recent.shift();

    // Discovery-log hook — best-effort. A throwing listener must never
    // corrupt banter state.
    if (this.onLineFired) {
      try {
        this.onLineFired({ key, context: pool.context, tag });
      } catch {
        /* swallowed */
      }
    }
  }

  /**
   * Ceremonial line — fires a specific i18n key directly through the sink,
   * bypassing cooldown and same-tick arbitration. Use only for once-per-run
   * or once-per-save moments where the engine's normal pacing is wrong
   * (e.g. the Burns "Address to a Haggis" coda at victory: the run-long
   * thread of stanza fragments must close on the opener regardless of what
   * just spoke).
   *
   * Records the fire into the no-repeat ring buffer + lastFireMs/lastContext
   * so subsequent normal `request()` calls still respect cooldown from this
   * line — preventing ambient banter from immediately burying the coda.
   * Also calls `onLineFired` so the Almanac's Banter book counts it.
   *
   * Returns false if banter is `off` or the translation is missing.
   */
  forceLine(key: string, tone: BanterTone, context: BanterContext, tag?: string): boolean {
    if (this.getFrequency() === 'off') return false;
    const line = this.translate(key);
    if (!line || line === key) return false;

    const color = TONE_COLORS[tone];
    this.sink.toast(line, color);
    this.sink.caption?.(`banter_${context}`, line, color);

    this.lastFireMs = this.now();
    this.lastContext = context;
    this.recent.push(key);
    if (this.recent.length > BANTER_NO_REPEAT_WINDOW) this.recent.shift();

    if (this.onLineFired) {
      try {
        this.onLineFired({ key, context, tag });
      } catch {
        /* swallowed */
      }
    }
    return true;
  }

  /** Forget all history — call on new run so lines are fresh. */
  reset(): void {
    this.lastFireMs = -Infinity;
    this.lastContext = null;
    this.recent.length = 0;
    this.pending = null;
  }

  // ── Internals ──

  private pickKey(pool: BanterPool, tag?: string): string | null {
    // Tag hit → use the authored sub-pool (boss character / variant voice).
    // Unknown or missing tag → silently fall back to the generic pool so
    // new bosses/variants ship without requiring content before they can
    // fire banter at all.
    const tagged = tag ? pool.keysByTag?.[tag] : undefined;
    const basePool = tagged && tagged.length > 0 ? tagged : pool.keys;
    const candidates = basePool.filter((k) => !this.recent.includes(k));
    const source = candidates.length > 0 ? candidates : basePool;
    if (source.length === 0) return null;
    const idx = Math.floor(this.rng() * source.length);
    return source[Math.min(idx, source.length - 1)];
  }
}

/** Exposed for tests — prove every declared context has a pool + keys. */
export function allBanterContexts(): readonly BanterContext[] {
  return BANTER_POOLS.map((p) => p.context);
}
