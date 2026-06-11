/**
 * Seed readout — extracted from GameOverScene as part of the Phase 5
 * render*Link drain. Renders the seed code with a clickable "copy"
 * affordance. Clipboard support varies (desktop: navigator.clipboard;
 * older Safari: textarea + execCommand); we fall back through them and
 * update the label to confirm when the copy worked.
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { t } from '../../core/i18n';
import { copyTextToClipboard } from '../../utils/clipboard';
import { formatSeedReadoutLabel } from '../gameOverFormatting';
import { resolveCopyActionLinkPalette } from '../gameOverLinkPalette';
import { COPY_ACTION_LINK_TEXT_BASE } from './copyActionLinkText';

export interface RenderGameOverSeedReadoutOpts {
  centerX: number;
  y: number;
  depth: number;
  code: string;
  isDaily: boolean;
  delay: number;
}

export function renderGameOverSeedReadout(
  scene: Phaser.Scene,
  opts: RenderGameOverSeedReadoutOpts,
): void {
  const { centerX, y, depth, code, isDaily, delay } = opts;
  const label = formatSeedReadoutLabel(code, isDaily);
  const tail = t('ui.gameOver.seed_copy_hint');
  const palette = resolveCopyActionLinkPalette(isDaily);
  const text = scene.add
    .text(centerX, y, `${label}  ·  ${tail}`, {
      ...COPY_ACTION_LINK_TEXT_BASE,
      color: palette.idle,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true });
  scene.tweens.add({ targets: text, alpha: 1, duration: 260, delay });

  let copied = false;
  const doCopy = () => {
    const ok = copyTextToClipboard(code);
    if (ok && !copied) {
      copied = true;
      text.setText(t('ui.gameOver.seed_copied', { code }));
      text.setColor(palette.success);
    }
  };
  text.on('pointerover', () => { if (!copied) text.setColor(palette.hover); });
  text.on('pointerout', () => { if (!copied) text.setColor(palette.idle); });
  text.on('pointerdown', doCopy);
}
