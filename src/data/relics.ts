/**
 * Relics — third progression tier (R1).
 *
 * Relics sit above weapons/passives: 3-slot cap per run, acquired from
 * elite/boss/chest drops rather than level-up card draws. Each relic is
 * a self-contained effect with a long-form flavour line (Dark-Souls-ish
 * tone, per spec §3).
 *
 * M1 scope: pure data + schema. Effect hook functions (applyPerFrame,
 * onPickup, etc.) are NOT authored here — they land in M3 alongside the
 * effect wiring. `iconSprite` keys are declared now; the actual Graphics
 * textures are generated in `BootScene` at M3.
 *
 * Source of truth: docs/superpowers/specs/2026-04-23-relics-third-tier-design.md §3.
 */

export type RelicRarity = 'common' | 'uncommon' | 'rare';

/**
 * Where a relic prefers to appear. Used by the M2 drop roller to bias
 * pools (e.g. elite kills favour stat-boost commons, bosses favour
 * run-defining rares, chests favour uncommons).
 */
export type RelicDropSource = 'elite' | 'boss' | 'chest' | 'hidden_node' | 'bargain';

export type RelicKey =
  // Common (8)
  | 'sporran_of_holding'
  | 'oatcake_stash'
  | 'grans_thimble'
  | 'lucky_heather_sprig'
  | 'bronze_clasp'
  | 'ceilidh_dancers_ribbon'
  | 'damp_tinder'
  | 'whisky_dram';

export interface RelicDef {
  readonly key: RelicKey;
  readonly rarity: RelicRarity;
  /** i18n dot-path — resolved with `t(nameKey)` at render time. */
  readonly nameKey: string;
  /** i18n dot-path — short one-sentence mechanical description. */
  readonly effectKey: string;
  /** i18n dot-path — longer Dark-Souls-ish flavour line. */
  readonly flavourKey: string;
  /** Programmatic texture key; generated in BootScene at M3. */
  readonly iconSprite: string;
  /** Hex colour used for pickup VFX (thematic Scottish palette). */
  readonly particleColour: number;
  /** Drop sources this relic can appear in. Never empty. */
  readonly dropAffinity: readonly RelicDropSource[];
  /** True if the relic has a manual activation (e.g. sporran menu). */
  readonly activate?: boolean;
}

export const RELICS: Readonly<Record<RelicKey, RelicDef>> = {
  // -------- Common (8) --------
  sporran_of_holding: {
    key: 'sporran_of_holding',
    rarity: 'common',
    nameKey: 'relics.sporran_of_holding.name',
    effectKey: 'relics.sporran_of_holding.effect',
    flavourKey: 'relics.sporran_of_holding.flavour',
    iconSprite: 'relic_sporran',
    particleColour: 0xcd7f32, // bronze
    dropAffinity: ['elite', 'chest'],
  },
  oatcake_stash: {
    key: 'oatcake_stash',
    rarity: 'common',
    nameKey: 'relics.oatcake_stash.name',
    effectKey: 'relics.oatcake_stash.effect',
    flavourKey: 'relics.oatcake_stash.flavour',
    iconSprite: 'relic_oatcake',
    particleColour: 0xd9b380, // toasted oat
    dropAffinity: ['elite', 'chest'],
  },
  grans_thimble: {
    key: 'grans_thimble',
    rarity: 'common',
    nameKey: 'relics.grans_thimble.name',
    effectKey: 'relics.grans_thimble.effect',
    flavourKey: 'relics.grans_thimble.flavour',
    iconSprite: 'relic_thimble',
    particleColour: 0xc0c0c0, // silver
    dropAffinity: ['elite'],
  },
  lucky_heather_sprig: {
    key: 'lucky_heather_sprig',
    rarity: 'common',
    nameKey: 'relics.lucky_heather_sprig.name',
    effectKey: 'relics.lucky_heather_sprig.effect',
    flavourKey: 'relics.lucky_heather_sprig.flavour',
    iconSprite: 'relic_heather',
    particleColour: 0xb19cd9, // heather purple
    dropAffinity: ['hidden_node', 'chest'],
  },
  bronze_clasp: {
    key: 'bronze_clasp',
    rarity: 'common',
    nameKey: 'relics.bronze_clasp.name',
    effectKey: 'relics.bronze_clasp.effect',
    flavourKey: 'relics.bronze_clasp.flavour',
    iconSprite: 'relic_clasp',
    particleColour: 0xcd7f32, // bronze
    dropAffinity: ['elite'],
  },
  ceilidh_dancers_ribbon: {
    key: 'ceilidh_dancers_ribbon',
    rarity: 'common',
    nameKey: 'relics.ceilidh_dancers_ribbon.name',
    effectKey: 'relics.ceilidh_dancers_ribbon.effect',
    flavourKey: 'relics.ceilidh_dancers_ribbon.flavour',
    iconSprite: 'relic_ribbon',
    particleColour: 0xe06666, // tartan red
    dropAffinity: ['chest', 'bargain'],
  },
  damp_tinder: {
    key: 'damp_tinder',
    rarity: 'common',
    nameKey: 'relics.damp_tinder.name',
    effectKey: 'relics.damp_tinder.effect',
    flavourKey: 'relics.damp_tinder.flavour',
    iconSprite: 'relic_tinder',
    particleColour: 0x8b4513, // peat brown
    dropAffinity: ['chest', 'hidden_node'],
  },
  whisky_dram: {
    key: 'whisky_dram',
    rarity: 'common',
    nameKey: 'relics.whisky_dram.name',
    effectKey: 'relics.whisky_dram.effect',
    flavourKey: 'relics.whisky_dram.flavour',
    iconSprite: 'relic_whisky',
    particleColour: 0xd4a017, // whisky amber
    dropAffinity: ['chest', 'bargain'],
    activate: true,
  },
};

/** Ordered key list — iteration order matches catalogue authorship order. */
export const RELIC_KEYS: readonly RelicKey[] = Object.keys(RELICS) as RelicKey[];
