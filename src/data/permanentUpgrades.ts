/**
 * Permanent upgrades — bought with Golden Haggis between runs.
 */

export interface PermanentUpgrade {
  key: string;
  /** i18n dot-path — resolved with `t(nameKey)` at render time. */
  nameKey: string;
  /** i18n dot-path — resolved with `t(descriptionKey)` at render time. */
  descriptionKey: string;
  maxLevel: number;
  /** Cost at level 1 */
  baseCost: number;
  /** Cost multiplier per level */
  costMultiplier: number;
  /** Effect per level */
  effectPerLevel: string;
}

export const PERMANENT_UPGRADES: PermanentUpgrade[] = [
  {
    key: 'thick_hide',
    nameKey: 'permanentUpgrade.thick_hide.name',
    descriptionKey: 'permanentUpgrade.thick_hide.description',
    maxLevel: 5,
    baseCost: 50,
    costMultiplier: 1.5,
    effectPerLevel: 'hp_5pct',
  },
  {
    key: 'strong_legs',
    nameKey: 'permanentUpgrade.strong_legs.name',
    descriptionKey: 'permanentUpgrade.strong_legs.description',
    maxLevel: 5,
    baseCost: 50,
    costMultiplier: 1.5,
    effectPerLevel: 'speed_3pct',
  },
  {
    key: 'sharp_thistles',
    nameKey: 'permanentUpgrade.sharp_thistles.name',
    descriptionKey: 'permanentUpgrade.sharp_thistles.description',
    maxLevel: 5,
    // Rebalanced 75 → 120: damage is the strongest multiplicative stat in
    // the game, and at 5 levels it's +25%. Was dominant over every other
    // starting-stat pick because of the implicit compounding.
    baseCost: 120,
    costMultiplier: 1.5,
    effectPerLevel: 'damage_5pct',
  },
  {
    key: 'magnetic_personality',
    nameKey: 'permanentUpgrade.magnetic_personality.name',
    descriptionKey: 'permanentUpgrade.magnetic_personality.description',
    maxLevel: 5,
    baseCost: 40,
    costMultiplier: 1.5,
    effectPerLevel: 'pickup_10pct',
  },
  {
    key: 'lucky_heather',
    nameKey: 'permanentUpgrade.lucky_heather.name',
    descriptionKey: 'permanentUpgrade.lucky_heather.description',
    // Rebalanced +5% → +10% per level. At +5%, the effect on the luck-weighted
    // card draw was statistically invisible. At +10% (with adjusted luck
    // multipliers in drawCards), the stat is actually felt.
    maxLevel: 3,
    baseCost: 100,
    costMultiplier: 1.5,
    effectPerLevel: 'luck_10pct',
  },
  {
    key: 'drift_control',
    nameKey: 'permanentUpgrade.drift_control.name',
    descriptionKey: 'permanentUpgrade.drift_control.description',
    maxLevel: 3,
    baseCost: 100,
    costMultiplier: 1.5,
    effectPerLevel: 'drift_15pct',
  },
  {
    key: 'extra_choice',
    nameKey: 'permanentUpgrade.extra_choice.name',
    descriptionKey: 'permanentUpgrade.extra_choice.description',
    maxLevel: 1,
    // Rebalanced 500 → 800: a 4th card per level is run-defining (extra
    // ~33% chance per level-up to hit your evolution/passive target). Was
    // priced below its power level, making it a universally correct pick.
    baseCost: 800,
    costMultiplier: 1,
    effectPerLevel: 'extra_card',
  },
  {
    key: 'battle_hardened',
    nameKey: 'permanentUpgrade.battle_hardened.name',
    descriptionKey: 'permanentUpgrade.battle_hardened.description',
    maxLevel: 3,
    baseCost: 80,
    costMultiplier: 1.5,
    effectPerLevel: 'armor_2',
  },
  {
    key: 'weapon_training',
    nameKey: 'permanentUpgrade.weapon_training.name',
    descriptionKey: 'permanentUpgrade.weapon_training.description',
    maxLevel: 2,
    baseCost: 200,
    costMultiplier: 2,
    effectPerLevel: 'weapon_level_1',
  },
  {
    key: 'crit_power',
    nameKey: 'permanentUpgrade.crit_power.name',
    descriptionKey: 'permanentUpgrade.crit_power.description',
    // Rebalanced: +25% crit damage alone at base 10% crit rate averages
    // +2.5% expected DPS per level — a dead pick. Now also bumps crit
    // chance by +3% per level, making the crit damage bonus meaningful.
    maxLevel: 3,
    baseCost: 120,
    costMultiplier: 1.5,
    effectPerLevel: 'crit_power_v2',
  },
  {
    key: 'xp_boost',
    nameKey: 'permanentUpgrade.xp_boost.name',
    descriptionKey: 'permanentUpgrade.xp_boost.description',
    maxLevel: 5,
    // Rebalanced 60 → 90: +40% XP at max is a ~2-3 extra level-up in a
    // 20-minute run, which is a strong compounding benefit.
    baseCost: 90,
    costMultiplier: 1.5,
    effectPerLevel: 'xp_8pct',
  },
  {
    key: 'lucky_start',
    nameKey: 'permanentUpgrade.lucky_start.name',
    descriptionKey: 'permanentUpgrade.lucky_start.description',
    maxLevel: 1,
    baseCost: 300,
    costMultiplier: 1,
    effectPerLevel: 'random_passive',
  },
  {
    key: 'natural_recovery',
    nameKey: 'permanentUpgrade.natural_recovery.name',
    descriptionKey: 'permanentUpgrade.natural_recovery.description',
    maxLevel: 3,
    baseCost: 75,
    costMultiplier: 1.5,
    effectPerLevel: 'regen_03',
  },
  {
    key: 'revival',
    nameKey: 'permanentUpgrade.revival.name',
    descriptionKey: 'permanentUpgrade.revival.description',
    maxLevel: 1,
    // Rebalanced 400 → 600: a free life is enormously valuable in a run-based
    // game; was the second-best shop pick after extra_choice at its old price.
    baseCost: 600,
    costMultiplier: 1,
    effectPerLevel: 'revival',
  },
  {
    key: 'double_dash',
    nameKey: 'permanentUpgrade.double_dash.name',
    descriptionKey: 'permanentUpgrade.double_dash.description',
    maxLevel: 1,
    baseCost: 250,
    costMultiplier: 1,
    effectPerLevel: 'double_dash',
  },
  {
    key: 'treasure_magnet',
    nameKey: 'permanentUpgrade.treasure_magnet.name',
    descriptionKey: 'permanentUpgrade.treasure_magnet.description',
    maxLevel: 3,
    // Rebalanced 60 → 40: niche utility pick, was priced in line with
    // combat stats but shouldn't compete directly with them.
    baseCost: 40,
    costMultiplier: 1.5,
    effectPerLevel: 'chest_5s',
  },
  {
    key: 'dirk_hand',
    nameKey: 'permanentUpgrade.dirk_hand.name',
    descriptionKey: 'permanentUpgrade.dirk_hand.description',
    maxLevel: 3,
    // Priced beside Deadly Precision (120) — attack speed affects every
    // weapon, so same tier. 3 levels max keeps tempo creep bounded.
    baseCost: 120,
    costMultiplier: 1.5,
    effectPerLevel: 'atk_speed_3pct',
  },
];

/** Get the cost for the next level of an upgrade */
export function getUpgradeCost(upgrade: PermanentUpgrade, currentLevel: number): number {
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}
