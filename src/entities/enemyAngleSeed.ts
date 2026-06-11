import type { RNG } from '../utils/rng';

/**
 * Initial angle for orbit-behaviour enemies. Drives `behaviorOrbit` x/y
 * (and therefore physics + collision), so must come from the seeded run
 * RNG to honour the T1 replay determinism contract — never Math.random.
 */
export function pickInitialOrbitAngle(rng: RNG): number {
  return rng.next() * Math.PI * 2;
}

/**
 * Spawn-direction angle for `behaviorSpawner` minions (e.g. nest → midge).
 * Minion is a real Enemy with collision and damage, so this is gameplay
 * state. Must use seeded RNG, not Math.random.
 */
export function pickSpawnerMinionAngle(rng: RNG): number {
  return rng.next() * Math.PI * 2;
}
