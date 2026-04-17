import Phaser from 'phaser';

/**
 * Shared scene fade-in / fade-out helpers. Several non-gameplay
 * scenes open on a full-screen dark wash and fade it to 0 so the
 * content reveals softly; the same scenes leave by fading a black
 * wash UP to 1 then swapping to the target scene.
 *
 * Pulling the two helpers into one module enforces the shared
 * fade colour (0x1a1a2e, a very dark navy that matches the menu
 * backdrop) and lets individual scenes choose only their duration.
 */

/** Full-screen fade rectangle colour — dark navy matching the menu backdrop. */
export const SCENE_FADE_COLOR = 0x1a1a2e;
/** Depth of the fade rectangle — sits above any scene-content depth. */
export const SCENE_FADE_DEPTH = 999;

/**
 * Draw a full-screen dark rectangle at alpha 1 and tween to 0 over
 * `durationMs`, destroying the rectangle on complete. Call from a
 * scene's create() for a soft reveal.
 */
export function addSceneFadeIn(scene: Phaser.Scene, durationMs: number = 360): void {
  const { width, height } = scene.scale;
  const fade = scene.add
    .rectangle(width / 2, height / 2, width, height, SCENE_FADE_COLOR, 1)
    .setDepth(SCENE_FADE_DEPTH);
  scene.tweens.add({
    targets: fade,
    alpha: 0,
    duration: durationMs,
    onComplete: () => fade.destroy(),
  });
}

/**
 * Fade TO dark then call `onComplete` — typically to start a new
 * scene. The rectangle begins at alpha 0 and tweens up to 1 so the
 * player sees the current content dim out before the transition.
 */
export function startSceneFadeOut(
  scene: Phaser.Scene,
  durationMs: number,
  onComplete: () => void,
): void {
  const { width, height } = scene.scale;
  const fade = scene.add
    .rectangle(width / 2, height / 2, width, height, SCENE_FADE_COLOR, 0)
    .setDepth(SCENE_FADE_DEPTH);
  scene.tweens.add({
    targets: fade,
    alpha: 1,
    duration: durationMs,
    onComplete,
  });
}
