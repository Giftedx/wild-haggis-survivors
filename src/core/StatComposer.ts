import { PLAYER } from '../config';
import { BALANCE } from './BalanceConfig';
import type { ISaveData } from './SaveManager';

/**
 * Composed baseline stats for a new run (meta upgrades layered on tuning constants).
 * Dash / hitbox / shield timings remain on BALANCE.player; core locomotion + HP here.
 */
export type ComposedPlayerStats = {
  speed: number;
  maxHp: number;
  driftDegrees: number;
  pickupRadius: number;
  /** Additive meta damage multiplier (e.g. 0.05 = +5%). */
  damagePctBonus: number;
} & typeof BALANCE.player;

const UPGRADE_SPEED_TIER_1 = 'speed_tier_1';
const UPGRADE_HEALTH_TIER_1 = 'health_tier_1';
const UPGRADE_PICKUP_TIER_1 = 'pickup_tier_1';
const UPGRADE_DAMAGE_TIER_1 = 'damage_tier_1';

export const StatComposer = {
  /** Keys that modify stats (exported for tests / tooling). */
  UPGRADE_SPEED_TIER_1,
  UPGRADE_HEALTH_TIER_1,
  UPGRADE_PICKUP_TIER_1,
  UPGRADE_DAMAGE_TIER_1,

  getPlayerStats(save: ISaveData): ComposedPlayerStats {
    const keys = new Set(save.unlockedUpgrades ?? []);
    let speed = PLAYER.SPEED;
    let maxHp = PLAYER.MAX_HP;
    const driftDegrees = PLAYER.DRIFT_DEGREES;
    let pickupRadius = PLAYER.PICKUP_RADIUS;
    let damagePctBonus = 0;

    if (keys.has(UPGRADE_SPEED_TIER_1)) speed *= 1.1;
    if (keys.has(UPGRADE_HEALTH_TIER_1)) maxHp *= 1.1;
    if (keys.has(UPGRADE_PICKUP_TIER_1)) pickupRadius += 22;
    if (keys.has(UPGRADE_DAMAGE_TIER_1)) damagePctBonus = 0.05;

    return {
      ...BALANCE.player,
      speed,
      maxHp,
      driftDegrees,
      pickupRadius,
      damagePctBonus,
    };
  },
};
