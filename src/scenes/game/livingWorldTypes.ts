/**
 * Living World Initiative — shared types.
 *
 * The Living World stack (companions, Selkie form, rhythm-coupled
 * weapon, atmosphere shader, music bridge, Croft surface) is a
 * cross-cutting program rather than a single feature. To keep the
 * tracks from drifting into six isolated hacks, every subsystem
 * talks through the same two-shape contract:
 *
 *  1. `LivingWorldRunContext` — a small, stable, mostly-read-only
 *     snapshot of the surrounding run. Subsystems pull from this
 *     instead of reaching into GameScene. Crucially, every field is
 *     either a primitive or a string union; nothing here is a Phaser
 *     handle, so Living World helpers can be unit-tested in node-env
 *     vitest without dragging the engine in.
 *  2. `LivingWorldMoment` — a tagged-union event that subsystems
 *     emit at notable transitions (companion called, form shifted,
 *     rhythm aligned, atmosphere motif active). The director fans
 *     these out to listeners; consumers are free to ignore moments
 *     they don't care about.
 *
 * Determinism contract: any subsystem whose response to a moment
 * could affect gameplay (damage, spawn, XP) must route its random
 * choices through the shared `runRng`. Cosmetic-only consumers
 * (shimmer, particle wisp) may use `Math.random()`. The director
 * carries no RNG of its own — passing it would create a cross-system
 * stream that none of the existing reset-order tests cover.
 */

import type { BiomeId } from '../../data/biomes';
import type { VariantKey } from '../../data/variants';
import type { CurseKey } from '../../data/curses';

/**
 * `getActiveSeasonalEventKey` returns `string | null` (see
 * `SeasonalEventManager`). The keys it can return are defined by
 * `SEASONAL_EVENTS`. We keep the field typed as `string | null` for
 * forward-compat with new seasons rather than enumerating a closed
 * union here — Living World subsystems compare on equality, not
 * exhaustiveness, so widening doesn't bite.
 */
type SeasonalEventKey = string;

/**
 * Minimal, framework-free run snapshot. Built fresh each frame by the
 * GameScene wiring and handed to subsystems that opt in. Subsystems
 * MUST NOT cache the object — keep refs to scalars they care about
 * instead, so a future "swap variant mid-run" path doesn't leave
 * stale references behind.
 */
export interface LivingWorldRunContext {
  /** Run seed — fixed for the run's lifetime; useful for branched RNGs. */
  readonly runSeed: number;
  /** Active variant. Lets subsystems gate on Selkie etc. without an i18n round-trip. */
  readonly variantKey: VariantKey;
  /** Active curse key, or null when the run picked the no-curse option. */
  readonly curseKey: CurseKey | null;
  /** Live seasonal event window (samhain, beltane, …) or null off-window. */
  readonly seasonalEventKey: SeasonalEventKey | null;
  /** Current biome the player is standing in. */
  readonly biomeId: BiomeId;
  /** Player HP fraction in [0,1]; consumers use it for tone/vfx ramps. */
  readonly hpFraction: number;
  /** Wall-clock-ish game seconds (already pause-aware via GameTickers). */
  readonly gameTimeSec: number;
  /** Accessibility flags — every Living World layer must respect these. */
  readonly reduceParticles: boolean;
  readonly reduceFlashing: boolean;
}

/**
 * Tagged-union moment. Add new kinds by widening the union — the
 * director uses `kind` to dispatch, listeners use it to discriminate.
 *
 * Cosmetic-only moments don't need to be authoritative; they exist so
 * the music bridge / atmosphere / HUD can react to the same event
 * without each subsystem subscribing to the others directly.
 */
export type LivingWorldMoment =
  | {
      readonly kind: 'companion_called';
      readonly companionKey: string;
      readonly playerX: number;
      readonly playerY: number;
    }
  | {
      readonly kind: 'companion_dismissed';
      readonly companionKey: string;
    }
  | {
      readonly kind: 'form_shifted';
      readonly from: string;
      readonly to: string;
    }
  | {
      readonly kind: 'rhythm_aligned';
      /** Multiplier applied (e.g. 1.15 from `PIBROCH_DAMAGE_MULT`-style sources). */
      readonly bonusMultiplier: number;
    }
  | {
      readonly kind: 'atmosphere_motif_active';
      readonly motifKey: string;
    };

/** Listener signature — synchronous. Throwing is treated as a bug. */
export type LivingWorldMomentListener = (moment: LivingWorldMoment) => void;
