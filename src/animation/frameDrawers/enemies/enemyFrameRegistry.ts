/**
 * Registry of animated enemy frame drawers. Enemy.ts checks this at
 * spawn time — keys present here get an AnimationController; keys
 * absent keep static texture + bobPhase.
 *
 * Start with 3 archetypes (Phase 1). More enemies graduate to
 * animation in Phase 2.5+.
 */

import type { EnemyFrameDrawer } from './enemyFrameTypes';

const REGISTRY = new Map<string, EnemyFrameDrawer>();

export function registerEnemyFrameDrawer(drawer: EnemyFrameDrawer): void {
  REGISTRY.set(drawer.enemyKey, drawer);
}

export function getEnemyFrameDrawer(enemyKey: string): EnemyFrameDrawer | null {
  return REGISTRY.get(enemyKey) ?? null;
}

export function isEnemyAnimated(enemyKey: string): boolean {
  return REGISTRY.has(enemyKey);
}

/** All registered enemy keys — used by BootScene bake loop. */
export function getAllAnimatedEnemyKeys(): string[] {
  return Array.from(REGISTRY.keys());
}

/** All registered drawers — used by BootScene bake loop. */
export function getAllAnimatedEnemyDrawers(): EnemyFrameDrawer[] {
  return Array.from(REGISTRY.values());
}
