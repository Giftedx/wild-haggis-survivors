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
  | 'shinty_ball'
  | 'whetstone'
  | 'velvet_antler'
  // Wild Living World Phase 2 — Waulking Mallet evolution paired passive.
  // "Tuning Fork" — a thumb-sized fork the haggis taps before a sweep,
  // the audible test-note before the pipes drone in. Paired with a
  // level-5 Waulking Mallet at chest grants the Pibroch Hammer.
  | 'tuning_fork'
  // Highland Horrors — Dirk Dance evolution paired passive.
  // "Gillie's Edge" — the gamekeeper's agility: light foot, quick turn.
  // +8% move speed. Paired with a level-5 Dirk Dance at chest → Dirk Flurry.
  | 'gillies_edge'
  // Highland Horrors — Granny's Curse evolution paired passive.
  // "Widow's Shawl" — warm wool worn against the Highland cold.
  // +12 max HP. Paired with a level-5 Granny's Curse at chest → Banshee Wail.
  | 'widows_shawl'
  // Highland Horrors — Wallace Sword evolution paired passive.
  // "Stirling Medal" — valor at Stirling Bridge, 1297.
  // +10% crit chance. Paired with a level-5 Wallace Sword at chest → Freedom Blade.
  | 'stirling_medal'
  // Whisky Lob paired passive — "Peated Oak".
  // Aged spirit on charred oak. +10% global damage — the smoke and barrel
  // tannins sharpen every edge the haggis carries. Pairs with a level-5
  // Whisky Lob at chest for the future evolution.
  | 'peated_oak'
  // Bagpipe Drone paired passive — "Reeds".
  // The drone pipe's double-reed, dipped and tuned. +10% cooldown reduction
  // — the reed settles faster, the drone cycle tightens. Pairs with a
  // level-5 Bagpipe Drone at chest for the future evolution.
  | 'reeds'
  // Clootie Rag paired passive — "Rowan Thread".
  // Red thread from a rowan, tied at the wrist against harm. +1.5 HP regen
  // per second — the tree that protects you while the rag wounds them.
  // Pairs with a level-5 Clootie Rag at chest for the future evolution.
  | 'rowan_thread'
  // Cullen Skink Ladle paired passive — "Smoked Haddock".
  // The Finnan haddie dried in the smoke — the broth that keeps you alive.
  // +12 max HP. Pairs with a level-5 Cullen Skink Ladle for the future evo.
  | 'smoked_haddock'
  // Steam Engine paired passive — "Copper Rivet".
  // A hand-riveted boiler fitting from the Clyde shipyards. +10% attack
  // speed — every rivet tightened, every cycle runs faster. Pairs with a
  // level-5 Steam Engine at chest for the future evolution.
  | 'copper_rivet'
  // Bodhrán paired passive — "Drum Hoop".
  // The bent-willow hoop that tensions the goatskin head. +10% AoE radius
  // — the hoop deepens the resonance and spreads the shockwave. Pairs with
  // a level-5 Bodhrán at chest to unlock the Beltane Drum evolution.
  | 'drum_hoop'
  // Selkie Song paired passive — "Seal Pelt".
  // The selkie's shed skin, smooth and salt-cold. +2 HP regen per second
  // — the warmth of the pelt keeps you alive while the song holds them.
  // Pairs with a level-5 Selkie Song at chest for the Selkie Chorus.
  | 'seal_pelt'
  // Clàrsach paired passive — "Wire Strings".
  // Taut bronze wire strings tuned to the open moor. +12% cooldown
  // reduction — the tighter the string, the faster the strum. Pairs
  // with a level-5 Clàrsach at chest for the Clàrsach Eternal.
  | 'wire_strings'
  // Rowan Amulet — holed rowan-berry sprig, the protective Highland
  // charm. +15% projectile speed — the charm guides the stone truer.
  // Pairs with a level-5 Hagstone Sling at chest for the Rowan Hail.
  | 'rowan_amulet'
  // Highland Trump — a Jew's harp, the small frame-drone of the mouth.
  // +10% global cooldown reduction — the resonance tightens the cycle.
  // Pairs with a level-5 Port-à-Beul at chest for Canntaireachd.
  | 'highland_trump'
  // Pinhead Oats — the slow-cook rolled oats for the pot.
  // +12 max HP (porridge fills ye up). Pairs with Porridge Pot for Brose Cannon.
  | 'pinhead_oats'
  // Batter Mix — seasoned plain flour for deep-frying.
  // +10% damage to everything. Pairs with Deep-Fried Mars Bar.
  | 'batter_mix';

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
  {
    id: 'add_sgian_dubh',
    name: 'upgradeCard.add_sgian_dubh.name',
    description: 'upgradeCard.add_sgian_dubh.description',
    rarity: 'uncommon',
    icon: 'wicon_sgian_dubh',
    effect: { type: 'add_weapon', weaponKey: 'sgian_dubh' },
  },
  {
    id: 'add_stag_antler',
    name: 'upgradeCard.add_stag_antler.name',
    description: 'upgradeCard.add_stag_antler.description',
    rarity: 'uncommon',
    icon: 'wicon_stag_antler',
    effect: { type: 'add_weapon', weaponKey: 'stag_antler' },
  },
  // Wild Living World Initiative — Waulking Mallet. Soft rhythm
  // weapon. Off-beat hits still output baseline damage so muted
  // audio never zeroes the weapon; on-beat hits land at +30%.
  {
    id: 'add_waulking_mallet',
    name: 'upgradeCard.add_waulking_mallet.name',
    description: 'upgradeCard.add_waulking_mallet.description',
    rarity: 'uncommon',
    icon: 'wicon_bagpipes',
    effect: { type: 'add_weapon', weaponKey: 'waulking_mallet' },
  },
  // Bagpipe Drone — continuous slow-aura utility weapon.
  {
    id: 'add_bagpipe_drone',
    name: 'upgradeCard.add_bagpipe_drone.name',
    description: 'upgradeCard.add_bagpipe_drone.description',
    rarity: 'uncommon',
    icon: 'wicon_bagpipe_drone',
    effect: { type: 'add_weapon', weaponKey: 'bagpipe_drone' },
  },
  // Whisky Lob — zone-denial lob weapon, shatters on landing.
  {
    id: 'add_whisky_lob',
    name: 'upgradeCard.add_whisky_lob.name',
    description: 'upgradeCard.add_whisky_lob.description',
    rarity: 'uncommon',
    icon: 'wicon_whisky_lob',
    effect: { type: 'add_weapon', weaponKey: 'whisky_lob' },
  },
  // Highland Horrors — three new weapon families.
  {
    id: 'add_dirk_dance',
    name: 'upgradeCard.add_dirk_dance.name',
    description: 'upgradeCard.add_dirk_dance.description',
    rarity: 'uncommon',
    icon: 'wicon_dirk_dance',
    effect: { type: 'add_weapon', weaponKey: 'dirk_dance' },
  },
  {
    id: 'add_grannies_curse',
    name: 'upgradeCard.add_grannies_curse.name',
    description: 'upgradeCard.add_grannies_curse.description',
    rarity: 'uncommon',
    icon: 'wicon_grannies_curse',
    effect: { type: 'add_weapon', weaponKey: 'grannies_curse' },
  },
  {
    id: 'add_wallace_sword',
    name: 'upgradeCard.add_wallace_sword.name',
    description: 'upgradeCard.add_wallace_sword.description',
    rarity: 'rare',
    icon: 'wicon_wallace_sword',
    effect: { type: 'add_weapon', weaponKey: 'wallace_sword' },
  },
  // Coastal Storm — standalone mega-AoE. No evolution, no paired passive.
  {
    id: 'add_coastal_storm',
    name: 'upgradeCard.add_coastal_storm.name',
    description: 'upgradeCard.add_coastal_storm.description',
    rarity: 'rare',
    icon: 'wicon_coastal_storm',
    effect: { type: 'add_weapon', weaponKey: 'coastal_storm' },
  },
  // Clootie Rag — wounding aura, bleed family. Paired passive: Rowan Thread.
  {
    id: 'add_clootie_rag',
    name: 'upgradeCard.add_clootie_rag.name',
    description: 'upgradeCard.add_clootie_rag.description',
    rarity: 'uncommon',
    icon: 'wicon_clootie_rag',
    effect: { type: 'add_weapon', weaponKey: 'clootie_rag' },
  },
  // Cullen Skink Ladle — lob_puddle slow zone. Paired passive: Smoked Haddock.
  {
    id: 'add_cullen_skink_ladle',
    name: 'upgradeCard.add_cullen_skink_ladle.name',
    description: 'upgradeCard.add_cullen_skink_ladle.description',
    rarity: 'uncommon',
    icon: 'wicon_cullen_skink_ladle',
    effect: { type: 'add_weapon', weaponKey: 'cullen_skink_ladle' },
  },
  // Steam Engine — heavy Clyde-built aoe_pulse, knockback-heavy, no freeze.
  // Paired passive: Copper Rivet.
  {
    id: 'add_steam_engine',
    name: 'upgradeCard.add_steam_engine.name',
    description: 'upgradeCard.add_steam_engine.description',
    rarity: 'uncommon',
    icon: 'wicon_steam_engine',
    effect: { type: 'add_weapon', weaponKey: 'steam_engine' },
  },
  // Bodhrán — rapid warm aoe_pulse rhythm weapon. Paired passive: Drum Hoop.
  {
    id: 'add_bodhran',
    name: 'upgradeCard.add_bodhran.name',
    description: 'upgradeCard.add_bodhran.description',
    rarity: 'uncommon',
    icon: 'wicon_bodhran',
    effect: { type: 'add_weapon', weaponKey: 'bodhran' },
  },
  // Selkie Song — charm aura_pulse. Paired passive: Seal Pelt.
  {
    id: 'add_selkie_song',
    name: 'upgradeCard.add_selkie_song.name',
    description: 'upgradeCard.add_selkie_song.description',
    rarity: 'uncommon',
    icon: 'wicon_selkie_song',
    effect: { type: 'add_weapon', weaponKey: 'selkie_song' },
  },
  // DESIGN_IDEAS §5 — Clàrsach (Celtic Harp).
  {
    id: 'add_clarsach',
    name: 'upgradeCard.add_clarsach.name',
    description: 'upgradeCard.add_clarsach.description',
    rarity: 'uncommon',
    icon: 'wicon_clarsach',
    effect: { type: 'add_weapon', weaponKey: 'clarsach' },
  },
  {
    id: 'add_hagstone_sling',
    name: 'upgradeCard.add_hagstone_sling.name',
    description: 'upgradeCard.add_hagstone_sling.description',
    rarity: 'uncommon',
    icon: 'wicon_hagstone_sling',
    effect: { type: 'add_weapon', weaponKey: 'hagstone_sling' },
  },
  // DESIGN_IDEAS §5 — Port-à-Beul (Mouth Music Chant).
  {
    id: 'add_port_a_beul',
    name: 'upgradeCard.add_port_a_beul.name',
    description: 'upgradeCard.add_port_a_beul.description',
    rarity: 'uncommon',
    icon: 'wicon_port_a_beul',
    effect: { type: 'add_weapon', weaponKey: 'port_a_beul' },
  },
  // DESIGN_IDEAS §5 — Flying Porridge Pot (lob_puddle slow+damage zone).
  {
    id: 'add_porridge_pot',
    name: 'upgradeCard.add_porridge_pot.name',
    description: 'upgradeCard.add_porridge_pot.description',
    rarity: 'uncommon',
    icon: 'wicon_porridge_pot',
    effect: { type: 'add_weapon', weaponKey: 'porridge_pot' },
  },
  // DESIGN_IDEAS §5 — Deep-Fried Mars Bar (slow heavy piercing projectile).
  {
    id: 'add_deep_fried_mars_bar',
    name: 'upgradeCard.add_deep_fried_mars_bar.name',
    description: 'upgradeCard.add_deep_fried_mars_bar.description',
    rarity: 'uncommon',
    icon: 'wicon_deep_fried_mars_bar',
    effect: { type: 'add_weapon', weaponKey: 'deep_fried_mars_bar' },
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
  {
    id: 'add_whetstone',
    name: 'upgradeCard.add_whetstone.name',
    description: 'upgradeCard.add_whetstone.description',
    rarity: 'uncommon',
    icon: 'ucard_whetstone',
    effect: { type: 'add_passive', passiveKey: 'whetstone' },
  },
  {
    id: 'add_velvet_antler',
    name: 'upgradeCard.add_velvet_antler.name',
    description: 'upgradeCard.add_velvet_antler.description',
    rarity: 'uncommon',
    icon: 'ucard_velvet_antler',
    effect: { type: 'add_passive', passiveKey: 'velvet_antler' },
  },
  {
    // Wild Living World Phase 2 — Tuning Fork passive (Waulking Mallet
    // evolution pair). Held in-paw, struck once at the start of each
    // sweep so the song aligns to the room. Pairing it with a
    // level-5 Waulking Mallet at chest grants the Pibroch Hammer.
    id: 'add_tuning_fork',
    name: 'upgradeCard.add_tuning_fork.name',
    description: 'upgradeCard.add_tuning_fork.description',
    rarity: 'uncommon',
    icon: 'ucard_tuning_fork',
    effect: { type: 'add_passive', passiveKey: 'tuning_fork' },
  },
  // Highland Horrors — three evolution-paired passives.
  {
    id: 'add_gillies_edge',
    name: 'upgradeCard.add_gillies_edge.name',
    description: 'upgradeCard.add_gillies_edge.description',
    rarity: 'uncommon',
    icon: 'ucard_gillies_edge',
    effect: { type: 'add_passive', passiveKey: 'gillies_edge' },
  },
  {
    id: 'add_widows_shawl',
    name: 'upgradeCard.add_widows_shawl.name',
    description: 'upgradeCard.add_widows_shawl.description',
    rarity: 'uncommon',
    icon: 'ucard_widows_shawl',
    effect: { type: 'add_passive', passiveKey: 'widows_shawl' },
  },
  {
    id: 'add_stirling_medal',
    name: 'upgradeCard.add_stirling_medal.name',
    description: 'upgradeCard.add_stirling_medal.description',
    rarity: 'rare',
    icon: 'ucard_stirling_medal',
    effect: { type: 'add_passive', passiveKey: 'stirling_medal' },
  },
  // Whisky Lob paired passive — Peated Oak.
  {
    id: 'add_peated_oak',
    name: 'upgradeCard.add_peated_oak.name',
    description: 'upgradeCard.add_peated_oak.description',
    rarity: 'uncommon',
    icon: 'ucard_peated_oak',
    effect: { type: 'add_passive', passiveKey: 'peated_oak' },
  },
  // Bagpipe Drone paired passive — Reeds.
  {
    id: 'add_reeds',
    name: 'upgradeCard.add_reeds.name',
    description: 'upgradeCard.add_reeds.description',
    rarity: 'uncommon',
    icon: 'ucard_reeds',
    effect: { type: 'add_passive', passiveKey: 'reeds' },
  },
  // Clootie Rag paired passive — Rowan Thread.
  {
    id: 'add_rowan_thread',
    name: 'upgradeCard.add_rowan_thread.name',
    description: 'upgradeCard.add_rowan_thread.description',
    rarity: 'uncommon',
    icon: 'ucard_rowan_thread',
    effect: { type: 'add_passive', passiveKey: 'rowan_thread' },
  },
  // Cullen Skink Ladle paired passive — Smoked Haddock.
  {
    id: 'add_smoked_haddock',
    name: 'upgradeCard.add_smoked_haddock.name',
    description: 'upgradeCard.add_smoked_haddock.description',
    rarity: 'uncommon',
    icon: 'ucard_smoked_haddock',
    effect: { type: 'add_passive', passiveKey: 'smoked_haddock' },
  },
  // Steam Engine paired passive — Copper Rivet.
  {
    id: 'add_copper_rivet',
    name: 'upgradeCard.add_copper_rivet.name',
    description: 'upgradeCard.add_copper_rivet.description',
    rarity: 'uncommon',
    icon: 'ucard_copper_rivet',
    effect: { type: 'add_passive', passiveKey: 'copper_rivet' },
  },
  {
    id: 'add_drum_hoop',
    name: 'upgradeCard.add_drum_hoop.name',
    description: 'upgradeCard.add_drum_hoop.description',
    rarity: 'uncommon',
    icon: 'ucard_drum_hoop',
    effect: { type: 'add_passive', passiveKey: 'drum_hoop' },
  },
  // Selkie Song paired passive — Seal Pelt. +2 HP regen / sec.
  {
    id: 'add_seal_pelt',
    name: 'upgradeCard.add_seal_pelt.name',
    description: 'upgradeCard.add_seal_pelt.description',
    rarity: 'uncommon',
    icon: 'ucard_seal_pelt',
    effect: { type: 'add_passive', passiveKey: 'seal_pelt' },
  },
  // Clàrsach paired passive — Wire Strings.
  {
    id: 'add_wire_strings',
    name: 'upgradeCard.add_wire_strings.name',
    description: 'upgradeCard.add_wire_strings.description',
    rarity: 'uncommon',
    icon: 'ucard_wire_strings',
    effect: { type: 'add_passive', passiveKey: 'wire_strings' },
  },
  {
    id: 'add_rowan_amulet',
    name: 'upgradeCard.add_rowan_amulet.name',
    description: 'upgradeCard.add_rowan_amulet.description',
    rarity: 'uncommon',
    icon: 'ucard_rowan_amulet',
    effect: { type: 'add_passive', passiveKey: 'rowan_amulet' },
  },
  // Highland Trump — Port-à-Beul evolution passive.
  {
    id: 'add_highland_trump',
    name: 'upgradeCard.add_highland_trump.name',
    description: 'upgradeCard.add_highland_trump.description',
    rarity: 'uncommon',
    icon: 'ucard_highland_trump',
    effect: { type: 'add_passive', passiveKey: 'highland_trump' },
  },
  // Pinhead Oats — Porridge Pot evolution passive.
  {
    id: 'add_pinhead_oats',
    name: 'upgradeCard.add_pinhead_oats.name',
    description: 'upgradeCard.add_pinhead_oats.description',
    rarity: 'common',
    icon: 'ucard_pinhead_oats',
    effect: { type: 'add_passive', passiveKey: 'pinhead_oats' },
  },
  // Batter Mix — Deep-Fried Mars Bar paired passive.
  {
    id: 'add_batter_mix',
    name: 'upgradeCard.add_batter_mix.name',
    description: 'upgradeCard.add_batter_mix.description',
    rarity: 'common',
    icon: 'ucard_batter_mix',
    effect: { type: 'add_passive', passiveKey: 'batter_mix' },
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
// type, no duplicate switch. Amounts are calibrated to roughly 60–80%
// of the pre-cap STAT_CARDS equivalents (was ~half; lifted 2026-05-12
// after playtester reported the level-30 cap felt like a dead-end —
// echoes were technically firing but psychologically a consolation
// prize). They're still echoes, not full level-ups, but each one
// registers as forward motion now.

export const ECHO_CARDS: UpgradeCard[] = [
  {
    id: 'echo_damage',
    name: 'upgradeCard.echo_damage.name',
    description: 'upgradeCard.echo_damage.description',
    rarity: 'common',
    icon: 'ucard_stat_damage',
    effect: { type: 'stat_boost', stat: 'damage', amount: 0.06 },
  },
  {
    id: 'echo_crit',
    name: 'upgradeCard.echo_crit.name',
    description: 'upgradeCard.echo_crit.description',
    rarity: 'common',
    icon: 'ucard_stat_damage',
    effect: { type: 'stat_boost', stat: 'crit', amount: 0.03 },
  },
  {
    id: 'echo_speed',
    name: 'upgradeCard.echo_speed.name',
    description: 'upgradeCard.echo_speed.description',
    rarity: 'common',
    icon: 'ucard_stat_speed',
    effect: { type: 'stat_boost', stat: 'speed', amount: 0.05 },
  },
  {
    id: 'echo_hp',
    name: 'upgradeCard.echo_hp.name',
    description: 'upgradeCard.echo_hp.description',
    rarity: 'common',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'maxHp', amount: 8 },
  },
  {
    id: 'echo_pickup',
    name: 'upgradeCard.echo_pickup.name',
    description: 'upgradeCard.echo_pickup.description',
    rarity: 'common',
    icon: 'ucard_stat_pickup',
    effect: { type: 'stat_boost', stat: 'pickup', amount: 10 },
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
    effect: { type: 'stat_boost', stat: 'cooldown', amount: 0.05 },
  },
  {
    id: 'echo_lifesteal',
    name: 'upgradeCard.echo_lifesteal.name',
    description: 'upgradeCard.echo_lifesteal.description',
    rarity: 'rare',
    icon: 'ucard_stat_health',
    effect: { type: 'stat_boost', stat: 'lifesteal', amount: 0.5 },
  },
];

const LEVELUP_DRIFT_CARD_ENABLED = true;

/** Extra context for pool building. New in U1 (rune tier). */
export interface BuildCardPoolContext {
  /** True once ANY boss has been killed this run — unlocks rune tier. */
  readonly bossKilledThisRun?: boolean;
  /** Rune ids already owned this run (filtered from draw). */
  readonly ownedRuneIds?: readonly string[];
  /** Test override for rune card pool inclusion. */
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

  // Rune tier — live after at least one boss kill. The explicit context
  // override keeps the pure pool logic testable without coupling tests to
  // the global rollout constant.
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
