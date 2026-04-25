import * as Phaser from 'phaser';
import { COLORS_CSS } from '../config';
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
import { stopAmbientWindOnShutdown } from './stopAmbientWindOnShutdown';
import {
  resolveSceneReturnTarget,
  type SceneReturnData,
  type SceneReturnTarget,
} from './returnTarget';

/**
 * Browse screen for achievements ("deeds"). Shows every defined deed with
 * its unlock status, and — for threshold deeds — a live progress bar
 * computed from both save layers (meta kills + gameplay bestTime/victories).
 *
 * Binary deeds (taxman, first evolution, all-bosses) intentionally hide
 * progress to preserve first-unlock surprise; the scene labels them
 * "a rumour on the moor" instead of revealing triggers.
 */
/**
 * Cards per page. 3 cols × 4 rows = 12 cards × ~125 px row height @ 720p,
 * which fits the title + word-wrapped description + progress label without
 * the row-overlap collision the un-paginated 10-row layout produced.
 */
const DEEDS_CARDS_PER_PAGE = 12;

export class DeedsScene extends Phaser.Scene {
  private saveManager = new SaveManager();
  private returnTo: SceneReturnTarget = 'MainMenu';
  private currentPage = 0;
  private pageElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'Deeds' });
  }

  init(data?: SceneReturnData): void {
    this.returnTo = resolveSceneReturnTarget(data?.returnTo);
    this.currentPage = 0;
    this.pageElements = [];
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
      cursedVictoriesCompleted: gameplay.cursedVictoriesCompleted ?? 0,
      runsWithoutHealingCircleCompleted: gameplay.runsWithoutHealingCircleCompleted ?? 0,
      runsInCoastalOnlyCompleted: gameplay.runsInCoastalOnlyCompleted ?? 0,
      runsWithAllEvolutionsCompleted: gameplay.runsWithAllEvolutionsCompleted ?? 0,
      burnsNightFullEvoRunsCompleted: gameplay.burnsNightFullEvoRunsCompleted ?? 0,
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
        sceneHeaderTextStyle(highContrastUi ? '#ffe08a' : COLORS_CSS.WHISKY_GOLD))
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
        color: COLORS_CSS.WHISKY_GOLD,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    // ── Deed grid (paginated) ──
    // Pre-pagination the 28-deed list packed 10 rows into the gridHeight,
    // collapsing rowHeight below 50 px and forcing the title text to render
    // at the same Y as the description hint. Capping the page at 12 keeps
    // rowHeight ≥ 120 px @ 720p so title + desc + progress all sit in their
    // own bands.
    const cols = uiScale > 1.2 ? 2 : 3;
    const cardsPerPage = DEEDS_CARDS_PER_PAGE;
    const totalPages = Math.max(1, Math.ceil(deeds.length / cardsPerPage));

    // ── Back button ──
    const backBtn = createBackButton(this, {
      x: width / 2, y: height - 32, width: 200, height: 38,
      label: t('ui.deeds.back'), fontSize: '15px', uiScale,
    });
    const goBack = () => {
      audio.playClick();
      this.scene.start(this.returnTo);
    };
    backBtn.on('pointerdown', goBack);
    this.input.keyboard?.on('keydown-ESC', goBack);

    const renderPage = (page: number): void => {
      // Tear down prior page's transient elements (cards + page nav).
      for (const el of this.pageElements) el.destroy();
      this.pageElements = [];

      const start = page * cardsPerPage;
      const slice = deeds.slice(start, start + cardsPerPage);
      const rows = Math.max(1, Math.ceil(slice.length / cols));

      const gridTop = 104;
      const gridBottom = height - 96; // reserve room for page nav + BACK
      const gridHeight = gridBottom - gridTop;
      const horizontalMargin = 24;
      const gutter = 14;
      const colWidth = (width - horizontalMargin * 2 - gutter * (cols - 1)) / cols;
      const rowHeight = (gridHeight - gutter * (rows - 1)) / rows;

      slice.forEach((deed, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const cx = horizontalMargin + colWidth / 2 + col * (colWidth + gutter);
        const cy = gridTop + rowHeight / 2 + row * (rowHeight + gutter);
        this.drawDeedCard(deed, cx, cy, colWidth, rowHeight, uiScale);
      });

      if (totalPages > 1) {
        const navY = height - 70;
        const indicator = this.add
          .text(width / 2, navY, `${page + 1} / ${totalPages}`, {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: COLORS_CSS.WHISKY_GOLD,
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setScale(uiScale);
        this.pageElements.push(indicator);

        const prevHit = this.add
          .rectangle(width / 2 - 76, navY, 32, 28, 0x11182a, 0.6)
          .setStrokeStyle(1, 0x355079, 1)
          .setInteractive({ useHandCursor: true });
        const prevLabel = this.add
          .text(width / 2 - 76, navY, '◀', {
            fontFamily: 'monospace', fontSize: '14px',
            color: page > 0 ? COLORS_CSS.WHISKY_GOLD : '#586075',
          })
          .setOrigin(0.5)
          .setScale(uiScale);
        prevHit.on('pointerdown', () => {
          if (page > 0) {
            audio.playClick();
            this.currentPage = page - 1;
            renderPage(this.currentPage);
          }
        });
        this.pageElements.push(prevHit, prevLabel);

        const nextHit = this.add
          .rectangle(width / 2 + 76, navY, 32, 28, 0x11182a, 0.6)
          .setStrokeStyle(1, 0x355079, 1)
          .setInteractive({ useHandCursor: true });
        const nextLabel = this.add
          .text(width / 2 + 76, navY, '▶', {
            fontFamily: 'monospace', fontSize: '14px',
            color: page < totalPages - 1 ? COLORS_CSS.WHISKY_GOLD : '#586075',
          })
          .setOrigin(0.5)
          .setScale(uiScale);
        nextHit.on('pointerdown', () => {
          if (page < totalPages - 1) {
            audio.playClick();
            this.currentPage = page + 1;
            renderPage(this.currentPage);
          }
        });
        this.pageElements.push(nextHit, nextLabel);
      }
    };

    renderPage(this.currentPage);

    // Arrow keys for page nav.
    this.input.keyboard?.on('keydown-LEFT', () => {
      if (this.currentPage > 0) {
        audio.playClick();
        this.currentPage--;
        renderPage(this.currentPage);
      }
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      if (this.currentPage < totalPages - 1) {
        audio.playClick();
        this.currentPage++;
        renderPage(this.currentPage);
      }
    });

    stopAmbientWindOnShutdown(this);
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
    const track = (obj: Phaser.GameObjects.GameObject) => {
      this.pageElements.push(obj);
      return obj;
    };

    // Card background — gold-tinted for unlocked, cool slate for locked.
    track(this.add
      .rectangle(cx, cy, w, h, palette.bgColor, 0.92)
      .setStrokeStyle(palette.strokeWidth, palette.strokeColor, palette.strokeAlpha));

    // Top row: icon + title. Card-edge offsets scale with uiScale so the
    // scaled icon/title sit the same visual distance from the card border
    // at every comfort setting (old fixed +28 ate into the description
    // band at 1.4x because scaled icon glyph + title line-height
    // pushed below the anchor faster than the offset).
    const iconX = cx - w / 2 + Math.round(28 * uiScale);
    const iconY = cy - h / 2 + Math.round(28 * uiScale);
    track(this.add
      .text(iconX, iconY, palette.iconChar, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: palette.iconColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(uiScale));

    const titleColor = palette.titleColor;
    // Reserve space for the top-right status tag — "IN PROGRESS" at 9px
    // monospace scales to ~91px wide at uiScale 1.4, so the old `w - 120`
    // cap let long titles collide with the status chip. `w - 170` keeps
    // title right-edge clear at every uiScale. X offset from icon scales
    // so the title reading edge tracks the scaled icon glyph.
    track(this.add
      .text(iconX + Math.round(22 * uiScale), iconY - Math.round(10 * uiScale), t(def.titleKey), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: titleColor,
        fontStyle: 'bold',
        wordWrap: { width: Math.max(50, (w - 170) / Math.max(1, uiScale)) },
      })
      .setOrigin(0, 0.5)
      .setScale(uiScale));

    // Status tag (top-right) — corner inset scales so the 9px→13px scaled
    // label doesn't drift off the card edge.
    const statusLabel = deed.status === 'unlocked'
      ? t('ui.deeds.status_unlocked')
      : deed.status === 'in_progress'
        ? t('ui.deeds.status_in_progress')
        : t('ui.deeds.status_locked');
    const statusColor = palette.statusColor;
    track(this.add
      .text(cx + w / 2 - Math.round(14 * uiScale), cy - h / 2 + Math.round(16 * uiScale), statusLabel, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: statusColor,
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(1, 0)
      .setScale(uiScale));

    // Description OR mystery hint for binary locked deeds. Left inset
    // scales with uiScale so the scaled text doesn't appear jammed into
    // the card border at 1.4x. Y offset stays near card center — desc
    // spans vertically from title bottom to progress bar top.
    const desc = resolveDeedDescription({
      status: deed.status,
      isBinary: deed.isBinary,
      fullDescription: t(def.descriptionKey),
      mysteryHint: t('ui.deeds.locked_mystery'),
    });
    const descColor = palette.descColor;
    // Description sits TOP-anchored just below the title baseline. Pre-fix
    // it used origin (0, 0.5) anchored to cy, which placed it ON the same
    // band as the title at small row heights — the un-paginated 10-row
    // layout produced rowHeight ≈ 42 px and the title + desc text bands
    // overlapped. Pagination keeps rowHeight ≈ 125 px, but anchoring desc
    // top below the icon band makes the rule hold even if the deed list
    // grows.
    const descTopY = iconY + Math.round(14 * uiScale);
    track(this.add
      .text(cx - w / 2 + Math.round(14 * uiScale), descTopY, desc.text, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: descColor,
        fontStyle: desc.italic ? 'italic' : 'normal',
        wordWrap: { width: Math.max(60, (w - 28) / Math.max(1, uiScale)) },
      })
      .setOrigin(0, 0)
      .setScale(uiScale));

    // Progress bar (bottom) — threshold deeds only. Bottom-edge offset
    // scales so the scaled progress label sitting 12px below the bar
    // doesn't spill past the card floor at 1.4x.
    if (!deed.isBinary) {
      const barY = cy + h / 2 - Math.round(18 * uiScale);
      const barMargin = 14;
      const barWidth = w - barMargin * 2;
      const barX = cx - barWidth / 2;
      // Track
      track(this.add
        .rectangle(cx, barY, barWidth, 6, 0x0a1020, 1)
        .setStrokeStyle(1, 0x243552, 1));
      // Fill
      const barStyle = resolveDeedProgressBarStyle(isUnlocked);
      const fillWidth = Math.max(2, barWidth * deed.ratio);
      track(this.add
        .rectangle(barX + fillWidth / 2, barY, fillWidth, 4, barStyle.fillColor, 1));
      // Numeric label — offset from bar scales so scaled 10px label
      // clears the bar fill without crushing against the card edge.
      track(this.add
        .text(cx, barY + Math.round(12 * uiScale), formatDeedProgressLabel(deed), {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: barStyle.labelColor,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScale(uiScale));
    }
  }
}
