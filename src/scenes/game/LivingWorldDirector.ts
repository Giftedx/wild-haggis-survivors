/**
 * LivingWorldDirector — cross-track coordinator for the Living World
 * Initiative.
 *
 * Owns:
 *   - registration of `LivingWorldSubsystem` instances (companion,
 *     atmosphere, music-bridge, etc.)
 *   - moment broadcast: any subsystem can call `notify(moment)` and
 *     every registered listener receives it
 *   - per-frame tick — only fires when GameScene is NOT paused; that
 *     mirrors the rest of the cosmetic stack (weather, juice particle
 *     trails) and matches the new-system safety pattern in CLAUDE.md
 *
 * Explicitly does NOT own:
 *   - any source of gameplay randomness (subsystems with gameplay
 *     branches must use `runRng` themselves)
 *   - any Phaser objects (kept framework-free so the unit test can
 *     run in node-env vitest)
 *   - per-subsystem reset logic (each subsystem destroys itself; the
 *     director resets ITS registry of listeners + subsystems)
 *
 * Lifecycle:
 *   - `new LivingWorldDirector()` is safe to construct early in
 *     scene `create()` — it owns no resources of its own.
 *   - Subsystems register via `addSubsystem` once they have been
 *     constructed; they unregister on their own teardown.
 *   - `reset()` is called from `resetTransientRunState` at the top of
 *     every `create()` run. Subsystems are responsible for their own
 *     destroy/null; the director only clears its registries.
 *   - `destroy()` is the scene-shutdown path; it also clears
 *     registries. Repeated `destroy()` calls are no-ops.
 */

import type {
  LivingWorldMoment,
  LivingWorldMomentListener,
  LivingWorldRunContext,
} from './livingWorldTypes';

/** Subsystem contract. All methods optional — implement only what you use. */
export interface LivingWorldSubsystem {
  /** Stable identifier — useful for debugging + double-registration guards. */
  readonly id: string;
  /** Called every non-paused frame, with the same scaled delta used by gameplay. */
  update?(delta: number, ctx: LivingWorldRunContext): void;
  /** Called when a moment is broadcast; subsystem chooses whether to react. */
  onMoment?(moment: LivingWorldMoment, ctx: LivingWorldRunContext | null): void;
  /** Optional. Director calls this only on its own `destroy()`. */
  destroy?(): void;
}

export class LivingWorldDirector {
  private readonly subsystems = new Map<string, LivingWorldSubsystem>();
  private readonly listeners = new Set<LivingWorldMomentListener>();
  private lastCtx: LivingWorldRunContext | null = null;
  private destroyed = false;
  /**
   * Test/diagnostics — incremented each time `notify` fans out a moment.
   * Cheap and useful for unit tests asserting "this moment was emitted".
   */
  momentCountForTesting = 0;

  /**
   * Accumulator in `[0, 1]` that decays over time and is pulsed by
   * moments. Read via `getPresence()`. Conductor smooths this further
   * with its own time-constant — the music bridge is intentionally
   * double-buffered (director decay + conductor lerp) so a single
   * companion call never causes an audible click.
   *
   * Cosmetic-only contract: never feeds gameplay branches. Replay
   * determinism is unaffected because audio mix is non-authoritative.
   */
  private presenceAccum = 0;

  /** Register a subsystem. No-op when an ID is already registered. */
  addSubsystem(sub: LivingWorldSubsystem): void {
    if (this.destroyed) return;
    if (this.subsystems.has(sub.id)) return;
    this.subsystems.set(sub.id, sub);
  }

  /** Remove a subsystem by id. Safe to call when not present. */
  removeSubsystem(id: string): void {
    this.subsystems.delete(id);
  }

  hasSubsystem(id: string): boolean {
    return this.subsystems.has(id);
  }

  /** Add a moment listener; returns the unsubscribe handle. */
  addListener(listener: LivingWorldMomentListener): () => void {
    if (this.destroyed) return () => {};
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Broadcast a moment to every subsystem and listener. */
  notify(moment: LivingWorldMoment): void {
    if (this.destroyed) return;
    this.momentCountForTesting++;
    // Music-bridge pulse weights — small additive contributions per
    // moment kind, clamped at 1. Decay handled in `update`. The
    // weights are intentionally conservative; the moor's "aliveness"
    // should feel earned, not strobed by frequent events.
    this.presenceAccum = Math.min(1, this.presenceAccum + getMomentPresenceWeight(moment));
    // Snapshot the sets so a listener that registers / unregisters
    // during fanout doesn't mutate iteration mid-loop.
    const subs = Array.from(this.subsystems.values());
    for (const sub of subs) {
      sub.onMoment?.(moment, this.lastCtx);
    }
    const listeners = Array.from(this.listeners);
    for (const l of listeners) {
      l(moment);
    }
  }

  /**
   * Per-frame tick. Caller is responsible for the pause check —
   * matches the existing convention in `tickFrameWorld` where the
   * "world" bag is only assembled when the gameplay-pause guard
   * cleared.
   */
  update(delta: number, ctx: LivingWorldRunContext): void {
    if (this.destroyed) return;
    this.lastCtx = ctx;
    // Slow exponential decay on the presence accumulator. Time-constant
    // ~6000ms means a fresh pulse halves in ~4 seconds; combined with
    // Conductor's slower smoothing the layer reads as a gentle bloom.
    if (Number.isFinite(delta) && delta > 0 && this.presenceAccum > 0) {
      const decay = Math.min(1, delta / 6000);
      this.presenceAccum = Math.max(0, this.presenceAccum - this.presenceAccum * decay);
    }
    const subs = Array.from(this.subsystems.values());
    for (const sub of subs) {
      sub.update?.(delta, ctx);
    }
  }

  /**
   * 0–1 Living-World presence — clamped on output for defense-in-depth.
   * Composed from:
   *   - subsystem floor: a small baseline if any subsystem is registered
   *     (a sheepdog on the field IS the moor being more alive)
   *   - moment accumulator: pulsed by `notify`, decayed in `update`
   *
   * Read by the music bridge each frame; the Conductor smooths it
   * further with a slower time-constant. Cosmetic-only.
   */
  getPresence(): number {
    const subsystemFloor = this.subsystems.size > 0 ? 0.15 : 0;
    const combined = subsystemFloor + this.presenceAccum;
    return Math.min(1, Math.max(0, combined));
  }

  /** Last run context handed to `update`, or null before the first tick. */
  getLastContext(): LivingWorldRunContext | null {
    return this.lastCtx;
  }

  /** Number of currently-registered subsystems (test helper). */
  subsystemCount(): number {
    return this.subsystems.size;
  }

  /**
   * Reset between runs. Cleans the registries; does NOT destroy the
   * subsystems themselves — they own their own destroy paths and are
   * re-registered by the next run's wiring.
   */
  reset(): void {
    this.subsystems.clear();
    this.listeners.clear();
    this.lastCtx = null;
    this.momentCountForTesting = 0;
    this.presenceAccum = 0;
  }

  /** Scene-shutdown. Idempotent. Calls each subsystem's destroy(). */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    const subs = Array.from(this.subsystems.values());
    for (const sub of subs) {
      sub.destroy?.();
    }
    this.subsystems.clear();
    this.listeners.clear();
    this.lastCtx = null;
    this.presenceAccum = 0;
  }
}

/**
 * Per-moment presence weight. Conservative values — multiple moments
 * within the same second sum, then clamp at 1 in `notify`. Exported
 * for unit tests that assert presence math without touching Phaser.
 */
export function getMomentPresenceWeight(moment: LivingWorldMoment): number {
  switch (moment.kind) {
    // Whistled a companion into the world — the moor has a friend.
    case 'companion_called':
      return 0.35;
    // Lost the companion — a soft reduction, not a punch.
    case 'companion_dismissed':
      return 0.05;
    // Form-shift is a player-state event; small bloom.
    case 'form_shifted':
      return 0.20;
    // Rhythm-aligned hit — micro bloom, will happen many times.
    case 'rhythm_aligned':
      return 0.04;
    // Atmosphere motif came alive — the moor itself, not the player.
    case 'atmosphere_motif_active':
      return 0.10;
    default:
      return 0;
  }
}
