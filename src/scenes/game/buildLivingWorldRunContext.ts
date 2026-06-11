/**
 * Builds a fresh `LivingWorldRunContext` snapshot each frame. Pure
 * factory so it can be unit-tested without booting Phaser — every
 * dependency is read through a thunk.
 *
 * The snapshot is intentionally cheap to build (one struct literal,
 * one biome lookup, a handful of property reads). Subsystems are
 * told NEVER to cache the object, so per-frame allocation is the
 * right shape — see `livingWorldTypes.ts` for the contract.
 */

import type { LivingWorldRunContext } from './livingWorldTypes';
import type { BiomeId } from '../../data/biomes';
import type { VariantKey } from '../../data/variants';
import type { CurseKey } from '../../data/curses';

export interface BuildLivingWorldRunContextDeps {
  getRunSeed(): number;
  getVariantKey(): VariantKey;
  getCurseKey(): CurseKey | null;
  getSeasonalEventKey(): string | null;
  getBiomeId(): BiomeId | null;
  getHpFraction(): number;
  getGameTimeSec(): number;
  getReduceParticles(): boolean;
  getReduceFlashing(): boolean;
}

/**
 * Fallback biome used when the player or biome controller isn't ready
 * yet (first frame, scene shutdown). Listeners react to context, so a
 * stable default keeps them from hitting `null`-checks every frame.
 */
const DEFAULT_BIOME: BiomeId = 'heather';

export function buildLivingWorldRunContext(
  deps: BuildLivingWorldRunContextDeps,
): LivingWorldRunContext {
  const biome = deps.getBiomeId();
  return {
    runSeed: deps.getRunSeed(),
    variantKey: deps.getVariantKey(),
    curseKey: deps.getCurseKey(),
    seasonalEventKey: deps.getSeasonalEventKey(),
    biomeId: biome ?? DEFAULT_BIOME,
    hpFraction: clamp01(deps.getHpFraction()),
    gameTimeSec: Math.max(0, deps.getGameTimeSec()),
    reduceParticles: !!deps.getReduceParticles(),
    reduceFlashing: !!deps.getReduceFlashing(),
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
