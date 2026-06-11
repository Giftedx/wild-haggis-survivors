import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { textStyle } from '../../ui/typography';
import { type FindEntryVM, findsDiscoverySummary } from './buildFindsEntries';
import { buildFindDetail, categoryLabelKeyFor } from './buildFindDetail';

const GRID_COLS_DESKTOP = 6;
const GRID_COLS_MOBILE = 3;
const CELL_BG_FOUND = 0x1a2236;
const CELL_BG_UNFOUND = 0x0e1524;
const PANEL_BG = 0x12192b;
const PANEL_STROKE = 0x355079;
const SCRIM_COLOR = 0x000000;

/**
 * Per-category accent tints used both as cell stroke and as the panel
 * stripe + chip pill. Picked from existing palette anchors so the page
 * stays in the Hearth/Wild tonal map already established by Beasties.
 */
const CATEGORY_TINT: Record<FindEntryVM['category'], number> = {
  weapon: 0xb86b2a,     // amber — kindred to slot-A banner in WeysBook
  evolution: 0xffaa00,  // legendary gold (matches evolution toast)
  passive: 0x4caa6a,    // moss green — passive items
  permanent: 0x8a6cd6,  // amethyst — between-run upgrades
  relic: 0xffb060,      // reliquary toast colour
  lore: 0x7ca4c0,       // haar blue — Old Drover whisper arc
  foundation: 0x5a8050, // field-note moss green — HWF faction entries
};

const CATEGORY_TINT_DIM = 0x2a3550;

export interface FindsBookHandle {
  destroy(): void;
}

export interface FindsBookViewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface FindsBookOpts {
  readonly expandedKey: string | null;
  readonly onToggle: (key: string) => void;
}

/**
 * C1 M3 — Finds book renderer.
 *
 * Single grid spanning all five find categories (weapon → evolution →
 * passive → permanent → relic). Each cell shows a category-tinted
 * border + abbreviated name; click expands a detail overlay with full
 * description, acquire count, and first-found date. Mirrors
 * BeastiesBook chrome — same scrim, same panel layout — so the
 * four-book Almanac stays visually coherent.
 *
 * No sprite rendering yet; the cell is a colour-coded plate. Icon
 * pass falls under the M5 polish bucket.
 */
export function renderFindsBook(
  scene: Phaser.Scene,
  viewport: FindsBookViewport,
  entries: readonly FindEntryVM[],
  uiScale: number,
  opts: FindsBookOpts,
): FindsBookHandle {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const { x: vx, y: vy, width: vw, height: vh } = viewport;

  const summary = findsDiscoverySummary(entries);
  const progress = scene.add
    .text(vx + vw / 2, vy + 12,
      t('ui.almanac.finds_progress', { acquired: summary.acquired, total: summary.total }),
      textStyle('label', { color: COLORS_CSS.WHISKY_GOLD }))
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  objects.push(progress);

  const gridTop = vy + 40;
  const gridHeight = Math.max(1, vh - 48);
  const GRID_COLS = vw < 600 ? GRID_COLS_MOBILE : GRID_COLS_DESKTOP;
  const rows = Math.max(1, Math.ceil(entries.length / GRID_COLS));
  const cellW = vw / GRID_COLS;
  const cellH = gridHeight / rows;

  entries.forEach((entry, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const cx = vx + cellW / 2 + col * cellW;
    const cy = gridTop + cellH / 2 + row * cellH;

    const accent = entry.acquired ? CATEGORY_TINT[entry.category] : CATEGORY_TINT_DIM;

    const cell = scene.add
      .rectangle(cx, cy, cellW - 6, cellH - 6,
        entry.acquired ? CELL_BG_FOUND : CELL_BG_UNFOUND, 0.85)
      .setStrokeStyle(1, accent, 0.9)
      .setInteractive({ useHandCursor: true });
    cell.on('pointerdown', () => {
      audio.playClick();
      opts.onToggle(entry.key);
    });
    objects.push(cell);

    // Category-tinted plate at the cell's left edge — gives the grid a
    // visual rhythm so the player can scan "weapon block / passive block /
    // permanent block" without reading every label.
    const stripeW = Math.max(3, Math.floor(cellW * 0.08));
    const stripe = scene.add
      .rectangle(cx - (cellW - 6) / 2 + stripeW / 2 + 3, cy,
        stripeW, cellH - 12, accent, entry.acquired ? 0.9 : 0.4);
    objects.push(stripe);

    const labelText = entry.acquired ? t(entry.nameKey) : t('ui.almanac.find_unknown_title');
    const label = scene.add
      .text(cx + stripeW * 0.5, cy,
        labelText,
        textStyle('small', {
          color: entry.acquired ? COLORS_CSS.TEXT_PRIMARY : COLORS_CSS.TEXT_DIM,
          align: 'center',
          wordWrap: { width: Math.max(40, (cellW - 16 - stripeW) / Math.max(1, uiScale)) },
        }))
      .setOrigin(0.5, 0.5)
      .setScale(uiScale);
    objects.push(label);

    if (entry.acquired && entry.acquireCount > 0) {
      const chip = scene.add
        .text(cx + (cellW - 6) / 2 - 6, cy - (cellH - 6) / 2 + 4,
          t('ui.almanac.finds_count_chip', { count: entry.acquireCount }),
          textStyle('small', { color: COLORS_CSS.WHISKY_GOLD }))
        .setOrigin(1, 0)
        .setScale(uiScale);
      objects.push(chip);
    }
  });

  if (opts.expandedKey !== null) {
    const expanded = entries.find((e) => e.key === opts.expandedKey);
    if (expanded) {
      renderExpandedOverlay(scene, viewport, expanded, uiScale, opts.onToggle, objects);
    }
  }

  return {
    destroy(): void {
      for (const o of objects) o.destroy();
      objects.length = 0;
    },
  };
}

function renderExpandedOverlay(
  scene: Phaser.Scene,
  viewport: FindsBookViewport,
  entry: FindEntryVM,
  uiScale: number,
  onToggle: (key: string) => void,
  sink: Phaser.GameObjects.GameObject[],
): void {
  const { x: vx, y: vy, width: vw, height: vh } = viewport;
  const detail = buildFindDetail(entry);

  const scrim = scene.add
    .rectangle(vx + vw / 2, vy + vh / 2, vw, vh, SCRIM_COLOR, 0.72)
    .setInteractive();
  scrim.on('pointerdown', () => {
    audio.playClick();
    onToggle(entry.key);
  });
  sink.push(scrim);

  const panelW = Math.min(480, vw - 40);
  const panelH = Math.min(300, vh - 40);
  const panelCx = vx + vw / 2;
  const panelCy = vy + vh / 2;

  const panel = scene.add
    .rectangle(panelCx, panelCy, panelW, panelH, PANEL_BG, 0.98)
    .setStrokeStyle(1, PANEL_STROKE, 1)
    .setInteractive();
  panel.on('pointerdown', () => undefined);
  sink.push(panel);

  // Category accent stripe across the top of the panel.
  const accent = detail.acquired ? CATEGORY_TINT[entry.category] : CATEGORY_TINT_DIM;
  const stripe = scene.add
    .rectangle(panelCx, panelCy - panelH / 2 + 6, panelW - 4, 6, accent, 0.95);
  sink.push(stripe);

  const titleRaw = t(detail.titleKey);
  const titleText = titleRaw === detail.titleKey ? detail.titleFallback : titleRaw;
  const title = scene.add
    .text(panelCx, panelCy - panelH / 2 + 24, titleText,
      textStyle('heading', {
        color: detail.acquired ? COLORS_CSS.WHISKY_GOLD : COLORS_CSS.TEXT_MUTED,
      }))
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  sink.push(title);

  // Category badge under the title — labels which book section the
  // find belongs to ("WEAPON", "PASSIVE", etc).
  const catLabel = scene.add
    .text(panelCx, panelCy - panelH / 2 + 64,
      t(categoryLabelKeyFor(detail.category)),
      textStyle('small', { color: COLORS_CSS.TEXT_SUBTITLE }))
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  sink.push(catLabel);

  // Chips row — count + first-found.
  const chipsY = panelCy - panelH / 2 + 96;
  const chipParts: string[] = [];
  if (detail.acquireCountText) chipParts.push(detail.acquireCountText);
  if (detail.firstAcquiredText) chipParts.push(detail.firstAcquiredText);
  if (chipParts.length > 0) {
    const chips = scene.add
      .text(panelCx, chipsY, chipParts.join('  ·  '),
        textStyle('small', { color: COLORS_CSS.TEXT_SUBTITLE, align: 'center' }))
      .setOrigin(0.5, 0)
      .setScale(uiScale);
    sink.push(chips);
  }

  const descRaw = t(detail.descKey);
  const desc = descRaw === detail.descKey ? detail.descFallback : descRaw;
  const descY = panelCy - panelH / 2 + 134;
  const descMaxHeight = panelH - (descY - (panelCy - panelH / 2)) - 20;
  const descText = scene.add
    .text(panelCx, descY, desc, {
      ...textStyle('label', {
        color: COLORS_CSS.TEXT_PRIMARY,
        align: 'center',
        wordWrap: { width: (panelW - 40) / Math.max(1, uiScale) },
      }),
      fontStyle: 'italic',
    })
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  if (descText.height * uiScale > descMaxHeight) {
    descText.setScale(Math.max(0.6, descMaxHeight / descText.height));
  }
  sink.push(descText);

  const closeBtn = scene.add
    .text(panelCx + panelW / 2 - 10, panelCy - panelH / 2 + 10, '×',
      textStyle('heading', { color: COLORS_CSS.TEXT_MUTED }))
    .setOrigin(1, 0)
    .setScale(uiScale)
    .setInteractive({ useHandCursor: true });
  closeBtn.on('pointerdown', () => {
    audio.playClick();
    onToggle(entry.key);
  });
  sink.push(closeBtn);
}
