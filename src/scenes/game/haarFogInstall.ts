/**
 * F1 M5 — Haar fog camera filter install + biome-driven density tween.
 *
 * Phase 5 helper extract from GameScene.installHaarFog +
 * handleBiomeEnteredForHaar. WebGL-only — Canvas renderer silently
 * runs without haar (the camera has no `filters` plug). The catch
 * around `new HaarFogController` is load-bearing: pre-WebGL2 contexts
 * fail in the controller's shader compile path; we want the run to
 * continue without haar in that case rather than crash.
 *
 * The biome handler tween targets the controller's `state` object
 * (density). `killTweensOf` clears any prior tween so consecutive
 * biome crossings don't compound. `getSettingsManager` is read at
 * call time so a mid-run accessibility toggle takes effect immediately.
 */
import * as Phaser from 'phaser';
import { HaarFogController } from '../../systems/shaders/HaarFogController';
import { biomeHaarTarget } from '../../systems/shaders/biomeHaar';
import { DEFAULT_HAAR_TRANSITION } from '../../systems/shaders/haarTransition';
import { getSettingsManager } from '../../core/SettingsManager';
import type { BiomeId } from '../../data/biomes';

/** Mounts a persistent HaarFogController on the scene's main camera.
 *  Returns the controller, or `null` when the renderer isn't WebGL or
 *  the shader compile failed. Idempotent across scene reuse: caller is
 *  expected to call this fresh each `create()`; teardown is handled by
 *  the camera filter list when the scene shuts down. */
export function installHaarFog(scene: Phaser.Scene): HaarFogController | null {
  if (scene.sys.game.renderer.type !== Phaser.WEBGL) return null;
  const cam = scene.cameras.main;
  const filters = cam.filters;
  if (!filters) return null;
  try {
    const haar = new HaarFogController(cam, { density: 0 });
    filters.internal.add(haar);
    return haar;
  } catch {
    return null;
  }
}

/** Tween the haar density to the biome-appropriate target.
 *  No-op when `haarFog` is null (Canvas renderer / shader compile
 *  failed / WebGL not available). */
export function handleBiomeEnteredForHaar(
  scene: Phaser.Scene,
  haarFog: HaarFogController | null,
  biome: BiomeId,
): void {
  if (!haarFog) return;
  const { motionScale, reduceParticles, reduceFlashing } = getSettingsManager().load();
  const target = biomeHaarTarget({ motionScale, reduceParticles, reduceFlashing }, biome);
  scene.tweens.killTweensOf(haarFog.state);
  scene.tweens.add({
    targets: haarFog.state,
    density: target,
    duration: DEFAULT_HAAR_TRANSITION.rampInMs,
    ease: 'Sine.easeInOut',
  });
}
