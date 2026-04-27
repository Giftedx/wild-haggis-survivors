import * as Phaser from 'phaser';
import { EVOLUTION_RECIPES } from './BalanceConfig';
import { BOSSES, ENEMY_TYPES } from '../data/enemies';
import { PASSIVE_CARDS, STAT_CARDS, WEAPON_CARDS } from '../data/upgrades';
import { VARIANTS } from '../data/variants';
import { WEAPON_DEFS } from '../data/weapons';
import { RELICS } from '../data/relics';

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

  for (const k of ['thistle', 'caber', 'haggis_ball'] as const) {
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
    'croft_returning_pal',
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
    'deco_autumn_leaves',
    'deco_spring_shoot',
    'deco_thaw_puddle',
  ] as const) {
    pushKey(out, seen, 'decoration', k, k);
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
