/**
 * Upgrade card definitions — what appears when the player levels up.
 *
 * Cards are drawn from a dynamic pool based on what the player already has.
 * Rarity determines border color and drop chance.
 */

import { EVOLUTION_RECIPES } from '../core/BalanceConfig';
import { WEAPON_DEFS } from './weapons';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type UpgradeEffect =
  | { type: 'add_weapon'; weaponKey: string }
  | { type: 'level_weapon'; weaponKey: string }
  | { type: 'add_passive'; passiveKey: string }
  | { type: 'stat_boost'; stat: string; amount: number }
  | { type: 'evolve_weapon'; weaponKey: string; evolutionKey: string };

/** @deprecated Use EvolutionRecipeDef from BalanceConfig */
export type EvolutionRecipe = import('../core/BalanceConfig').EvolutionRecipeDef;

export interface UpgradeCard {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  icon: string; // texture key — generated in BootScene (`wicon_*`, passives, etc.)
  effect: UpgradeEffect;
}

/** Rarity drop weights. Rebalanced 60/25/12/3 → 55/28/13/4 for slightly
 *  more uncommon/rare/legendary variety at baseline. */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 55,
  uncommon: 28,
  rare: 13,
  legendary: 4,
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
    description: 'Blasts of sound in a ring around you — knocks foes outward.',
    rarity: 'uncommon',
    icon: 'wicon_bagpipe_blast',
    effect: { type: 'add_weapon', weaponKey: 'bagpipe_blast' },
  },
  {
    id: 'add_caber_toss',
    name: 'Caber Toss',
    description: 'Hurls a heavy caber through multiple enemies in a line.',
    rarity: 'uncommon',
    icon: 'wicon_caber_toss',
    effect: { type: 'add_weapon', weaponKey: 'caber_toss' },
  },
  {
    id: 'add_scotch_mist',
    name: 'Scotch Mist',
    description: 'Leaves a trail of choking mist — poisons those who stand in it.',
    rarity: 'uncommon',
    icon: 'wicon_scotch_mist',
    effect: { type: 'add_weapon', weaponKey: 'scotch_mist' },
  },
  {
    id: 'add_haggis_hurler',
    name: 'Jobby Hurler',
    description: 'Lobs wee jobbies that bounce off arena edges until they hit.',
    rarity: 'uncommon',
    icon: 'wicon_haggis_hurler',
    effect: { type: 'add_weapon', weaponKey: 'haggis_hurler' },
  },
  {
    id: 'add_nessie_tentacle',
    name: "Nessie's Tentacle",
    description: 'A sweeping arc in front of you — wide reach, meaty knockback.',
    rarity: 'uncommon',
    icon: 'wicon_nessie_tentacle',
    effect: { type: 'add_weapon', weaponKey: 'nessie_tentacle' },
  },
  {
    id: 'add_claymore',
    name: 'Highland Claymore',
    description: 'Slow, enormous frontal cleave. Pairs with Tartan Sash for evolution.',
    rarity: 'uncommon',
    icon: 'wicon_claymore',
    effect: { type: 'add_weapon', weaponKey: 'claymore' },
  },
  {
    id: 'add_bagpipes',
    name: 'Ceòl Mòr Bagpipes',
    description: 'Great drone: pulsing ring damages and slows anything too close.',
    rarity: 'uncommon',
    icon: 'wicon_bagpipes',
    effect: { type: 'add_weapon', weaponKey: 'bagpipes' },
  },
];

// ── Passive item cards ──

export const PASSIVE_CARDS: UpgradeCard[] = [
  {
    id: 'add_sporran',
    name: 'Sporran',
    description: '+15% Luck — uncommon, rare, and legendary cards show up more often. Evolves Thistle Shot.',
    rarity: 'uncommon',
    icon: 'ucard_sporran',
    effect: { type: 'add_passive', passiveKey: 'sporran' },
  },
  {
    id: 'add_whisky_flask',
    name: 'Whisky Flask',
    description: '+20% radius on all AoE weapons and effects. Evolves Bagpipe Blast.',
    rarity: 'uncommon',
    icon: 'ucard_whisky_flask',
    effect: { type: 'add_passive', passiveKey: 'whisky_flask' },
  },
  {
    id: 'add_kilt',
    name: 'Kilt',
    description: '+15% max HP — room for one more mistake. Evolves Caber Toss.',
    rarity: 'uncommon',
    icon: 'ucard_kilt',
    effect: { type: 'add_passive', passiveKey: 'kilt' },
  },
  {
    id: 'add_tam_o_shanter',
    name: "Tam o' Shanter",
    description: '+10% move speed — easier kiting against the drift. Evolves Scotch Mist.',
    rarity: 'uncommon',
    icon: 'ucard_tam_o_shanter',
    effect: { type: 'add_passive', passiveKey: 'tam_o_shanter' },
  },
  {
    id: 'add_irn_bru',
    name: 'Irn Bru',
    description: '+20% attack speed — weapons fire faster. Evolves Jobby Hurler.',
    rarity: 'uncommon',
    icon: 'ucard_irn_bru',
    effect: { type: 'add_passive', passiveKey: 'irn_bru' },
  },
  {
    id: 'add_loch_water',
    name: 'Loch Water',
    description: '+25% pickup radius — gems and drops come to you. Evolves Nessie\'s Tentacle.',
    rarity: 'uncommon',
    icon: 'ucard_loch_water',
    effect: { type: 'add_passive', passiveKey: 'loch_water' },
  },
  {
    id: 'add_thistle_crown',
    name: 'Thistle Crown',
    description: '+5% crit chance. Thorns: enemies that collide with you take 3 damage.',
    rarity: 'rare',
    icon: 'ucard_thistle_crown',
    effect: { type: 'add_passive', passiveKey: 'thistle_crown' },
  },
  {
    id: 'add_highland_shield',
    name: 'Highland Shield',
    description: 'Every 20s, ignore a lethal hit — survive at 1 HP instead of dying.',
    rarity: 'rare',
    icon: 'ucard_highland_shield',
    effect: { type: 'add_passive', passiveKey: 'highland_shield' },
  },
  {
    id: 'add_tartan_sash',
    name: 'Tartan Sash',
    description: '+8% damage on all sources. Evolves Highland Claymore.',
    rarity: 'uncommon',
    icon: 'ucard_tartan_sash',
    effect: { type: 'add_passive', passiveKey: 'tartan_sash' },
  },
];

// ── Stat boost cards (common filler) ──

export const STAT_CARDS: UpgradeCard[] = [
  {
    id: 'boost_hp',
    name: 'Thick Hide',
    description: '+10 max HP — flat buffer, stacks every time you pick this.',
    rarity: 'common',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'maxHp', amount: 10 },
  },
  {
    id: 'boost_speed',
    name: 'Quick Feet',
    description: '+8% move speed — reposition faster, drift still applies.',
    rarity: 'common',
    icon: 'ucard_stat_speed',
    effect: { type: 'stat_boost', stat: 'speed', amount: 0.08 },
  },
  {
    id: 'boost_pickup',
    name: 'Keen Nose',
    description: '+15 pickup radius — XP gems and drops reach you sooner.',
    rarity: 'common',
    icon: 'ucard_stat_pickup',
    effect: { type: 'stat_boost', stat: 'pickup', amount: 15 },
  },
  {
    id: 'boost_damage',
    name: 'Sharpened Thistles',
    description: '+10% damage — every weapon and effect hits harder.',
    rarity: 'common',
    icon: 'ucard_stat_damage',
    effect: { type: 'stat_boost', stat: 'damage', amount: 0.10 },
  },
  {
    id: 'boost_drift',
    name: 'Balanced Legs',
    description: '-15% clockwise drift — inputs feel closer to where you aim.',
    rarity: 'common',
    icon: 'ucard_stat_drift',
    effect: { type: 'stat_boost', stat: 'drift', amount: 0.15 },
  },
  {
    id: 'heal',
    name: 'Haggis Supper',
    description: 'Instantly heal 25% of your current max HP.',
    rarity: 'common',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'healPercent', amount: 0.25 },
  },
  {
    id: 'boost_crit',
    name: 'Eagle Eye',
    description: '+5% crit chance — more lucky big hits.',
    rarity: 'uncommon',
    icon: 'ucard_stat_damage',
    effect: { type: 'stat_boost', stat: 'crit', amount: 0.05 },
  },
  {
    id: 'boost_regen',
    name: 'Highland Spring',
    description: '+0.5 HP per second — slow but steady recovery.',
    rarity: 'uncommon',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'regen', amount: 0.5 },
  },
  {
    id: 'boost_armor',
    name: 'Iron Hide',
    description: '+3 armor — flat reduction to incoming damage.',
    rarity: 'uncommon',
    icon: 'ucard_stat_defense',
    effect: { type: 'stat_boost', stat: 'armor', amount: 3 },
  },
  {
    id: 'boost_cooldown',
    name: 'Battle Frenzy',
    description: '-10% weapon cooldowns — more swings, shots, and pulses.',
    rarity: 'uncommon',
    icon: 'ucard_stat_cooldown',
    effect: { type: 'stat_boost', stat: 'cooldown', amount: 0.10 },
  },
  {
    id: 'banish',
    name: 'Highland Purge',
    description: 'Remove up to 5 of the weakest nearby enemies — breathing room now.',
    rarity: 'rare',
    icon: 'ucard_stat_utility',
    effect: { type: 'stat_boost', stat: 'banish', amount: 5 },
  },
  {
    id: 'boost_lifesteal',
    name: 'Vampiric Touch',
    description: '+1 HP each time you score a kill.',
    rarity: 'rare',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'lifesteal', amount: 1 },
  },
  {
    id: 'boost_projectile_speed',
    name: 'Swift Thistles',
    description: '+15% projectile speed — thistles, cabers, and balls arrive faster.',
    rarity: 'common',
    icon: 'ucard_stat_speed',
    effect: { type: 'stat_boost', stat: 'projectileSpeed', amount: 0.15 },
  },
  {
    id: 'boost_boss_heal',
    name: 'Trophy Hunter',
    description: 'When a boss dies, heal 20% max HP — reward for the big fight.',
    rarity: 'rare',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'bossHeal', amount: 0.20 },
  },
  {
    id: 'boost_knockback',
    name: 'Highland Force',
    description: '+25% knockback — shove enemies harder on every hit.',
    rarity: 'common',
    icon: 'ucard_stat_knockback',
    effect: { type: 'stat_boost', stat: 'knockback', amount: 0.25 },
  },
  {
    id: 'boost_xp',
    name: 'Wisdom of the Highlands',
    description: '+15% XP from enemies — level up sooner.',
    rarity: 'uncommon',
    icon: 'ucard_stat_utility',
    effect: { type: 'stat_boost', stat: 'xpMultiplier', amount: 0.15 },
  },
];

const LEVELUP_DRIFT_CARD_ENABLED = false;

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

  // Stat cards are always available (repeatable), except cards that are
  // intentionally disabled during active tuning passes.
  pool.push(...STAT_CARDS.filter((card) => (
    LEVELUP_DRIFT_CARD_ENABLED
    || !(card.effect.type === 'stat_boost' && card.effect.stat === 'drift')
  )));

  // Weapon level-up cards for owned weapons below max level (and not evolved)
  for (const key of ownedWeaponKeys) {
    if (evolvedWeaponKeys.includes(key)) continue; // Already evolved
    const level = weaponLevels[key] ?? 1;
    if (level < 5) {
      // Add evolution hint on level 4→5 cards
      const recipe = EVOLUTION_RECIPES.find((r) => r.baseWeapon === key);
      const hint = level === 4 && recipe
        ? ` At Lv 5, open a treasure chest while carrying ${formatPassiveItemName(recipe.requiredPassive)} to evolve.`
        : '';
      pool.push({
        id: `levelup_${key}_${level + 1}`,
        name: `${formatWeaponName(key)} Lv${level + 1}`,
        description: `Upgrade ${formatWeaponName(key)} to level ${level + 1}.${hint}`,
        rarity: level === 4 && recipe ? 'legendary' : (level >= 3 ? 'rare' : 'uncommon'),
        icon: `wicon_${key}`,
        effect: { type: 'level_weapon', weaponKey: key },
      });
    }
  }

  // Weapon evolutions: see EVOLUTION_RECIPES in BalanceConfig — offered from treasure chests only.

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
  const def = WEAPON_DEFS[key];
  if (def) return def.name;
  return key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatPassiveItemName(passiveKey: string): string {
  const found = PASSIVE_CARDS.find(
    (c) => c.effect.type === 'add_passive' && c.effect.passiveKey === passiveKey
  );
  return found?.name
    ?? passiveKey.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Draw N cards from the pool, weighted by rarity.
 * @param luckBonus — percentage bonus to rare/legendary weights (from Sporran + Lucky Heather)
 */
export function drawCards(pool: UpgradeCard[], count: number, luckBonus: number = 0): UpgradeCard[] {
  if (pool.length <= count) return [...pool];

  // Adjusted weights — luck boosts rare and legendary chances. Luck
  // multipliers doubled so the stat is actually felt: at max luck
  // (sporran + 3× lucky_heather = 15 + 30 = 45) commons drop from 55 to
  // ~10, rares rise from 13 to ~40, legendaries from 4 to ~22.
  const weights: Record<Rarity, number> = {
    common: Math.max(5, RARITY_WEIGHTS.common - luckBonus * 1.0),
    uncommon: RARITY_WEIGHTS.uncommon,
    rare: RARITY_WEIGHTS.rare + luckBonus * 0.6,
    legendary: RARITY_WEIGHTS.legendary + luckBonus * 0.4,
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
