/**
 * runStartModifiers — pure functions that apply the two layers of run-
 * start modifications to the player before a run begins:
 *
 *   1. applyVariantModifiers — the selected haggis variant's passive bumps
 *      (speed, hp, armor, pickup, xp mult, damage, drift, cooldown).
 *   2. applyPermanentUpgrades — everything the player has bought with
 *      Golden Haggis: thick_hide, strong_legs, sharp_thistles, etc.
 *      Returns the two "flag" outputs that don't live on Player —
 *      `revivalAvailable` (one-shot revival on death) and
 *      `chestDurationBonusMs` (extra time on chest/coin pickups).
 *
 * Variants apply FIRST so permanent upgrades stack on top cleanly —
 * percentage upgrades are computed against `getRunBase*` values on
 * Player, which snapshot at base + variant application.
 */
import type { Player } from '../../entities/Player';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { VariantDef } from '../../data/variants';
import type { RNG } from '../../utils/rng';
import { loadSave } from '../../utils/save';
import { PASSIVE_KEYS } from '../../data/upgrades';
import { applyPassiveEffect } from './passiveEffects';

export function applyVariantModifiers(player: Player, variant: VariantDef): void {
  const { modifiers } = variant;
  if (modifiers.moveSpeedPct) player.addSpeed(player.getRunBaseSpeed() * modifiers.moveSpeedPct);
  if (modifiers.maxHpFlat) player.addMaxHp(modifiers.maxHpFlat);
  if (modifiers.armorFlat) player.addArmor(modifiers.armorFlat);
  if (modifiers.pickupRadiusFlat) player.addPickupRadius(modifiers.pickupRadiusFlat);
  if (modifiers.xpMultiplierPct) player.addXpMultiplier(modifiers.xpMultiplierPct);
  if (modifiers.damagePct) player.addDamageMultiplier(modifiers.damagePct);
  if (modifiers.driftReductionPct) player.reduceDrift(modifiers.driftReductionPct);
  if (modifiers.cooldownReductionPct) player.addCooldownReduction(modifiers.cooldownReductionPct);
  if (modifiers.critChancePct) player.addCritChance(modifiers.critChancePct);
  if (modifiers.spriteScale) player.setScale(modifiers.spriteScale);
  if (modifiers.driftSignFlip) player.flipDriftSign();
}

export interface PermanentUpgradeResult {
  revivalAvailable: boolean;
  chestDurationBonusMs: number;
}

export interface PermanentUpgradeDeps {
  player: Player;
  weaponSystem: WeaponSystem;
  ownedPassives: string[];      // mutated if lucky_start hits
  runRng: RNG;
}

export function applyPermanentUpgrades(deps: PermanentUpgradeDeps): PermanentUpgradeResult {
  const { player, weaponSystem, ownedPassives, runRng } = deps;
  const save = loadSave();
  const ups = save.upgrades;
  let revivalAvailable = false;
  let chestDurationBonusMs = 0;

  const thickHide = ups['thick_hide'] ?? 0;
  if (thickHide > 0) player.addMaxHp(Math.ceil(player.getRunBaseMaxHp() * 0.05 * thickHide));

  const strongLegs = ups['strong_legs'] ?? 0;
  if (strongLegs > 0) player.addSpeed(player.getRunBaseSpeed() * 0.03 * strongLegs);

  const sharpThistles = ups['sharp_thistles'] ?? 0;
  if (sharpThistles > 0) player.addDamageMultiplier(0.05 * sharpThistles);

  const magneticPersonality = ups['magnetic_personality'] ?? 0;
  if (magneticPersonality > 0) player.addPickupRadius(player.getRunBasePickupRadius() * 0.10 * magneticPersonality);

  const driftControl = ups['drift_control'] ?? 0;
  for (let i = 0; i < driftControl; i++) player.reduceDrift(0.15);

  const battleHardened = ups['battle_hardened'] ?? 0;
  if (battleHardened > 0) player.addArmor(2 * battleHardened);

  const weaponTraining = ups['weapon_training'] ?? 0;
  for (let i = 0; i < weaponTraining; i++) weaponSystem.levelUpWeapon('thistle_shot');

  const critPower = ups['crit_power'] ?? 0;
  if (critPower > 0) {
    player.addCritChance(0.03 * critPower);
    player.addCritDamageMultiplier(0.25 * critPower);
  }

  const xpBoost = ups['xp_boost'] ?? 0;
  if (xpBoost > 0) player.addXpMultiplier(0.08 * xpBoost);

  const naturalRecovery = ups['natural_recovery'] ?? 0;
  if (naturalRecovery > 0) player.addHpRegen(0.3 * naturalRecovery);

  const revival = ups['revival'] ?? 0;
  if (revival > 0) revivalAvailable = true;

  const luckyStart = ups['lucky_start'] ?? 0;
  if (luckyStart > 0) {
    const available = PASSIVE_KEYS.filter((k) => !ownedPassives.includes(k));
    if (available.length > 0) {
      const randomPassive = runRng.pick(available);
      ownedPassives.push(randomPassive);
      applyPassiveEffect(player, randomPassive);
    }
  }

  const doubleDash = ups['double_dash'] ?? 0;
  if (doubleDash > 0) player.addDashCharge();

  const treasureMagnet = ups['treasure_magnet'] ?? 0;
  if (treasureMagnet > 0) chestDurationBonusMs = 5000 * treasureMagnet;

  const dirkHand = ups['dirk_hand'] ?? 0;
  if (dirkHand > 0) player.addAttackSpeedMultiplier(0.03 * dirkHand);

  // extra_choice and lucky_heather affect the card system, not stats.

  return { revivalAvailable, chestDurationBonusMs };
}
