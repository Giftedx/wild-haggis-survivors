/**
 * Save frame link — extracted from GameOverScene as part of the Phase 5
 * render*Link drain. Downloads the current canvas as a PNG named with
 * run context. Only rendered when captureEnabled is true (gate
 * evaluated in the caller before this helper is invoked).
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { saveScreenshot } from '../../utils/screenshot';
import { buildCaptureFilename } from '../../utils/captureFilename';
import { formatLocalYmd } from '../../utils/formatDate';
import { TOAST_COLORS } from '../../ui/toastPalette';
import { resolveCopyActionLinkPalette } from '../gameOverLinkPalette';
import type { GameOverPayload } from '../gameOverPayload';
import { COPY_ACTION_LINK_TEXT_BASE } from './copyActionLinkText';

export interface RenderGameOverSaveFrameLinkOpts {
  centerX: number;
  y: number;
  depth: number;
  delay: number;
  /** Payload accessor — re-read at click time so a late-arriving payload is honoured. */
  getPayload: () => GameOverPayload | null;
}

export function renderGameOverSaveFrameLink(
  scene: Phaser.Scene,
  opts: RenderGameOverSaveFrameLinkOpts,
): void {
  const { centerX, y, depth, delay, getPayload } = opts;
  const hint = t('ui.gameOver.save_frame');
  const palette = resolveCopyActionLinkPalette(false);
  const text = scene.add
    .text(centerX, y, `📷 ${hint}`, {
      ...COPY_ACTION_LINK_TEXT_BASE,
      color: palette.idle,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true });
  scene.tweens.add({ targets: text, alpha: 1, duration: 260, delay });

  let saving = false;
  const doSave = () => {
    if (saving) return;
    const p = getPayload();
    if (!p) return;
    saving = true;
    const filename = buildCaptureFilename('screenshot', {
      mode: p.mode,
      variantLabel: p.variantLabel,
      timeSurvivedSec: p.summary.timeSurvivedSec,
      seedCode: p.seedCode,
      dateYmd: formatLocalYmd(new Date()),
    });
    saveScreenshot(scene.game.canvas as HTMLCanvasElement, filename).then((ok) => {
      if (ok) {
        text.setText(`📷 ${t('ui.toast.screenshot_saved')}`);
        text.setColor(palette.success);
      } else {
        text.setText(`📷 ${t('ui.toast.screenshot_failed')}`);
        text.setColor(TOAST_COLORS.warning);
        saving = false;
      }
      audio.playClick();
    });
  };
  text.on('pointerover', () => { if (!saving) text.setColor(palette.hover); });
  text.on('pointerout', () => { if (!saving) text.setColor(palette.idle); });
  text.on('pointerdown', doSave);
}
