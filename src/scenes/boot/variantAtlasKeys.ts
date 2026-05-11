/**
 * Pure key-enumeration core for the lazy variant atlas bake (see
 * `variantAtlasBaker.ts` for the imperative side). Kept Phaser-free so
 * it can be imported under vitest's node env — the imperative bake
 * module pulls in `applyOutline` which transitively touches `phaser`,
 * and Phaser crashes on `window` at module eval time outside a browser.
 */

import { allAtlasKeysForVariant, ALL_ANIMATION_STATES } from '../../animation/textureAtlas';
import { getFrameCountForState } from '../../animation/frameClock';
import { ACCESSORY_REGISTRY } from '../../entities/haggisComposition/accessoryRegistry';
import { type VariantKey } from '../../data/variants';

const MANTLE_TIERS: ReadonlyArray<1 | 2> = [1, 2];

/**
 * Enumerate every atlas key owned by `variantKey`'s slice of the three
 * variant-scoped atlas families (haggis body, variant-aware accessories,
 * mantle overlay). Non-variant accessories are excluded — they live in
 * `enumerateNonVariantAccessoryKeys()`.
 */
export function enumerateVariantAtlasKeys(variantKey: VariantKey): {
  readonly haggis: ReadonlyArray<string>;
  readonly accessories: ReadonlyArray<string>;
  readonly mantle: ReadonlyArray<string>;
} {
  const haggis = allAtlasKeysForVariant('haggis', variantKey);

  const accessories: string[] = [];
  for (const drawer of Object.values(ACCESSORY_REGISTRY)) {
    if (!drawer.variantAware) continue;
    for (const state of ALL_ANIMATION_STATES) {
      const frameCount = getFrameCountForState(state);
      for (let frame = 0; frame < frameCount; frame++) {
        accessories.push(`${drawer.id}_${variantKey}_${state}_${frame}`);
      }
    }
  }

  const mantle = MANTLE_TIERS.map((tier) => `mantle_${variantKey}_${tier}`);

  return { haggis, accessories, mantle };
}

/**
 * Enumerate every atlas key for the accessories that are NOT
 * variant-aware. These bake once per session regardless of which
 * variants the player ever selects, so BootScene owns the call.
 */
export function enumerateNonVariantAccessoryKeys(): ReadonlyArray<string> {
  const out: string[] = [];
  for (const drawer of Object.values(ACCESSORY_REGISTRY)) {
    if (drawer.variantAware) continue;
    for (const state of ALL_ANIMATION_STATES) {
      const frameCount = getFrameCountForState(state);
      for (let frame = 0; frame < frameCount; frame++) {
        out.push(`${drawer.id}_${state}_${frame}`);
      }
    }
  }
  return out;
}

/**
 * Given a list of candidate keys and a `textureExists` predicate, return
 * the subset that needs baking. Used by the imperative bake routines to
 * skip already-warm cache entries (idempotency) and by unit tests to
 * verify cold/warm behavior without touching the Phaser cache.
 */
export function selectKeysNeedingBake(
  keys: ReadonlyArray<string>,
  textureExists: (key: string) => boolean,
): ReadonlyArray<string> {
  return keys.filter((key) => !textureExists(key));
}
