import Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { getSettingsManager } from '../core/SettingsManager';
import { loadSave, MAX_RUN_HISTORY, type RunHistoryEntry } from '../utils/save';
import { SaveManager } from '../core/SaveManager';
import { getVariantByKey } from '../data/variants';
import { CURSES, getCurseByKey, setPendingCurse, type CurseKey } from '../data/curses';
import { encodeSeed } from '../utils/rng';
import { isReplayBlobAny, type ReplayBlobAny } from '../replay/replayBlob';
import {
  buildChronicleCodex,
  computeIronmoorStats,
  computeMilestones,
  computeMoorRoadKillCriteria,
  detectMood,
  formatClock,
  formatCodexNamesLine,
  formatDurationLong,
  formatIronmoorLine,
  formatMoorRoadStatus,
  formatStandingStonesLine,
  formatAncestralEchoesLine,
  formatPostBellLine,
  formatHearthBeatsLine,
  computeCurseStats,
  formatCurseStatsLine,
  computeStandingStonesStats,
  formatChronicleMilestoneLines,
  formatChronicleRunSubLine,
  formatRelativeTime,
  formatRerunTooltip,
  lifetimeTotals,
  moodColor,
  moodSubtitleKey,
  resolveChronicleMilestonesDensityStyle,
} from '../ui/chronicleAggregates';
import { paginationState } from '../ui/pagination';
import { resolveRerunLinkPalette } from './gameOverLinkPalette';
import { resolveChronicleRowVictoryStyle } from './chronicleRowVictoryStyle';
import { addSceneFadeIn, addAmberHeaderWash, addSceneBackdrop } from './sceneFade';
import { createBackButton } from './createBackButton';
import { sceneHeaderTextStyle, sceneSubtitleTextStyle } from './sceneHeaderStyle';
import { clickToScene } from './clickToScene';
import { stopAmbientWindOnShutdown } from './stopAmbientWindOnShutdown';

// Repeated text styles inside this scene — pinned so the row + pagination
// look stays in sync. Both small monospace bold strings used for header
// chips and pagination buttons / list section titles.
const CHRONICLE_PAGER_BTN_TEXT = {
  fontFamily: 'monospace', fontSize: '11px', color: '#cdd4e0', fontStyle: 'bold',
} as const;
const CHRONICLE_SECTION_HEADER_TEXT = {
  fontFamily: 'monospace', fontSize: '12px', color: '#7f8ca7',
  fontStyle: 'bold', letterSpacing: 1,
} as const;

/**
 * The Herd Chronicle — a run journal surface.
 *
 * Shows lifetime totals (authoritative from SaveData counters), notable
 * milestones extracted from the capped runHistory window, and a paginated
 * list of recent runs. The header/subtitle voice is mood-driven (Voice Card
 * Hearth vs Edge) — see chronicleAggregates.ts for the state machine.
 *
 * Non-goals: no run deletion, no time-range filters, no CSV export. The
 * chronicle is a cozy artifact, not a spreadsheet. Older entries fade per
 * MAX_RUN_HISTORY (FIFO) — the scene surfaces that transparently.
 *
 * Cull codex reads `codexCulledKeys` from the meta save (SaveManager), not
 * the gameplay gold/unlock save — same source as AchievementManager.
 */
export class ChronicleScene extends Phaser.Scene {
  // Layout constants — tuned so the full scene fits inside the 600px game
  // height without the runs panel or pagination escaping off-screen.
  // ROWS_PER_PAGE dropped 5→4 to make room for the larger milestones
  // panel (which now hosts 7+ optional sections: codex, moor road,
  // ironmoor, stones, echoes, post-bell, hearth beats, curses).
  private readonly ROWS_PER_PAGE = 4;
  private readonly ROW_STRIDE = 30;
  private readonly MILESTONES_PANEL_HEIGHT = 178;
  /** Below milestones + codex block — keep clearance above pagination + BACK. */
  private readonly RUNS_HEADER_Y = 398;
  private readonly ROWS_START_Y = this.RUNS_HEADER_Y + 20; // row y = start + 16 + i*stride
  private readonly ROWS_PANEL_HEIGHT = this.ROWS_PER_PAGE * this.ROW_STRIDE + 18;
  private readonly ROWS_PANEL_CENTER_Y = this.ROWS_START_Y + this.ROWS_PANEL_HEIGHT / 2 - 6;
  private readonly PAGINATION_Y = this.ROWS_PANEL_CENTER_Y + this.ROWS_PANEL_HEIGHT / 2 + 14;
  private page = 0;
  private runRowObjects: Phaser.GameObjects.GameObject[] = [];
  private history: RunHistoryEntry[] = [];
  private pageLabel!: Phaser.GameObjects.Text;
  private prevBtn!: Phaser.GameObjects.Rectangle;
  private nextBtn!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'Chronicle' });
  }

  create(): void {
    const { width, height } = this.scale;
    const { uiScale, highContrastUi } = getSettingsManager().load();
    const save = loadSave();
    const metaSave = new SaveManager().load();
    // Newest-first for display; source list is newest-last.
    this.history = [...save.runHistory].reverse();
    const totals = lifetimeTotals(save);
    const milestones = computeMilestones(save.runHistory);
    const mood = detectMood(save.runHistory);

    addSceneBackdrop(this);
    // Warm amber wash at the top — matches MetaShop's cozy framing
    addAmberHeaderWash(this);

    audio.startAmbientWind();
    addSceneFadeIn(this);

    // ── Header ──
    this.add
      .text(width / 2, 36, t('ui.chronicle.title'),
        sceneHeaderTextStyle('30px', highContrastUi ? '#ffe08a' : COLORS_CSS.WHISKY_GOLD))
      .setOrigin(0.5)
      .setScale(uiScale);

    this.add
      .text(width / 2, 70, t(moodSubtitleKey(mood)),
        sceneSubtitleTextStyle(moodColor(mood), width))
      .setOrigin(0.5)
      .setScale(uiScale);

    // ── Lifetime panel ──
    const lifetimePanelY = 118;
    this.add
      .rectangle(width / 2, lifetimePanelY + 38, width - 40, 94, 0x11182a, 0.7)
      .setStrokeStyle(1, 0x2d3e62, 0.8);
    this.add
      .text(width / 2, lifetimePanelY, t('ui.chronicle.lifetime_heading'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#7f8ca7',
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    // 3 columns × 3 rows of lifetime stats
    const statCellWidth = (width - 120) / 3;
    const statStartX = 60 + statCellWidth / 2;
    const cells: { label: string; value: string }[] = [
      { label: t('ui.chronicle.stat_runs'), value: `${totals.totalRuns}` },
      { label: t('ui.chronicle.stat_victories'), value: `${totals.victories}` },
      { label: t('ui.chronicle.stat_win_rate'), value: `${Math.round(totals.winRate * 100)}%` },
      { label: t('ui.chronicle.stat_total_culls'), value: `${totals.totalKills}` },
      { label: t('ui.chronicle.stat_total_gold'), value: `${totals.totalGold}` },
      { label: t('ui.chronicle.stat_time_on_moor'), value: formatDurationLong(totals.timeOnMoorSec) },
      { label: t('ui.chronicle.stat_best_time'), value: formatClock(totals.bestTimeSec) },
      { label: t('ui.chronicle.stat_best_kills'), value: `${totals.bestKills}` },
      { label: t('ui.chronicle.stat_best_combo'), value: `${totals.bestCombo}x` },
    ];
    for (let i = 0; i < cells.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = statStartX + col * statCellWidth;
      const cy = lifetimePanelY + 24 + row * 22;
      this.add
        .text(cx, cy, `${cells[i].label}: `, {
          fontFamily: 'monospace', fontSize: '11px', color: '#7f8ca7',
        })
        .setOrigin(1, 0.5)
        .setScale(uiScale);
      this.add
        .text(cx + 2, cy, cells[i].value, {
          fontFamily: 'monospace', fontSize: '12px', color: '#e4e9f0', fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setScale(uiScale);
    }

    // ── Milestones panel ──
    const milestonesPanelY = 232;
    this.add
      .rectangle(width / 2, milestonesPanelY + 65, width - 40, this.MILESTONES_PANEL_HEIGHT, 0x12192b, 0.7)
      .setStrokeStyle(1, 0x283a5f, 0.8);
    this.add
      .text(width / 2, milestonesPanelY, t('ui.chronicle.milestones_heading'), CHRONICLE_SECTION_HEADER_TEXT)
      .setOrigin(0.5)
      .setScale(uiScale);
    const codex = buildChronicleCodex(metaSave.codexCulledKeys);
    const codexSection =
      '\n\n' +
      t('ui.chronicle.codex_heading') +
      '\n' +
      t('ui.chronicle.codex_progress', {
        discovered: codex.discoveredCount,
        total: codex.rosterTotal,
      }) +
      '\n' +
      (codex.discoveredCount > 0
        ? formatCodexNamesLine(codex.discoveredNames)
        : t('ui.chronicle.codex_empty'));

    // W2 Moor Road status — appended only when at least one W2 run exists.
    // formatMoorRoadStatus returns blank when w2Runs === 0, so pre-W2 saves
    // see nothing extra.
    const moorRoad = formatMoorRoadStatus(computeMoorRoadKillCriteria(save.runHistory));
    const moorRoadSection = moorRoad.line ? `\n\n${moorRoad.line}` : '';

    // W66 Ironmoor lifetime stats — silent when the player has never
    // taken an Ironmoor run, so there's no empty chrome on fresh saves.
    const ironmoor = formatIronmoorLine(
      computeIronmoorStats(save.runHistory),
      save.bestIronmoorSeconds ?? 0,
    );
    const ironmoorSection = ironmoor ? `\n${ironmoor}` : '';

    // Standing Stones + Ancestral Echoes — silent when the player
    // has never interacted with either mechanic, so fresh saves see
    // no empty chrome.
    const stonesLine = formatStandingStonesLine(computeStandingStonesStats(save));
    const stonesSection = stonesLine ? `\n${stonesLine}` : '';
    const echoesLine = formatAncestralEchoesLine(save);
    const echoesSection = echoesLine ? `\n${echoesLine}` : '';
    const postBellLine = formatPostBellLine(save);
    const postBellSection = postBellLine ? `\n${postBellLine}` : '';
    const hearthLine = formatHearthBeatsLine(metaSave.moorMomentsLifetime ?? 0);
    const hearthSection = hearthLine ? `\n${hearthLine}` : '';
    const curseLine = formatCurseStatsLine(computeCurseStats(save.runHistory), CURSES.length);
    const curseSection = curseLine ? `\n${curseLine}` : '';

    const milestoneLines = this.buildMilestoneLines(milestones) + codexSection + moorRoadSection + ironmoorSection + stonesSection + echoesSection + postBellSection + hearthSection + curseSection;
    // Optional sections grow over a player's lifetime — tighten font +
    // line spacing once content gets dense so the panel still fits.
    // The threshold is generous (~12 lines) so casual saves keep the
    // larger, friendlier 12px size.
    const density = resolveChronicleMilestonesDensityStyle(milestoneLines.split('\n').length);
    this.add
      .text(width / 2, milestonesPanelY + 22, milestoneLines, {
        fontFamily: 'monospace',
        fontSize: density.fontSize,
        color: '#c4cdd8',
        align: 'center',
        lineSpacing: density.lineSpacing,
        wordWrap: { width: width - 80 },
      })
      .setOrigin(0.5, 0)
      .setScale(uiScale);

    // ── Run list header ──
    const runsHeaderY = this.RUNS_HEADER_Y;
    this.add
      .text(40, runsHeaderY, t('ui.chronicle.runs_heading'), CHRONICLE_SECTION_HEADER_TEXT)
      .setOrigin(0, 0.5)
      .setScale(uiScale);
    if (this.history.length >= MAX_RUN_HISTORY) {
      this.add
        .text(width - 40, runsHeaderY, t('ui.chronicle.runs_cap_note', { max: MAX_RUN_HISTORY }), {
          fontFamily: 'monospace', fontSize: '10px', color: '#596780', fontStyle: 'italic',
        })
        .setOrigin(1, 0.5)
        .setScale(uiScale);
    }

    // ── Run list rows (paginated) ──
    this.add
      .rectangle(width / 2, this.ROWS_PANEL_CENTER_Y, width - 40, this.ROWS_PANEL_HEIGHT, 0x0f1828, 0.7)
      .setStrokeStyle(1, 0x243552, 0.8);

    // Page controls (only wired if >ROWS_PER_PAGE entries)
    const paginationY = this.PAGINATION_Y;
    this.prevBtn = this.add
      .rectangle(width / 2 - 120, paginationY, 72, 24, 0x252540, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2 - 120, paginationY, t('ui.chronicle.prev'), CHRONICLE_PAGER_BTN_TEXT)
      .setOrigin(0.5).setScale(uiScale);
    this.prevBtn.on('pointerdown', () => this.turnPage(-1));

    this.nextBtn = this.add
      .rectangle(width / 2 + 120, paginationY, 72, 24, 0x252540, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2 + 120, paginationY, t('ui.chronicle.next'), CHRONICLE_PAGER_BTN_TEXT)
      .setOrigin(0.5).setScale(uiScale);
    this.nextBtn.on('pointerdown', () => this.turnPage(1));

    this.pageLabel = this.add
      .text(width / 2, paginationY, '', {
        fontFamily: 'monospace', fontSize: '11px', color: '#8a93a8',
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    this.renderRunsPage(this.ROWS_START_Y, width, uiScale);

    // ── Back button ──
    const backY = height - 18;
    const backBtn = createBackButton(this, {
      x: width / 2, y: backY, width: 180, height: 30,
      label: t('ui.chronicle.back'), fontSize: '14px', uiScale,
    });
    const goBack = clickToScene(this, 'MainMenu');
    backBtn.on('pointerdown', goBack);

    this.input.keyboard?.on('keydown-ESC', goBack);

    stopAmbientWindOnShutdown(this);
  }

  /**
   * Clicking a Chronicle row's ↻ glyph starts a fresh Game scene
   * seeded with that entry's runSeed and its original variant. Any
   * suspended active run is cleared first (matches the "Play Again"
   * path on GameOverScene) so the new run isn't treated as a resume.
   *
   * If the original run bore a curse, the rerun re-applies it via
   * the pending-curse singleton — otherwise a "rerun cursed seed"
   * silently dropped the curse and gave the player an easier rerun
   * than the original (and a visibly different boss/spawn cadence).
   */
  private rerunSeed(seed: number, variantKey: string, curseKey?: string): void {
    audio.playClick();
    try { new SaveManager().clearActiveRun(); } catch { /* best-effort */ }
    const def = getCurseByKey(curseKey ?? null);
    setPendingCurse(def ? (def.key as CurseKey) : null);
    this.scene.start('Game', { seed, forceVariantKey: variantKey });
  }

  /**
   * T1 replay — launches GameScene with a recorded blob. The blob's
   * metadata overrides any seed / variant the caller might have
   * supplied (see `GameScene.init`). On playback end, GameScene
   * restarts this Chronicle scene.
   */
  private watchReplay(replay: ReplayBlobAny): void {
    audio.playClick();
    try { new SaveManager().clearActiveRun(); } catch { /* best-effort */ }
    // Replay mode ignores the curse pending singleton — the recorded
    // modifiers are already baked into the seeded RNG stream. V1
    // limitation: mid-run curse effects aren't perfectly reproduced,
    // documented in ADR-0002.
    setPendingCurse(null);
    this.scene.start('Game', { replay });
  }

  private turnPage(delta: number): void {
    const pagination = paginationState(this.history.length, this.ROWS_PER_PAGE, this.page + delta);
    if (pagination.clampedPage === this.page) return;
    this.page = pagination.clampedPage;
    audio.playClick();
    const { width } = this.scale;
    const { uiScale } = getSettingsManager().load();
    this.renderRunsPage(this.ROWS_START_Y, width, uiScale);
  }

  private renderRunsPage(startY: number, width: number, uiScale: number): void {
    for (const o of this.runRowObjects) o.destroy();
    this.runRowObjects = [];

    if (this.history.length === 0) {
      const empty = this.add
        .text(width / 2, startY + 120, t('ui.chronicle.runs_empty'), {
          fontFamily: 'monospace', fontSize: '14px', color: '#8a93a8', fontStyle: 'italic',
          align: 'center', wordWrap: { width: width - 80 },
        })
        .setOrigin(0.5)
        .setScale(uiScale);
      this.runRowObjects.push(empty);
      this.pageLabel.setText('');
      this.prevBtn.setVisible(false);
      this.nextBtn.setVisible(false);
      return;
    }

    const pagination = paginationState(this.history.length, this.ROWS_PER_PAGE, this.page);
    const slice = this.history.slice(pagination.startIndex, pagination.endIndex);

    slice.forEach((entry, i) => {
      const y = startY + 16 + i * this.ROW_STRIDE;
      const isVictory = entry.isVictory;
      const rowBg = this.add
        .rectangle(width / 2, y, width - 60, this.ROW_STRIDE - 4, isVictory ? 0x3a2e12 : 0x161e2e, 0.85)
        .setStrokeStyle(1, isVictory ? 0xb48a2a : 0x2a3550, 0.7);
      this.runRowObjects.push(rowBg);

      // Variant sprite (small, as identity anchor)
      const variant = getVariantByKey(entry.variantKey);
      if (this.textures.exists(variant.textureKey)) {
        const sprite = this.add
          .sprite(50, y, variant.textureKey)
          .setScale(0.95 * uiScale)
          .setDepth(1);
        this.runRowObjects.push(sprite);
      }

      // Outcome badge + row colour bundle.
      const rowStyle = resolveChronicleRowVictoryStyle(isVictory);
      const badge = this.add
        .text(88, y, rowStyle.badgeLabel, {
          fontFamily: 'monospace', fontSize: '11px',
          color: rowStyle.badgeColor,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setScale(uiScale);
      this.runRowObjects.push(badge);

      // Main line: time · kills · level · variant
      const rowKey = isVictory ? 'ui.chronicle.run_row_victory' : 'ui.chronicle.run_row_defeat';
      const mainLine = t(rowKey, {
        time: formatClock(entry.timeSurvivedSec),
        kills: entry.enemiesKilled,
        level: entry.level,
        variant: t(variant.nameKey),
      });
      const main = this.add
        .text(150, y - 8, mainLine, {
          fontFamily: 'monospace', fontSize: '13px',
          color: rowStyle.mainColor,
          fontStyle: rowStyle.mainFontStyle,
        })
        .setOrigin(0, 0.5)
        .setScale(uiScale);
      this.runRowObjects.push(main);

      // Weapon chips (first 4 keys) + bosses + combo [+ route trail].
      const subLine = formatChronicleRunSubLine(entry);
      const sub = this.add
        .text(150, y + 8, subLine, {
          fontFamily: 'monospace', fontSize: '10px',
          color: '#8a93a8',
          wordWrap: { width: width - 260 },
        })
        .setOrigin(0, 0.5)
        .setScale(uiScale);
      this.runRowObjects.push(sub);

      // Right side: relative timestamp
      const rel = this.add
        .text(width - 40, y, formatRelativeTime(entry.timestamp), {
          fontFamily: 'monospace', fontSize: '11px', color: '#596780', fontStyle: 'italic',
        })
        .setOrigin(1, 0.5)
        .setScale(uiScale);
      this.runRowObjects.push(rel);

      // W66 Ironmoor badge — short "⚔" chip on the right side of the
      // row. Coexists with the curse chip (different x-slots: ironmoor
      // sits further left at width-180, curse at width-92), so a cursed
      // ironmoor row shows both badges side-by-side.
      if (entry.ironmoor) {
        const imBadge = this.add
          .text(width - 180, y, '⚔', {
            fontFamily: 'monospace', fontSize: '13px', color: '#c8a0a0', fontStyle: 'bold',
          })
          .setOrigin(1, 0.5)
          .setScale(uiScale);
        this.runRowObjects.push(imBadge);
      }

      // Curse badge — sits just left of the timestamp for rows that bore a
      // curse. Stays compact (~70px) so it never crowds the variant/weapon
      // line. Rose-pink tint matches the CurseScene accent.
      const curseDef = getCurseByKey(entry.curseKey);
      if (curseDef) {
        const badge = this.add
          .text(width - 92, y, t('ui.chronicle.run_curse_chip', { curse: t(curseDef.nameKey) }), {
            fontFamily: 'monospace', fontSize: '10px', color: '#e8a0c6', fontStyle: 'bold',
          })
          .setOrigin(1, 0.5)
          .setScale(uiScale);
        this.runRowObjects.push(badge);
      }

      // Rerun-this-seed button — only shows on rows with a persisted
      // runSeed (V8+). Left-of-timestamp, hover-brightens + shows a
      // small tooltip with the seed code so players know what they're
      // rerunning before they click.
      if (typeof entry.runSeed === 'number') {
        const seedCode = encodeSeed(entry.runSeed);
        const tooltipCurseLabel = curseDef ? t(curseDef.nameKey) : null;
        const tooltipText = formatRerunTooltip(seedCode, tooltipCurseLabel);
        const rerunPalette = resolveRerunLinkPalette();
        const rerun = this.add
          .text(width - 160, y, '↻', {
            fontFamily: 'monospace', fontSize: '18px', color: rerunPalette.idle, fontStyle: 'bold',
          })
          .setOrigin(1, 0.5)
          .setScale(uiScale)
          .setInteractive({ useHandCursor: true });
        let tooltip: Phaser.GameObjects.Text | null = null;
        const showTooltip = () => {
          rerun.setColor(rerunPalette.hover);
          if (tooltip) return;
          tooltip = this.add.text(width - 170, y, tooltipText, {
            fontFamily: 'monospace', fontSize: '10px', color: rerunPalette.idle, fontStyle: 'italic',
          }).setOrigin(1, 0.5).setScale(uiScale).setDepth(10);
          this.runRowObjects.push(tooltip);
        };
        const hideTooltip = () => {
          rerun.setColor(rerunPalette.idle);
          if (tooltip) {
            tooltip.destroy();
            tooltip = null;
          }
        };
        rerun.on('pointerover', showTooltip);
        rerun.on('pointerout', hideTooltip);
        rerun.on('pointerdown', () => {
          hideTooltip();
          this.rerunSeed(entry.runSeed!, entry.variantKey, entry.curseKey);
        });
        this.runRowObjects.push(rerun);
      }

      // T1 replay — watch this entry's recorded run. Only appears when
      // the entry carries a valid blob (record mode was on for the
      // original run). Placed left of the rerun glyph so the two live
      // together as a "revisit this run" cluster.
      if (entry.replay && isReplayBlobAny(entry.replay)) {
        const replay = entry.replay;
        const rerunPalette = resolveRerunLinkPalette();
        const watch = this.add
          .text(width - 195, y, t('ui.replay.chronicle_watch_glyph'), {
            fontFamily: 'monospace', fontSize: '14px', color: rerunPalette.idle, fontStyle: 'bold',
          })
          .setOrigin(1, 0.5)
          .setScale(uiScale)
          .setInteractive({ useHandCursor: true });
        let watchTip: Phaser.GameObjects.Text | null = null;
        const showWatchTip = () => {
          watch.setColor(rerunPalette.hover);
          if (watchTip) return;
          watchTip = this.add.text(width - 205, y, t('ui.replay.chronicle_watch_tooltip'), {
            fontFamily: 'monospace', fontSize: '10px', color: rerunPalette.idle, fontStyle: 'italic',
          }).setOrigin(1, 0.5).setScale(uiScale).setDepth(10);
          this.runRowObjects.push(watchTip);
        };
        const hideWatchTip = () => {
          watch.setColor(rerunPalette.idle);
          if (watchTip) {
            watchTip.destroy();
            watchTip = null;
          }
        };
        watch.on('pointerover', showWatchTip);
        watch.on('pointerout', hideWatchTip);
        watch.on('pointerdown', () => {
          hideWatchTip();
          this.watchReplay(replay);
        });
        this.runRowObjects.push(watch);
      }
    });

    if (pagination.pageVisible) {
      this.pageLabel.setText(pagination.pageLabel);
      this.prevBtn.setVisible(true);
      this.nextBtn.setVisible(true);
      this.prevBtn.setAlpha(pagination.prevEnabled ? 1 : 0.4);
      this.nextBtn.setAlpha(pagination.nextEnabled ? 1 : 0.4);
    } else {
      this.pageLabel.setText('');
      this.prevBtn.setVisible(false);
      this.nextBtn.setVisible(false);
    }
  }

  private buildMilestoneLines(m: ReturnType<typeof computeMilestones>): string {
    return formatChronicleMilestoneLines(m).join('\n');
  }
}

