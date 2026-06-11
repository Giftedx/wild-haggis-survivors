/**
 * Pre-Run First-Footing — Hogmanay seasonal hook (DESIGN_IDEAS §1).
 *
 * Tradition: the first person across the threshold after midnight on
 * 31 December is the "first-footer". A dark-haired man bringing
 * symbolic gifts — shortbread (food), whisky (drink), coal (warmth),
 * silver (wealth) — promises the household luck for the year. Across
 * Scotland the customs vary in detail; the four-gift pattern is the
 * most-cited form.
 *
 * In WHS the wild haggis is the household. During the Hogmanay
 * seasonal window (Dec 28 – Jan 3) every run starts with a rolled
 * first-footing gift — one of four small but visible boons, with a
 * Hearth-warm toast announcing the visitor.
 *
 * Pure helpers — no Phaser, no scene state. RNG is `runRng` so a
 * given seed always rolls the same gift (replay determinism intact).
 * The opt-out paths flow through caller — `disableSeasonalEvents`
 * stops the seasonal-event lookup upstream so this module never
 * receives 'hogmanay' on an opt-out save, and `null` from
 * `rollFirstFootingGift` short-circuits cleanly.
 */

import type { RNG } from '../utils/rng';
import type { RunModifiers } from '../core/RunModifiers';

/** The four traditional first-foot gifts. */
export type FirstFootingGiftKind = 'shortbread' | 'whisky' | 'coal' | 'silver';

export const FIRST_FOOTING_GIFT_KINDS: readonly FirstFootingGiftKind[] = [
  'shortbread',
  'whisky',
  'coal',
  'silver',
] as const;

/**
 * Roll a first-footing gift for this run, or `null` when no gift
 * should fire. The gate fires on a Hogmanay-keyed seasonal event;
 * any other event (or null event) returns null immediately so the
 * caller branches cleanly without redundant date math.
 */
export function rollFirstFootingGift(
  rng: RNG,
  seasonalEventKey: string | null,
): FirstFootingGiftKind | null {
  if (seasonalEventKey !== 'hogmanay') return null;
  return rng.pick(FIRST_FOOTING_GIFT_KINDS);
}

/**
 * Per-gift modifier deltas applied IN PLACE to the run's `RunModifiers`
 * bag. Returns the deltas as a separate object too so callers (and
 * tests) can introspect what changed without comparing snapshots.
 *
 * Mapping (values are deliberately small — first-footing is a luck
 * blessing, not a build-around):
 *  - shortbread → +20 starting HP (applied via `extraStartingHpHeal`,
 *    NOT through RunModifiers — caller heals the spawned Player).
 *  - whisky → spawnIntervalMult ×1.08 (a slightly calmer opening
 *    wave; "the moor's drinking too").
 *  - coal → damageTakenMult ×0.95 (warmth softens the first hits;
 *    5% less damage taken all run).
 *  - silver → goldMult ×1.15 (+15% gold this run; the silver coin
 *    promises wealth for the year).
 */
export interface FirstFootingResult {
  /** The gift that rolled — null if no gift fired. */
  readonly gift: FirstFootingGiftKind | null;
  /**
   * Post-spawn heal amount in HP. Non-zero only for `shortbread`.
   * Caller invokes `player.heal(amount)` after Player construction.
   */
  readonly extraStartingHpHeal: number;
}

export function applyFirstFootingToModifiers(
  gift: FirstFootingGiftKind | null,
  modifiers: RunModifiers,
): FirstFootingResult {
  if (gift === null) return { gift: null, extraStartingHpHeal: 0 };
  switch (gift) {
    case 'shortbread':
      // No modifier-bag delta; caller heals after spawn.
      return { gift, extraStartingHpHeal: 20 };
    case 'whisky':
      // Slightly slower opening wave; the spawn director reads the
      // bag live so this takes effect from the next interval.
      modifiers.spawnIntervalMult *= 1.08;
      return { gift, extraStartingHpHeal: 0 };
    case 'coal':
      modifiers.damageTakenMult *= 0.95;
      return { gift, extraStartingHpHeal: 0 };
    case 'silver':
      modifiers.goldMult *= 1.15;
      return { gift, extraStartingHpHeal: 0 };
  }
}
