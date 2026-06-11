/**
 * Pure mapping from a killed-boss-key to the Act 3 stretch whose node
 * path should now load. Act 3 is split across three stretches (pre-Laird,
 * post-Laird, post-Hunter-General) so each beat gets its own bank of
 * flavoured nodes instead of cycling the same pool for the entire act.
 *
 * - `the_laird` → advance to stretch 2 (pre-Laird → post-Laird)
 * - `hunter_general` → advance to stretch 3 (post-Laird → post-Hunter)
 * - everything else (including `gordon` / `tour_bus` / `taxman` and
 *   regular enemies) → null
 *
 * Kept as a pure function so `EnemyKillHandler` forwards without owning
 * the boss-list knowledge, matching the `dispatchActComplete` shape.
 */
import type { Act3Stretch } from '../../data/nodeBanks';

export interface DispatchStretchCompleteResult {
  /** Target stretch (2 or 3) whose bank should load, or null for non-stretch bosses. */
  readonly stretchToLoad: Act3Stretch | null;
}

const BOSS_KEY_TO_STRETCH: Readonly<Record<string, Act3Stretch>> = {
  the_laird: 2,
  hunter_general: 3,
};

export function dispatchStretchComplete(bossKey: string): DispatchStretchCompleteResult {
  const stretch = BOSS_KEY_TO_STRETCH[bossKey];
  return { stretchToLoad: stretch ?? null };
}
