/**
 * Phaser-free selection of which animated enemies BootScene bakes eagerly
 * vs. which defer to lazy per-encounter bake (`ensureEnemyAtlas`). Sister
 * to `variantAtlasKeys.ts` — key/selection logic stays Phaser-free so it's
 * unit-testable; the imperative bake lives in `variantAtlasBaker.ts`.
 *
 * ADR-0005 enemy-bake descope (2026-05-29): the W71 animated-enemy roster
 * grew the eager enemy atlas bake to ~333 ms (1026 keys) — over the W71
 * boot budget (`e2e/w71-atlas-bake-budget.spec.ts`), the exact "animated-
 * enemy roster expansion" that spec's own comment anticipated would force
 * this descope. Boot now eagerly bakes only the early-appearing enemies a
 * player meets in the opening minutes (so run-start never hitches); later
 * enemies and all bosses (absent from `ENEMY_TYPES`) bake lazily at spawn.
 * Correctness is guaranteed by the spawn chokepoint (`Enemy.spawn` calls
 * `ensureEnemyAtlas` before the AnimationController's first `setTexture`),
 * so this threshold is a feel knob, not a correctness lever — trash lazy-
 * bakes are sub-frame; bosses are telegraphed.
 */
import { ENEMY_TYPES } from '../../data/enemies';

/**
 * Enemies first appearing at or before this game-second are baked at boot.
 * Tuned so the eager bake stays well under the W71 boot budget while the
 * opening minutes (the densest onboarding window) never hitch. Everything
 * later — plus every boss — defers to `ensureEnemyAtlas` at spawn.
 */
export const EAGER_ENEMY_MAX_APPEARS_AT_SEC = 180;

/**
 * True when `enemyKey` is a timed roster enemy (`ENEMY_TYPES`) that first
 * appears at or before `maxAppearsAtSec`. Bosses, post-bell specials, and
 * summoned minions are absent from `ENEMY_TYPES` and so are never eager.
 */
export function isEagerEnemyKey(
  enemyKey: string,
  maxAppearsAtSec: number = EAGER_ENEMY_MAX_APPEARS_AT_SEC,
): boolean {
  const cfg = ENEMY_TYPES[enemyKey];
  return cfg != null && cfg.appearsAt <= maxAppearsAtSec;
}

/**
 * Filter animated enemy keys (from the frame registry) down to the eager
 * set BootScene bakes on the cold path. Keys absent from `ENEMY_TYPES` are
 * dropped (deferred to lazy bake).
 */
export function selectEagerEnemyKeys(
  animatedKeys: readonly string[],
  maxAppearsAtSec: number = EAGER_ENEMY_MAX_APPEARS_AT_SEC,
): string[] {
  return animatedKeys.filter((k) => isEagerEnemyKey(k, maxAppearsAtSec));
}
