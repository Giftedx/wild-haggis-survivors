/**
 * Shared types for the seven Moor Road node-event resolvers (M1 M3).
 *
 * Each resolver is a pure function: `(node, rng?, context?) → spec`.
 * The scene applies the spec against the live systems (SpawnSystem,
 * Player, RelicSystem, etc.) so the resolvers stay headless and testable.
 */
import type { RelicKey } from '../../data/relics';

// -- encounter ---------------------------------------------------------------

export interface EncounterEnemyMix {
  readonly key: string;
  readonly count: number;
}

export interface EncounterSpec {
  readonly enemyMix: readonly EncounterEnemyMix[];
  readonly durationMs: number;
}

// -- shrine ------------------------------------------------------------------

export interface ShrineBuffCandidate {
  readonly key: string;
}

export interface ShrineSpec {
  readonly candidates: readonly ShrineBuffCandidate[];
  readonly durationMs: number;
}

// -- wee_trader --------------------------------------------------------------

export type TraderItemKind = 'relic' | 'passive' | 'reroll';

export interface TraderStockItem {
  readonly kind: TraderItemKind;
  readonly key: string;
  readonly priceGold: number;
}

export interface TraderSpec {
  readonly items: readonly TraderStockItem[];
}

// -- hidden ------------------------------------------------------------------

export type HiddenRewardKind = 'relic' | 'lore_fragment';

export interface HiddenSpec {
  readonly kind: HiddenRewardKind;
  /** When kind === 'relic'; caller resolves to an actual RelicKey via RelicSystem. */
  readonly rewardKey?: string;
}

// -- bargain -----------------------------------------------------------------

export type BargainOfferKind = 'relic' | 'buff_run' | 'weapon_upgrade_token';

export interface BargainSpec {
  /** Damage taken by the player on accept (integer; clamped by caller). */
  readonly hpCost: number;
  readonly offerKind: BargainOfferKind;
  readonly offerKey: string;
}

// -- rest --------------------------------------------------------------------

export interface RestSpec {
  readonly healRatio: number;
  readonly rerollTokens: number;
}

// -- elite -------------------------------------------------------------------

export interface EliteMultipliers {
  readonly hp: number;
  readonly speed: number;
  readonly xp: number;
}

export interface EliteEncounterSpec {
  readonly enemyKey: string;
  readonly eliteMul: EliteMultipliers;
  readonly guaranteedRelic: boolean;
}

// -- helpers -----------------------------------------------------------------

/** Safe coerce of `node.data.foo` where `foo` is expected to be a number. */
export function readNumber(
  data: Readonly<Record<string, unknown>>,
  key: string,
  fallback: number,
): number {
  const v = data[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Safe coerce of a string array from `node.data.foo`. Empty on mismatch. */
export function readStringArray(
  data: Readonly<Record<string, unknown>>,
  key: string,
): string[] {
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

// Re-export for callers who want to annotate a relic-returning event
export type { RelicKey };
