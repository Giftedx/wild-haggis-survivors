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
    baseCost: 75,
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
    description: '+5% card rarity',
    maxLevel: 3,
    baseCost: 100,
    costMultiplier: 1.5,
    effectPerLevel: 'luck_5pct',
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
    baseCost: 500,
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
    description: '+25% critical hit damage',
    maxLevel: 3,
    baseCost: 120,
    costMultiplier: 1.5,
    effectPerLevel: 'crit_dmg_25pct',
  },
  {
    key: 'xp_boost',
    name: 'Scholar\'s Mind',
    description: '+8% XP gain',
    maxLevel: 5,
    baseCost: 60,
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
    baseCost: 400,
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
    baseCost: 60,
    costMultiplier: 1.5,
    effectPerLevel: 'chest_5s',
  },
];

/** Get the cost for the next level of an upgrade */
export function getUpgradeCost(upgrade: PermanentUpgrade, currentLevel: number): number {
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}
