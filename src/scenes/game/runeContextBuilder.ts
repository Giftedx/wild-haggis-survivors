/**
 * Pure builder that shapes a per-frame `RuneEvalContext` from a typed
 * slice of GameScene state. The scene calls this every tick and passes
 * the result to `RuneConditionSystem.tick`.
 *
 * Kept Phaser-free so the tick path is drivable from vitest without
 * standing up a real scene. Inputs are plain readonly shapes the scene
 * can cheaply synthesise each frame.
 */

import {
  emptyRuneEvalContext,
  type RuneEvalContext,
} from '../../systems/runes/runeConditions';

export interface RuneContextInputs {
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

/** Build a fresh context — every input explicit, no defaults leaking. */
export function buildRuneEvalContextFromScene(
  inputs: RuneContextInputs,
): RuneEvalContext {
  return {
    ...emptyRuneEvalContext(),
    ...inputs,
  };
}
