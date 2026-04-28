/**
 * Texture-existence-guarded wrappers around `scene.add.image` and
 * `scene.add.sprite`. Returns `null` when the texture key isn't
 * registered with the scene's TextureManager.
 *
 * CLAUDE.md "new-system safety pattern checklist" item (c) mandates
 * that every `scene.add.image` / `scene.add.sprite` site be guarded
 * so unit-test stubs that skip BootScene baking don't render the
 * magenta missing-texture placeholder. Many sites already inline a
 * `scene.textures.exists()` check before the add call; this helper
 * centralises the pattern so new sites can adopt one canonical form
 * and missed guards are easier to grep for (`safeAddImage|safeAddSprite`
 * vs the noisier `scene.add.image|sprite` audit).
 *
 * Pure adapter — no caching, no side effects. Safe to call across
 * scene resets; the texture-existence check is per-scene state read.
 *
 * Adoption status (2026-04-28): seeded by FloraScatter +
 * WildlifeSystem refactors. Other sites continue to use their own
 * inline guards — those can migrate over time. New code should prefer
 * this helper over inlining the OR.
 */
import type * as Phaser from 'phaser';

export function safeAddImage(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
): Phaser.GameObjects.Image | null {
  if (!scene.textures.exists(key)) return null;
  return scene.add.image(x, y, key);
}

export function safeAddSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
): Phaser.GameObjects.Sprite | null {
  if (!scene.textures.exists(key)) return null;
  return scene.add.sprite(x, y, key);
}
