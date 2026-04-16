import Phaser from 'phaser';
import { COLORS } from '../config';
import { t } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { getSettingsManager } from '../core/SettingsManager';
import { loadSave, MAX_RUN_HISTORY, type RunHistoryEntry } from '../utils/save';
import { SaveManager } from '../core/SaveManager';
import { getVariantByKey } from '../data/variants';
import { WEAPON_DEFS, type WeaponKey } from '../data/weapons';
import { getCurseByKey } from '../data/curses';
import {
  buildChronicleCodex,
  computeMilestones,
  computeMoorRoadKillCriteria,
  detectMood,
  formatClock,
  formatCodexNamesLine,
  formatDurationLong,
  formatMoorRoadStatus,
  formatRelativeTime,
  formatRouteBreadcrumb,
  lifetimeTotals,
  type ChronicleMood,
} from '../ui/chronicleAggregates';

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
  private readonly ROWS_PER_PAGE = 5;
  private readonly ROW_STRIDE = 30;
  /** Below milestones + codex block — keep clearance above pagination + BACK. */
  private readonly RUNS_HEADER_Y = 368;
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

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);
    // Warm amber wash at the top — matches MetaShop's cozy framing
    this.add.rectangle(width / 2, 30, width, 60, 0xd4a017, 0.04);

    audio.startAmbientWind();
    const fade = this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e, 1).setDepth(999);
    this.tweens.add({ targets: fade, alpha: 0, duration: 360, onComplete: () => fade.destroy() });

    // ── Header ──
    this.add
      .text(width / 2, 36, t('ui.chronicle.title'), {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: highContrastUi ? '#ffe08a' : '#d4a017',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    this.add
      .text(width / 2, 70, t(moodSubtitleKey(mood)), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: moodColor(mood),
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: width - 60 },
      })
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
      .rectangle(width / 2, milestonesPanelY + 50, width - 40, 148, 0x12192b, 0.7)
      .setStrokeStyle(1, 0x283a5f, 0.8);
    this.add
      .text(width / 2, milestonesPanelY, t('ui.chronicle.milestones_heading'), {
        fontFamily: 'monospace', fontSize: '12px', color: '#7f8ca7', fontStyle: 'bold', letterSpacing: 1,
      })
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

    const milestoneLines = this.buildMilestoneLines(milestones) + codexSection + moorRoadSection;
    this.add
      .text(width / 2, milestonesPanelY + 22, milestoneLines, {
        fontFamily: 'monospace', fontSize: '12px', color: '#c4cdd8', align: 'center', lineSpacing: 4,
        wordWrap: { width: width - 80 },
      })
      .setOrigin(0.5, 0)
      .setScale(uiScale);

    // ── Run list header ──
    const runsHeaderY = this.RUNS_HEADER_Y;
    this.add
      .text(40, runsHeaderY, t('ui.chronicle.runs_heading'), {
        fontFamily: 'monospace', fontSize: '12px', color: '#7f8ca7', fontStyle: 'bold', letterSpacing: 1,
      })
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
    this.add.text(width / 2 - 120, paginationY, '< PREV', {
      fontFamily: 'monospace', fontSize: '11px', color: '#cdd4e0', fontStyle: 'bold',
    }).setOrigin(0.5).setScale(uiScale);
    this.prevBtn.on('pointerdown', () => this.turnPage(-1));

    this.nextBtn = this.add
      .rectangle(width / 2 + 120, paginationY, 72, 24, 0x252540, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2 + 120, paginationY, 'NEXT >', {
      fontFamily: 'monospace', fontSize: '11px', color: '#cdd4e0', fontStyle: 'bold',
    }).setOrigin(0.5).setScale(uiScale);
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
    const backBtn = this.add
      .rectangle(width / 2, backY, 180, 30, 0x252540, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, backY, t('ui.chronicle.back'), {
        fontFamily: 'monospace', fontSize: '14px', color: '#e8d4a0', fontStyle: 'bold',
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

  private turnPage(delta: number): void {
    const pageCount = Math.max(1, Math.ceil(this.history.length / this.ROWS_PER_PAGE));
    const next = Phaser.Math.Clamp(this.page + delta, 0, pageCount - 1);
    if (next === this.page) return;
    this.page = next;
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

    const pageCount = Math.max(1, Math.ceil(this.history.length / this.ROWS_PER_PAGE));
    const startIdx = this.page * this.ROWS_PER_PAGE;
    const slice = this.history.slice(startIdx, startIdx + this.ROWS_PER_PAGE);

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

      // Outcome badge
      const badge = this.add
        .text(88, y, isVictory ? '✦ WIN' : 'FELL', {
          fontFamily: 'monospace', fontSize: '11px',
          color: isVictory ? '#f7d27a' : '#9aa4bb',
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
          color: isVictory ? '#f5e1a6' : '#d6dde7',
          fontStyle: isVictory ? 'bold' : 'normal',
        })
        .setOrigin(0, 0.5)
        .setScale(uiScale);
      this.runRowObjects.push(main);

      // Weapon chips (first 4 keys) + bosses + combo
      const weapons = entry.weaponKeys.slice(0, 4).map((k) => {
        const def = WEAPON_DEFS[k as WeaponKey];
        return def?.name ?? k;
      }).join(', ');
      // W2 Moor Road: append route breadcrumb when the run hit a picker.
      const routeTrail = entry.routes && entry.routes.length > 0
        ? `  ·  ${formatRouteBreadcrumb(entry.routes)}`
        : '';
      const subLine = `${weapons || '—'}  ·  ${entry.bossKills} boss${entry.bossKills === 1 ? '' : 'es'}  ·  combo ${entry.bestCombo}x${routeTrail}`;
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
    });

    if (pageCount > 1) {
      this.pageLabel.setText(`${this.page + 1} / ${pageCount}`);
      this.prevBtn.setVisible(true);
      this.nextBtn.setVisible(true);
      this.prevBtn.setAlpha(this.page > 0 ? 1 : 0.4);
      this.nextBtn.setAlpha(this.page < pageCount - 1 ? 1 : 0.4);
    } else {
      this.pageLabel.setText('');
      this.prevBtn.setVisible(false);
      this.nextBtn.setVisible(false);
    }
  }

  private buildMilestoneLines(m: ReturnType<typeof computeMilestones>): string {
    const lines: string[] = [];

    if (m.firstVictory) {
      lines.push(t('ui.chronicle.milestone_first_victory', {
        time: formatClock(m.firstVictory.timeSurvivedSec),
        kills: m.firstVictory.enemiesKilled,
      }));
    } else {
      lines.push(t('ui.chronicle.milestone_first_victory_none'));
    }

    if (m.longestRun) {
      lines.push(t('ui.chronicle.milestone_longest', {
        time: formatClock(m.longestRun.timeSurvivedSec),
        variant: t(getVariantByKey(m.longestRun.variantKey).nameKey),
      }));
    }

    if (m.mostKills) {
      lines.push(t('ui.chronicle.milestone_most_kills', {
        kills: m.mostKills.enemiesKilled,
        variant: t(getVariantByKey(m.mostKills.variantKey).nameKey),
      }));
    }

    if (m.highestCombo && m.highestCombo.bestCombo > 0) {
      lines.push(t('ui.chronicle.milestone_highest_combo', {
        combo: m.highestCombo.bestCombo,
      }));
    }

    if (m.favoriteVariantKey) {
      lines.push(t('ui.chronicle.milestone_favorite_variant', {
        variant: t(getVariantByKey(m.favoriteVariantKey).nameKey),
        count: m.favoriteVariantCount,
      }));
    }

    if (m.favoriteWeaponKey) {
      const def = WEAPON_DEFS[m.favoriteWeaponKey as WeaponKey];
      lines.push(t('ui.chronicle.milestone_favorite_weapon', {
        weapon: def?.name ?? m.favoriteWeaponKey,
        count: m.favoriteWeaponCount,
      }));
    }

    if (m.currentWinStreak >= 2) {
      lines.push(t('ui.chronicle.milestone_win_streak', { count: m.currentWinStreak }));
    }

    return lines.join('\n');
  }
}

function moodSubtitleKey(mood: ChronicleMood): string {
  switch (mood) {
    case 'empty': return 'ui.chronicle.sub_empty';
    case 'first_run': return 'ui.chronicle.sub_first_run';
    case 'victory_streak': return 'ui.chronicle.sub_victory_streak';
    case 'fresh_victory': return 'ui.chronicle.sub_fresh_victory';
    case 'loss_streak': return 'ui.chronicle.sub_loss_streak';
    case 'improving': return 'ui.chronicle.sub_improving';
    case 'declining': return 'ui.chronicle.sub_declining';
    case 'steady':
    default: return 'ui.chronicle.sub_steady';
  }
}

/** Header subtitle tint — warm for wins, cool for rough patches. */
function moodColor(mood: ChronicleMood): string {
  switch (mood) {
    case 'victory_streak':
    case 'fresh_victory':
      return '#f7d27a';
    case 'loss_streak':
      return '#b8a8a8'; // soft, not a red-for-shame
    case 'improving':
      return '#9de6a8';
    case 'declining':
      return '#a8b3c8';
    case 'empty':
    case 'first_run':
      return '#b8a88a';
    case 'steady':
    default:
      return '#9ea8bb';
  }
}
