import * as Phaser from 'phaser';
import { audio } from '../systems/AudioSystem';
import { COLORS } from '../config';
import {
  addAmberHeaderWash,
  AMBER_HEADER_WASH_ALPHA_QUIET,
  addSceneBackdrop,
} from './sceneFade';
import { PANEL_STROKE } from '../ui/panelStyle';

/**
 * Builds the shared "shop scene" cozy backdrop — both ShopScene and
 * MetaShopScene opened with this exact 17-line setup. Pulls the
 * shared bits out so a panel/heather/fade tweak is one edit.
 *
 * Includes: scene backdrop, amber header wash, central content panel
 * rectangle, 5 heather sprites along the bottom, ambient moor wind
 * SFX kickoff, and a black fade-in overlay that self-destroys.
 */
export function installShopBackdrop(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;

  addSceneBackdrop(scene);
  // Warm amber wash at the top — cozy between storms
  addAmberHeaderWash(scene, AMBER_HEADER_WASH_ALPHA_QUIET);
  scene.add.rectangle(width / 2, 318, width - 26, 452, COLORS.PANEL, 0.62)
    .setStrokeStyle(PANEL_STROKE.standard.width, PANEL_STROKE.standard.color, PANEL_STROKE.standard.alpha);
  // Heather strip at the bottom for highland warmth
  if (scene.textures.exists('deco_heather')) {
    for (let i = 0; i < 5; i++) {
      const hx = 60 + i * (width - 120) / 4;
      scene.add.image(hx, height - 12, 'deco_heather')
        .setAlpha(0.35).setScale(1.2).setDepth(0);
    }
  }

  // Ambient moor wind — cozy between storms
  audio.startAmbientWind();

  const fadeIn = scene.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK, 1)
    .setDepth(999);
  scene.tweens.add({
    targets: fadeIn, alpha: 0, duration: 360,
    onComplete: () => fadeIn.destroy(),
  });
}
