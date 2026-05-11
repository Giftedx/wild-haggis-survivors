/**
 * Lazy per-variant atlas bake helpers (imperative side; key enumeration
 * lives in `variantAtlasKeys.ts` to stay Phaser-free).
 *
 * Background: BootScene used to eagerly bake every variant atlas at boot
 * (15 variants × 19 haggis frames + 15 variants × 19 kilt frames + the
 * non-variant accessories + 15 variants × 2 mantle tiers). That measured
 * ~210ms of GPU/CPU work on the critical-path boot just for the
 * variant-scoped families, with another ~213ms baking enemies — so total
 * bake landed around 430ms, well over ADR-0005's 200ms aspirational
 * threshold and triggering the descope clause the ADR pre-authorised:
 *
 *   > "If the precache exceeds 2.5 MB or bake time exceeds 200 ms,
 *    descope to on-demand (per-variant) bakes triggered when a variant is
 *    selected."  — docs/adr/0005-skeletal-animation-rig.md
 *
 * This module owns the descope. Boot now bakes only the non-variant
 * accessories (one-time, can't be variant-deferred), the default variant
 * (so HUD/preview/quickplay always works), and the saved selected variant
 * (so a returning player's chosen archetype is warm before they hit Play).
 *
 * Everything else is baked lazily via `ensureVariantAtlas(scene, key)` —
 * called by `GameScene.create()` right after the active variant is
 * resolved, and idempotent so a re-pick or replay swap is free.
 */

import type * as Phaser from 'phaser';
import { type VariantKey, getVariantByKey, VARIANTS } from '../../data/variants';
import { ALL_ANIMATION_STATES, allAtlasKeysForVariant } from '../../animation/textureAtlas';
import { getFrameCountForState } from '../../animation/frameClock';
import { drawHaggisFrame, getHaggisSpriteSize } from '../../animation/frameDrawers/haggisFrames';
import { CLASSIC_VARIANT } from '../../art/palettes';
import type { AnimationState } from '../../animation/animationStates';
import { ACCESSORY_REGISTRY } from '../../entities/haggisComposition/accessoryRegistry';
import { drawMantleTier } from '../../art/sprites/haggisMantle';
import { applyOutline } from '../../art/outlinePostProcess';
import { getAllAnimatedEnemyDrawers } from '../../animation/frameDrawers/enemies/enemyFrameRegistry';
import { selectKeysNeedingBake } from './variantAtlasKeys';

export interface BakeReport {
  readonly variantKey: VariantKey;
  readonly bakedHaggis: number;
  readonly bakedAccessories: number;
  readonly bakedMantle: number;
  readonly skipped: boolean;
  readonly totalMs: number;
}

const MANTLE_TIERS: ReadonlyArray<1 | 2> = [1, 2];

/**
 * Parse the (state, frame) coordinates out of a haggis atlas key. The
 * variant slug can contain underscores ('peerie_shetlander', 'witch_hare'),
 * so we anchor on the last two tokens — same approach BootScene used to
 * use inline.
 */
function parseAtlasKeyTail(key: string): { state: AnimationState; frame: number } {
  const parts = key.split('_');
  const frame = Number(parts[parts.length - 1]);
  const state = parts[parts.length - 2] as AnimationState;
  return { state, frame };
}

/**
 * Idempotent: bake the haggis body atlas for one variant. Skips keys
 * already present in the texture cache so a re-call (e.g. variant swap
 * during a replay) is a no-op. Returns the number of textures actually
 * generated.
 */
export function bakeHaggisAtlasForVariant(
  scene: Phaser.Scene,
  variantKey: VariantKey,
): number {
  const size = getHaggisSpriteSize();
  const candidate = allAtlasKeysForVariant('haggis', variantKey);
  const needsBake = selectKeysNeedingBake(candidate, (k) => scene.textures.exists(k));
  for (const key of needsBake) {
    const { state, frame } = parseAtlasKeyTail(key);
    const g = scene.add.graphics();
    drawHaggisFrame(g, {
      variantPalette: CLASSIC_VARIANT,
      state,
      frame,
      variantKey,
    });
    g.generateTexture(key, size, size);
    g.destroy();
    applyOutline(scene, key, size, size);
  }
  return needsBake.length;
}

/**
 * Idempotent: bake every variant-aware accessory atlas for one variant
 * (kilt only, today — the registry can grow without changing the
 * helper). Skips keys already in cache.
 */
export function bakeVariantAccessoryAtlasForVariant(
  scene: Phaser.Scene,
  variantKey: VariantKey,
): number {
  let baked = 0;
  for (const drawer of Object.values(ACCESSORY_REGISTRY)) {
    if (!drawer.variantAware) continue;
    const authored = new Set<AnimationState>(drawer.authoredStates);
    for (const state of ALL_ANIMATION_STATES) {
      const frameCount = getFrameCountForState(state);
      for (let frame = 0; frame < frameCount; frame++) {
        const key = `${drawer.id}_${variantKey}_${state}_${frame}`;
        if (scene.textures.exists(key)) continue;
        const g = scene.add.graphics();
        const ctx = authored.has(state)
          ? { variantPalette: CLASSIC_VARIANT, state, frame, variantKey }
          : { variantPalette: CLASSIC_VARIANT, state: 'idle' as AnimationState, frame: 0, variantKey };
        drawer.draw(g, ctx);
        g.generateTexture(key, 80, 80);
        g.destroy();
        applyOutline(scene, key, 80, 80);
        baked++;
      }
    }
  }
  return baked;
}

/**
 * Idempotent: bake every NON-variant-aware accessory (tam, sporran,
 * shield, etc.) once per session. BootScene calls this exactly once on
 * the cold path; subsequent variant swaps don't re-touch these.
 */
export function bakeNonVariantAccessoryAtlas(scene: Phaser.Scene): number {
  let baked = 0;
  for (const drawer of Object.values(ACCESSORY_REGISTRY)) {
    if (drawer.variantAware) continue;
    const authored = new Set<AnimationState>(drawer.authoredStates);
    for (const state of ALL_ANIMATION_STATES) {
      const frameCount = getFrameCountForState(state);
      for (let frame = 0; frame < frameCount; frame++) {
        const key = `${drawer.id}_${state}_${frame}`;
        if (scene.textures.exists(key)) continue;
        const g = scene.add.graphics();
        const ctx = authored.has(state)
          ? { variantPalette: CLASSIC_VARIANT, state, frame, variantKey: undefined }
          : { variantPalette: CLASSIC_VARIANT, state: 'idle' as AnimationState, frame: 0, variantKey: undefined };
        drawer.draw(g, ctx);
        g.generateTexture(key, 80, 80);
        g.destroy();
        applyOutline(scene, key, 80, 80);
        baked++;
      }
    }
  }
  return baked;
}

/**
 * Idempotent: bake the haggis mantle overlay (tiers 1 + 2) for one
 * variant. Tier 0 is intentionally not baked — the overlay sprite stays
 * hidden until tier 1 is reached.
 */
export function bakeMantleAtlasForVariant(
  scene: Phaser.Scene,
  variantKey: VariantKey,
): number {
  const size = getHaggisSpriteSize();
  const variant = getVariantByKey(variantKey);
  let baked = 0;
  for (const tier of MANTLE_TIERS) {
    const key = `mantle_${variantKey}_${tier}`;
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics();
    drawMantleTier(g, variant, tier);
    g.generateTexture(key, size, size);
    g.destroy();
    baked++;
  }
  return baked;
}

/**
 * Public entry point used by BootScene + GameScene + the sprite-export
 * tool. Idempotent: a second call is a no-op (returns skipped: true).
 *
 * Caller is expected to invoke this BEFORE any code path that consumes
 * the variant's atlas (Player construction is the canonical site —
 * AnimationController calls `sprite.setTexture(atlasKey(...))` on
 * construction).
 */
export function ensureVariantAtlas(
  scene: Phaser.Scene,
  variantKey: VariantKey,
): BakeReport {
  const startMs = performance.now();
  const bakedHaggis = bakeHaggisAtlasForVariant(scene, variantKey);
  const bakedAccessories = bakeVariantAccessoryAtlasForVariant(scene, variantKey);
  const bakedMantle = bakeMantleAtlasForVariant(scene, variantKey);
  const totalMs = performance.now() - startMs;
  const skipped = bakedHaggis === 0 && bakedAccessories === 0 && bakedMantle === 0;
  return { variantKey, bakedHaggis, bakedAccessories, bakedMantle, skipped, totalMs };
}

/**
 * Force-bake every variant. Reserved for the `?export` sprite tool,
 * which composites the full atlas into a single PNG and therefore needs
 * the cache fully warm. Production boot never calls this.
 */
export function ensureAllVariantAtlases(scene: Phaser.Scene): BakeReport[] {
  return VARIANTS.map((variant) => ensureVariantAtlas(scene, variant.key));
}

/**
 * Bake every registered animated enemy's atlas (every state × frame).
 * Not variant-scoped — enemies look the same across player variants —
 * so this runs once per session from BootScene. Idempotent: keys
 * already in cache are skipped (matches the variant family's idempotency
 * contract so the helper is uniformly safe to recall).
 */
export function bakeEnemyAtlas(scene: Phaser.Scene): number {
  const drawers = getAllAnimatedEnemyDrawers();
  let baked = 0;
  for (const drawer of drawers) {
    const size = drawer.canvasSize;
    for (const state of ALL_ANIMATION_STATES) {
      const frameCount = getFrameCountForState(state);
      for (let frame = 0; frame < frameCount; frame++) {
        const key = `${drawer.enemyKey}_${state}_${frame}`;
        if (scene.textures.exists(key)) continue;
        const g = scene.add.graphics();
        const bodyFrame = drawer.authoredStates.has(state)
          ? drawer.getFrame(state, frame)
          : drawer.getFrame('idle', 0);
        drawer.draw(g, bodyFrame);
        g.generateTexture(key, size, size);
        g.destroy();
        applyOutline(scene, key, size, size);
        baked++;
      }
    }
  }
  return baked;
}
