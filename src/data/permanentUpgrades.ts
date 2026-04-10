/**
 * Permanent upgrades — bought with Golden Haggis between runs.
 */

export interface PermanentUpgrade {
  key: string;
  name: string;
  description: string;
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
    name: 'Thick Hide',
    description: '+5% starting HP',
    maxLevel: 5,
    baseCost: 50,
    costMultiplier: 1.5,
    effectPerLevel: 'hp_5pct',
  },
  {
    key: 'strong_legs',
    name: 'Strong Legs',
    description: '+3% move speed',
    maxLevel: 5,
    baseCost: 50,
    costMultiplier: 1.5,
    effectPerLevel: 'speed_3pct',
  },
  {
    key: 'sharp_thistles',
    name: 'Sharp Thistles',
    description: '+5% damage',
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
    name: 'Magnetic Personality',
    description: '+10% pickup radius',
    maxLevel: 5,
    baseCost: 40,
    costMultiplier: 1.5,
    effectPerLevel: 'pickup_10pct',
  },
  {
    key: 'lucky_heather',
    name: 'Lucky Heather',
    // Rebalanced +5% → +10% per level. At +5%, the effect on the luck-weighted
    // card draw was statistically invisible. At +10% (with adjusted luck
    // multipliers in drawCards), the stat is actually felt.
    description: '+10% card rarity',
    maxLevel: 3,
    baseCost: 100,
    costMultiplier: 1.5,
    effectPerLevel: 'luck_10pct',
  },
  {
    key: 'drift_control',
    name: 'Drift Control',
    description: '-15% movement drift',
    maxLevel: 3,
    baseCost: 100,
    costMultiplier: 1.5,
    effectPerLevel: 'drift_15pct',
  },
  {
    key: 'extra_choice',
    name: 'Extra Choice',
    description: '4 cards on level-up instead of 3',
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
    name: 'Battle Hardened',
    description: '+2 starting armor',
    maxLevel: 3,
    baseCost: 80,
    costMultiplier: 1.5,
    effectPerLevel: 'armor_2',
  },
  {
    key: 'weapon_training',
    name: 'Weapon Training',
    description: 'Start with Thistle Shot at +1 level',
    maxLevel: 2,
    baseCost: 200,
    costMultiplier: 2,
    effectPerLevel: 'weapon_level_1',
  },
  {
    key: 'crit_power',
    name: 'Deadly Precision',
    // Rebalanced: +25% crit damage alone at base 10% crit rate averages
    // +2.5% expected DPS per level — a dead pick. Now also bumps crit
    // chance by +3% per level, making the crit damage bonus meaningful.
    description: '+3% crit chance, +25% crit damage',
    maxLevel: 3,
    baseCost: 120,
    costMultiplier: 1.5,
    effectPerLevel: 'crit_power_v2',
  },
  {
    key: 'xp_boost',
    name: 'Scholar\'s Mind',
    description: '+8% XP gain',
    maxLevel: 5,
    // Rebalanced 60 → 90: +40% XP at max is a ~2-3 extra level-up in a
    // 20-minute run, which is a strong compounding benefit.
    baseCost: 90,
    costMultiplier: 1.5,
    effectPerLevel: 'xp_8pct',
  },
  {
    key: 'lucky_start',
    name: 'Lucky Start',
    description: 'Start with a random passive item',
    maxLevel: 1,
    baseCost: 300,
    costMultiplier: 1,
    effectPerLevel: 'random_passive',
  },
  {
    key: 'natural_recovery',
    name: 'Natural Recovery',
    description: '+0.3 HP/sec regeneration',
    maxLevel: 3,
    baseCost: 75,
    costMultiplier: 1.5,
    effectPerLevel: 'regen_03',
  },
  {
    key: 'revival',
    name: 'Second Wind',
    description: 'Revive once per run with 50% HP',
    maxLevel: 1,
    // Rebalanced 400 → 600: a free life is enormously valuable in a run-based
    // game; was the second-best shop pick after extra_choice at its old price.
    baseCost: 600,
    costMultiplier: 1,
    effectPerLevel: 'revival',
  },
  {
    key: 'double_dash',
    name: 'Double Dash',
    description: '2 dash charges instead of 1',
    maxLevel: 1,
    baseCost: 250,
    costMultiplier: 1,
    effectPerLevel: 'double_dash',
  },
  {
    key: 'treasure_magnet',
    name: 'Treasure Magnet',
    description: '+5s chest duration',
    maxLevel: 3,
    // Rebalanced 60 → 40: niche utility pick, was priced in line with
    // combat stats but shouldn't compete directly with them.
    baseCost: 40,
    costMultiplier: 1.5,
    effectPerLevel: 'chest_5s',
  },
];

/** Get the cost for the next level of an upgrade */
export function getUpgradeCost(upgrade: PermanentUpgrade, currentLevel: number): number {
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}
