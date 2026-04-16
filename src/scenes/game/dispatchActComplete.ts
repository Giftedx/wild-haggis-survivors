/**
 * Pure mapping from killed-boss-key to the act that its death completes.
 * Returns null for bosses that do not gate an act (the_laird triggers the
 * existing victory bell, hunter_general is post-bell content) or for any
 * unknown / non-boss key.
 *
 * Kept as a pure function so EnemyKillHandler can forward without owning
 * the boss-list knowledge.
 */

export interface DispatchActCompleteResult {
  /** Act number (1 or 2) whose picker should launch, or null if none. */
  readonly actToComplete: 1 | 2 | null;
}

const BOSS_KEY_TO_ACT: Readonly<Record<string, 1 | 2>> = {
  gordon: 1,
  tour_bus: 2,
};

export function dispatchActComplete(bossKey: string): DispatchActCompleteResult {
  const act = BOSS_KEY_TO_ACT[bossKey];
  return { actToComplete: act ?? null };
}
