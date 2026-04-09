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
];

/** Get the cost for the next level of an upgrade */
export function getUpgradeCost(upgrade: PermanentUpgrade, currentLevel: number): number {
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}
