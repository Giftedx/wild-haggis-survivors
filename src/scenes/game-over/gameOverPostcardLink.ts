/**
 * Postcard link — extracted from GameOverScene as part of the Phase 5
 * render*Link drain. Small "save postcard" text link that downloads
 * the current canvas as a PNG. Sits below the seed readout so it
 * doesn't crowd the main action buttons.
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { getCurseByKey } from '../../data/curses';
import { downloadPostcard } from '../../utils/postcard';
import { buildPostcardPayloadFromGameOver } from '../gameOverFormatting';
import { resolveCopyActionLinkPalette } from '../gameOverLinkPalette';
import type { GameOverPayload } from '../gameOverPayload';
import { COPY_ACTION_LINK_TEXT_BASE } from './copyActionLinkText';

export interface RenderGameOverPostcardLinkOpts {
  centerX: number;
  y: number;
  depth: number;
  delay: number;
  /** Payload accessor — re-read at click time so a late-arriving payload is honoured. */
  getPayload: () => GameOverPayload | null;
}

export function renderGameOverPostcardLink(
  scene: Phaser.Scene,
  opts: RenderGameOverPostcardLinkOpts,
): void {
  const { centerX, y, depth, delay, getPayload } = opts;
  const hint = t('ui.gameOver.postcard_hint');
  const palette = resolveCopyActionLinkPalette(false);
  const text = scene.add
    .text(centerX, y, `📮 ${hint}`, {
      ...COPY_ACTION_LINK_TEXT_BASE,
      color: palette.idle,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true });
  scene.tweens.add({ targets: text, alpha: 1, duration: 260, delay });

  let saved = false;
  const doSave = () => {
    if (saved) return;
    const p = getPayload();
    if (!p) return;
    const canvas = scene.game.canvas as HTMLCanvasElement | undefined;
    const curseDef = getCurseByKey(p.curseKey ?? null);
    const ok = downloadPostcard(
      canvas,
      buildPostcardPayloadFromGameOver(p, curseDef ? t(curseDef.nameKey) : null),
    );
    if (ok) {
      saved = true;
      text.setText(`📮 ${t('ui.gameOver.postcard_saved')}`);
      text.setColor(palette.success);
      audio.playClick();
    }
  };
  text.on('pointerover', () => { if (!saved) text.setColor(palette.hover); });
  text.on('pointerout', () => { if (!saved) text.setColor(palette.idle); });
  text.on('pointerdown', doSave);
}
