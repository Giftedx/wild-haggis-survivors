import Phaser from 'phaser';
import { COLORS } from '../config';
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
  type DeedProgress,
  type DeedStatsSnapshot,
} from '../ui/deedsProgress';

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
    const uniqueRouteKeys = new Set<string>();
    for (const entry of gameplay.runHistory ?? []) {
      for (const p of entry.routes ?? []) uniqueRouteKeys.add(p.routeKey);
    }

    const snapshot: DeedStatsSnapshot = {
      lifetimeKills: meta.totalKills + meta.totalKillsSpent,
      bestTimeSec: gameplay.bestTime,
      victories: gameplay.victories,
      moorMomentsLifetime: meta.moorMomentsLifetime,
      unlockedIds: meta.unlockedAchievements,
      codexDiscoveredCount: meta.codexCulledKeys.length,
      uniqueRoutesWalked: uniqueRouteKeys.size,
      ceilidhPulsesLifetime: gameplay.ceilidhPulsesLifetime ?? 0,
    };
    const deeds = computeAllDeeds(snapshot);
    const summary = deedSummary(snapshot);

    // ── Background + ambient wash ──
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);
    this.add.rectangle(width / 2, 30, width, 60, 0xd4a017, 0.04);
    audio.startAmbientWind();
    const fade = this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e, 1).setDepth(999);
    this.tweens.add({ targets: fade, alpha: 0, duration: 360, onComplete: () => fade.destroy() });

    // ── Header ──
    this.add
      .text(width / 2, 36, t('ui.deeds.title'), {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: highContrastUi ? '#ffe08a' : '#d4a017',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    const subKey = summary.earned === 0
      ? 'ui.deeds.sub_empty'
      : summary.earned === summary.total
        ? 'ui.deeds.sub_complete'
        : 'ui.deeds.sub_partial';
    this.add
      .text(width / 2, 70, t(subKey, { earned: summary.earned, total: summary.total }), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: summary.earned === summary.total ? '#f7d27a' : '#b8a88a',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: width - 60 },
      })
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
    // 3 columns × 3 rows layout. Each card = ~280px wide, 130px tall.
    // Panel grid spans y=104 to y=height-68 so back button fits below.
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
    const backBtn = this.add
      .rectangle(width / 2, height - 32, 200, 38, 0x252540, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, height - 32, t('ui.deeds.back'), {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#e8d4a0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(uiScale);
    backBtn.on('pointerover', () => backBtn.setFillStyle(0x2a2244));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x252540));
    backBtn.on('pointerdown', () => {
      audio.playClick();
      this.scene.start('MainMenu');
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      audio.playClick();
      this.scene.start('MainMenu');
    });

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
    const isInProgress = deed.status === 'in_progress';

    // Card background — gold-tinted for unlocked, cool slate for locked.
    const bgColor = isUnlocked ? 0x2a2015 : 0x10172a;
    const strokeColor = isUnlocked ? 0xd4a017 : isInProgress ? 0x3a5078 : 0x283a5f;
    this.add
      .rectangle(cx, cy, w, h, bgColor, 0.92)
      .setStrokeStyle(isUnlocked ? 2 : 1, strokeColor, isUnlocked ? 1 : 0.8);

    // Top row: icon + title
    const iconX = cx - w / 2 + 28;
    const iconY = cy - h / 2 + 28;
    const iconChar = isUnlocked ? '✦' : '○';
    const iconColor = isUnlocked ? '#f7d27a' : isInProgress ? '#6a7ba8' : '#3d4660';
    this.add
      .text(iconX, iconY, iconChar, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: iconColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    const titleColor = isUnlocked ? '#f5e1a6' : isInProgress ? '#c7d1e4' : '#6f7a94';
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
    const statusLabel = isUnlocked
      ? t('ui.deeds.status_unlocked')
      : isInProgress
        ? t('ui.deeds.status_in_progress')
        : t('ui.deeds.status_locked');
    const statusColor = isUnlocked ? '#9de6a8' : isInProgress ? '#a8b3c8' : '#596780';
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
    const descriptionText = (!isUnlocked && deed.isBinary)
      ? t('ui.deeds.locked_mystery')
      : t(def.descriptionKey);
    const descColor = isUnlocked ? '#cabfa0' : isInProgress ? '#95a0ba' : '#5a6478';
    this.add
      .text(cx - w / 2 + 14, cy - 4, descriptionText, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: descColor,
        fontStyle: (!isUnlocked && deed.isBinary) ? 'italic' : 'normal',
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
      const fillColor = isUnlocked ? 0xd4a017 : 0x4a6090;
      const fillWidth = Math.max(2, barWidth * deed.ratio);
      this.add
        .rectangle(barX + fillWidth / 2, barY, fillWidth, 4, fillColor, 1);
      // Numeric label
      this.add
        .text(cx, barY + 12, formatDeedProgressLabel(deed), {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: isUnlocked ? '#d4a017' : '#8a93a8',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScale(uiScale);
    }
  }
}
