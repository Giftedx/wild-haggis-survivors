/**
 * Relic drop-roll math — pure helpers for R1 M2 T12.
 *
 * Decides *whether* a Relic drops (elite kill 15% base, legendary chest
 * 25% override, Tier-2+ bosses guaranteed) and *which* Relic drops
 * (weighted 50/35/15 rarity pool, filtered by drop-affinity + exclusion
 * of already-held keys).
 *
 * All functions are Phaser-agnostic and accept an injected `RNG` so
 * replay playback is byte-deterministic. Callers — RelicSystem,
 * EnemyKillHandler, PickupSpawner — thread the run RNG through.
 *
 * Spec: docs/superpowers/specs/2026-04-23-relics-third-tier-design.md §2, §3, §7.
 */
import type { RNG } from '../utils/rng';
import {
  RARITY_DROP_WEIGHTS,
  RELICS,
  RELIC_KEYS,
  type RelicDef,
  type RelicDropSource,
  type RelicKey,
  type RelicRarity,
} from './relics';

/** Base drop chance for an elite kill (spec §2). Luck-scaled externally. */
export const RELIC_ELITE_BASE_DROP_CHANCE = 0.15;

/** Chance a legendary chest roll is overridden to a Relic (spec §2). */
export const RELIC_CHEST_OVERRIDE_CHANCE = 0.25;

/**
 * Boss keys that guarantee a Relic drop. Spec §2 names the four
 * Tier-2+ bosses; Gordon is Tier-1 and deliberately excluded so the
 * first Act doesn't flood the early run with Relics.
 *
 * V2 (2026-05-22) — `cailleach_boss` added as guaranteed since the
 * Cailleach Gauntlet costs the player 7 cairn-touches; the reward
 * must land.
 */
export const RELIC_BOSS_GUARANTEED_SOURCES: ReadonlySet<string> = new Set([
  'tour_bus',
  'the_laird',
  'hunter_general',
  'taxman',
  'cailleach_boss',
]);

/**
 * V2 — for bosses with a `restrictedToBossKey`-matching relic in the
 * catalogue, return that relic def directly (skipping the pool roll).
 * Returns null if the boss has no restricted relic, falling back to
 * the normal pool path. Used by the relic-drop call site to ensure
 * the Cailleach Gauntlet always drops Stormcrown specifically.
 */
export function pickRestrictedRelicForBoss(bossKey: string): RelicDef | null {
  for (const key of RELIC_KEYS) {
    const def = RELICS[key];
    if (def.restrictedToBossKey === bossKey) {
      return def;
    }
  }
  return null;
}

/** Ordered rarity tiers for the weighted pool. */
const RARITY_TIERS: readonly RelicRarity[] = ['common', 'uncommon', 'rare'];

/**
 * Does an elite kill drop a Relic? 15% base chance scaled by luck.
 * Clamped to [0, 1]. `luck = 0` never fires; `luck >= 1/base` always does.
 */
export function rollEliteDropOccurs(rng: RNG, luckMultiplier: number): boolean {
  const chance = Math.min(
    1,
    Math.max(0, RELIC_ELITE_BASE_DROP_CHANCE * luckMultiplier),
  );
  if (chance <= 0) return false;
  return rng.bool(chance);
}

/** Does a legendary chest roll override to a Relic drop? */
export function rollChestOverrideOccurs(rng: RNG): boolean {
  return rng.bool(RELIC_CHEST_OVERRIDE_CHANCE);
}

/** Does killing this boss guarantee a Relic drop? */
export function bossGrantsRelic(bossKey: string): boolean {
  return RELIC_BOSS_GUARANTEED_SOURCES.has(bossKey);
}

/**
 * Select one Relic from the drop pool.
 *
 * Two-step weighted roll:
 *   1. Pick a rarity tier by `RARITY_DROP_WEIGHTS` (50/35/15). If no
 *      relic of that tier matches `source` + isn't held, fall back to
 *      the next tier in weight order, then uniformly across everything
 *      eligible. Keeps the authored distribution honest while still
 *      degrading gracefully as the player collects Relics.
 *   2. Within the chosen tier, uniform-pick among source-matching,
 *      not-held candidates.
 *
 * Returns `null` only if every Relic in the catalogue is already held
 * — in that case the caller should silently skip the drop.
 */
export function pickRelicFromPool(
  source: RelicDropSource,
  rng: RNG,
  heldKeys: readonly RelicKey[],
): RelicDef | null {
  const held = new Set<RelicKey>(heldKeys);

  // Partition the catalogue once by rarity + source + not-held.
  const byRarity: Record<RelicRarity, RelicDef[]> = {
    common: [],
    uncommon: [],
    rare: [],
  };
  for (const key of RELIC_KEYS) {
    const def = RELICS[key];
    if (held.has(key)) continue;
    if (!def.dropAffinity.includes(source)) continue;
    // V2 — restricted relics never appear in the open pool; they
    // drop only through `pickRestrictedRelicForBoss`.
    if (def.restrictedToBossKey) continue;
    byRarity[def.rarity].push(def);
  }

  const candidateTiers = RARITY_TIERS.filter((r) => byRarity[r].length > 0);
  if (candidateTiers.length === 0) return null;

  // Rarity pick, weighted by RARITY_DROP_WEIGHTS restricted to tiers
  // that actually have candidates. `rng.weighted` handles the
  // re-normalisation for us, so the 50/35/15 split collapses cleanly
  // to e.g. 50/35 when no rare matches the source.
  const chosenTier = rng.weighted(candidateTiers, (r) => RARITY_DROP_WEIGHTS[r]);
  const tierPool = byRarity[chosenTier];
  return rng.pick(tierPool);
}
