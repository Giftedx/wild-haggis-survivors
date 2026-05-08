/**
 * Curse chip — extracted from GameOverScene as part of the Phase 5
 * scene drain. Small one-liner under the variant chip acknowledging
 * the curse the player bore. Resolves the curse def internally and
 * early-returns when the run had no curse, so the caller can invoke
 * unconditionally.
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { t } from '../../core/i18n';
import { textStyle } from '../../ui/typography';
import { getCurseByKey } from '../../data/curses';

export interface RenderGameOverCurseChipOpts {
  curseKey: string | null;
  panelCenterX: number;
  /** Y of the variant chip — curse chip sits 38 below it. */
  variantChipY: number;
  PANEL_W: number;
  uiScale: number;
  /** Base depth — chip renders at depthBase + 2, text at depthBase + 3. */
  depthBase: number;
}

export function renderGameOverCurseChip(
  scene: Phaser.Scene,
  opts: RenderGameOverCurseChipOpts,
): void {
  const { curseKey, panelCenterX, variantChipY, PANEL_W, uiScale, depthBase: d } = opts;
  const curseDef = getCurseByKey(curseKey);
  if (!curseDef) return;

  const curseChipY = variantChipY + 38;
  const curseChip = scene.add
    .rectangle(panelCenterX, curseChipY, Math.min(560, PANEL_W - 48), 22, 0x2a1830, 0.96)
    .setScrollFactor(0)
    .setDepth(d + 2)
    .setStrokeStyle(1, 0xb35287, 0.9)
    .setAlpha(0);
  const curseText = scene.add
    .text(panelCenterX, curseChipY, t('ui.gameOver.curse_chip', {
      curse: t(curseDef.nameKey),
      pct: curseDef.goldBonusPct,
    }),
      textStyle('label', { fontSize: '12px', color: COLORS_CSS.CURSE_MAUVE_BRIGHT }),
    )
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(d + 3)
    .setAlpha(0);
  curseText.setScale(uiScale);
  scene.tweens.add({ targets: [curseChip, curseText], alpha: 1, duration: 260, delay: 500 });
}
