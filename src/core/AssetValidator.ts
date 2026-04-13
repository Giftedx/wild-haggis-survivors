import Phaser from 'phaser';
import { EVOLUTION_RECIPES } from './BalanceConfig';
import { BOSSES, ENEMY_TYPES } from '../data/enemies';
import { PASSIVE_CARDS, STAT_CARDS, WEAPON_CARDS } from '../data/upgrades';
import { VARIANTS } from '../data/variants';
import { WEAPON_DEFS } from '../data/weapons';

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
  ] as const) {
    pushKey(out, seen, 'fx', k.id, k.key);
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
