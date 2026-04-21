import Phaser from 'phaser';
import { COLORS } from '../config';

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
export const SCENE_FADE_COLOR = COLORS.BG_DARK;
/** Depth of the fade rectangle — sits above any scene-content depth. */
export const SCENE_FADE_DEPTH = 999;

/**
 * Draw a full-screen dark rectangle at alpha 1 and tween to 0 over
 * `durationMs`, destroying the rectangle on complete. Call from a
 * scene's create() for a soft reveal.
 */
export function addSceneFadeIn(
  scene: Phaser.Scene,
  durationMs: number = 360,
  color: number = SCENE_FADE_COLOR,
): void {
  const { width, height } = scene.scale;
  const fade = scene.add
    .rectangle(width / 2, height / 2, width, height, color, 1)
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
  color: number = SCENE_FADE_COLOR,
): void {
  const { width, height } = scene.scale;
  const fade = scene.add
    .rectangle(width / 2, height / 2, width, height, color, 0)
    .setDepth(SCENE_FADE_DEPTH);
  scene.tweens.add({
    targets: fade,
    alpha: 1,
    duration: durationMs,
    onComplete,
  });
}

// ── Warm amber header wash ──────────────────────────────────────────
//
// Chronicle / Deeds / Shop / MetaShop all paint a very subtle
// warm-gold wash across the top 60px of the scene — a common cozy
// header treatment that unifies the "non-gameplay screens" look.

/** Default alpha of the amber header wash. 0.04 is the Chronicle /
 *  Deeds setting; 0.03 is the slightly quieter Shop / MetaShop
 *  setting. */
export const AMBER_HEADER_WASH_COLOR = COLORS.WHISKY_GOLD;
export const AMBER_HEADER_WASH_ALPHA_DEFAULT = 0.04;
export const AMBER_HEADER_WASH_ALPHA_QUIET = 0.03;

/** Height of the wash strip in pixels (top-of-scene). */
const AMBER_HEADER_WASH_HEIGHT = 60;
const AMBER_HEADER_WASH_Y = 30;

/**
 * Paint a full-screen COLORS.BG_DARK rectangle as the scene's
 * bottom-most backdrop. Used by every non-gameplay scene.
 *
 * `depth` can be supplied (MainMenu uses -100 so its parallax
 * mountain layers render in front of the backdrop); default is
 * auto-depth which Phaser places behind most scene content.
 */
export function addSceneBackdrop(scene: Phaser.Scene, depth?: number): void {
  const { width, height } = scene.scale;
  const rect = scene.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);
  if (depth !== undefined) rect.setDepth(depth);
}

export function addAmberHeaderWash(
  scene: Phaser.Scene,
  alpha: number = AMBER_HEADER_WASH_ALPHA_DEFAULT,
): void {
  const { width } = scene.scale;
  scene.add.rectangle(
    width / 2,
    AMBER_HEADER_WASH_Y,
    width,
    AMBER_HEADER_WASH_HEIGHT,
    AMBER_HEADER_WASH_COLOR,
    alpha,
  );
}
