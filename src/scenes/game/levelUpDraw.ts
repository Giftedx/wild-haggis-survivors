import type { UpgradeCard } from '../../data/upgrades';
import type { SaveData } from '../../utils/save';

/**
 * Pure helpers for the LevelUpFlow card-draw pipeline.
 *
 * The scene still owns the drawCards() call (it needs the RNG and
 * buildCardPool result from multiple live systems), but these three
 * small decisions can be pinned with tests:
 *
 *   - filterHealCardsWhenFull: drop heal cards when HP is already full
 *   - resolveLuckBonus: sum sporran + lucky_heather + player bonus
 *   - resolveCardCount: +1 card when the 'extra_choice' perm upgrade is owned
 */

/** Flat luck points granted by owning the Sporran passive. */
export const LUCK_BONUS_SPORRAN = 15;
/** Luck points per level of the lucky_heather permanent upgrade. */
export const LUCK_BONUS_PER_LUCKY_HEATHER_LEVEL = 10;

/**
 * Remove heal / healPercent stat-boost cards from the offered pool
 * when the player is already at full HP. Prevents a wasted pick.
 */
export function filterHealCardsWhenFull(
  pool: readonly UpgradeCard[],
  isAtMaxHp: boolean,
): UpgradeCard[] {
  if (!isAtMaxHp) return pool.slice();
  return pool.filter(
    (c) => !(c.effect.type === 'stat_boost'
      && (c.effect.stat === 'heal' || c.effect.stat === 'healPercent')),
  );
}

/**
 * Luck-draw bonus in whole points. Sums:
 *
 *   - Sporran passive:            +15 if equipped
 *   - lucky_heather permanent:    +10 per level
 *   - Player.getLuckDrawBonus():  whatever in-run bonuses have accrued
 *
 * Negative save values (corrupted upgrades map) clamp to 0.
 */
export function resolveLuckBonus(
  save: Pick<SaveData, 'upgrades'>,
  ownedPassives: readonly string[],
  playerLuckDrawBonus: number,
): number {
  let luck = 0;
  if (ownedPassives.includes('sporran')) luck += LUCK_BONUS_SPORRAN;
  const heatherLevels = Math.max(0, Math.floor(save.upgrades['lucky_heather'] ?? 0));
  luck += heatherLevels * LUCK_BONUS_PER_LUCKY_HEATHER_LEVEL;
  luck += Math.max(0, playerLuckDrawBonus);
  return luck;
}

/**
 * Number of upgrade cards offered per level-up. +1 when the
 * `extra_choice` permanent upgrade is owned (any level > 0 counts).
 */
export function resolveCardCount(
  save: Pick<SaveData, 'upgrades'>,
  baseCardsPerLevel: number,
): number {
  const extra = (save.upgrades['extra_choice'] ?? 0) > 0 ? 1 : 0;
  return Math.max(1, Math.floor(baseCardsPerLevel) + extra);
}
