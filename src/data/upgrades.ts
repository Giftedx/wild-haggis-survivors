/**
 * Upgrade card definitions — what appears when the player levels up.
 *
 * Cards are drawn from a dynamic pool based on what the player already has.
 * Rarity determines border color and drop chance.
 */

import { EVOLUTION_RECIPES } from '../core/BalanceConfig';
import { COLORS } from '../config';
import { WEAPON_DEFS } from './weapons';
import { buildRuneCards } from './runeCards';
import { t } from '../core/i18n';
import type { RNG } from '../utils/rng';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'rune' | 'mythic';

/** All valid passive item keys — single source of truth. */
export type PassiveKey =
  | 'sporran'
  | 'whisky_flask'
  | 'kilt'
  | 'tam_o_shanter'
  | 'irn_bru'
  | 'loch_water'
  | 'thistle_crown'
  | 'highland_shield'
  | 'tartan_sash'
  | 'shinty_ball';

export type UpgradeEffect =
  | { type: 'add_weapon'; weaponKey: string }
  | { type: 'level_weapon'; weaponKey: string }
  | { type: 'add_passive'; passiveKey: string }
  | { type: 'stat_boost'; stat: string; amount: number }
  | { type: 'evolve_weapon'; weaponKey: string; evolutionKey: string }
  | { type: 'grant_rune'; runeId: string }
  | { type: 'overcharge_weapon'; weaponKey: string };

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
/** Rune rarity weight — between rare (13) and legendary (4) per U1 spec §2. */
export const RUNE_RARITY_WEIGHT = 7;
/**
 * Release gate for player-visible rune cards. M4 (2026-04-26) ships the
 * Player / WeaponSystem / XPSystem / GoldGain consumers + bag drain so a
 * visible card is finally a true promise. Cards still need
 * bossKilledThisRun to surface — runes are a late-run reward, never the
 * first level-up offer.
 *
 * To re-disable for a hotfix, flip back to `false` here; the catalogue,
 * grant path, and persistence keep working in tests but no card surfaces.
 */
export const RUNE_CARD_OFFERS_ENABLED = true;

/** Phase B Endless — Mythic (Overcharge) draw weight. Rare-but-not-impossible
 *  in the post-bell pool. The card only enters the pool when an evolved,
 *  un-overcharged weapon exists, so weight here is a within-pool bias not a
 *  per-level guarantee. */
export const MYTHIC_RARITY_WEIGHT = 6;

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 55,
  uncommon: 28,
  rare: 13,
  legendary: 4,
  rune: RUNE_RARITY_WEIGHT,
  mythic: MYTHIC_RARITY_WEIGHT,
};

/** Rarity colors for card borders — mirrors the `COLORS` card-rarity
 *  palette so a retint in `config.ts` carries through to upgrade cards
 *  without hand-syncing parallel literals. */
export const RARITY_COLORS: Record<Rarity, number> = {
  common: COLORS.COMMON,
  uncommon: COLORS.UNCOMMON,
  rare: COLORS.RARE,
  legendary: COLORS.LEGENDARY,
  rune: COLORS.RUNE,
  mythic: COLORS.MYTHIC,
};

// ── Weapon cards ──

export const WEAPON_CARDS: UpgradeCard[] = [
  {
    id: 'add_bagpipe_blast',
    name: 'upgradeCard.add_bagpipe_blast.name',
    description: 'upgradeCard.add_bagpipe_blast.description',
    rarity: 'uncommon',
    icon: 'wicon_bagpipe_blast',
    effect: { type: 'add_weapon', weaponKey: 'bagpipe_blast' },
  },
  {
    id: 'add_caber_toss',
    name: 'upgradeCard.add_caber_toss.name',
    description: 'upgradeCard.add_caber_toss.description',
    rarity: 'uncommon',
    icon: 'wicon_caber_toss',
    effect: { type: 'add_weapon', weaponKey: 'caber_toss' },
  },
  {
    id: 'add_scotch_mist',
    name: 'upgradeCard.add_scotch_mist.name',
    description: 'upgradeCard.add_scotch_mist.description',
    rarity: 'uncommon',
    icon: 'wicon_scotch_mist',
    effect: { type: 'add_weapon', weaponKey: 'scotch_mist' },
  },
  {
    id: 'add_haggis_hurler',
    name: 'upgradeCard.add_haggis_hurler.name',
    description: 'upgradeCard.add_haggis_hurler.description',
    rarity: 'uncommon',
    icon: 'wicon_haggis_hurler',
    effect: { type: 'add_weapon', weaponKey: 'haggis_hurler' },
  },
  {
    id: 'add_nessie_tentacle',
    name: 'upgradeCard.add_nessie_tentacle.name',
    description: 'upgradeCard.add_nessie_tentacle.description',
    rarity: 'uncommon',
    icon: 'wicon_nessie_tentacle',
    effect: { type: 'add_weapon', weaponKey: 'nessie_tentacle' },
  },
  {
    id: 'add_claymore',
    name: 'upgradeCard.add_claymore.name',
    description: 'upgradeCard.add_claymore.description',
    rarity: 'uncommon',
    icon: 'wicon_claymore',
    effect: { type: 'add_weapon', weaponKey: 'claymore' },
  },
  {
    id: 'add_bagpipes',
    name: 'upgradeCard.add_bagpipes.name',
    description: 'upgradeCard.add_bagpipes.description',
    rarity: 'uncommon',
    icon: 'wicon_bagpipes',
    effect: { type: 'add_weapon', weaponKey: 'bagpipes' },
  },
  {
    id: 'add_shinty_stick',
    name: 'upgradeCard.add_shinty_stick.name',
    description: 'upgradeCard.add_shinty_stick.description',
    rarity: 'uncommon',
    icon: 'wicon_shinty_stick',
    effect: { type: 'add_weapon', weaponKey: 'shinty_stick' },
  },
];

// ── Passive item cards ──

export const PASSIVE_CARDS: UpgradeCard[] = [
  {
    id: 'add_sporran',
    name: 'upgradeCard.add_sporran.name',
    description: 'upgradeCard.add_sporran.description',
    rarity: 'uncommon',
    icon: 'ucard_sporran',
    effect: { type: 'add_passive', passiveKey: 'sporran' },
  },
  {
    id: 'add_whisky_flask',
    name: 'upgradeCard.add_whisky_flask.name',
    description: 'upgradeCard.add_whisky_flask.description',
    rarity: 'uncommon',
    icon: 'ucard_whisky_flask',
    effect: { type: 'add_passive', passiveKey: 'whisky_flask' },
  },
  {
    id: 'add_kilt',
    name: 'upgradeCard.add_kilt.name',
    description: 'upgradeCard.add_kilt.description',
    rarity: 'uncommon',
    icon: 'ucard_kilt',
    effect: { type: 'add_passive', passiveKey: 'kilt' },
  },
  {
    id: 'add_tam_o_shanter',
    name: 'upgradeCard.add_tam_o_shanter.name',
    description: 'upgradeCard.add_tam_o_shanter.description',
    rarity: 'uncommon',
    icon: 'ucard_tam_o_shanter',
    effect: { type: 'add_passive', passiveKey: 'tam_o_shanter' },
  },
  {
    id: 'add_irn_bru',
    name: 'upgradeCard.add_irn_bru.name',
    description: 'upgradeCard.add_irn_bru.description',
    rarity: 'uncommon',
    icon: 'ucard_irn_bru',
    effect: { type: 'add_passive', passiveKey: 'irn_bru' },
  },
  {
    id: 'add_loch_water',
    name: 'upgradeCard.add_loch_water.name',
    description: 'upgradeCard.add_loch_water.description',
    rarity: 'uncommon',
    icon: 'ucard_loch_water',
    effect: { type: 'add_passive', passiveKey: 'loch_water' },
  },
  {
    id: 'add_thistle_crown',
    name: 'upgradeCard.add_thistle_crown.name',
    description: 'upgradeCard.add_thistle_crown.description',
    rarity: 'rare',
    icon: 'ucard_thistle_crown',
    effect: { type: 'add_passive', passiveKey: 'thistle_crown' },
  },
  {
    id: 'add_highland_shield',
    name: 'upgradeCard.add_highland_shield.name',
    description: 'upgradeCard.add_highland_shield.description',
    rarity: 'rare',
    icon: 'ucard_highland_shield',
    effect: { type: 'add_passive', passiveKey: 'highland_shield' },
  },
  {
    id: 'add_tartan_sash',
    name: 'upgradeCard.add_tartan_sash.name',
    description: 'upgradeCard.add_tartan_sash.description',
    rarity: 'uncommon',
    icon: 'ucard_tartan_sash',
    effect: { type: 'add_passive', passiveKey: 'tartan_sash' },
  },
  {
    id: 'add_shinty_ball',
    name: 'upgradeCard.add_shinty_ball.name',
    description: 'upgradeCard.add_shinty_ball.description',
    rarity: 'uncommon',
    icon: 'ucard_shinty_ball',
    effect: { type: 'add_passive', passiveKey: 'shinty_ball' },
  },
];

/** Canonical list of passive item keys — derived from PASSIVE_CARDS. Single source of truth. */
export const PASSIVE_KEYS: string[] = PASSIVE_CARDS
  .filter((c): c is UpgradeCard & { effect: { type: 'add_passive'; passiveKey: string } } =>
    c.effect.type === 'add_passive')
  .map((c) => c.effect.passiveKey);

/**
 * M1 F8 — roll a random passive the player doesn't already own.
 * Returns the UpgradeCard (for name + icon) so callers can show a
 * proper toast and wire the apply path through `LevelUpFlow
 * .applyPassiveEffect`. Returns null when the roster is full —
 * callers should fall back to a refund / stub path.
 */
export function rollRandomUnheldPassive(
  rng: RNG,
  ownedPassiveKeys: readonly string[],
): UpgradeCard | null {
  const held = new Set(ownedPassiveKeys);
  const available = PASSIVE_CARDS.filter((c) => {
    const eff = c.effect as { type: 'add_passive'; passiveKey: string };
    return !held.has(eff.passiveKey);
  });
  if (available.length === 0) return null;
  return rng.pick(available);
}

// ── Stat boost cards (common filler) ──

export const STAT_CARDS: UpgradeCard[] = [
  {
    id: 'boost_hp',
    name: 'upgradeCard.boost_hp.name',
    description: 'upgradeCard.boost_hp.description',
    rarity: 'common',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'maxHp', amount: 10 },
  },
  {
    id: 'boost_speed',
    name: 'upgradeCard.boost_speed.name',
    description: 'upgradeCard.boost_speed.description',
    rarity: 'common',
    icon: 'ucard_stat_speed',
    effect: { type: 'stat_boost', stat: 'speed', amount: 0.08 },
  },
  {
    id: 'boost_pickup',
    name: 'upgradeCard.boost_pickup.name',
    description: 'upgradeCard.boost_pickup.description',
    rarity: 'common',
    icon: 'ucard_stat_pickup',
    effect: { type: 'stat_boost', stat: 'pickup', amount: 15 },
  },
  {
    id: 'boost_damage',
    name: 'upgradeCard.boost_damage.name',
    description: 'upgradeCard.boost_damage.description',
    rarity: 'common',
    icon: 'ucard_stat_damage',
    effect: { type: 'stat_boost', stat: 'damage', amount: 0.10 },
  },
  {
    id: 'boost_drift',
    name: 'upgradeCard.boost_drift.name',
    description: 'upgradeCard.boost_drift.description',
    rarity: 'common',
    icon: 'ucard_stat_drift',
    effect: { type: 'stat_boost', stat: 'drift', amount: 0.15 },
  },
  {
    id: 'heal',
    name: 'upgradeCard.heal.name',
    description: 'upgradeCard.heal.description',
    rarity: 'common',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'healPercent', amount: 0.25 },
  },
  {
    id: 'boost_crit',
    name: 'upgradeCard.boost_crit.name',
    description: 'upgradeCard.boost_crit.description',
    rarity: 'uncommon',
    icon: 'ucard_stat_damage',
    effect: { type: 'stat_boost', stat: 'crit', amount: 0.05 },
  },
  {
    id: 'boost_regen',
    name: 'upgradeCard.boost_regen.name',
    description: 'upgradeCard.boost_regen.description',
    rarity: 'uncommon',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'regen', amount: 0.5 },
  },
  {
    id: 'boost_armor',
    name: 'upgradeCard.boost_armor.name',
    description: 'upgradeCard.boost_armor.description',
    rarity: 'uncommon',
    icon: 'ucard_stat_defense',
    effect: { type: 'stat_boost', stat: 'armor', amount: 3 },
  },
  {
    id: 'boost_cooldown',
    name: 'upgradeCard.boost_cooldown.name',
    description: 'upgradeCard.boost_cooldown.description',
    rarity: 'uncommon',
    icon: 'ucard_stat_cooldown',
    effect: { type: 'stat_boost', stat: 'cooldown', amount: 0.10 },
  },
  {
    id: 'banish',
    name: 'upgradeCard.banish.name',
    description: 'upgradeCard.banish.description',
    rarity: 'rare',
    icon: 'ucard_stat_utility',
    effect: { type: 'stat_boost', stat: 'banish', amount: 5 },
  },
  {
    id: 'boost_lifesteal',
    name: 'upgradeCard.boost_lifesteal.name',
    description: 'upgradeCard.boost_lifesteal.description',
    rarity: 'rare',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'lifesteal', amount: 1 },
  },
  {
    id: 'boost_projectile_speed',
    name: 'upgradeCard.boost_projectile_speed.name',
    description: 'upgradeCard.boost_projectile_speed.description',
    rarity: 'common',
    icon: 'ucard_stat_speed',
    effect: { type: 'stat_boost', stat: 'projectileSpeed', amount: 0.15 },
  },
  {
    id: 'boost_boss_heal',
    name: 'upgradeCard.boost_boss_heal.name',
    description: 'upgradeCard.boost_boss_heal.description',
    rarity: 'rare',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'bossHeal', amount: 0.20 },
  },
  {
    id: 'boost_knockback',
    name: 'upgradeCard.boost_knockback.name',
    description: 'upgradeCard.boost_knockback.description',
    rarity: 'common',
    icon: 'ucard_stat_knockback',
    effect: { type: 'stat_boost', stat: 'knockback', amount: 0.25 },
  },
  {
    id: 'boost_xp',
    name: 'upgradeCard.boost_xp.name',
    description: 'upgradeCard.boost_xp.description',
    rarity: 'uncommon',
    icon: 'ucard_stat_utility',
    effect: { type: 'stat_boost', stat: 'xpMultiplier', amount: 0.15 },
  },
  {
    id: 'boost_luck',
    name: 'upgradeCard.boost_luck.name',
    description: 'upgradeCard.boost_luck.description',
    rarity: 'uncommon',
    icon: 'ucard_stat_utility',
    effect: { type: 'stat_boost', stat: 'luck', amount: 8 },
  },
];

// ── Echo cards (post-cap progression) ──────────────────────────────────
//
// After reaching MAX_LEVEL, XP accumulates into a separate buffer instead
// of vanishing. When the buffer crosses XP.ECHO_XP_THRESHOLD, the player
// picks one echo card — small stat bumps, smaller than regular stat cards.
// The moor's "echo": whispers of progression that linger past the cap.
//
// All echoes use the existing `stat_boost` effect so LevelUpFlow.apply()
// can route them through the same applyStatBoost dispatch — no new effect
// type, no duplicate switch. Amounts are intentionally small (roughly half
// the STAT_CARDS equivalents) because the player receives many echoes over
// the 10-minute back half of a run.

export const ECHO_CARDS: UpgradeCard[] = [
  {
    id: 'echo_damage',
    name: 'upgradeCard.echo_damage.name',
    description: 'upgradeCard.echo_damage.description',
    rarity: 'common',
    icon: 'ucard_stat_damage',
    effect: { type: 'stat_boost', stat: 'damage', amount: 0.04 },
  },
  {
    id: 'echo_crit',
    name: 'upgradeCard.echo_crit.name',
    description: 'upgradeCard.echo_crit.description',
    rarity: 'common',
    icon: 'ucard_stat_damage',
    effect: { type: 'stat_boost', stat: 'crit', amount: 0.02 },
  },
  {
    id: 'echo_speed',
    name: 'upgradeCard.echo_speed.name',
    description: 'upgradeCard.echo_speed.description',
    rarity: 'common',
    icon: 'ucard_stat_speed',
    effect: { type: 'stat_boost', stat: 'speed', amount: 0.03 },
  },
  {
    id: 'echo_hp',
    name: 'upgradeCard.echo_hp.name',
    description: 'upgradeCard.echo_hp.description',
    rarity: 'common',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'maxHp', amount: 5 },
  },
  {
    id: 'echo_pickup',
    name: 'upgradeCard.echo_pickup.name',
    description: 'upgradeCard.echo_pickup.description',
    rarity: 'common',
    icon: 'ucard_stat_pickup',
    effect: { type: 'stat_boost', stat: 'pickup', amount: 6 },
  },
  {
    id: 'echo_armor',
    name: 'upgradeCard.echo_armor.name',
    description: 'upgradeCard.echo_armor.description',
    rarity: 'uncommon',
    icon: 'ucard_stat_defense',
    effect: { type: 'stat_boost', stat: 'armor', amount: 1 },
  },
  {
    id: 'echo_cooldown',
    name: 'upgradeCard.echo_cooldown.name',
    description: 'upgradeCard.echo_cooldown.description',
    rarity: 'uncommon',
    icon: 'ucard_stat_cooldown',
    effect: { type: 'stat_boost', stat: 'cooldown', amount: 0.03 },
  },
  {
    id: 'echo_lifesteal',
    name: 'upgradeCard.echo_lifesteal.name',
    description: 'upgradeCard.echo_lifesteal.description',
    rarity: 'rare',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'lifesteal', amount: 0.3 },
  },
];

const LEVELUP_DRIFT_CARD_ENABLED = true;

/** Extra context for pool building. New in U1 (rune tier). */
export interface BuildCardPoolContext {
  /** True once ANY boss has been killed this run — unlocks rune tier. */
  readonly bossKilledThisRun?: boolean;
  /** Rune ids already owned this run (filtered from draw). */
  readonly ownedRuneIds?: readonly string[];
  /** Test/future-rollout override for the release gate above. */
  readonly runeOffersEnabled?: boolean;
  /** Phase B Endless — true while in post-bell. Gates Overcharge cards. */
  readonly isPostBell?: boolean;
  /**
   * Phase B Endless — weapon keys already overcharged this run. The
   * Overcharge tier is once-per-weapon-per-run; entries listed here are
   * filtered out of the offered pool.
   */
  readonly overchargedWeaponKeys?: readonly string[];
}

/**
 * Build the available card pool based on current player state.
 * Filters out weapons already owned, passives already held, etc.
 */
export function buildCardPool(
  ownedWeaponKeys: string[],
  ownedPassiveKeys: string[],
  weaponLevels: Record<string, number>,
  evolvedWeaponKeys: string[] = [],
  ctx: BuildCardPoolContext = {},
): UpgradeCard[] {
  const pool: UpgradeCard[] = [];

  // Stat cards are always available (repeatable), except cards that are
  // intentionally disabled during active tuning passes.
  pool.push(...STAT_CARDS.filter((card) => (
    LEVELUP_DRIFT_CARD_ENABLED
    || !(card.effect.type === 'stat_boost' && card.effect.stat === 'drift')
  )));

  // Weapon level-up cards for owned weapons below max level (and not evolved).
  // Cards built here bake the resolved display text into the name/description
  // fields (rather than storing i18n keys) because the "{weapon} Lv{n}" form
  // is dynamic per (weapon, level) combo and not one key per card.
  for (const key of ownedWeaponKeys) {
    if (evolvedWeaponKeys.includes(key)) continue; // Already evolved
    const level = weaponLevels[key] ?? 1;
    if (level < 5) {
      // Add evolution hint on level 4→5 cards
      const recipe = EVOLUTION_RECIPES.find((r) => r.baseWeapon === key);
      const weaponName = formatWeaponName(key);
      const nextLevel = level + 1;
      const hint = level === 4 && recipe
        ? t('upgradeCard.evolution_hint', { passive: formatPassiveItemName(recipe.requiredPassive) })
        : '';
      pool.push({
        id: `levelup_${key}_${nextLevel}`,
        name: t('upgradeCard.levelup.name', { weapon: weaponName, level: nextLevel }),
        description: t('upgradeCard.levelup.description', { weapon: weaponName, level: nextLevel }) + hint,
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

  // Passive cards (only if not already owned). T215 — when picking the
  // passive would complete an evolution recipe (matching weapon already
  // at lv5 + not yet evolved), surface that prominently with an
  // "Evolves into <X>" tag and a legendary-rarity bump so the player
  // recognises which pick lights up the legendary form. The actual
  // evolution still fires from a chest; this only signals that the
  // synergy is unlocked once the chest appears.
  for (const card of PASSIVE_CARDS) {
    const eff = card.effect as { type: 'add_passive'; passiveKey: string };
    if (ownedPassiveKeys.includes(eff.passiveKey)) continue;
    const recipe = EVOLUTION_RECIPES.find((r) =>
      r.requiredPassive === eff.passiveKey
      && ownedWeaponKeys.includes(r.baseWeapon)
      && (weaponLevels[r.baseWeapon] ?? 1) >= 5
      && !evolvedWeaponKeys.includes(r.baseWeapon),
    );
    if (recipe) {
      const evolvedName = t(recipe.nameKey);
      pool.push({
        ...card,
        rarity: 'legendary',
        description:
          t(card.description)
          + t('upgradeCard.evolution_ready_hint', { evolved: evolvedName }),
      });
    } else {
      pool.push(card);
    }
  }

  // Rune tier — still behind a release gate. Until runtime consumers read
  // RuneEffectBag, offering these cards would over-promise to the player.
  // The explicit context override keeps the pure pool logic testable for
  // the future re-enable path.
  if (ctx.bossKilledThisRun && (ctx.runeOffersEnabled ?? RUNE_CARD_OFFERS_ENABLED)) {
    const owned = new Set(ctx.ownedRuneIds ?? []);
    for (const card of buildRuneCards()) {
      const eff = card.effect as { type: 'grant_rune'; runeId: string };
      if (!owned.has(eff.runeId)) pool.push(card);
    }
  }

  // Phase B Endless — Overcharge cards. Once per weapon per run, gated
  // to post-bell + already-evolved + not-yet-overcharged. Generated
  // programmatically so a new evolution recipe in BalanceConfig adds an
  // overcharge automatically.
  if (ctx.isPostBell && evolvedWeaponKeys.length > 0) {
    const already = new Set(ctx.overchargedWeaponKeys ?? []);
    for (const key of evolvedWeaponKeys) {
      if (already.has(key)) continue;
      const weaponName = formatWeaponName(key);
      pool.push({
        id: `overcharge_${key}`,
        name: t('upgradeCard.overcharge.name', { weapon: weaponName }),
        description: t('upgradeCard.overcharge.description', { weapon: weaponName }),
        rarity: 'mythic',
        icon: `wicon_${key}`,
        effect: { type: 'overcharge_weapon', weaponKey: key },
      });
    }
  }

  return pool;
}

function formatWeaponName(key: string): string {
  const def = WEAPON_DEFS[key as import('./weapons').WeaponKey];
  if (def) return t(def.nameKey);
  return key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatPassiveItemName(passiveKey: string): string {
  const found = PASSIVE_CARDS.find(
    (c) => c.effect.type === 'add_passive' && c.effect.passiveKey === passiveKey
  );
  // card.name is now an i18n key per the upgraded contract; resolve it.
  return found ? t(found.name)
    : passiveKey.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Weapon-aware nudge for level-up offers — flat weight bonus, deterministic. */
export interface CardSynergyContext {
  readonly ownedWeaponKeys: readonly string[];
}

/** Extra draw weight from build synergy (weapon keys already owned). */
export function synergyWeightBonus(card: UpgradeCard, ctx: CardSynergyContext | undefined): number {
  if (!ctx) return 0;
  const w = ctx.ownedWeaponKeys;
  const has = (k: string) => w.includes(k);
  if (card.effect.type !== 'stat_boost') return 0;
  const s = card.effect.stat;
  if (s === 'projectileSpeed' && (has('haggis_hurler') || has('thistle_shot') || has('caber_toss'))) return 10;
  if (s === 'knockback' && (has('caber_toss') || has('bagpipe_blast'))) return 8;
  if (s === 'cooldown' && (has('bagpipe_blast') || has('nessie_tentacle'))) return 8;
  if (s === 'regen' && has('scotch_mist')) return 7;
  if (s === 'damage' && w.length > 0) return 5;
  if (s === 'xpMultiplier' && w.length >= 2) return 4;
  return 0;
}

export type DrawCardsOptions = {
  /** Weight multiplier when this card id is already in the current hand (0–1). */
  duplicateWeightMultiplier?: number;
  synergyContext?: CardSynergyContext;
};

/**
 * Draw `count` cards from `pool` with rarity-weighted probability.
 *
 * `rng` returns [0, 1). Defaults to `Math.random` for tests; gameplay passes
 * run-scoped RNG for deterministic dailies / seed codes.
 */
export function drawCards(
  pool: UpgradeCard[],
  count: number,
  luckBonus: number = 0,
  rng: () => number = Math.random,
  opts?: DrawCardsOptions,
): UpgradeCard[] {
  if (pool.length <= count) return [...pool];

  const dupMul = opts?.duplicateWeightMultiplier ?? 0.22;

  // Adjusted weights — luck boosts rare and legendary chances. Luck
  // multipliers doubled so the stat is actually felt: at max luck
  // (sporran + 3× lucky_heather = 15 + 30 = 45) commons drop from 55 to
  // ~10, rares rise from 13 to ~40, legendaries from 4 to ~22.
  const weights: Record<Rarity, number> = {
    common: Math.max(5, RARITY_WEIGHTS.common - luckBonus * 1.0),
    uncommon: RARITY_WEIGHTS.uncommon,
    rare: RARITY_WEIGHTS.rare + luckBonus * 0.6,
    legendary: RARITY_WEIGHTS.legendary + luckBonus * 0.4,
    // U1 Rune tier — luck-coupled (doubled same as rare/legendary) so a
    // sporran build lifts the chance of seeing a rune offer alongside
    // the usual legendary surge. Floor at 1 to keep the tier live even
    // if hostile luck math pushed it below zero.
    rune: Math.max(1, RARITY_WEIGHTS.rune + luckBonus * 0.3),
    // Phase B Endless — Mythic / Overcharge tier. Same luck coupling as
    // legendary so a sporran build sees overcharges more often. Card only
    // enters the pool post-bell + on already-evolved un-overcharged weapons.
    mythic: Math.max(1, RARITY_WEIGHTS.mythic + luckBonus * 0.4),
  };

  const drawn: UpgradeCard[] = [];
  const remaining = [...pool];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    let totalWeight = 0;
    const drawnIds = new Set(drawn.map((c) => c.id));
    for (const card of remaining) {
      const rarityW = weights[card.rarity];
      const syn = synergyWeightBonus(card, opts?.synergyContext);
      const dup = drawnIds.has(card.id) ? dupMul : 1;
      totalWeight += Math.max(0.001, rarityW * dup + syn);
    }

    let roll = rng() * totalWeight;
    let picked = remaining[remaining.length - 1]!;
    for (const card of remaining) {
      const rarityW = weights[card.rarity];
      const syn = synergyWeightBonus(card, opts?.synergyContext);
      const dup = drawnIds.has(card.id) ? dupMul : 1;
      const w = Math.max(0.001, rarityW * dup + syn);
      roll -= w;
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
