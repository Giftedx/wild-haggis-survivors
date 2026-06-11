/**
 * Variant unlock + progress-snapshot helpers.
 *
 * Extracted from `src/utils/save.ts` per the 2026-04-30 restructure plan
 * (Phase 1.5). `evaluateVariantUnlocks` is the unlock resolver consumed by
 * both `applyRunSummary` (history.ts) and `finalizeSaveCandidate`
 * (migrations.ts). `coerceSelectedVariant` clamps a persisted selection
 * to the unlocked set. `progressSnapshotFromSave` is the public adapter
 * SaveScenes use to render variant-progress strips against a SaveData.
 */

import {
  DEFAULT_VARIANT_KEY,
  VARIANTS,
  VariantKey,
  VariantProgressSnapshot,
  coerceVariantKeys,
  getVariantByKey,
  meetsVariantUnlockCondition,
} from '../../data/variants';
import type { SaveData } from './types';

export function evaluateVariantUnlocks(
  progress: VariantProgressSnapshot,
  previouslyUnlocked: readonly VariantKey[] = []
): { unlockedVariants: VariantKey[]; newlyUnlockedVariants: VariantKey[] } {
  const unlocked = new Set<VariantKey>([DEFAULT_VARIANT_KEY, ...previouslyUnlocked]);

  for (const variant of VARIANTS) {
    if (meetsVariantUnlockCondition(variant, progress)) {
      unlocked.add(variant.key);
    }
  }

  const unlockedVariants = coerceVariantKeys(Array.from(unlocked));
  const previousSet = new Set<VariantKey>(previouslyUnlocked);
  const newlyUnlockedVariants = unlockedVariants.filter((key) => !previousSet.has(key));

  return { unlockedVariants, newlyUnlockedVariants };
}

export function coerceSelectedVariant(
  selectedVariant: unknown,
  unlockedVariants: readonly VariantKey[]
): VariantKey {
  const normalized = getVariantByKey(typeof selectedVariant === 'string' ? selectedVariant : undefined).key;
  return unlockedVariants.includes(normalized) ? normalized : DEFAULT_VARIANT_KEY;
}

/**
 * V2 followup — build a `VariantProgressSnapshot` whose field names
 * match the snapshot contract (short names: `cursedVictories`, not
 * the SaveData long form `cursedVictoriesCompleted`). SaveScenes
 * rendering variant-progress strips must route through this helper
 * rather than pass `SaveData` directly — structural typing masks the
 * name mismatch and silently reports "0/N" for every progress row.
 */
export function progressSnapshotFromSave(save: SaveData): VariantProgressSnapshot {
  return {
    bestTime: save.bestTime,
    bestKills: save.bestKills,
    totalGoldEarned: save.totalGoldEarned,
    victories: save.victories,
    cursedVictories: save.cursedVictoriesCompleted,
    runsWithoutHealing: save.runsWithoutHealingCircleCompleted,
    runsInCoastalOnly: save.runsInCoastalOnlyCompleted,
    runsWithAllEvolutions: save.runsWithAllEvolutionsCompleted,
    burnsNightFullEvoRuns: save.burnsNightFullEvoRunsCompleted,
    unlockedVariants: save.unlockedVariants,
  };
}
