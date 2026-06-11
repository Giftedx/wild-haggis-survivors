import * as Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { getSettingsManager } from '../core/SettingsManager';
import { loadSave, MAX_RUN_HISTORY, type RunHistoryEntry } from '../utils/save';
import { SaveManager } from '../core/SaveManager';
import { getVariantByKey } from '../data/variants';
import { CURSES, getCurseByKey, type CurseKey } from '../data/curses';
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
import { createPaginationNav, type PaginationNavHandle } from '../ui/gamePagination';
import { resolveRerunLinkPalette } from './gameOverLinkPalette';
import { resolveChronicleRowVictoryStyle } from './chronicleRowVictoryStyle';
import { buildSporranPipsForChronicle } from './chronicleSporranPips';
import { addSceneFadeIn, addAmberHeaderWash, addSceneBackdrop } from './sceneFade';
import { createBackButton } from './createBackButton';
import { sceneHeaderTextStyle, sceneSubtitleTextStyle } from './sceneHeaderStyle';
import {
  computeRelicHistogram,
  formatRelicHistogramRow,
} from './game/relicHistogram';
import { stopAmbientWindOnShutdown } from './stopAmbientWindOnShutdown';
import {
  resolveSceneReturnTarget,
  returnTargetData,
  type SceneReturnData,
  type SceneReturnTarget,
} from './returnTarget';
import { createDomFocusLayer, type DomFocusAction, type DomFocusLayer } from '../ui/domFocusLayer';
import { GamepadMenuNav, type GamepadMenuEntry } from '../utils/GamepadMenuNav';
import { bindHubMenuKeyboardNav } from '../ui/hubMenuKeyboardNav';

// Repeated text styles inside this scene — pinned so the row section
// header look stays in sync.
const CHRONICLE_SECTION_HEADER_TEXT = {
  fontFamily: 'monospace', fontSize: '12px', color: COLORS_CSS.TEXT_SUBTITLE,
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
  /** Base row stride at uiScale 1.0 — 13px main + 10px sub text stack
   *  comfortably inside 30px. Multiplied by uiScale in create() so
   *  uiScale 1.4 rows (18px+14px) don't overlap neighbours. */
  private readonly BASE_ROW_STRIDE = 30;
  private readonly MILESTONES_PANEL_HEIGHT = 178;
  /** Below milestones + codex block — keep clearance above pagination + BACK. */
  private readonly RUNS_HEADER_Y = 398;
  /** Runtime-computed row layout — populated in create() from uiScale so
   *  accessibility scaling grows the rows + panel together instead of
   *  letting scaled badges/text overlap neighbour rows. */
  private ROW_STRIDE = 30;
  private ROWS_START_Y = 418;
  private ROWS_PANEL_HEIGHT = 138;
  private ROWS_PANEL_CENTER_Y = 481;
  private PAGINATION_Y = 564;
  /** Runtime pagination Y — clamped in create() so short viewports keep
   *  the pagination row clear of the back button at `height - 18`. */
  private paginationY = 564;
  private page = 0;
  private runRowObjects: Phaser.GameObjects.GameObject[] = [];
  private history: RunHistoryEntry[] = [];
  private paginationNav: PaginationNavHandle = { destroy: () => {}, prevRect: null, nextRect: null };
  private domFocusLayer: DomFocusLayer | null = null;
  private gamepadNav: GamepadMenuNav | null = null;
  private hubKeyboardUnbind?: () => void;
  private chronicleEscHandler?: () => void;
  private chronicleAlmanacNavRect: Phaser.GameObjects.Rectangle | null = null;
  private chronicleBackRect: Phaser.GameObjects.Rectangle | null = null;
  private chronicleRowNavHits: Array<{
    rect: Phaser.GameObjects.Rectangle;
    label: string;
    entry: RunHistoryEntry;
  }> = [];
  private returnTo: SceneReturnTarget = 'MainMenu';

  constructor() {
    super({ key: 'Chronicle' });
  }

  init(data?: SceneReturnData): void {
    this.returnTo = resolveSceneReturnTarget(data?.returnTo);
  }

  create(): void {
    const { width, height } = this.scale;
    const { uiScale, highContrastUi } = getSettingsManager().load();
    // Scale row stride + panel dims with uiScale so 1.4x text doesn't
    // overlap neighbour rows. Stays readonly-equivalent — set once per
    // create() before any layout consumer reads them.
    const scaleClamp = Math.max(1, uiScale);
    this.ROW_STRIDE = Math.round(this.BASE_ROW_STRIDE * scaleClamp);
    // Push the RECENT RUNS header lower on mobile so it clears the
    // taller single-column lifetime + milestones stack (audit 09f).
    const computedRunsHeaderY = width < 600 ? this.RUNS_HEADER_Y + 110 : this.RUNS_HEADER_Y;
    this.ROWS_START_Y = computedRunsHeaderY + 20;
    this.ROWS_PANEL_HEIGHT = this.ROWS_PER_PAGE * this.ROW_STRIDE + 18;
    this.ROWS_PANEL_CENTER_Y = this.ROWS_START_Y + this.ROWS_PANEL_HEIGHT / 2 - 6;
    this.PAGINATION_Y = this.ROWS_PANEL_CENTER_Y + this.ROWS_PANEL_HEIGHT / 2 + 14;
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
        sceneHeaderTextStyle(highContrastUi ? '#ffe08a' : COLORS_CSS.WHISKY_GOLD))
      .setOrigin(0.5)
      .setScale(uiScale);

    this.add
      .text(width / 2, 70, t(moodSubtitleKey(mood)),
        sceneSubtitleTextStyle(moodColor(mood), width))
      .setOrigin(0.5)
      .setScale(uiScale);

    // ── Cross-link: Highland Almanac ──
    // Top-right corner — subtle italic link. The Chronicle's Cull Codex
    // section is a subset of what the Almanac surfaces (full beasties +
    // weys + finds + banter), so players who want depth get a one-click
    // jump across.
    const goAlmanac = () => {
      audio.playClick();
      this.scene.start('Almanac', returnTargetData(this.returnTo));
    };
    const almanacLink = this.add
      .text(width - 40, 36, t('ui.chronicle.view_almanac'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: COLORS_CSS.TEXT_SUBTITLE,
        fontStyle: 'italic',
      })
      .setOrigin(1, 0.5)
      .setScale(uiScale)
      .setInteractive({ useHandCursor: true });
    almanacLink.on('pointerover', () => almanacLink.setColor(COLORS_CSS.WHISKY_GOLD));
    almanacLink.on('pointerout', () => almanacLink.setColor(COLORS_CSS.TEXT_SUBTITLE));
    almanacLink.on('pointerdown', goAlmanac);
    const almanacBounds = almanacLink.getBounds();
    this.chronicleAlmanacNavRect = this.add
      .rectangle(almanacBounds.centerX, almanacBounds.centerY, almanacBounds.width + 16, almanacBounds.height + 8, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(80);
    this.chronicleAlmanacNavRect.on('pointerdown', goAlmanac);

    // ── Lifetime panel ──
    const lifetimePanelY = 118;
    // Stats grid drops from 3 cols × 3 rows (desktop) to 1 col × 9 rows
    // (mobile) so adjacent labels don't render on top of each other.
    // Panel height grows in step so the milestones panel below has clean
    // separation from the bottom row.
    const isMobileChronicle = width < 600;
    const lifetimePanelH = isMobileChronicle ? 188 : 94;
    this.add
      .rectangle(width / 2, lifetimePanelY + lifetimePanelH / 2 - 9, width - 40, lifetimePanelH, 0x11182a, 0.7)
      .setStrokeStyle(1, 0x2d3e62, 0.8);
    this.add
      .text(width / 2, lifetimePanelY, t('ui.chronicle.lifetime_heading'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: COLORS_CSS.TEXT_SUBTITLE,
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    // 3 columns × 3 rows on desktop; 1 column × 9 rows on mobile so
    // adjacent labels don't collide ("Total culls: 0 Gold banked: 0"
    // smear from audit 09f).
    const cols = width < 600 ? 1 : 3;
    const statCellWidth = (width - 120) / cols;
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
    // Single-column mobile layout grows the lifetime panel to fit nine
    // rows; the panel rectangle drawn above is 94 px tall, fine for
    // 3 rows but cuts off 6 of 9 rows on mobile. Push subsequent panel
    // anchors below with a per-viewport offset.
    const rowStride = cols === 1 ? 18 : 22;
    for (let i = 0; i < cells.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = statStartX + col * statCellWidth;
      const cy = lifetimePanelY + 24 + row * rowStride;
      this.add
        .text(cx, cy, `${cells[i].label}: `, {
          fontFamily: 'monospace', fontSize: '11px', color: COLORS_CSS.TEXT_SUBTITLE,
        })
        .setOrigin(1, 0.5)
        .setScale(uiScale);
      this.add
        .text(cx + 2, cy, cells[i].value, {
          fontFamily: 'monospace', fontSize: '12px', color: COLORS_CSS.TEXT_BRIGHT, fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setScale(uiScale);
    }

    // ── Milestones panel ──
    // Pushed down on mobile because the lifetime panel grows ~94 px taller
    // when stats grid drops to single column.
    const milestonesPanelY = isMobileChronicle ? 326 : 232;
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

    // R1 M4.5 P6 (T29) — dev-only Relic pick-rate histogram. Gated on
    // the `?devRelicStats=1` URL param so playtesters can self-serve
    // without shipping a prod-visible pane. Kill criteria live in the
    // M4.5 plan: <5% pick rate = deadweight; >70% = auto-pick.
    const relicHistogramSection = formatDevRelicHistogramSection(save.runHistory);

    const milestoneLines = this.buildMilestoneLines(milestones) + codexSection + moorRoadSection + ironmoorSection + stonesSection + echoesSection + postBellSection + hearthSection + curseSection + relicHistogramSection;
    // Optional sections grow over a player's lifetime — tighten font +
    // line spacing once content gets dense so the panel still fits.
    // The threshold is generous (~12 lines) so casual saves keep the
    // larger, friendlier 12px size.
    const density = resolveChronicleMilestonesDensityStyle(milestoneLines.split('\n').length);
    this.add
      .text(width / 2, milestonesPanelY + 22, milestoneLines, {
        fontFamily: 'monospace',
        fontSize: density.fontSize,
        color: COLORS_CSS.TEXT_PRIMARY,
        align: 'center',
        lineSpacing: density.lineSpacing,
        wordWrap: { width: (width - 80) / Math.max(1, uiScale) },
      })
      .setOrigin(0.5, 0)
      .setScale(uiScale);

    // ── Run list header ──
    // Mirror the mobile shift used in create() so the header label sits
    // just above the panel rectangle even on narrow viewports.
    const runsHeaderY = width < 600 ? this.RUNS_HEADER_Y + 110 : this.RUNS_HEADER_Y;
    this.add
      .text(40, runsHeaderY, t('ui.chronicle.runs_heading'), CHRONICLE_SECTION_HEADER_TEXT)
      .setOrigin(0, 0.5)
      .setScale(uiScale);
    if (this.history.length >= MAX_RUN_HISTORY) {
      this.add
        .text(width - 40, runsHeaderY, t('ui.chronicle.runs_cap_note', { max: MAX_RUN_HISTORY }), {
          fontFamily: 'monospace', fontSize: '10px', color: COLORS_CSS.TEXT_DIM, fontStyle: 'italic',
        })
        .setOrigin(1, 0.5)
        .setScale(uiScale);
    }

    // ── Run list rows (paginated) ──
    this.add
      .rectangle(width / 2, this.ROWS_PANEL_CENTER_Y, width - 40, this.ROWS_PANEL_HEIGHT, 0x0f1828, 0.7)
      .setStrokeStyle(1, 0x243552, 0.8);

    // Clamp pagination Y above the back button — short viewports (e.g.
    // 480px tall on a mobile landscape window) otherwise push pagination
    // arrows straight into the back row. 36px breathing room keeps the
    // arrow glyphs legible over the back chrome.
    const backY = height - 18;
    this.paginationY = Math.min(this.PAGINATION_Y, backY - 36);

    const backBtn = createBackButton(this, {
      x: width / 2, y: backY, width: 180, height: 30,
      label: t('ui.chronicle.back'), fontSize: '14px', uiScale,
    });
    backBtn.setDepth(90);
    const goBack = () => {
      audio.playClick();
      this.scene.start(this.returnTo);
    };
    backBtn.on('pointerdown', goBack);
    this.chronicleBackRect = backBtn;

    this.renderRunsPage(this.ROWS_START_Y, width, uiScale);

    this.chronicleEscHandler = goBack;
    this.input.keyboard?.on('keydown-ESC', this.chronicleEscHandler);

    this.hubKeyboardUnbind = bindHubMenuKeyboardNav(this, () => this.gamepadNav);

    this.events.once('shutdown', () => {
      this.hubKeyboardUnbind?.();
      this.hubKeyboardUnbind = undefined;
      this.gamepadNav?.destroy();
      this.gamepadNav = null;
      this.domFocusLayer?.destroy();
      this.domFocusLayer = null;
      if (this.chronicleEscHandler) {
        this.input.keyboard?.off('keydown-ESC', this.chronicleEscHandler);
        this.chronicleEscHandler = undefined;
      }
    });

    stopAmbientWindOnShutdown(this);
  }

  /**
   * Clicking a Chronicle row's ↻ glyph starts a fresh Game scene
   * seeded with that entry's runSeed and its original variant. Any
   * suspended active run is cleared first (matches the "Play Again"
   * path on GameOverScene) so the new run isn't treated as a resume.
   *
   * If the original run bore a curse, the rerun re-applies it via the
   * GameScene init payload — otherwise a "rerun cursed seed" silently
   * dropped the curse and gave the player an easier rerun than the
   * original (and a visibly different boss/spawn cadence).
   */
  private rerunSeed(seed: number, variantKey: string, curseKey?: string): void {
    audio.playClick();
    try { new SaveManager().clearActiveRun(); } catch { /* best-effort */ }
    const def = getCurseByKey(curseKey ?? null);
    this.scene.start('Game', {
      seed,
      forceVariantKey: variantKey,
      curseKey: def ? (def.key as CurseKey) : null,
    });
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
    // Replay mode ignores any caller-passed curse — the parser pulls
    // the curseKey from the blob itself when v2+, and the recorded
    // modifiers are already baked into the seeded RNG stream. V1
    // limitation: mid-run curse effects aren't perfectly reproduced,
    // documented in ADR-0002.
    this.scene.start('Game', { replay });
  }

  private renderRunsPage(startY: number, width: number, uiScale: number): void {
    this.chronicleRowNavHits = [];
    for (const o of this.runRowObjects) o.destroy();
    this.runRowObjects = [];

    if (this.history.length === 0) {
      // P1.9 — clamp empty-state Y above the bottom BACK button row.
      // Pre-fix: at startY + 120 on mobile (664-height viewport) the
      // copy "Nothin logged yet. Go bag the first tale." landed at
      // y=648 right where the BACK button sits, splitting the sentence
      // around the button visually.
      const { height } = this.scale;
      const emptyY = Math.min(startY + 120, height - 80);
      const empty = this.add
        .text(width / 2, emptyY, t('ui.chronicle.runs_empty'), {
          fontFamily: 'monospace', fontSize: '14px', color: COLORS_CSS.TEXT_MUTED, fontStyle: 'italic',
          align: 'center', wordWrap: { width: (width - 80) / Math.max(1, uiScale) },
        })
        .setOrigin(0.5)
        .setScale(uiScale);
      this.runRowObjects.push(empty);
      if (this.chronicleBackRect?.active) {
        this.rebuildChronicleT407Nav(width, uiScale);
      }
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

      // Main line: [ancestor name ·] time · kills · level · variant
      const rowKey = isVictory ? 'ui.chronicle.run_row_victory' : 'ui.chronicle.run_row_defeat';
      const namePrefix = entry.name ? t('ui.chronicle.name_prefix', { name: entry.name }) + ' · ' : '';
      const mainLine = namePrefix + t(rowKey, {
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
          color: COLORS_CSS.TEXT_MUTED,
          wordWrap: { width: (width - 310) / Math.max(1, uiScale) },
        })
        .setOrigin(0, 0.5)
        .setScale(uiScale);
      this.runRowObjects.push(sub);

      // Right side: relative timestamp
      const rel = this.add
        .text(width - 40, y, formatRelativeTime(entry.timestamp), {
          fontFamily: 'monospace', fontSize: '11px', color: COLORS_CSS.TEXT_DIM, fontStyle: 'italic',
        })
        .setOrigin(1, 0.5)
        .setScale(uiScale);
      this.runRowObjects.push(rel);

      // E1 M1 — seasonal event badge. Rendered when the run landed
      // inside a real-world event window (Burns Night for now).
      // Slot further left than the ironmoor chip so the two don't
      // overlap on a cursed-ironmoor-during-Burns-Night row.
      if (entry.seasonalEvent) {
        const key = `seasonalEvent.${entry.seasonalEvent}.badge_suffix`;
        const resolved = t(key);
        // Only render when the key resolves to a real string (hides
        // gracefully if a future event was removed from the i18n tree
        // but is still stamped on an old history entry).
        if (resolved && resolved !== key) {
          const seasonalBadge = this.add
            .text(width - 250, y, resolved, {
              fontFamily: 'monospace', fontSize: '10px',
              color: COLORS_CSS.WHISKY_GOLD, fontStyle: 'italic',
            })
            .setOrigin(1, 0.5)
            .setScale(uiScale);
          this.runRowObjects.push(seasonalBadge);
        }
      }

      // W66 Ironmoor badge — short "⚔" chip on the right side of the
      // row. Coexists with the curse chip (different x-slots: ironmoor
      // sits further left at width-180, curse at width-92), so a cursed
      // ironmoor row shows both badges side-by-side.
      if (entry.ironmoor) {
        const imBadge = this.add
          .text(width - 180, y, '⚔', {
            fontFamily: 'monospace', fontSize: '13px', color: COLORS_CSS.CURSE_MAUVE, fontStyle: 'bold',
          })
          .setOrigin(1, 0.5)
          .setScale(uiScale);
        this.runRowObjects.push(imBadge);
      }

      // S1 Phase 2 follow-up — sporran picks pip strip. Three small
      // kind-coloured circles (curse purple / boon green / quirk amber)
      // immediately left of the curse-chip slot, rendered only when the
      // run went through SporranScene. Resolves stale ids defensively.
      // Hover any pip → tooltip lists every pick by name (sister to
      // the rerun glyph's pointerover/pointerout pattern below).
      const sporranPips = buildSporranPipsForChronicle(entry.sporranPicks);
      if (sporranPips.length > 0) {
        const stripCx = width - 270;
        const pipR = 4;
        const pipGap = 11;
        const tooltipText = sporranPips
          .map((pip) => (pip.nameKey ? t(pip.nameKey) : pip.cardId))
          .join(' · ');
        let pipTooltip: Phaser.GameObjects.Text | null = null;
        const showPipTooltip = () => {
          if (pipTooltip) return;
          pipTooltip = this.add.text(stripCx + sporranPips.length * pipGap, y - 14, tooltipText, {
            fontFamily: 'monospace', fontSize: '10px', color: COLORS_CSS.TEXT_SUBTITLE, fontStyle: 'italic',
          }).setOrigin(0, 0.5).setScale(uiScale).setDepth(10);
          this.runRowObjects.push(pipTooltip);
        };
        const hidePipTooltip = () => {
          if (pipTooltip) {
            pipTooltip.destroy();
            pipTooltip = null;
          }
        };
        sporranPips.forEach((pip, idx) => {
          const cx = stripCx + idx * pipGap;
          const dot = this.add
            .circle(cx, y, pipR, pip.color, 0.95)
            .setStrokeStyle(1, 0x000000, 0.4)
            .setScale(uiScale)
            .setInteractive({ useHandCursor: false });
          dot.on('pointerover', showPipTooltip);
          dot.on('pointerout', hidePipTooltip);
          this.runRowObjects.push(dot);
        });
      }

      // Curse badge — sits just left of the timestamp for rows that bore a
      // curse. Stays compact (~70px) so it never crowds the variant/weapon
      // line. Rose-pink tint matches the CurseScene accent.
      const curseDef = getCurseByKey(entry.curseKey);
      if (curseDef) {
        const badge = this.add
          .text(width - 92, y, t('ui.chronicle.run_curse_chip', { curse: t(curseDef.nameKey) }), {
            fontFamily: 'monospace', fontSize: '10px', color: COLORS_CSS.CURSE_MAUVE_BRIGHT, fontStyle: 'bold',
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
        // v2 blobs carry curse + routes + composed-stats metadata so
        // playback reproduces the recorded run's outcome; v1 is
        // seed-only best-effort. Surface the difference in glyph +
        // tooltip so users know which is which at a glance.
        const isHd = replay.version === 2;
        const glyphKey = isHd ? 'ui.replay.chronicle_watch_glyph_hd' : 'ui.replay.chronicle_watch_glyph';
        const tooltipKey = isHd ? 'ui.replay.chronicle_watch_tooltip_hd' : 'ui.replay.chronicle_watch_tooltip';
        const watch = this.add
          .text(width - 195, y, t(glyphKey), {
            fontFamily: 'monospace', fontSize: '14px', color: rerunPalette.idle, fontStyle: 'bold',
          })
          .setOrigin(1, 0.5)
          .setScale(uiScale)
          .setInteractive({ useHandCursor: true });
        let watchTip: Phaser.GameObjects.Text | null = null;
        const showWatchTip = () => {
          watch.setColor(rerunPalette.hover);
          if (watchTip) return;
          watchTip = this.add.text(width - 205, y, t(tooltipKey), {
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

      this.chronicleRowNavHits.push({ rect: rowBg, label: mainLine, entry });
    });

    this.paginationNav.destroy();
    this.paginationNav = createPaginationNav(
      this,
      width / 2,
      this.paginationY,
      this.history.length,
      this.ROWS_PER_PAGE,
      this.page,
      (newPage) => {
        this.page = newPage;
        audio.playClick();
        this.renderRunsPage(this.ROWS_START_Y, width, uiScale);
      },
    );

    if (this.chronicleBackRect?.active) {
      this.rebuildChronicleT407Nav(width, uiScale);
    }
  }

  /**
   * T407 — rebuild gamepad highlight rects + DOM focus mirror after run rows
   * or pagination change. Entry order: Almanac link, run rows, optional
   * prev/next, Back.
   */
  private rebuildChronicleT407Nav(width: number, uiScale: number): void {
    this.gamepadNav?.destroy();
    this.gamepadNav = null;
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;

    const total = this.history.length;
    const pState = paginationState(total, this.ROWS_PER_PAGE, this.page);
    const nav = this.paginationNav;
    const hasPageNav = pState.pageVisible && nav.prevRect != null && nav.nextRect != null;

    const entries: GamepadMenuEntry[] = [];
    const domRows: DomFocusAction[] = [];

    if (this.chronicleAlmanacNavRect?.active) {
      const act = () => {
        audio.playClick();
        this.scene.start('Almanac', returnTargetData(this.returnTo));
      };
      entries.push({ rect: this.chronicleAlmanacNavRect, activate: act });
      domRows.push({
        id: 'chronicle-almanac',
        label: t('ui.chronicle.view_almanac'),
        onActivate: act,
      });
    }

    let runIdx = 0;
    for (const hit of this.chronicleRowNavHits) {
      const { entry } = hit;
      const canRevisit =
        (entry.replay != null && isReplayBlobAny(entry.replay)) ||
        typeof entry.runSeed === 'number';
      const activate = () => {
        if (entry.replay != null && isReplayBlobAny(entry.replay)) {
          this.watchReplay(entry.replay);
        } else if (typeof entry.runSeed === 'number') {
          this.rerunSeed(entry.runSeed, entry.variantKey, entry.curseKey);
        }
      };
      entries.push({ rect: hit.rect, activate });
      domRows.push({
        id: `chronicle-run-${entry.timestamp}-${runIdx}`,
        label: hit.label,
        disabled: !canRevisit,
        onActivate: () => {
          if (!canRevisit) return;
          activate();
        },
      });
      runIdx += 1;
    }

    if (hasPageNav && nav.prevRect && nav.nextRect) {
      const onPrev = () => {
        const p = paginationState(total, this.ROWS_PER_PAGE, this.page);
        if (!p.prevEnabled) return;
        audio.playClick();
        this.page = p.clampedPage - 1;
        this.renderRunsPage(this.ROWS_START_Y, width, uiScale);
      };
      const onNext = () => {
        const p = paginationState(total, this.ROWS_PER_PAGE, this.page);
        if (!p.nextEnabled) return;
        audio.playClick();
        this.page = p.clampedPage + 1;
        this.renderRunsPage(this.ROWS_START_Y, width, uiScale);
      };
      entries.push({ rect: nav.prevRect, activate: onPrev });
      entries.push({ rect: nav.nextRect, activate: onNext });
      domRows.push({
        id: 'chronicle-page-prev',
        label: t('ui.shop.prev'),
        disabled: !pState.prevEnabled,
        onActivate: onPrev,
      });
      domRows.push({
        id: 'chronicle-page-next',
        label: t('ui.shop.next'),
        disabled: !pState.nextEnabled,
        onActivate: onNext,
      });
    }

    if (this.chronicleBackRect?.active) {
      const goBack = () => {
        audio.playClick();
        this.scene.start(this.returnTo);
      };
      entries.push({ rect: this.chronicleBackRect, activate: goBack });
      domRows.push({
        id: 'chronicle-back',
        label: t('ui.chronicle.back'),
        onActivate: goBack,
      });
    }

    if (entries.length === 0) return;

    this.domFocusLayer = createDomFocusLayer({
      id: 'whs-chronicle-focus-layer',
      label: t('ui.chronicle.title'),
      description: t('ui.chronicle.runs_heading'),
      role: 'group',
      actions: domRows,
      initialFocusIndex: 0,
      onFocusIndexChange: (index) => {
        this.gamepadNav?.syncExternalIndex(index);
      },
    });

    this.gamepadNav = new GamepadMenuNav(this, entries, {
      onHighlightChange: (i) => this.domFocusLayer?.setFocusedIndex(i),
    });
    this.domFocusLayer.setFocusedIndex(this.gamepadNav.getIndex());
  }

  private buildMilestoneLines(m: ReturnType<typeof computeMilestones>): string {
    return formatChronicleMilestoneLines(m).join('\n');
  }
}

/**
 * R1 M4.5 P6 (T29) — optional Relic pick-rate block. Renders when the
 * URL contains `?devRelicStats=1` so playtesters can self-report
 * without a prod UI. Silent on fresh saves. Returns '' to keep the
 * milestone block unchanged in the default (non-dev) path.
 */
function formatDevRelicHistogramSection(history: readonly RunHistoryEntry[]): string {
  if (typeof window === 'undefined') return '';
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('devRelicStats') !== '1') return '';
  } catch {
    return '';
  }
  const summary = computeRelicHistogram(history);
  if (summary.sampleRuns === 0) return '';
  const top = summary.rows.filter((r) => r.pickCount > 0);
  if (top.length === 0) return '';
  const lines = top.map((r) => formatRelicHistogramRow(r, summary.sampleRuns));
  const heading = `\n\nRelic pick-rates — ${summary.runsWithAnyRelic}/${summary.sampleRuns} runs held a relic (dev only)`;
  return `${heading}\n${lines.join('\n')}`;
}

