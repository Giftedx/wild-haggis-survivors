import type { RNG } from '../utils/rng';

/**
 * Launch angle for bouncing-projectile weapons — Jobby Hurler and Shinty
 * Stick, both dispatched through `WeaponSystem.fireBouncing`. The angle
 * decides which enemies the 5s-TTL bouncing projectile strikes over its
 * lifetime, and therefore which die, what XP/gold drops, and which kill
 * events fire — all gameplay state. So it must be drawn from the seeded
 * run RNG to honour the T1 replay determinism contract — never
 * Math.random / Phaser.Math.FloatBetween. The evolved sister path
 * `fireRapidBounce` already draws its jitter from getRunRng().
 */
export function pickBouncingLaunchAngle(rng: RNG): number {
  return rng.next() * Math.PI * 2;
}
