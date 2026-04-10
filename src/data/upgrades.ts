/**
 * Upgrade card definitions — what appears when the player levels up.
 *
 * Cards are drawn from a dynamic pool based on what the player already has.
 * Rarity determines border color and drop chance.
 */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type UpgradeEffect =
  | { type: 'add_weapon'; weaponKey: string }
  | { type: 'level_weapon'; weaponKey: string }
  | { type: 'add_passive'; passiveKey: string }
  | { type: 'stat_boost'; stat: string; amount: number }
  | { type: 'evolve_weapon'; weaponKey: string; evolutionKey: string };

/** Weapon evolution recipes — weapon at lv5 + matching passive = legendary evolution */
export interface EvolutionRecipe {
  weaponKey: string;
  passiveKey: string;
  evolutionKey: string;
  name: string;
  description: string;
}

export const EVOLUTION_RECIPES: EvolutionRecipe[] = [
  { weaponKey: 'thistle_shot', passiveKey: 'sporran', evolutionKey: 'thistle_storm',
    name: 'Thistle Storm', description: '8 homing thistles seek enemies across the screen.' },
  { weaponKey: 'bagpipe_blast', passiveKey: 'whisky_flask', evolutionKey: 'highland_fling',
    name: 'The Highland Fling', description: 'Massive pulsating sonic ring shatters all enemies.' },
  { weaponKey: 'caber_toss', passiveKey: 'kilt', evolutionKey: 'highland_games',
    name: 'Highland Games', description: 'Caber explodes on final pierce, leaving a burning zone.' },
  { weaponKey: 'scotch_mist', passiveKey: 'tam_o_shanter', evolutionKey: 'the_haar',
    name: 'The Haar', description: 'Dense fog covers 40% of the screen, melting enemies.' },
  { weaponKey: 'haggis_hurler', passiveKey: 'irn_bru', evolutionKey: 'haggis_cannon',
    name: 'Haggis Cannon', description: 'Rapid-fire haggis that explode on each bounce.' },
  { weaponKey: 'nessie_tentacle', passiveKey: 'loch_water', evolutionKey: 'nessie_unleashed',
    name: 'Nessie Unleashed', description: 'Multiple massive tentacles sweep the entire screen.' },
];

export interface UpgradeCard {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  icon: string;  // texture key (placeholder for now)
  effect: UpgradeEffect;
}

/** Rarity drop weights */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 60,
  uncommon: 25,
  rare: 12,
  legendary: 3,
};

/** Rarity colors for card borders */
export const RARITY_COLORS: Record<Rarity, number> = {
  common: 0x888888,
  uncommon: 0x44aa44,
  rare: 0x4488dd,
  legendary: 0xddaa00,
};

// ── Weapon cards ──

export const WEAPON_CARDS: UpgradeCard[] = [
  {
    id: 'add_bagpipe_blast',
    name: 'Bagpipe Blast',
    description: 'Periodic shockwave pushes enemies back.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'add_weapon', weaponKey: 'bagpipe_blast' },
  },
  {
    id: 'add_caber_toss',
    name: 'Caber Toss',
    description: 'Heavy caber pierces through enemies.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'add_weapon', weaponKey: 'caber_toss' },
  },
  {
    id: 'add_scotch_mist',
    name: 'Scotch Mist',
    description: 'Leave a damaging fog trail behind you.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'add_weapon', weaponKey: 'scotch_mist' },
  },
  {
    id: 'add_haggis_hurler',
    name: 'Haggis Hurler',
    description: 'Bouncing haggis balls ricochet off edges.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'add_weapon', weaponKey: 'haggis_hurler' },
  },
  {
    id: 'add_nessie_tentacle',
    name: "Nessie's Tentacle",
    description: 'Sweeping tentacle attack in an arc.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'add_weapon', weaponKey: 'nessie_tentacle' },
  },
];

// ── Passive item cards ──

export const PASSIVE_CARDS: UpgradeCard[] = [
  {
    id: 'add_sporran',
    name: 'Sporran',
    description: '+15% Luck — better card rarity. Evolves Thistle Shot.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'add_passive', passiveKey: 'sporran' },
  },
  {
    id: 'add_whisky_flask',
    name: 'Whisky Flask',
    description: '+20% AoE radius on all weapons. Evolves Bagpipe Blast.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'add_passive', passiveKey: 'whisky_flask' },
  },
  {
    id: 'add_kilt',
    name: 'Kilt',
    description: '+15% Max HP. Evolves Caber Toss.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'add_passive', passiveKey: 'kilt' },
  },
  {
    id: 'add_tam_o_shanter',
    name: "Tam o' Shanter",
    description: '+10% Movement speed. Evolves Scotch Mist.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'add_passive', passiveKey: 'tam_o_shanter' },
  },
  {
    id: 'add_irn_bru',
    name: 'Irn Bru',
    description: '+20% Attack speed. Evolves Haggis Hurler.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'add_passive', passiveKey: 'irn_bru' },
  },
  {
    id: 'add_loch_water',
    name: 'Loch Water',
    description: "+25% Pickup radius. Evolves Nessie's Tentacle.",
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'add_passive', passiveKey: 'loch_water' },
  },
  {
    id: 'add_thistle_crown',
    name: 'Thistle Crown',
    description: '+5% Crit + thorns: enemies take 3 damage on contact.',
    rarity: 'rare',
    icon: 'xp_gem',
    effect: { type: 'add_passive', passiveKey: 'thistle_crown' },
  },
  {
    id: 'add_highland_shield',
    name: 'Highland Shield',
    description: 'Block 1 lethal hit every 20 seconds. Survive with 1 HP.',
    rarity: 'rare',
    icon: 'xp_gem',
    effect: { type: 'add_passive', passiveKey: 'highland_shield' },
  },
];

// ── Stat boost cards (common filler) ──

export const STAT_CARDS: UpgradeCard[] = [
  {
    id: 'boost_hp',
    name: 'Thick Hide',
    description: '+10 Max HP.',
    rarity: 'common',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'maxHp', amount: 10 },
  },
  {
    id: 'boost_speed',
    name: 'Quick Feet',
    description: '+8% Movement speed.',
    rarity: 'common',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'speed', amount: 0.08 },
  },
  {
    id: 'boost_pickup',
    name: 'Keen Nose',
    description: '+15 Pickup radius.',
    rarity: 'common',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'pickup', amount: 15 },
  },
  {
    id: 'boost_damage',
    name: 'Sharpened Thistles',
    description: '+10% Damage on all weapons.',
    rarity: 'common',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'damage', amount: 0.10 },
  },
  {
    id: 'boost_drift',
    name: 'Balanced Legs',
    description: '-15% Movement drift.',
    rarity: 'common',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'drift', amount: 0.15 },
  },
  {
    id: 'heal',
    name: 'Haggis Supper',
    description: 'Restore 25% Max HP.',
    rarity: 'common',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'healPercent', amount: 0.25 },
  },
  {
    id: 'boost_crit',
    name: 'Eagle Eye',
    description: '+5% Critical hit chance.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'crit', amount: 0.05 },
  },
  {
    id: 'boost_regen',
    name: 'Highland Spring',
    description: '+0.5 HP/sec regeneration.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'regen', amount: 0.5 },
  },
  {
    id: 'boost_armor',
    name: 'Iron Hide',
    description: '+3 Armor (reduces damage taken).',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'armor', amount: 3 },
  },
  {
    id: 'boost_cooldown',
    name: 'Battle Frenzy',
    description: '-10% weapon cooldowns.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'cooldown', amount: 0.10 },
  },
  {
    id: 'banish',
    name: 'Highland Purge',
    description: 'Instantly destroy 5 weakest enemies nearby.',
    rarity: 'rare',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'banish', amount: 5 },
  },
  {
    id: 'boost_lifesteal',
    name: 'Vampiric Touch',
    description: 'Heal 1 HP per enemy killed.',
    rarity: 'rare',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'lifesteal', amount: 1 },
  },
  {
    id: 'boost_projectile_speed',
    name: 'Swift Thistles',
    description: '+15% Projectile speed.',
    rarity: 'common',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'projectileSpeed', amount: 0.15 },
  },
  {
    id: 'boost_boss_heal',
    name: 'Trophy Hunter',
    description: 'Heal 20% Max HP on boss kill.',
    rarity: 'rare',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'bossHeal', amount: 0.20 },
  },
  {
    id: 'boost_knockback',
    name: 'Highland Force',
    description: '+25% Knockback on all weapons.',
    rarity: 'common',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'knockback', amount: 0.25 },
  },
  {
    id: 'boost_xp',
    name: 'Wisdom of the Highlands',
    description: '+15% XP gained from enemies.',
    rarity: 'uncommon',
    icon: 'xp_gem',
    effect: { type: 'stat_boost', stat: 'xpMultiplier', amount: 0.15 },
  },
];

/**
 * Build the available card pool based on current player state.
 * Filters out weapons already owned, passives already held, etc.
 */
export function buildCardPool(
  ownedWeaponKeys: string[],
  ownedPassiveKeys: string[],
  weaponLevels: Record<string, number>,
  evolvedWeaponKeys: string[] = []
): UpgradeCard[] {
  const pool: UpgradeCard[] = [];

  // Stat cards are always available (repeatable)
  pool.push(...STAT_CARDS);

  // Weapon level-up cards for owned weapons below max level (and not evolved)
  for (const key of ownedWeaponKeys) {
    if (evolvedWeaponKeys.includes(key)) continue; // Already evolved
    const level = weaponLevels[key] ?? 1;
    if (level < 5) {
      // Add evolution hint on level 4→5 cards
      const recipe = EVOLUTION_RECIPES.find(r => r.weaponKey === key);
      const hint = level === 4 && recipe
        ? ` Evolves with ${formatWeaponName(recipe.passiveKey)}!`
        : '';
      pool.push({
        id: `levelup_${key}_${level + 1}`,
        name: `${formatWeaponName(key)} Lv${level + 1}`,
        description: `Upgrade ${formatWeaponName(key)} to level ${level + 1}.${hint}`,
        rarity: level >= 3 ? 'rare' : 'uncommon',
        icon: 'xp_gem',
        effect: { type: 'level_weapon', weaponKey: key },
      });
    }
  }

  // Evolution cards — weapon at lv5 + matching passive owned + not already evolved
  for (const recipe of EVOLUTION_RECIPES) {
    if (evolvedWeaponKeys.includes(recipe.weaponKey)) continue;
    if (!ownedWeaponKeys.includes(recipe.weaponKey)) continue;
    const wLevel = weaponLevels[recipe.weaponKey] ?? 0;
    if (wLevel >= 5 && ownedPassiveKeys.includes(recipe.passiveKey)) {
      pool.push({
        id: `evolve_${recipe.evolutionKey}`,
        name: recipe.name,
        description: recipe.description,
        rarity: 'legendary',
        icon: 'xp_gem',
        effect: { type: 'evolve_weapon', weaponKey: recipe.weaponKey, evolutionKey: recipe.evolutionKey },
      });
    }
  }

  // New weapon cards (only if not already owned, max 6 weapons)
  if (ownedWeaponKeys.length < 6) {
    for (const card of WEAPON_CARDS) {
      const eff = card.effect as { type: 'add_weapon'; weaponKey: string };
      if (!ownedWeaponKeys.includes(eff.weaponKey)) {
        pool.push(card);
      }
    }
  }

  // Passive cards (only if not already owned)
  for (const card of PASSIVE_CARDS) {
    const eff = card.effect as { type: 'add_passive'; passiveKey: string };
    if (!ownedPassiveKeys.includes(eff.passiveKey)) {
      pool.push(card);
    }
  }

  return pool;
}

function formatWeaponName(key: string): string {
  return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Draw N cards from the pool, weighted by rarity.
 * @param luckBonus — percentage bonus to rare/legendary weights (from Sporran + Lucky Heather)
 */
export function drawCards(pool: UpgradeCard[], count: number, luckBonus: number = 0): UpgradeCard[] {
  if (pool.length <= count) return [...pool];

  // Adjusted weights — luck boosts rare and legendary chances
  const weights: Record<Rarity, number> = {
    common: Math.max(10, RARITY_WEIGHTS.common - luckBonus * 0.5),
    uncommon: RARITY_WEIGHTS.uncommon,
    rare: RARITY_WEIGHTS.rare + luckBonus * 0.3,
    legendary: RARITY_WEIGHTS.legendary + luckBonus * 0.2,
  };

  const drawn: UpgradeCard[] = [];
  const remaining = [...pool];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    let totalWeight = 0;
    for (const card of remaining) {
      totalWeight += weights[card.rarity];
    }

    let roll = Math.random() * totalWeight;
    let picked = remaining[remaining.length - 1];
    for (const card of remaining) {
      roll -= weights[card.rarity];
      if (roll < 0) {
        picked = card;
        break;
      }
    }

    drawn.push(picked);
    const idx = remaining.indexOf(picked);
    if (idx !== -1) remaining.splice(idx, 1);
  }

  return drawn;
}
