/**
 * Title + rotating subtitle render — extracted from GameOverScene as
 * part of the Phase 5 scene drain. Picks death/victory title pair
 * indices via `pickGameOverTitleKeys`, then mounts the title and
 * subtitle text objects with their fade/scale-in tweens.
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { t } from '../../core/i18n';
import { textStyle } from '../../ui/typography';
import { pickGameOverTitleKeys } from '../gameOverPanelTheme';

export interface RenderGameOverTitleAndSubtitleOpts {
  isVictory: boolean;
  panelCenterX: number;
  panelTop: number;
  PANEL_W: number;
  compact: boolean;
  uiScale: number;
  titleColor: string;
  titleStartScale: number;
  /** Base depth — title/subtitle render at depthBase + 2. */
  depthBase: number;
}

export function renderGameOverTitleAndSubtitle(
  scene: Phaser.Scene,
  opts: RenderGameOverTitleAndSubtitleOpts,
): void {
  const {
    isVictory,
    panelCenterX,
    panelTop,
    PANEL_W,
    compact,
    uiScale,
    titleColor,
    titleStartScale,
    depthBase: d,
  } = opts;

  const { titleKey: deathTitleKey, subKey: deathSubKey } = pickGameOverTitleKeys(
    isVictory,
    Phaser.Math.Between(0, 3),
    Phaser.Math.Between(0, 3),
  );

  const title = scene.add
    .text(panelCenterX, panelTop + (compact ? 38 : 54), t(deathTitleKey),
      textStyle('display', {
        color: titleColor,
        align: 'center',
        fontSize: compact ? '30px' : '48px',
        wordWrap: { width: (PANEL_W - 32) / Math.max(1, uiScale) },
      }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(d + 2)
    .setAlpha(0)
    .setScale(compact ? uiScale : titleStartScale);
  title.setScale((compact ? 1 : titleStartScale) * uiScale);
  const subtitle = scene.add
    .text(panelCenterX, panelTop + (compact ? 78 : 94), t(deathSubKey),
      textStyle('body', {
        color: COLORS_CSS.DUSTY_TAN,
        align: 'center',
        fontSize: compact ? '12px' : '16px',
        wordWrap: { width: (PANEL_W - 48) / Math.max(1, uiScale) },
      }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(d + 2)
    .setAlpha(0);
  subtitle.setScale(uiScale);

  scene.tweens.add({
    targets: title,
    alpha: 1,
    scale: uiScale,
    duration: 480,
    delay: 180,
    ease: 'Back.easeOut',
  });
  scene.tweens.add({ targets: subtitle, alpha: 1, duration: 320, delay: 320 });
}
