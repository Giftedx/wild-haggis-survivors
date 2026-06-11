/**
 * Copy frame link — extracted from GameOverScene as part of the Phase 5
 * render*Link drain. Pushes the current canvas as a PNG into the user's
 * clipboard via `navigator.clipboard.write`. The caller already
 * feature-detected `ClipboardItem` so this helper assumes the API is
 * available; if the write rejects (iframe permission denial), the link
 * surfaces the failure inline.
 *
 * Pairs with renderGameOverSaveFrameLink as a 2-link row when the modern
 * clipboard API is available; otherwise Save frame stays solo.
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { copyCanvasToClipboard } from '../../utils/clipboard';
import { TOAST_COLORS } from '../../ui/toastPalette';
import { resolveCopyActionLinkPalette } from '../gameOverLinkPalette';
import { COPY_ACTION_LINK_TEXT_BASE } from './copyActionLinkText';

export interface RenderGameOverCopyFrameLinkOpts {
  centerX: number;
  y: number;
  depth: number;
  delay: number;
}

export function renderGameOverCopyFrameLink(
  scene: Phaser.Scene,
  opts: RenderGameOverCopyFrameLinkOpts,
): void {
  const { centerX, y, depth, delay } = opts;
  const hint = t('ui.gameOver.copy_frame');
  const palette = resolveCopyActionLinkPalette(false);
  const text = scene.add
    .text(centerX, y, `📋 ${hint}`, {
      ...COPY_ACTION_LINK_TEXT_BASE,
      color: palette.idle,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true });
  scene.tweens.add({ targets: text, alpha: 1, duration: 260, delay });

  let copying = false;
  const doCopy = () => {
    if (copying) return;
    copying = true;
    copyCanvasToClipboard(scene.game.canvas as HTMLCanvasElement).then((ok) => {
      if (ok) {
        text.setText(`📋 ${t('ui.toast.frame_copied')}`);
        text.setColor(palette.success);
      } else {
        text.setText(`📋 ${t('ui.toast.frame_copy_failed')}`);
        text.setColor(TOAST_COLORS.warning);
        copying = false;
      }
      audio.playClick();
    });
  };
  text.on('pointerover', () => { if (!copying) text.setColor(palette.hover); });
  text.on('pointerout', () => { if (!copying) text.setColor(palette.idle); });
  text.on('pointerdown', doCopy);
}
