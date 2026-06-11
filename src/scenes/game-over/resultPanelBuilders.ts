/**
 * Result-panel widget builders extracted from GameOverScene as part of
 * the Phase 5 scene drain. Two pure presentation helpers:
 *
 *  - `createResultStat` — label + value pair for the stat grid (time,
 *    kills, level, bosses, passives, combo). Optional NEW BEST badge
 *    pops in via Back.easeOut tween.
 *  - `createResultActionButton` — Play Again / Gold Shop / Tae Gran's
 *    button with focus-controller registration. Hover routes through
 *    the controller so pointer + keyboard / gamepad nav stay in sync.
 *
 * Pure UI; no replay determinism dependency.
 */
import type * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { t } from '../../core/i18n';
import { textStyle } from '../../ui/typography';
import { createGameButton, type ButtonTier } from '../../ui/gameButton';
import type { GameOverFocusController } from './GameOverFocusController';

export function createResultStat(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  value: string,
  depth: number,
  delay: number,
  uiScale: number,
  isNewBest?: boolean,
): void {
  const labelText = scene.add
    .text(x, y, label,
      textStyle('label', { fontSize: '12px', color: COLORS_CSS.TEXT_SUBTITLE }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0)
    .setScale(uiScale);
  const valueText = scene.add
    .text(x, y + Math.round(18 * uiScale), value,
      textStyle('body', { fontSize: '20px', color: isNewBest ? COLORS_CSS.WHISKY_GOLD : COLORS_CSS.WHITE }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0)
    .setScale(uiScale);

  scene.tweens.add({ targets: [labelText, valueText], alpha: 1, duration: 220, delay });

  if (isNewBest) {
    const badge = scene.add
      .text(x + Math.round(46 * uiScale), y + Math.round(10 * uiScale), t('ui.gameOver.new_best'),
        textStyle('small', { fontSize: '8px', color: COLORS_CSS.WHISKY_GOLD }),
      )
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1)
      .setAlpha(0)
      .setScale(0.5 * uiScale);
    scene.tweens.add({
      targets: badge,
      alpha: 1,
      scale: uiScale,
      duration: 360,
      delay: delay + 200,
      ease: 'Back.easeOut',
    });
  }
}

export function createResultActionButton(
  scene: Phaser.Scene,
  focusController: GameOverFocusController,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  tier: ButtonTier,
  delay: number,
  uiScale: number,
  onClick: () => void,
  overrides?: { fillOverride?: number; hoverOverride?: number; textColorOverride?: string; disabled?: boolean },
): void {
  // setInteractive is called at construction by the factory — alpha-0
  // fade-in still provides the visual delay without softlocking the
  // buttons if a tween is interrupted by tab-backgrounding.
  const { rect: button, label: text } = createGameButton(scene, {
    x, y, width, height, label, tier, uiScale,
    fillOverride: overrides?.fillOverride,
    hoverOverride: overrides?.hoverOverride,
    textColorOverride: overrides?.textColorOverride,
  });
  button.setScrollFactor(0).setDepth(203).setAlpha(0);
  text.setScrollFactor(0).setDepth(204).setAlpha(0);

  scene.tweens.add({
    targets: [button, text],
    alpha: 1,
    duration: 260,
    delay,
  });

  button.on('pointerdown', onClick);
  button.on('pointerover', () => {
    const idx = focusController.getActions().findIndex((e) => e.rect === button);
    if (idx === -1) return;
    if (focusController.getAction(idx)?.disabled === true) return;
    focusController.setFocusedIndex(idx);
  });
  // Snapshot the idle stroke (createGameButton may have set an HC tier
  // border) so applyStyles can restore it on de-focus.
  focusController.addAction({
    rect: button,
    onActivate: onClick,
    disabled: overrides?.disabled === true,
    idleStroke: {
      width: button.lineWidth,
      color: button.strokeColor,
      alpha: button.strokeAlpha,
    },
  });
}
