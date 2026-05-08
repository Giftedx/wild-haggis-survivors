/**
 * Loadout summary + weapon damage rows render — extracted from
 * GameOverScene as part of the Phase 5 scene drain. Renders the
 * weapons-line header (count + evolved tally), the bounded build
 * summary, the optional run-identity radiator (act/routes/relics/
 * runes), then the damage-by-weapon heading + 3-row body.
 *
 * Top of the block anchors on the weaponDamagePanel top edge; rows
 * chain via post-scale displayHeight so uiScale 1.4 layouts don't
 * collide with the gold panel below.
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { t } from '../../core/i18n';
import { textStyle } from '../../ui/typography';
import {
  boundedLoadoutSummary,
  buildGameOverRunIdentityLines,
  buildWeaponDamageRows,
} from '../gameOverFormatting';
import type { GameOverPayload } from '../gameOverPayload';

export interface RenderGameOverLoadoutSummaryOpts {
  panelCenterX: number;
  PANEL_W: number;
  uiScale: number;
  panelScale: number;
  weaponPanelTop: number;
  /** Base depth — text renders at depthBase + 3. */
  depthBase: number;
  payload: GameOverPayload;
  weaponDamage: Record<string, number>;
  summary: { enemiesKilled: number; timeSurvivedSec: number };
  runResult: { goldEarned: number };
}

export function renderGameOverLoadoutSummary(
  scene: Phaser.Scene,
  opts: RenderGameOverLoadoutSummaryOpts,
): void {
  const {
    panelCenterX,
    PANEL_W,
    uiScale,
    panelScale,
    weaponPanelTop,
    depthBase: d,
    payload,
    weaponDamage,
    summary,
    runResult,
  } = opts;

  const loadoutSummaryText = boundedLoadoutSummary(payload.buildSummary, 2);
  const weaponsHead =
    payload.weaponCount === 1
      ? t('ui.gameOver.weapons_line_one', { evolved: payload.evolvedCount })
      : t('ui.gameOver.weapons_line', { count: payload.weaponCount, evolved: payload.evolvedCount });
  // T402 — run-identity radiator (parity with pause panel). Empty for
  // fresh act-1 runs with no routes/relics; otherwise appends gated
  // act/routes/relics lines so the summary reflects what shaped the run.
  // Variant chip is rendered separately above; we deliberately don't
  // duplicate it here. Reuses `ui.pause.stats_*` keys for locale parity.
  const runIdentityLines = buildGameOverRunIdentityLines({
    currentAct: payload.currentAct,
    routeLabels: payload.routeLabels,
    relicLabels: payload.relicLabels,
    runeLabels: payload.runeLabels,
  });
  const summaryBlock = runIdentityLines.length > 0
    ? `${weaponsHead}\n${loadoutSummaryText}\n${runIdentityLines.join('\n')}`
    : `${weaponsHead}\n${loadoutSummaryText}`;
  const loadoutSummary = scene.add
    .text(
      panelCenterX,
      weaponPanelTop + Math.round(15 * panelScale),
      summaryBlock,
      {
        ...textStyle('label', { color: COLORS_CSS.TEXT_SECONDARY, align: 'center', wordWrap: { width: Math.min(560, PANEL_W - 48) / Math.max(1, uiScale) } }),
        lineSpacing: 6,
      }
    )
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setDepth(d + 3)
    .setAlpha(0);
  loadoutSummary.setScale(uiScale);
  scene.tweens.add({ targets: loadoutSummary, alpha: 1, duration: 260, delay: 900 });

  const weaponRows = buildWeaponDamageRows({
    weaponDamage,
    enemiesKilled: summary.enemiesKilled,
    timeSurvivedSec: summary.timeSurvivedSec,
    goldEarned: runResult.goldEarned,
    maxRows: 3,
  });
  // Use displayHeight (post-scale) so chained positions match visual bottom.
  // Previous plain `.height` under-measured at uiScale 1.4, letting weapon
  // rows overlap the goldPanel background.
  const loadoutBottom = loadoutSummary.y + loadoutSummary.displayHeight;
  const weaponHeading = scene.add
    .text(panelCenterX, loadoutBottom + Math.round(10 * panelScale), t('ui.gameOver.damage_by_weapon'), {
      ...textStyle('label', { color: COLORS_CSS.TEXT_SUBTITLE }),
      letterSpacing: 1,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(d + 3)
    .setAlpha(0);
  weaponHeading.setScale(uiScale);
  const weaponBody = scene.add
    .text(panelCenterX, weaponHeading.y + Math.round(16 * panelScale), weaponRows, {
      ...textStyle('label', { color: COLORS_CSS.TEXT_PRIMARY, align: 'center', wordWrap: { width: Math.min(560, PANEL_W - 48) / Math.max(1, uiScale) } }),
      lineSpacing: 4,
    })
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setDepth(d + 3)
    .setAlpha(0);
  weaponBody.setScale(uiScale);
  scene.tweens.add({ targets: [weaponHeading, weaponBody], alpha: 1, duration: 260, delay: 940 });
}
