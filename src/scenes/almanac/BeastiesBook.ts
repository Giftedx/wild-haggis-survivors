import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { t } from '../../core/i18n';
import { textStyle } from '../../ui/typography';
import { type BeastieEntryVM, beastiesDiscoverySummary } from './buildBeastiesEntries';
import { resolveBeastieDisplay } from './beastieDisplay';

const GRID_COLS = 6;
const GRID_ROWS = 6; // 36 slots — fits 30 enemies + 5 bosses with one spare
const CELL_BG_SEEN = 0x1a2236;
const CELL_BG_UNSEEN = 0x0e1524;
const CELL_STROKE_SEEN = 0x355079;
const CELL_STROKE_UNSEEN = 0x1f2c48;

export interface BeastiesBookHandle {
  destroy(): void;
}

export interface BeastiesBookViewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * C1 M2 Task 8 — Beasties book renderer.
 *
 * Fixed 6×6 grid at default uiScale. Each cell shows the enemy sprite
 * (if seen) and a small kill-count chip at the top-right. Progress
 * pill at the top of the viewport reads "X of Y discovered". Returns
 * a handle whose `destroy()` tears down every spawned GameObject so
 * the scene can swap tabs cleanly.
 *
 * Silhouette handling for unseen entries lands in Task 9 — for now
 * unseen cells render the sprite at low alpha against a dimmer panel
 * so the grid still reads as populated. The final "???" + outline
 * treatment comes with the beastieDisplay helper.
 */
export function renderBeastiesBook(
  scene: Phaser.Scene,
  viewport: BeastiesBookViewport,
  entries: readonly BeastieEntryVM[],
  uiScale: number,
): BeastiesBookHandle {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const { x: vx, y: vy, width: vw, height: vh } = viewport;

  // Progress pill — sits above the grid, mirrors Deeds' counter pill.
  const summary = beastiesDiscoverySummary(entries);
  const progress = scene.add
    .text(vx + vw / 2, vy + 12,
      t('ui.almanac.beasties_progress', { seen: summary.seen, total: summary.total }),
      textStyle('label', { color: COLORS_CSS.WHISKY_GOLD }))
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  objects.push(progress);

  // Grid viewport — leaves 36px at top for the progress line.
  const gridTop = vy + 40;
  const gridHeight = Math.max(1, vh - 48);
  const cellW = vw / GRID_COLS;
  const cellH = gridHeight / GRID_ROWS;
  // Slightly smaller sprite scale than the cell so name + kill chip
  // fit without colliding. Small enemy sprites (16×16) scale 2×;
  // boss sprites (64×64+) scale down to fit.
  const spriteBudget = Math.min(cellW, cellH) * 0.55;

  entries.forEach((entry, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    if (row >= GRID_ROWS) return; // overflow safety — spec target is 36 slots
    const cx = vx + cellW / 2 + col * cellW;
    const cy = gridTop + cellH / 2 + row * cellH;

    const cell = scene.add
      .rectangle(cx, cy, cellW - 6, cellH - 6,
        entry.seen ? CELL_BG_SEEN : CELL_BG_UNSEEN, 0.85)
      .setStrokeStyle(1, entry.seen ? CELL_STROKE_SEEN : CELL_STROKE_UNSEEN, 0.9);
    objects.push(cell);

    const display = resolveBeastieDisplay(entry);
    if (scene.textures.exists(entry.texture)) {
      const sprite = scene.add.sprite(cx, cy - 6, entry.texture);
      const nativeSize = Math.max(sprite.width, sprite.height, 1);
      const fit = spriteBudget / nativeSize;
      sprite.setScale(fit * (entry.isBoss ? 0.8 : 1.0));
      sprite.setAlpha(display.alpha);
      if (display.tint !== null) {
        // Phaser tint multiplies RGB channels — setting a very dark
        // tone collapses the sprite to a shadow silhouette while
        // preserving the outline shape.
        sprite.setTint(display.tint);
      }
      objects.push(sprite);
    }

    // Name label under the sprite — real name when seen, '???' when
    // silhouetted. Lets players scan the grid without expanding.
    const nameLabel = scene.add
      .text(cx, cy + (cellH - 6) / 2 - 8, display.displayName,
        textStyle('small', {
          color: display.isSilhouette ? COLORS_CSS.TEXT_DIM : COLORS_CSS.TEXT_PRIMARY,
          align: 'center',
          wordWrap: { width: Math.max(40, (cellW - 10) / Math.max(1, uiScale)) },
        }))
      .setOrigin(0.5, 1)
      .setScale(uiScale);
    objects.push(nameLabel);

    // Kill count chip — top-right of the cell, seen-only.
    if (entry.seen && entry.killCount > 0) {
      const chip = scene.add
        .text(cx + (cellW - 6) / 2 - 6, cy - (cellH - 6) / 2 + 6,
          t('ui.almanac.beasties_kill_chip', { count: entry.killCount }),
          textStyle('small', { color: COLORS_CSS.WHISKY_GOLD }))
        .setOrigin(1, 0)
        .setScale(uiScale);
      objects.push(chip);
    }

    // Boss marker — top-left dot so bosses read at a glance even
    // before the player has seen them.
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

  return {
    destroy(): void {
      for (const o of objects) o.destroy();
      objects.length = 0;
    },
  };
}
