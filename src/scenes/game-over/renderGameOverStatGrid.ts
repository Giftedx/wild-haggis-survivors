/**
 * Stat grid (time / kills / level / bosses / passives / combo) — extracted
 * from GameOverScene as part of the Phase 5 scene drain. Six numeric tiles
 * laid out 3-wide × 2-tall, each driven by `createResultStat`. NEW BEST
 * gilding compares this run against `previousBests` snapshot captured
 * BEFORE the run was recorded (the snapshot the payload carries).
 *
 * Pure presentation; no replay determinism dependency.
 */
import type * as Phaser from 'phaser';
import { t } from '../../core/i18n';
import { formatClockTime } from '../gameOverFormatting';
import type { GameOverPayload } from '../gameOverPayload';
import { createResultStat } from './resultPanelBuilders';

export interface RenderGameOverStatGridOpts {
  panelCenterX: number;
  panelTop: number;
  PANEL_W: number;
  compact: boolean;
  uiScale: number;
  /** Base depth — stats render at depthBase + 3. */
  depthBase: number;
  payload: GameOverPayload;
}

export function renderGameOverStatGrid(
  scene: Phaser.Scene,
  opts: RenderGameOverStatGridOpts,
): void {
  const { panelCenterX, panelTop, PANEL_W, compact, uiScale, depthBase: d, payload } = opts;
  const { summary } = payload;
  const summaryTime = formatClockTime(summary.timeSurvivedSec);
  const statBaseY = panelTop + (compact ? 178 : 200);
  const statGap = Math.min(142, Math.floor(PANEL_W * 0.21));
  const statRowGap = Math.round((compact ? 36 : 42) * uiScale);
  const pb = payload.previousBests;
  createResultStat(scene, panelCenterX - statGap, statBaseY, t('ui.gameOver.stat_time'), summaryTime, d + 3, 600, uiScale,
    pb && summary.timeSurvivedSec > pb.bestTime);
  createResultStat(scene, panelCenterX, statBaseY, t('ui.gameOver.stat_kills'), `${summary.enemiesKilled}`, d + 3, 660, uiScale,
    pb && summary.enemiesKilled > pb.bestKills);
  createResultStat(scene, panelCenterX + statGap, statBaseY, t('ui.gameOver.stat_level'), `${payload.xpLevel}`, d + 3, 720, uiScale,
    pb && payload.xpLevel > pb.bestLevel);
  createResultStat(scene, panelCenterX - statGap, statBaseY + statRowGap, t('ui.gameOver.stat_bosses'), `${payload.bossKillCount}`, d + 3, 780, uiScale);
  createResultStat(scene, panelCenterX, statBaseY + statRowGap, t('ui.gameOver.stat_passives'), `${payload.ownedPassiveCount}`, d + 3, 840, uiScale);
  createResultStat(scene, panelCenterX + statGap, statBaseY + statRowGap, t('ui.gameOver.stat_combo'), `${summary.bestCombo ?? 0}x`, d + 3, 900, uiScale,
    pb && (summary.bestCombo ?? 0) > pb.bestCombo);
}
