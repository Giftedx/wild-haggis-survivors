import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { textStyle } from '../../ui/typography';
import { type WeyEntryVM, weysDiscoverySummary } from './buildWeysEntries';
import { buildWeyDetail } from './buildWeyDetail';

const GRID_COLS = 2;
const GRID_ROWS = 3; // 6 routes (3 picker A, 3 picker B). Each col is one slot.
const CELL_BG_PICKED = 0x1a2236;
const CELL_BG_UNPICKED = 0x0e1524;
const SLOT_A_BANNER = 0xb86b2a; // warm dust — fork / brae feel
const SLOT_B_BANNER = 0x2a5a8a; // cool — loch / hills feel
const SLOT_BANNER_DIM = 0x2a3550;
const PANEL_BG = 0x12192b;
const PANEL_STROKE = 0x355079;
const SCRIM_COLOR = 0x000000;

export interface WeysBookHandle {
  destroy(): void;
}

export interface WeysBookViewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface WeysBookOpts {
  readonly expandedKey: string | null;
  readonly onToggle: (key: string) => void;
}

/**
 * C1 M3 — Weys book renderer.
 *
 * Two-column grid (col A = picker A routes, col B = picker B). Each cell
 * shows a slot-tinted banner (warm orange for A / cool blue for B), the
 * route label, and a pick-count chip. Click toggles an expanded detail
 * overlay that surfaces the route description + first-picked date.
 *
 * Mirrors the BeastiesBook renderer so the four-book Almanac stays
 * visually coherent — same scrim, same panel chrome, same close-button
 * placement. The slot-tinted banner replaces the sprite tile because we
 * don't ship route artwork yet.
 */
export function renderWeysBook(
  scene: Phaser.Scene,
  viewport: WeysBookViewport,
  entries: readonly WeyEntryVM[],
  uiScale: number,
  opts: WeysBookOpts,
): WeysBookHandle {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const { x: vx, y: vy, width: vw, height: vh } = viewport;

  const summary = weysDiscoverySummary(entries);
  const progress = scene.add
    .text(vx + vw / 2, vy + 12,
      t('ui.almanac.weys_progress', { picked: summary.picked, total: summary.total }),
      textStyle('label', { color: COLORS_CSS.WHISKY_GOLD }))
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  objects.push(progress);

  const gridTop = vy + 40;
  const gridHeight = Math.max(1, vh - 48);
  const cellW = vw / GRID_COLS;
  const cellH = gridHeight / GRID_ROWS;

  // Bucket entries by slot so col 0 = slot A, col 1 = slot B.
  const slotA = entries.filter((e) => e.slot === 'A');
  const slotB = entries.filter((e) => e.slot === 'B');

  drawColumn(scene, slotA, vx, gridTop, cellW, cellH, uiScale, opts, objects);
  drawColumn(scene, slotB, vx + cellW, gridTop, cellW, cellH, uiScale, opts, objects);

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

function drawColumn(
  scene: Phaser.Scene,
  entries: readonly WeyEntryVM[],
  colX: number,
  gridTop: number,
  cellW: number,
  cellH: number,
  uiScale: number,
  opts: WeysBookOpts,
  sink: Phaser.GameObjects.GameObject[],
): void {
  entries.forEach((entry, row) => {
    if (row >= GRID_ROWS) return;
    const cx = colX + cellW / 2;
    const cy = gridTop + cellH / 2 + row * cellH;
    const slotBaseTint = entry.slot === 'A' ? SLOT_A_BANNER : SLOT_B_BANNER;
    const bannerTint = entry.picked ? slotBaseTint : SLOT_BANNER_DIM;

    const cell = scene.add
      .rectangle(cx, cy, cellW - 8, cellH - 8,
        entry.picked ? CELL_BG_PICKED : CELL_BG_UNPICKED, 0.9)
      .setStrokeStyle(1, bannerTint, 0.9)
      .setInteractive({ useHandCursor: true });
    cell.on('pointerdown', () => {
      audio.playClick();
      opts.onToggle(entry.key);
    });
    sink.push(cell);

    // Banner stripe across the top of the cell — slot-tinted plate that
    // stands in for route artwork. Picked routes get full saturation;
    // unwalked routes use the muted grey-blue stroke colour so the page
    // reads "still hidden" at a glance.
    const bannerH = Math.max(12, cellH * 0.22);
    const banner = scene.add
      .rectangle(cx, cy - (cellH - 8) / 2 + bannerH / 2 + 2,
        cellW - 14, bannerH, bannerTint, entry.picked ? 0.85 : 0.45);
    sink.push(banner);

    const label = scene.add
      .text(cx, cy + 4,
        entry.picked ? t(entry.labelKey) : t('ui.almanac.wey_unknown_title'),
        textStyle('label', {
          color: entry.picked ? COLORS_CSS.TEXT_PRIMARY : COLORS_CSS.TEXT_DIM,
          align: 'center',
          wordWrap: { width: Math.max(40, (cellW - 24) / Math.max(1, uiScale)) },
        }))
      .setOrigin(0.5, 0.5)
      .setScale(uiScale);
    sink.push(label);

    if (entry.picked && entry.pickCount > 0) {
      const chip = scene.add
        .text(cx + (cellW - 8) / 2 - 6, cy - (cellH - 8) / 2 + 6,
          t('ui.almanac.weys_pickcount_chip', { count: entry.pickCount }),
          textStyle('small', { color: COLORS_CSS.WHISKY_GOLD }))
        .setOrigin(1, 0)
        .setScale(uiScale);
      sink.push(chip);
    }
  });
}

function renderExpandedOverlay(
  scene: Phaser.Scene,
  viewport: WeysBookViewport,
  entry: WeyEntryVM,
  uiScale: number,
  onToggle: (key: string) => void,
  sink: Phaser.GameObjects.GameObject[],
): void {
  const { x: vx, y: vy, width: vw, height: vh } = viewport;
  const detail = buildWeyDetail(entry);

  // Scrim — captures outside-clicks to collapse.
  const scrim = scene.add
    .rectangle(vx + vw / 2, vy + vh / 2, vw, vh, SCRIM_COLOR, 0.72)
    .setInteractive();
  scrim.on('pointerdown', () => {
    audio.playClick();
    onToggle(entry.key);
  });
  sink.push(scrim);

  const panelW = Math.min(480, vw - 40);
  const panelH = Math.min(280, vh - 40);
  const panelCx = vx + vw / 2;
  const panelCy = vy + vh / 2;

  const panel = scene.add
    .rectangle(panelCx, panelCy, panelW, panelH, PANEL_BG, 0.98)
    .setStrokeStyle(1, PANEL_STROKE, 1)
    .setInteractive();
  panel.on('pointerdown', () => undefined);
  sink.push(panel);

  // Slot-tinted accent stripe at the top of the panel (mirrors the cell
  // banner so the open detail still reads as "this is a slot-A route").
  const slotTint = entry.slot === 'A' ? SLOT_A_BANNER : SLOT_B_BANNER;
  const stripe = scene.add
    .rectangle(panelCx, panelCy - panelH / 2 + 6, panelW - 4, 6, slotTint, 0.95);
  sink.push(stripe);

  const titleRaw = t(detail.titleKey);
  const titleText = titleRaw === detail.titleKey ? detail.titleFallback : titleRaw;
  const title = scene.add
    .text(panelCx, panelCy - panelH / 2 + 24, titleText,
      textStyle('heading', {
        color: detail.picked ? COLORS_CSS.WHISKY_GOLD : COLORS_CSS.TEXT_MUTED,
      }))
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  sink.push(title);

  // Chips row — pick-count + first-picked.
  const chipsY = panelCy - panelH / 2 + 70;
  const chipParts: string[] = [];
  if (detail.pickCountText) chipParts.push(detail.pickCountText);
  if (detail.firstPickedText) chipParts.push(detail.firstPickedText);
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
  const descY = panelCy - panelH / 2 + 110;
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
