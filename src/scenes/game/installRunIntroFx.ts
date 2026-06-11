/**
 * installRunIntroFx — fade-in from black + controls hint toast.
 * Both are run-start ceremony: the fade softens scene starts, and the
 * hint surfaces controls for the first 30 seconds then self-fades.
 *
 * Extracted from GameScene.create(). Returns the hint's hide ticker
 * handle so the scene can cancel it if the run ends early.
 */
import type Phaser from 'phaser';
import type { UpdateTickers, TickerHandle } from '../../utils/UpdateTickers';
import { t } from '../../core/i18n';

export interface UiViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Fade-in duration (ms). */
const FADE_DURATION_MS = 500;
/** Hint fade-in delay (ms) — late enough that players see the map first. */
const HINT_FADE_IN_DELAY_MS = 4000;
/** Hint fade-in duration (ms). */
const HINT_FADE_IN_MS = 500;
/** How long the hint stays visible before auto-hiding (ms). */
const HINT_VISIBLE_MS = 30_000;
/** Hint fade-out duration (ms). */
const HINT_FADE_OUT_MS = 1000;
/** Target alpha for the visible hint. */
const HINT_TARGET_ALPHA = 0.8;

export function installRunIntroFx(
  scene: Phaser.Scene,
  updateTickers: UpdateTickers,
  getUiViewport: () => UiViewport,
): TickerHandle {
  // Fade in from black.
  const { x: uiX, y: uiY, width: uiWidth, height: uiHeight } = getUiViewport();
  const fadeIn = scene.add
    .rectangle(uiX + uiWidth / 2, uiY + uiHeight / 2, uiWidth, uiHeight, 0x000000, 1)
    .setScrollFactor(0)
    .setDepth(999);
  scene.tweens.add({
    targets: fadeIn,
    alpha: 0,
    duration: FADE_DURATION_MS,
    onComplete: () => fadeIn.destroy(),
  });

  // Controls hint — show for first HINT_VISIBLE_MS, then fade out.
  // P1.8 — wrap to viewport width so the bottom-edge hint doesn't clip
  // both edges on a 390-px iPhone. align: center keeps the wrapped lines
  // visually balanced under the centred origin.
  const { x: hintX, y: hintY, width: hintW, height: hintH } = getUiViewport();
  const hint = scene.add
    .text(hintX + hintW / 2, hintY + hintH - 36, t('ui.game.controls_hint'), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#a09890',
      stroke: '#0a0a0c',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: Math.max(220, hintW - 24) },
    })
    .setOrigin(0.5, 1)
    .setScrollFactor(0)
    .setDepth(60)
    .setAlpha(0);
  scene.tweens.add({
    targets: hint,
    alpha: HINT_TARGET_ALPHA,
    duration: HINT_FADE_IN_MS,
    delay: HINT_FADE_IN_DELAY_MS,
  });
  return updateTickers.addOnce('raw', HINT_VISIBLE_MS, () => {
    scene.tweens.add({
      targets: hint,
      alpha: 0,
      duration: HINT_FADE_OUT_MS,
      onComplete: () => hint.destroy(),
    });
  });
}
