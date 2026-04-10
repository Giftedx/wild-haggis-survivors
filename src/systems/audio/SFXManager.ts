/**
 * Per–sound-key concurrency gate (sliding window) to cap simultaneous / bursty SFX.
 * Used by AudioSystem so gameplay bursts (many XP gems, AoE hits) do not spawn
 * hundreds of Web Audio nodes in one frame.
 */

export type SfxLimit = { maxConcurrent: number; windowMs: number };

/** Defaults tuned for survivor-like burst traffic. Unknown keys get a permissive fallback. */
export const SFX_LIMITS: Record<string, SfxLimit> = {
  hit: { maxConcurrent: 8, windowMs: 50 },
  kill: { maxConcurrent: 6, windowMs: 50 },
  xp_pickup: { maxConcurrent: 3, windowMs: 50 },
  shoot: { maxConcurrent: 4, windowMs: 50 },
  click: { maxConcurrent: 10, windowMs: 100 },
};

const DEFAULT_LIMIT: SfxLimit = { maxConcurrent: 24, windowMs: 50 };

export class SFXManager {
  private readonly slots = new Map<string, number[]>();

  constructor(private readonly nowMs: () => number = () => performance.now()) {}

  /** Drop all windows — call between runs if reusing one global instance. */
  clear(): void {
    this.slots.clear();
  }

  /**
   * If the key is under its concurrency cap for the current window, run `play`
   * exactly once. Otherwise no-op.
   */
  tryPlay(key: string, play: () => void): void {
    const cfg = SFX_LIMITS[key] ?? DEFAULT_LIMIT;
    const now = this.nowMs();
    let stamps = this.slots.get(key) ?? [];
    stamps = stamps.filter((t) => now - t < cfg.windowMs);
    if (stamps.length >= cfg.maxConcurrent) return;
    stamps.push(now);
    this.slots.set(key, stamps);
    play();
  }
}

/** Scene-wide instance — ISceneContext exposes this; AudioSystem routes gated SFX here. */
export const sfxManager = new SFXManager();
