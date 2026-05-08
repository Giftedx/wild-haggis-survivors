/**
 * Gold panel content (title + breakdown line) extracted from
 * GameOverScene as part of the Phase 5 scene drain. Title pops in via
 * Back.easeOut scale tween; breakdown fades in below it. Both anchor
 * relative to `goldPanelCenterY` (already shifted with panelScale)
 * rather than fixed offsets so 1.4x layouts stay inside the gold
 * panel border.
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { t } from '../../core/i18n';
import { textStyle } from '../../ui/typography';

export interface RenderGameOverGoldPanelOpts {
  panelCenterX: number;
  goldPanelCenterY: number;
  innerW: number;
  compact: boolean;
  uiScale: number;
  panelScale: number;
  /** Base depth — text renders at depthBase + 3. */
  depthBase: number;
  /** Total gold earned for the run. */
  goldEarned: number;
  /** Pre-formatted "+X kills · +Y time · …" breakdown line. */
  goldBreakdown: string;
}

export function renderGameOverGoldPanel(
  scene: Phaser.Scene,
  opts: RenderGameOverGoldPanelOpts,
): void {
  const {
    panelCenterX,
    goldPanelCenterY,
    innerW,
    compact,
    uiScale,
    panelScale,
    depthBase: d,
    goldEarned,
    goldBreakdown,
  } = opts;

  // goldTitleY anchors on the goldPanel centre (already shifted with scale)
  // rather than a fixed +420 offset, so it moves with the panel at 1.4x.
  const goldTitleY = goldPanelCenterY - Math.round(15 * panelScale);

  const goldTitle = scene.add
    .text(panelCenterX, goldTitleY, t('ui.gameOver.gold_title', { amount: goldEarned }),
      textStyle('heading', {
        fontSize: compact ? '22px' : '28px',
        color: COLORS_CSS.WHISKY_GOLD,
        align: 'center',
        wordWrap: { width: (innerW - 24) / Math.max(1, uiScale) },
      }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(d + 3)
    .setAlpha(0);
  goldTitle.setScale(uiScale);
  const goldText = scene.add
    .text(panelCenterX, goldTitleY + Math.round(30 * panelScale), goldBreakdown,
      textStyle('label', { fontSize: '12px', color: COLORS_CSS.LABEL_TAN, align: 'center' }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(d + 3)
    .setAlpha(0);
  goldText.setScale(uiScale);
  scene.tweens.add({
    targets: goldTitle,
    alpha: 1,
    scale: { from: 0.7, to: 1 },
    duration: 300,
    delay: 980,
    ease: 'Back.easeOut',
  });
  scene.tweens.add({ targets: goldText, alpha: 1, duration: 240, delay: 1080 });
}
