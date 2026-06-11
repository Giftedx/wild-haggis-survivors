/**
 * Pure helper that computes HazardZones placements from a seeded RNG.
 *
 * Extracted from `HazardZones.spawn()` so the placement logic is testable
 * without booting Phaser and — more importantly for T1 — so the previously
 * hardcoded `new Phaser.Math.RandomDataGenerator(['zones'])` stream gets
 * replaced with the run's own seeded RNG. Same seed → same lava/heal
 * positions across constructions.
 */
import type { RNG } from '../../utils/rng';

export interface HazardPlacement {
  x: number;
  y: number;
  r: number;
  /** Cosmetic jitter added to the glow tween duration. */
  tweenJitterMs: number;
}

export interface HazardPlacements {
  lava: HazardPlacement[];
  heal: HazardPlacement[];
}

const EDGE_INSET = 200;
const LAVA_COUNT = 4;
const LAVA_RADIUS_MIN = 35;
const LAVA_RADIUS_MAX = 55;
const LAVA_TWEEN_JITTER_MAX = 800;
const HEAL_COUNT = 3;
const HEAL_RADIUS_MIN = 30;
const HEAL_RADIUS_MAX = 45;
const HEAL_TWEEN_JITTER_MAX = 1000;

export function computeHazardPlacements(
  rng: RNG,
  worldWidth: number,
  worldHeight: number,
): HazardPlacements {
  const lava: HazardPlacement[] = [];
  for (let i = 0; i < LAVA_COUNT; i++) {
    lava.push({
      x: rng.int(EDGE_INSET, worldWidth - EDGE_INSET),
      y: rng.int(EDGE_INSET, worldHeight - EDGE_INSET),
      r: rng.int(LAVA_RADIUS_MIN, LAVA_RADIUS_MAX),
      tweenJitterMs: rng.int(0, LAVA_TWEEN_JITTER_MAX),
    });
  }

  const heal: HazardPlacement[] = [];
  for (let i = 0; i < HEAL_COUNT; i++) {
    heal.push({
      x: rng.int(EDGE_INSET, worldWidth - EDGE_INSET),
      y: rng.int(EDGE_INSET, worldHeight - EDGE_INSET),
      r: rng.int(HEAL_RADIUS_MIN, HEAL_RADIUS_MAX),
      tweenJitterMs: rng.int(0, HEAL_TWEEN_JITTER_MAX),
    });
  }

  return { lava, heal };
}

/**
 * Single extra healing circle — used by the W2 `round_the_loch` route
 * onResume, which drops two extras. Kept as a pure function so the route
 * side-effect stays deterministic per-seed.
 */
export function computeExtraHealingPlacement(
  rng: RNG,
  worldWidth: number,
  worldHeight: number,
): HazardPlacement {
  return {
    x: rng.int(EDGE_INSET, worldWidth - EDGE_INSET),
    y: rng.int(EDGE_INSET, worldHeight - EDGE_INSET),
    r: rng.int(HEAL_RADIUS_MIN, HEAL_RADIUS_MAX),
    tweenJitterMs: rng.int(0, HEAL_TWEEN_JITTER_MAX),
  };
}
