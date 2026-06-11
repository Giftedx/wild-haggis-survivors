/**
 * Save clip link — extracted from GameOverScene as part of the Phase 5
 * render*Link drain. Downloads the last 15s of canvas recording as a
 * browser-supported video file. Only rendered when the ClipRecorder is available
 * (MediaRecorder + captureStream support) and captureEnabled.
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { buildCaptureFilename } from '../../utils/captureFilename';
import type { ClipRecorder } from '../../utils/clipRecorder';
import { formatLocalYmd } from '../../utils/formatDate';
import { TOAST_COLORS } from '../../ui/toastPalette';
import { resolveCopyActionLinkPalette } from '../gameOverLinkPalette';
import type { GameOverPayload } from '../gameOverPayload';
import { COPY_ACTION_LINK_TEXT_BASE } from './copyActionLinkText';

export interface RenderGameOverSaveClipLinkOpts {
  centerX: number;
  y: number;
  depth: number;
  delay: number;
  recorder: ClipRecorder;
  /** Payload accessor — re-read at click time so a late-arriving payload is honoured. */
  getPayload: () => GameOverPayload | null;
}

export function renderGameOverSaveClipLink(
  scene: Phaser.Scene,
  opts: RenderGameOverSaveClipLinkOpts,
): void {
  const { centerX, y, depth, delay, recorder, getPayload } = opts;
  const hint = t('ui.gameOver.save_clip');
  const palette = resolveCopyActionLinkPalette(false);
  const text = scene.add
    .text(centerX, y, `📼 ${hint}`, {
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
    const filename = buildCaptureFilename('clip', {
      mode: p.mode,
      variantLabel: p.variantLabel,
      timeSurvivedSec: p.summary.timeSurvivedSec,
      seedCode: p.seedCode,
      dateYmd: formatLocalYmd(new Date()),
      clipExtension: recorder.selectedExtension(),
    });
    recorder.saveLast((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }).then((blob) => {
      if (blob === null) {
        text.setText(`📼 ${t('ui.toast.clip_empty')}`);
        text.setColor(TOAST_COLORS.warning);
        saving = false;
      } else {
        text.setText(`📼 ${t('ui.toast.clip_saved')}`);
        text.setColor(palette.success);
        audio.playClick();
      }
    }).catch(() => {
      text.setText(`📼 ${t('ui.toast.clip_failed')}`);
      text.setColor(TOAST_COLORS.warning);
      saving = false;
    });
  };
  text.on('pointerover', () => { if (!saving) text.setColor(palette.hover); });
  text.on('pointerout', () => { if (!saving) text.setColor(palette.idle); });
  text.on('pointerdown', doSave);
}
