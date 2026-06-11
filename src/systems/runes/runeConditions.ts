/**
 * Pure rune-condition evaluators.
 *
 * Each condition reads a slice of `RuneEvalContext` and returns a boolean.
 * `RuneConditionSystem` builds the context once per frame, then invokes
 * `evaluateRuneCondition` per active rune.
 *
 * Semantics
 * - Sustained conditions (biome_*, hp_low, relics_full) return true for as
 *   long as their state holds; transition detection at the system layer
 *   turns that into an apply/remove pair.
 * - Pulse conditions (every_nth_kill, crit_on_weakened, kill_named_elite)
 *   return true only on the frame the event occurred; the system's
 *   transition detector fires the effect exactly once per pulse.
 */

import type { RuneConditionKey } from '../../data/runes';

export interface RuneEvalContext {
  readonly biomeKey: string | null;
  readonly hpFrac: number;
  readonly nearHazardWater: boolean;
  readonly nearCairn: boolean;
  readonly ownedRelicsCount: number;
  readonly ownedWeaponKeys: readonly string[];
  readonly runTimeMs: number;
  readonly combo: number;
  readonly unopenedChestsCount: number;
  readonly dashMsAgo: number | null;
  readonly evolvedWeaponsCount: number;
  readonly killsThisRun: number;
  readonly justKilled: boolean;
  readonly lastKillDeltaMs: number | null;
  readonly distinctKillTypesIn5s: number;
  readonly critOnWeakenedThisFrame: boolean;
  readonly pickupChainDurationMs: number;
  readonly namedEliteKilledThisFrame: boolean;
  readonly killOnThistleThisFrame: boolean;
  readonly musicBassActive: boolean;
  readonly nodesVisited: number;
  readonly postBell: boolean;
  readonly timeOfDayKey: 'dawn' | 'day' | 'dusk' | 'night' | null;
}

/** Neutral context where every condition evaluates to false. */
export function emptyRuneEvalContext(): RuneEvalContext {
  return {
    biomeKey: null,
    hpFrac: 0.5,               // neither low nor high
    nearHazardWater: false,
    nearCairn: false,
    ownedRelicsCount: 0,
    ownedWeaponKeys: [],
    runTimeMs: 600_000,         // neither early nor late
    combo: 0,
    unopenedChestsCount: 0,
    dashMsAgo: null,
    evolvedWeaponsCount: 0,
    killsThisRun: 0,
    justKilled: false,
    lastKillDeltaMs: null,
    distinctKillTypesIn5s: 0,
    critOnWeakenedThisFrame: false,
    pickupChainDurationMs: 0,
    namedEliteKilledThisFrame: false,
    killOnThistleThisFrame: false,
    musicBassActive: false,
    nodesVisited: 0,
    postBell: false,
    timeOfDayKey: null,
  };
}

// Thresholds pinned centrally so balancing touches one place.
export const RUNE_THRESHOLDS = Object.freeze({
  HP_LOW_FRAC: 0.3,
  HP_HIGH_FRAC: 0.9,
  RUN_EARLY_MS: 60_000,
  RUN_LATE_MS: 20 * 60_000,
  COMBO_HIGH: 50,
  CHESTS_MANY: 3,
  DASH_RECENT_MS: 2_000,
  EVOLVED_MULTI: 2,
  KILL_CASCADE_MS: 500,
  DISTINCT_TYPES: 3,
  PICKUP_CHAIN_MS: 5_000,
  DASHED_AGO_CENTER_MS: 5_000,
  DASHED_AGO_WINDOW_MS: 500,
  NODES_VISITED: 3,
  RELICS_FULL: 3,
});

export function evaluateRuneCondition(
  key: RuneConditionKey,
  ctx: RuneEvalContext,
): boolean {
  switch (key) {
    // ── biome ──
    case 'biome_fog':
      // B5 Phase 1b grounded the dedicated `haar` biome (east-coast
      // sea-fog). The 'fog' literal is retained as a forward-compat
      // alias in case future content keys haar via 'fog'; today only
      // 'haar' fires this predicate in production.
      return ctx.biomeKey === 'fog' || ctx.biomeKey === 'haar';
    case 'biome_bog': return ctx.biomeKey === 'bog';
    case 'biome_heather': return ctx.biomeKey === 'heather';
    case 'near_water_hazard': return ctx.nearHazardWater;
    case 'near_cairn': return ctx.nearCairn;
    case 'biome_dusk': return ctx.timeOfDayKey === 'dusk';
    case 'biome_cold':
      // B5 Phase 2 grounded the dedicated `frost` biome (Cairngorms
      // winter). The 'cold' literal is retained as a forward-compat
      // alias; today only 'frost' fires this predicate in production.
      return ctx.biomeKey === 'cold' || ctx.biomeKey === 'frost';
    case 'biome_coastal':
      // B5 Phase 1 grounded the dedicated `coastal` biome (Seawrack
      // tide). The Loch fallback stays as a design softener — both
      // biomes evoke the tonal palette the rune semantics (pickup-
      // chain hangs on by the shore) play cleanly in. To tighten back
      // to coastal-only, drop the `|| 'loch'` clause.
      return ctx.biomeKey === 'coastal' || ctx.biomeKey === 'loch';
    case 'post_bell': return ctx.postBell;
    case 'biome_urban':
      // B6 shipped `glasgow_close` as the live urban-flavour biome; the
      // catalogue key stays `biome_urban` so edinburgh_rune needs no id churn.
      return ctx.biomeKey === 'glasgow_close';
    // ── state ──
    case 'hp_low': return ctx.hpFrac < RUNE_THRESHOLDS.HP_LOW_FRAC;
    case 'hp_high': return ctx.hpFrac > RUNE_THRESHOLDS.HP_HIGH_FRAC;
    case 'relics_full': return ctx.ownedRelicsCount >= RUNE_THRESHOLDS.RELICS_FULL;
    case 'weapon_bagpipes': return ctx.ownedWeaponKeys.includes('bagpipes');
    case 'run_early': return ctx.runTimeMs < RUNE_THRESHOLDS.RUN_EARLY_MS;
    case 'run_late': return ctx.runTimeMs > RUNE_THRESHOLDS.RUN_LATE_MS;
    case 'combo_high': return ctx.combo >= RUNE_THRESHOLDS.COMBO_HIGH;
    case 'chests_many': return ctx.unopenedChestsCount >= RUNE_THRESHOLDS.CHESTS_MANY;
    case 'dash_recent_2s': return ctx.dashMsAgo !== null && ctx.dashMsAgo <= RUNE_THRESHOLDS.DASH_RECENT_MS;
    case 'evolved_multi': return ctx.evolvedWeaponsCount >= RUNE_THRESHOLDS.EVOLVED_MULTI;
    // ── action-chain ──
    case 'every_nth_kill:10':
      return ctx.justKilled && ctx.killsThisRun > 0 && ctx.killsThisRun % 10 === 0;
    case 'kill_cascade':
      return ctx.lastKillDeltaMs !== null && ctx.lastKillDeltaMs <= RUNE_THRESHOLDS.KILL_CASCADE_MS;
    case 'three_types_in_5s':
      return ctx.distinctKillTypesIn5s >= RUNE_THRESHOLDS.DISTINCT_TYPES;
    case 'crit_on_weakened': return ctx.critOnWeakenedThisFrame;
    case 'pickup_chain_5s': return ctx.pickupChainDurationMs >= RUNE_THRESHOLDS.PICKUP_CHAIN_MS;
    case 'dashed_5s_ago': {
      if (ctx.dashMsAgo === null) return false;
      const d = Math.abs(ctx.dashMsAgo - RUNE_THRESHOLDS.DASHED_AGO_CENTER_MS);
      return d < RUNE_THRESHOLDS.DASHED_AGO_WINDOW_MS;
    }
    case 'kill_named_elite': return ctx.namedEliteKilledThisFrame;
    case 'kill_on_thistle': return ctx.killOnThistleThisFrame;
    case 'music_bass_active': return ctx.musicBassActive;
    case 'visited_3_nodes': return ctx.nodesVisited >= RUNE_THRESHOLDS.NODES_VISITED;
  }
}
