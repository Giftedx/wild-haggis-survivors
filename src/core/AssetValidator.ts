import * as Phaser from 'phaser';
import { EVOLUTION_RECIPES } from './BalanceConfig';
import { BOSSES, ENEMY_TYPES } from '../data/enemies';
import { PASSIVE_CARDS, STAT_CARDS, WEAPON_CARDS } from '../data/upgrades';
import { VARIANTS } from '../data/variants';
import { WEAPON_DEFS } from '../data/weapons';
import { RELICS } from '../data/relics';
import { WILDLIFE_DEFS } from '../data/wildlife';

/** Internal texture used as source for missing-key aliases (magenta checkerboard). */
export const MISSING_PLACEHOLDER_KEY = '__whs_missing_texture__';

export type TextureRequirement = {
  category: string;
  id: string;
  key: string;
};

function pushKey(
  out: TextureRequirement[],
  seen: Set<string>,
  category: string,
  id: string,
  key: string
): void {
  if (!key || seen.has(key)) return;
  seen.add(key);
  out.push({ category, id, key });
}

/**
 * All texture keys that gameplay + UI expect to exist after `BootScene` generation.
 * Keeps data-driven keys aligned with `BootScene.generateAllTextures()`.
 */
export function collectRequiredTextureRequirements(): TextureRequirement[] {
  const out: TextureRequirement[] = [];
  const seen = new Set<string>();

  for (const e of Object.values(ENEMY_TYPES)) {
    pushKey(out, seen, 'enemy', e.key, e.texture);
  }
  for (const b of BOSSES) {
    pushKey(out, seen, 'boss', b.key, b.texture);
  }

  for (const k of ['thistle', 'caber', 'haggis_ball', 'shinty_ball'] as const) {
    pushKey(out, seen, 'projectile', k, k);
  }

  for (const key of Object.keys(WEAPON_DEFS)) {
    pushKey(out, seen, 'weapon_hud', key, `wicon_${key}`);
  }
  for (const r of EVOLUTION_RECIPES) {
    pushKey(out, seen, 'weapon_hud_evo', r.evolvedWeapon, `wicon_${r.evolvedWeapon}`);
  }

  for (const v of VARIANTS) {
    pushKey(out, seen, 'player_variant', v.key, v.textureKey);
  }

  for (const k of [
    'player_mood_idle_blink',
    'player_mood_hurt_flinch',
    'player_mood_low_hp',
    'player_mood_level_up',
    'player_mood_dash_smear',
    'player_mood_victory_bounce',
    'player_mood_coorie_rest',
    'player_mood_determined',
  ] as const) {
    pushKey(out, seen, 'player_mood', k, k);
  }

  for (const w of Object.values(WILDLIFE_DEFS)) {
    pushKey(out, seen, 'wildlife', `${w.key}_idle`, w.spriteKeyIdle);
    pushKey(out, seen, 'wildlife', `${w.key}_move`, w.spriteKeyMove);
  }

  for (const relic of Object.values(RELICS)) {
    pushKey(out, seen, 'relic_icon', relic.key, relic.iconSprite);
  }

  for (const p of [
    { id: 'xp_gem', key: 'xp_gem' },
    { id: 'health_orb', key: 'health_orb' },
    { id: 'chest', key: 'chest' },
  ] as const) {
    pushKey(out, seen, 'pickup', p.id, p.key);
  }

  for (const k of [
    'entity_shadow',
    'boss_shadow',
    'deco_thistle',
    'deco_rock',
    'deco_heather',
  ] as const) {
    pushKey(out, seen, 'aux', k, k);
  }

  for (const k of [
    { id: 'hud_shield', key: 'hud_shield' },
    { id: 'hud_dash_pip_full', key: 'hud_dash_pip_full' },
    { id: 'hud_dash_pip_empty', key: 'hud_dash_pip_empty' },
  ] as const) {
    pushKey(out, seen, 'hud', k.id, k.key);
  }

  for (const k of [
    { id: 'fx_snowflake', key: 'fx_snowflake' },
    // Round 2 additions (2026-04-27) — projectile trails, death bursts,
    // weather kit. Not yet consumed by gameplay systems but locked in
    // so a future bake-orchestrator drop is caught at boot validation.
    { id: 'fx_trail_thistle', key: 'fx_trail_thistle' },
    { id: 'fx_trail_caber', key: 'fx_trail_caber' },
    { id: 'fx_trail_haggis', key: 'fx_trail_haggis' },
    { id: 'fx_enemy_burst_small', key: 'fx_enemy_burst_small' },
    { id: 'fx_enemy_burst_medium', key: 'fx_enemy_burst_medium' },
    { id: 'fx_enemy_burst_large', key: 'fx_enemy_burst_large' },
    { id: 'fx_rain_drop', key: 'fx_rain_drop' },
    { id: 'fx_drizzle', key: 'fx_drizzle' },
    { id: 'fx_sun_shaft', key: 'fx_sun_shaft' },
    { id: 'fx_aurora_band', key: 'fx_aurora_band' },
    { id: 'fx_lambing_mote', key: 'fx_lambing_mote' },
    { id: 'fx_harvest_sheaf', key: 'fx_harvest_sheaf' },
    { id: 'fx_stonehaven_fireball', key: 'fx_stonehaven_fireball' },
    { id: 'fx_bracken_leaf', key: 'fx_bracken_leaf' },
    { id: 'fx_bannockburn_dust', key: 'fx_bannockburn_dust' },
    { id: 'fx_grouse_feather', key: 'fx_grouse_feather' },
    { id: 'fx_weapon_thistle_bloom', key: 'fx_weapon_thistle_bloom' },
    { id: 'fx_weapon_thistle_storm_bloom', key: 'fx_weapon_thistle_storm_bloom' },
    { id: 'fx_weapon_caber_splinter', key: 'fx_weapon_caber_splinter' },
    { id: 'fx_weapon_highland_games_burst', key: 'fx_weapon_highland_games_burst' },
    { id: 'fx_weapon_bagpipe_note', key: 'fx_weapon_bagpipe_note' },
    { id: 'fx_weapon_bagpipe_blast_ring', key: 'fx_weapon_bagpipe_blast_ring' },
    { id: 'fx_weapon_bagpipes_drone_knot', key: 'fx_weapon_bagpipes_drone_knot' },
    { id: 'fx_weapon_highland_fling_ring', key: 'fx_weapon_highland_fling_ring' },
    { id: 'fx_weapon_scotch_mist_wisp', key: 'fx_weapon_scotch_mist_wisp' },
    { id: 'fx_weapon_the_haar_bank', key: 'fx_weapon_the_haar_bank' },
    { id: 'fx_weapon_haggis_oat_puff', key: 'fx_weapon_haggis_oat_puff' },
    { id: 'fx_weapon_haggis_cannon_pop', key: 'fx_weapon_haggis_cannon_pop' },
    { id: 'fx_weapon_nessie_splash', key: 'fx_weapon_nessie_splash' },
    { id: 'fx_weapon_nessie_unleashed_crest', key: 'fx_weapon_nessie_unleashed_crest' },
    { id: 'fx_weapon_claymore_spark', key: 'fx_weapon_claymore_spark' },
    { id: 'fx_weapon_william_blade_wave', key: 'fx_weapon_william_blade_wave' },
    { id: 'fx_weather_haar_puff', key: 'fx_weather_haar_puff' },
    { id: 'fx_weather_smirr_cluster', key: 'fx_weather_smirr_cluster' },
    { id: 'fx_weather_bog_bubble', key: 'fx_weather_bog_bubble' },
    { id: 'fx_weather_loch_ripple_wide', key: 'fx_weather_loch_ripple_wide' },
    { id: 'fx_weather_peat_smoke', key: 'fx_weather_peat_smoke' },
    { id: 'fx_weather_wind_leaf', key: 'fx_weather_wind_leaf' },
    { id: 'fx_weather_bracken_turn_leaf', key: 'fx_weather_bracken_turn_leaf' },
    { id: 'fx_weather_frost_star', key: 'fx_weather_frost_star' },
    { id: 'fx_weather_midge_glimmer', key: 'fx_weather_midge_glimmer' },
    { id: 'fx_weather_moon_mist', key: 'fx_weather_moon_mist' },
    { id: 'fx_telegraph_elite_swirl', key: 'fx_telegraph_elite_swirl' },
    { id: 'fx_telegraph_curse_seal', key: 'fx_telegraph_curse_seal' },
    { id: 'fx_telegraph_aoe_gold', key: 'fx_telegraph_aoe_gold' },
    { id: 'fx_telegraph_dash_red', key: 'fx_telegraph_dash_red' },
    { id: 'fx_telegraph_projectile_blue', key: 'fx_telegraph_projectile_blue' },
    { id: 'fx_telegraph_fey_hex', key: 'fx_telegraph_fey_hex' },
    { id: 'fx_telegraph_loch_ripple', key: 'fx_telegraph_loch_ripple' },
    { id: 'fx_telegraph_urban_flicker', key: 'fx_telegraph_urban_flicker' },
  ] as const) {
    pushKey(out, seen, 'fx', k.id, k.key);
  }

  // Round 2 additions — croft visitors (postie / neighbour / weans /
  // standing sheepdog / returning pal). NPCs available to CroftScene
  // for between-run warmth; locked in so the orchestrator wiring can't
  // silently regress.
  for (const k of [
    'croft_postie_f0',
    'croft_postie_f1',
    'croft_neighbour_f0',
    'croft_neighbour_f1',
    'croft_weans',
    'croft_sheepdog_stand_f0',
    'croft_sheepdog_stand_f1',
    'croft_stoat_stand_f0',
    'croft_stoat_stand_f1',
    'croft_eagle_perch_f0',
    'croft_eagle_perch_f1',
    'croft_kelpie_foal_f0',
    'croft_kelpie_foal_f1',
    'croft_returning_pal',
    'croft_rain_window',
    'croft_brownie_bowl',
    'croft_field_guide',
    'croft_gran_radio',
    'croft_tartan_blanket',
    'croft_family_photo',
    'croft_boots_by_door',
    'croft_seed_tray',
    'croft_knitting_basket',
    'croft_hearth_rowan_charm',
  ] as const) {
    pushKey(out, seen, 'croft', k, k);
  }

  // Round 2 additions — urban Glasgow props, biome hazards, seasonal
  // moor decorations. World-dressing pool for FloraScatter / hazard
  // system to draw from.
  for (const k of [
    'deco_chippy_sign',
    'deco_bus_stop',
    'deco_newsprint',
    'deco_close_door',
    'deco_scaffold_post',
    'hazard_peat_pit',
    'hazard_falling_slate',
    'hazard_burn_water',
    'hazard_loose_scree',
    'hazard_tidal_wrack',
    // B5 Phase 1 — Seawrack/Coastal flora authored sprites.
    'deco_kelp_strand',
    // (backfill) B6 Highland Horrors hazards were shipped without validator
    // entries — lock them now so a future bake removal is caught.
    'hazard_wind_shear',
    'hazard_highland_mist',
    'deco_barnacle_rock',
    'deco_whelk_shell',
    'deco_foam_line',
    // B5 Phase 1b — Haar/Fog flora + hazard authored sprites.
    'hazard_slick_cobble',
    'deco_fog_pier',
    'deco_dripping_heather',
    // B5 Phase 2 — Frost flora + hazard authored sprites.
    'hazard_rime_patch',
    'deco_snow_patch',
    'deco_bare_birch',
    'deco_rime_bracken',
    'deco_ptarmigan_print',
    // deco_antler_shed already authored (sprites/decorations/antlerShed.ts)
    // — used by frost STORY_PROPS_BY_BIOME, but not previously
    // validator-locked. Lock it now so removing the bake is caught.
    'deco_antler_shed',
    'deco_autumn_leaves',
    'deco_spring_shoot',
    'deco_thaw_puddle',
    'deco_winter_snowcap',
    'deco_summer_barley',
    'deco_waymarker_post',
    'deco_pictish_stone',
    'deco_ruined_croft',
    'deco_clootie_ribbons',
    'deco_fairy_ring',
    'deco_selkie_skin',
    'deco_pech_tools',
    'deco_catsith_saucer',
    'deco_brahan_eye_stone',
    'deco_burns_scrap',
    'deco_milestone',
    'deco_bridge_plank',
    'deco_peat_spade',
    'deco_fishing_net',
    'deco_salmon_leap',
    'deco_standing_stone_glyph',
    'deco_washer_cloth',
    'deco_rowan_charm',
    'deco_crannog_stake',
    'deco_machair_shell',
    // Clyde Shipyard hazard.
    'hazard_molten_slag',
    // Black Bog hazard.
    'hazard_ink_pool',
  ] as const) {
    pushKey(out, seen, 'decoration', k, k);
  }

  for (const k of [
    'pickup_gold_coin',
    'pickup_chest_hearth',
    'pickup_chest_fey',
    'pickup_chest_legendary',
    'pickup_health_thistle',
    'pickup_xp_heather',
    'pickup_xp_loch',
    'pickup_oatcake_glow',
    'pickup_polaroid',
  ] as const) {
    pushKey(out, seen, 'pickup_variant', k, k);
  }

  // Round 2 additions — UI ornament: 4 rarity card frames + 3 banter
  // corner ornaments + toast parchment.
  for (const k of [
    'ui_card_frame_common',
    'ui_card_frame_uncommon',
    'ui_card_frame_rare',
    'ui_card_frame_legendary',
    'ui_card_frame_mythic',
    'ui_card_frame_rune',
    'ui_banter_corner_hearth',
    'ui_banter_corner_edge',
    'ui_banter_corner_fey',
    'ui_toast_frame',
  ] as const) {
    pushKey(out, seen, 'ui', k, k);
  }

  for (const k of [
    'hud_status_burn',
    'hud_status_frost',
    'hud_status_poison',
    'hud_status_elite',
    'hud_status_cursed',
    'hud_status_boss_phase',
    'hud_status_relic_full',
    'hud_status_route',
    'hud_status_warning',
    'hud_status_comfort',
  ] as const) {
    pushKey(out, seen, 'hud_status', k, k);
  }

  for (const arr of [WEAPON_CARDS, PASSIVE_CARDS, STAT_CARDS]) {
    for (const c of arr) {
      pushKey(out, seen, 'upgrade_card', c.id, c.icon);
    }
  }

  return out;
}

export type TextureExistsFn = (key: string) => boolean;

export function findMissingTextureKeys(
  exists: TextureExistsFn,
  requirements: readonly TextureRequirement[] = collectRequiredTextureRequirements()
): TextureRequirement[] {
  return requirements.filter((r) => !exists(r.key));
}

const LOG_PREFIX = '[WHS ASSET ERROR]';

export function logMissingTextureErrors(missing: readonly TextureRequirement[]): void {
  for (const m of missing) {
    console.error(
      `${LOG_PREFIX} Missing texture "${m.key}" (${m.category} / ${m.id}). ` +
        'Add it in BootScene or fix the config key before shipping.'
    );
  }
}

export function ensureCheckerboardPlaceholder(scene: Phaser.Scene): void {
  const tm = scene.textures;
  if (tm.exists(MISSING_PLACEHOLDER_KEY)) return;
  const s = 32;
  const g = scene.add.graphics();
  const c1 = 0xff00ff;
  const c2 = 0x000000;
  const t = 4;
  for (let y = 0; y < s; y += t) {
    for (let x = 0; x < s; x += t) {
      g.fillStyle((x / t + y / t) % 2 === 0 ? c1 : c2, 1);
      g.fillRect(x, y, t, t);
    }
  }
  g.generateTexture(MISSING_PLACEHOLDER_KEY, s, s);
  g.destroy();
}

/** Registers each missing key as a copy of the checkerboard placeholder so `setTexture` cannot crash mid-run. */
export function aliasMissingKeysToPlaceholder(scene: Phaser.Scene, keys: readonly string[]): void {
  if (keys.length === 0) return;
  ensureCheckerboardPlaceholder(scene);
  const tm = scene.textures;
  const src = tm.get(MISSING_PLACEHOLDER_KEY).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  for (const key of keys) {
    if (tm.exists(key)) continue;
    tm.addImage(key, src as HTMLImageElement);
  }
}

/**
 * Boot-time guard: log missing balance/Boot mismatches and alias placeholders so QA still runs.
 * Call from `BootScene.create()` immediately after textures are generated.
 */
export function validateAndRepairBootTextures(scene: Phaser.Scene): {
  missing: TextureRequirement[];
  placeholderAliases: number;
} {
  const reqs = collectRequiredTextureRequirements();
  const missing = findMissingTextureKeys((k) => scene.textures.exists(k), reqs);
  if (missing.length === 0) {
    return { missing: [], placeholderAliases: 0 };
  }
  logMissingTextureErrors(missing);
  const keys = missing.map((m) => m.key);
  aliasMissingKeysToPlaceholder(scene, keys);
  return { missing, placeholderAliases: keys.length };
}
