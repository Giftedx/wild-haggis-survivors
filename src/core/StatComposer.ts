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
  /** Meta HP regen per second (base 0). */
  hpRegen: number;
  /** Meta crit chance bonus (additive, e.g. 0.03 = +3%). */
  critBonus: number;
  /** Meta cooldown reduction multiplier (e.g. 0.08 = -8%). */
  cooldownReduction: number;
  /** Meta XP gain multiplier (e.g. 0.05 = +5%). */
  xpGainBonus: number;
  /** Meta flat armor bonus. */
  armorBonus: number;
  /** Meta dash cooldown reduction multiplier (e.g. 0.10 = -10%). */
  dashCooldownReduction: number;
} & typeof BALANCE.player;

export const StatComposer = {
  getPlayerStats(save: ISaveData): ComposedPlayerStats {
    const keys = new Set(save.unlockedUpgrades ?? []);
    let speed = PLAYER.SPEED;
    let maxHp = PLAYER.MAX_HP;
    const driftDegrees = PLAYER.DRIFT_DEGREES;
    let pickupRadius = PLAYER.PICKUP_RADIUS;
    let damagePctBonus = 0;
    let hpRegen = 0;
    let critBonus = 0;
    let cooldownReduction = 0;
    let xpGainBonus = 0;
    let armorBonus = 0;
    let dashCooldownReduction = 0;

    // Speed tiers (multiplicative, stacks)
    if (keys.has('speed_tier_1')) speed *= 1.1;
    if (keys.has('speed_tier_2')) speed *= 1.15;

    // Health tiers
    if (keys.has('health_tier_1')) maxHp *= 1.1;
    if (keys.has('health_tier_2')) maxHp *= 1.15;

    // Pickup
    if (keys.has('pickup_tier_1')) pickupRadius += 22;

    // Damage tiers (additive)
    if (keys.has('damage_tier_1')) damagePctBonus += 0.05;
    if (keys.has('damage_tier_2')) damagePctBonus += 0.10;

    // Regen
    if (keys.has('regen_tier_1')) hpRegen += 0.2;

    // Crit
    if (keys.has('crit_tier_1')) critBonus += 0.03;

    // Cooldown
    if (keys.has('cooldown_tier_1')) cooldownReduction += 0.08;

    // XP
    if (keys.has('xp_tier_1')) xpGainBonus += 0.05;

    // Armor
    if (keys.has('armor_tier_1')) armorBonus += 2;

    // Dash cooldown
    if (keys.has('dash_tier_1')) dashCooldownReduction += 0.10;

    return {
      ...BALANCE.player,
      speed,
      maxHp,
      driftDegrees,
      pickupRadius,
      damagePctBonus,
      hpRegen,
      critBonus,
      cooldownReduction,
      xpGainBonus,
      armorBonus,
      dashCooldownReduction,
    };
  },
};
