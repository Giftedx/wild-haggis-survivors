/**
 * Ironmoor amplification banner — extracted from GameOverScene as part
 * of the Phase 5 scene drain. Renders the rose-pink victory/death
 * banner under the title for any Ironmoor run, so the posture is
 * acknowledged in the ceremony. Caller decides whether to invoke (the
 * payload's `ironmoor` flag is the gate).
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { t } from '../../core/i18n';
import { textStyle } from '../../ui/typography';
import { ironmoorBannerStyle } from '../gameOverPanelTheme';

export interface RenderGameOverIronmoorBannerOpts {
  isVictory: boolean;
  panelCenterX: number;
  panelTop: number;
  PANEL_W: number;
  compact: boolean;
  uiScale: number;
  /** Base depth — banner renders at depthBase + 2. */
  depthBase: number;
}

export function renderGameOverIronmoorBanner(
  scene: Phaser.Scene,
  opts: RenderGameOverIronmoorBannerOpts,
): void {
  const { isVictory, panelCenterX, panelTop, PANEL_W, compact, uiScale, depthBase: d } = opts;
  const banner_ = ironmoorBannerStyle(isVictory);
  const banner = scene.add
    .text(panelCenterX, panelTop + (compact ? 104 : 118), t(banner_.key),
      textStyle('body', { color: banner_.color, align: 'center', wordWrap: { width: (PANEL_W - 48) / Math.max(1, uiScale) } }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(d + 2)
    .setAlpha(0)
    .setScale(uiScale);
  scene.tweens.add({ targets: banner, alpha: 1, duration: 320, delay: 520 });
}
