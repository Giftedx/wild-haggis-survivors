import Phaser from 'phaser';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { getSettingsManager } from '../core/SettingsManager';
import { SaveManager } from '../core/SaveManager';
import { ACHIEVEMENT_DEFS } from '../core/BalanceConfig';
import { loadSave } from '../utils/save';
import {
  computeAllDeeds,
  deedSummary,
  formatDeedProgressLabel,
  resolveDeedCardPalette,
  resolveDeedDescription,
  resolveDeedProgressBarStyle,
  resolveDeedsSubtitleStyle,
  type DeedProgress,
  type DeedStatsSnapshot,
} from '../ui/deedsProgress';
import { countUniqueRouteKeys } from '../ui/chronicleAggregates';
import { createBackButton } from './createBackButton';
import { addSceneFadeIn, addAmberHeaderWash, addSceneBackdrop } from './sceneFade';
import { sceneHeaderTextStyle, sceneSubtitleTextStyle } from './sceneHeaderStyle';
import { clickToScene } from './clickToScene';

/**
 * Browse screen for achievements ("deeds"). Shows every defined deed with
 * its unlock status, and — for threshold deeds — a live progress bar
 * computed from both save layers (meta kills + gameplay bestTime/victories).
 *
 * Binary deeds (taxman, first evolution, all-bosses) intentionally hide
 * progress to preserve first-unlock surprise; the scene labels them
 * "a rumour on the moor" instead of revealing triggers.
 */
export class DeedsScene extends Phaser.Scene {
  private saveManager = new SaveManager();

  constructor() {
    super({ key: 'Deeds' });
  }

  create(): void {
    const { width, height } = this.scale;
    const { uiScale, highContrastUi } = getSettingsManager().load();
    const meta = this.saveManager.load();
    const gameplay = loadSave();

    // W2 Moor Road: how many distinct route keys have been picked across
    // the gameplay save's runHistory. Feeds the "Kent the Moor" deed.
    const uniqueRoutesWalked = countUniqueRouteKeys(gameplay.runHistory ?? []);

    const snapshot: DeedStatsSnapshot = {
      lifetimeKills: meta.totalKills + meta.totalKillsSpent,
      bestTimeSec: gameplay.bestTime,
      victories: gameplay.victories,
      moorMomentsLifetime: meta.moorMomentsLifetime,
      unlockedIds: meta.unlockedAchievements,
      codexDiscoveredCount: meta.codexCulledKeys.length,
      uniqueRoutesWalked,
      ceilidhPulsesLifetime: gameplay.ceilidhPulsesLifetime ?? 0,
      bestEndlessSeconds: gameplay.bestEndlessSeconds ?? 0,
    };
    const deeds = computeAllDeeds(snapshot);
    const summary = deedSummary(snapshot);

    // ── Background + ambient wash ──
    addSceneBackdrop(this);
    addAmberHeaderWash(this);
    audio.startAmbientWind();
    addSceneFadeIn(this);

    // ── Header ──
    this.add
      .text(width / 2, 36, t('ui.deeds.title'),
        sceneHeaderTextStyle('30px', highContrastUi ? '#ffe08a' : '#d4a017'))
      .setOrigin(0.5)
      .setScale(uiScale);

    const subStyle = resolveDeedsSubtitleStyle(summary.earned, summary.total);
    this.add
      .text(width / 2, 70, t(subStyle.key, { earned: summary.earned, total: summary.total }),
        sceneSubtitleTextStyle(subStyle.color, width))
      .setOrigin(0.5)
      .setScale(uiScale);

    // Counter chip (top-right)
    this.add
      .rectangle(width - 70, 36, 120, 26, 0x11182a, 0.85)
      .setStrokeStyle(1, 0x355079, 1);
    this.add
      .text(width - 70, 36, t('ui.deeds.counter', { earned: summary.earned, total: summary.total }), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d4a017',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    // ── Deed grid ──
    // 3-column layout; row count grows with the deed list. Cards shrink
    // vertically as more deeds ship — gridHeight is fixed (y=104 →
    // y=height-68 so the back button fits below).
    const cols = 3;
    const rows = Math.ceil(deeds.length / cols);
    const gridTop = 104;
    const gridBottom = height - 68;
    const gridHeight = gridBottom - gridTop;
    const horizontalMargin = 24;
    const gutter = 14;
    const colWidth = (width - horizontalMargin * 2 - gutter * (cols - 1)) / cols;
    const rowHeight = (gridHeight - gutter * (rows - 1)) / rows;

    deeds.forEach((deed, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = horizontalMargin + colWidth / 2 + col * (colWidth + gutter);
      const cy = gridTop + rowHeight / 2 + row * (rowHeight + gutter);
      this.drawDeedCard(deed, cx, cy, colWidth, rowHeight, uiScale);
    });

    // ── Back button ──
    const backBtn = createBackButton(this, {
      x: width / 2, y: height - 32, width: 200, height: 38,
      label: t('ui.deeds.back'), fontSize: '15px', uiScale,
    });
    const goBack = clickToScene(this, 'MainMenu');
    backBtn.on('pointerdown', goBack);

    this.input.keyboard?.on('keydown-ESC', goBack);

    this.events.once('shutdown', () => {
      audio.stopAmbientWind();
    });
  }

  private drawDeedCard(
    deed: DeedProgress,
    cx: number,
    cy: number,
    w: number,
    h: number,
    uiScale: number,
  ): void {
    const def = ACHIEVEMENT_DEFS[deed.id];
    const isUnlocked = deed.status === 'unlocked';
    const palette = resolveDeedCardPalette(deed.status);

    // Card background — gold-tinted for unlocked, cool slate for locked.
    this.add
      .rectangle(cx, cy, w, h, palette.bgColor, 0.92)
      .setStrokeStyle(palette.strokeWidth, palette.strokeColor, palette.strokeAlpha);

    // Top row: icon + title
    const iconX = cx - w / 2 + 28;
    const iconY = cy - h / 2 + 28;
    this.add
      .text(iconX, iconY, palette.iconChar, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: palette.iconColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    const titleColor = palette.titleColor;
    this.add
      .text(iconX + 22, iconY - 10, t(def.titleKey), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: titleColor,
        fontStyle: 'bold',
        wordWrap: { width: w - 80 },
      })
      .setOrigin(0, 0.5)
      .setScale(uiScale);

    // Status tag (top-right)
    const statusLabel = deed.status === 'unlocked'
      ? t('ui.deeds.status_unlocked')
      : deed.status === 'in_progress'
        ? t('ui.deeds.status_in_progress')
        : t('ui.deeds.status_locked');
    const statusColor = palette.statusColor;
    this.add
      .text(cx + w / 2 - 14, cy - h / 2 + 16, statusLabel, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: statusColor,
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(1, 0)
      .setScale(uiScale);

    // Description OR mystery hint for binary locked deeds
    const desc = resolveDeedDescription({
      status: deed.status,
      isBinary: deed.isBinary,
      fullDescription: t(def.descriptionKey),
      mysteryHint: t('ui.deeds.locked_mystery'),
    });
    const descColor = palette.descColor;
    this.add
      .text(cx - w / 2 + 14, cy - 4, desc.text, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: descColor,
        fontStyle: desc.italic ? 'italic' : 'normal',
        wordWrap: { width: w - 28 },
      })
      .setOrigin(0, 0.5)
      .setScale(uiScale);

    // Progress bar (bottom) — threshold deeds only
    if (!deed.isBinary) {
      const barY = cy + h / 2 - 18;
      const barMargin = 14;
      const barWidth = w - barMargin * 2;
      const barX = cx - barWidth / 2;
      // Track
      this.add
        .rectangle(cx, barY, barWidth, 6, 0x0a1020, 1)
        .setStrokeStyle(1, 0x243552, 1);
      // Fill
      const barStyle = resolveDeedProgressBarStyle(isUnlocked);
      const fillWidth = Math.max(2, barWidth * deed.ratio);
      this.add
        .rectangle(barX + fillWidth / 2, barY, fillWidth, 4, barStyle.fillColor, 1);
      // Numeric label
      this.add
        .text(cx, barY + 12, formatDeedProgressLabel(deed), {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: barStyle.labelColor,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScale(uiScale);
    }
  }
}
