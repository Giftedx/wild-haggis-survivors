/**
 * B1 Phase 3 Task 17 — pure decision helper for the `enemy_ambient` banter
 * pool. SpawnSystem calls this at every regular (non-boss) enemy spawn and
 * routes the result to `requestBanter('enemy_ambient', enemyKey)`.
 *
 *   - First-ever encounter of an enemy key → `'first'` (banter line fires
 *     through the first-encounter sub-pool and the key is persisted into
 *     `SaveData.seenEnemies` so the line never re-fires at full priority).
 *   - Enemy already seen → occasional 1-in-20 respawn flavour line
 *     (`'respawn'`) so familiar foes still get the odd aside.
 *   - Otherwise → `null`; no request, SpawnSystem stays silent.
 *
 * Pure: takes a `ReadonlySet<string>` of seen enemies + an RNG probe and
 * returns a discriminated decision. Testable without Phaser or save state.
 * Rate-limit + priority arbitration live in `BanterSystem` — this helper
 * only decides *whether* a request is warranted per spawn.
 */

export type EnemyAmbientDecision = 'first' | 'respawn' | null;

/** Probability a re-encounter fires its ambient flavour line. */
export const ENEMY_AMBIENT_RESPAWN_CHANCE = 0.05;

export function resolveEnemyAmbientTrigger(
  enemyKey: string,
  seenEnemies: ReadonlySet<string>,
  rngBool: (probability: number) => boolean,
): EnemyAmbientDecision {
  if (enemyKey.length === 0) return null;
  if (!seenEnemies.has(enemyKey)) return 'first';
  if (rngBool(ENEMY_AMBIENT_RESPAWN_CHANCE)) return 'respawn';
  return null;
}
