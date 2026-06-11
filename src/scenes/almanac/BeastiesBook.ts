import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { textStyle } from '../../ui/typography';
import { type BeastieEntryVM, beastiesDiscoverySummary } from './buildBeastiesEntries';
import { resolveBeastieDisplay } from './beastieDisplay';
import { buildBeastieDetail } from './buildBeastieDetail';

const GRID_COLS_DESKTOP = 6;
const GRID_COLS_MOBILE = 4;
const TOTAL_SLOTS = 36; // 30 enemies + 5 bosses with one spare
const CELL_BG_SEEN = 0x1a2236;
const CELL_BG_UNSEEN = 0x0e1524;
const CELL_STROKE_SEEN = 0x355079;
const CELL_STROKE_UNSEEN = 0x1f2c48;
const PANEL_BG = 0x12192b;
const PANEL_STROKE = 0x355079;
const SCRIM_COLOR = 0x000000;

export interface BeastiesBookHandle {
  destroy(): void;
}

export interface BeastiesBookViewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface BeastiesBookOpts {
  readonly expandedKey: string | null;
  readonly onToggle: (key: string) => void;
}

/**
 * C1 M2 — Beasties book renderer.
 *
 * Fixed 6×6 grid at default uiScale. Each cell is clickable; clicking
 * calls `onToggle(key)`, which the scene uses to flip `expandedKey`
 * and re-render with the detail overlay visible. Clicking the scrim
 * or the × button also collapses.
 *
 * Returns a handle whose `destroy()` tears down every spawned
 * GameObject so the scene can swap tabs or re-render cleanly.
 */
export function renderBeastiesBook(
  scene: Phaser.Scene,
  viewport: BeastiesBookViewport,
  entries: readonly BeastieEntryVM[],
  uiScale: number,
  opts: BeastiesBookOpts,
): BeastiesBookHandle {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const { x: vx, y: vy, width: vw, height: vh } = viewport;

  const summary = beastiesDiscoverySummary(entries);
  const progress = scene.add
    .text(vx + vw / 2, vy + 12,
      t('ui.almanac.beasties_progress', { seen: summary.seen, total: summary.total }),
      textStyle('label', { color: COLORS_CSS.WHISKY_GOLD }))
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  objects.push(progress);

  const gridTop = vy + 40;
  const gridHeight = Math.max(1, vh - 48);
  // Drop to 4 cols below 600 px viewport so beastie names ("Gordon the
  // Chef", "Tour Bus") have room to read without truncating to 3 lines
  // (audit 09d).
  const GRID_COLS = vw < 600 ? GRID_COLS_MOBILE : GRID_COLS_DESKTOP;
  const GRID_ROWS = Math.ceil(TOTAL_SLOTS / GRID_COLS);
  const cellW = vw / GRID_COLS;
  const cellH = gridHeight / GRID_ROWS;
  const spriteBudget = Math.min(cellW, cellH) * 0.55;

  entries.forEach((entry, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    if (row >= GRID_ROWS) return;
    const cx = vx + cellW / 2 + col * cellW;
    const cy = gridTop + cellH / 2 + row * cellH;

    const cell = scene.add
      .rectangle(cx, cy, cellW - 6, cellH - 6,
        entry.seen ? CELL_BG_SEEN : CELL_BG_UNSEEN, 0.85)
      .setStrokeStyle(1, entry.seen ? CELL_STROKE_SEEN : CELL_STROKE_UNSEEN, 0.9)
      .setInteractive({ useHandCursor: true });
    cell.on('pointerdown', () => {
      audio.playClick();
      opts.onToggle(entry.key);
    });
    objects.push(cell);

    const display = resolveBeastieDisplay(entry);
    if (scene.textures.exists(entry.texture)) {
      const sprite = scene.add.sprite(cx, cy - 6, entry.texture);
      const nativeSize = Math.max(sprite.width, sprite.height, 1);
      const fit = spriteBudget / nativeSize;
      sprite.setScale(fit * (entry.isBoss ? 0.8 : 1.0));
      sprite.setAlpha(display.alpha);
      if (display.tint !== null) {
        sprite.setTint(display.tint);
      }
      objects.push(sprite);
    }

    // P2.9 — long beastie names ("Gordon the Chef", "Tour Bus") clipped
    // inside 4-col mobile cells. Drop to a tighter font on narrow
    // viewports so the longest names fit on two lines without wrapping
    // mid-word.
    const labelFontSize = vw < 600 ? '9px' : undefined;
    const nameLabel = scene.add
      .text(cx, cy + (cellH - 6) / 2 - 8, display.displayName,
        textStyle('small', {
          ...(labelFontSize ? { fontSize: labelFontSize } : {}),
          color: display.isSilhouette ? COLORS_CSS.TEXT_DIM : COLORS_CSS.TEXT_PRIMARY,
          align: 'center',
          wordWrap: { width: Math.max(40, (cellW - 10) / Math.max(1, uiScale)) },
        }))
      .setOrigin(0.5, 1)
      .setScale(uiScale);
    objects.push(nameLabel);

    if (entry.seen && entry.killCount > 0) {
      const chip = scene.add
        .text(cx + (cellW - 6) / 2 - 6, cy - (cellH - 6) / 2 + 6,
          t('ui.almanac.beasties_kill_chip', { count: entry.killCount }),
          textStyle('small', { color: COLORS_CSS.WHISKY_GOLD }))
        .setOrigin(1, 0)
        .setScale(uiScale);
      objects.push(chip);
    }

    if (entry.isBoss) {
      const dot = scene.add
        .text(cx - (cellW - 6) / 2 + 4, cy - (cellH - 6) / 2 + 2, '★',
          textStyle('small', {
            color: entry.seen ? COLORS_CSS.WHISKY_GOLD : COLORS_CSS.TEXT_DIM,
          }))
        .setOrigin(0, 0)
        .setScale(uiScale);
      objects.push(dot);
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
  viewport: BeastiesBookViewport,
  entry: BeastieEntryVM,
  uiScale: number,
  onToggle: (key: string) => void,
  sink: Phaser.GameObjects.GameObject[],
): void {
  const { x: vx, y: vy, width: vw, height: vh } = viewport;
  const detail = buildBeastieDetail(entry);

  // Scrim — sits over the grid, catches outside clicks to collapse.
  const scrim = scene.add
    .rectangle(vx + vw / 2, vy + vh / 2, vw, vh, SCRIM_COLOR, 0.72)
    .setInteractive();
  scrim.on('pointerdown', () => {
    audio.playClick();
    onToggle(entry.key);
  });
  sink.push(scrim);

  // Panel — centred within the viewport. Clamped so the detail card
  // stays visible even at high uiScale.
  const panelW = Math.min(480, vw - 40);
  const panelH = Math.min(300, vh - 40);
  const panelCx = vx + vw / 2;
  const panelCy = vy + vh / 2;

  const panel = scene.add
    .rectangle(panelCx, panelCy, panelW, panelH, PANEL_BG, 0.98)
    .setStrokeStyle(1, PANEL_STROKE, 1)
    .setInteractive();
  // Panel swallows pointer events so clicks on its body don't reach
  // the scrim behind it — otherwise tapping the lore would close
  // the overlay.
  panel.on('pointerdown', () => undefined);
  sink.push(panel);

  // Title
  const title = scene.add
    .text(panelCx, panelCy - panelH / 2 + 24, detail.titleText,
      textStyle('heading', {
        color: detail.isSilhouette ? COLORS_CSS.TEXT_MUTED : COLORS_CSS.WHISKY_GOLD,
      }))
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  sink.push(title);

  // Sprite preview — larger than the grid thumbnail so the player
  // can actually see what they caught.
  if (scene.textures.exists(entry.texture)) {
    const sprite = scene.add.sprite(panelCx, panelCy - panelH / 2 + 84, entry.texture);
    const nativeSize = Math.max(sprite.width, sprite.height, 1);
    sprite.setScale((64 / nativeSize) * (entry.isBoss ? 0.9 : 1));
    sprite.setAlpha(detail.isSilhouette ? 0.55 : 1);
    if (detail.isSilhouette) sprite.setTint(0x1a2236);
    sink.push(sprite);
  }

  // Chips row — where-found + kill count + first-seen
  const chipsY = panelCy - panelH / 2 + 130;
  const chipParts: string[] = [];
  if (detail.whereFoundText) chipParts.push(detail.whereFoundText);
  if (detail.killCountText) chipParts.push(detail.killCountText);
  if (detail.firstSeenText) chipParts.push(detail.firstSeenText);
  if (chipParts.length > 0) {
    const chips = scene.add
      .text(panelCx, chipsY, chipParts.join('  ·  '),
        textStyle('small', { color: COLORS_CSS.TEXT_SUBTITLE, align: 'center' }))
      .setOrigin(0.5, 0)
      .setScale(uiScale);
    sink.push(chips);
  }

  // Lore paragraph — i18n lookup with inline fallback so the panel
  // stays readable even before flavour leaves ship.
  const loreRaw = t(detail.loreKey);
  const lore = loreRaw === detail.loreKey ? detail.loreFallback : loreRaw;
  const loreY = panelCy - panelH / 2 + 164;
  const loreMaxHeight = panelH - (loreY - (panelCy - panelH / 2)) - 20;
  const loreText = scene.add
    .text(panelCx, loreY, lore, {
      ...textStyle('label', {
        color: COLORS_CSS.TEXT_PRIMARY,
        align: 'center',
        wordWrap: { width: (panelW - 40) / Math.max(1, uiScale) },
      }),
      fontStyle: 'italic',
    })
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  // Clamp the lore — some flavour entries (especially unseen)
  // are long enough to push past the panel floor at large uiScale.
  if (loreText.height * uiScale > loreMaxHeight) {
    loreText.setScale(Math.max(0.6, loreMaxHeight / loreText.height));
  }
  sink.push(loreText);

  // Close button — top-right corner of the panel.
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
