/**
 * Dev-only Combinations Preview. Three sections:
 *  1. Baseline classic haggis (bare + every accessory solo + full
 *     9-stack across every state) for accessory placement tuning.
 *  2. Every playable haggis variant (classic, moor_runner, iron_belly,
 *     glen_forager, surefoot, pipe_breath, laird, wee_ghostie,
 *     glaswegian) bare + full kit so breed silhouettes + their fit
 *     under a full accessory build are visible at a glance.
 *
 * Cells render at 2× zoom with a subtle crosshair + bounding-box
 * outline so small placement issues (accessory clipping into the body,
 * drifting off the anchor on a specific frame) are visible at a glance.
 *
 * Navigation:
 *   ESC                 → return to Game
 *   Mouse wheel         → scroll the grid
 *   ArrowUp / ArrowDn   → scroll the grid
 *   PageUp / PageDown   → scroll one viewport
 */

import Phaser from 'phaser';
import { getHaggisSpriteSize } from '../../animation/frameDrawers/haggisFrames';
import { VARIANTS } from '../../data/variants';
import type { VariantKey } from '../../data/variants';

type CellState = 'idle' | 'walking' | 'attacking' | 'hurt';
type AccessoryId =
  | 'tam_o_shanter'
  | 'kilt'
  | 'highland_shield'
  | 'sporran'
  | 'thistle_crown'
  | 'tartan_sash'
  | 'whisky_flask'
  | 'irn_bru'
  | 'loch_water';

/**
 * Draw order is the accessory-layer depth order: bottom → top. Used
 * for composite cells (tam row uses a subset; full row uses the whole
 * list). Kept in one place so positional tweaks don't accidentally
 * reorder layers.
 */
const LAYER_ORDER: ReadonlyArray<AccessoryId> = [
  'loch_water',       // behind
  'highland_shield',  // behind
  'kilt',             // body
  'tartan_sash',      // body
  'sporran',          // front
  'whisky_flask',     // front
  'irn_bru',          // front
  'tam_o_shanter',    // above
  'thistle_crown',    // above
];

interface Cell {
  readonly label: string;
  readonly accessories: ReadonlyArray<AccessoryId>;
  readonly state: CellState;
  /** Which frame of the state's atlas to show. Default 0. */
  readonly frame?: number;
  /** Which haggis variant's atlas to draw. Default 'classic'. */
  readonly variant?: VariantKey;
}

function soloRow(id: AccessoryId): [Cell, Cell] {
  return [
    { label: `${id} / idle`, accessories: [id], state: 'idle' },
    { label: `${id} / walking`, accessories: [id], state: 'walking' },
  ];
}

function variantRow(key: VariantKey, displayName: string): [Cell, Cell] {
  return [
    { label: `${displayName} / bare`, accessories: [], state: 'idle', variant: key },
    { label: `${displayName} / full`, accessories: LAYER_ORDER, state: 'idle', variant: key },
  ];
}

function buildCells(): Cell[] {
  const cells: Cell[] = [
    // ── Section 1: classic haggis — baseline + accessory solos ──
    { label: 'bare / idle', accessories: [], state: 'idle' },
    { label: 'bare / walking', accessories: [], state: 'walking' },
    ...soloRow('tam_o_shanter'),
    ...soloRow('thistle_crown'),
    ...soloRow('highland_shield'),
    ...soloRow('kilt'),
    ...soloRow('tartan_sash'),
    ...soloRow('sporran'),
    ...soloRow('whisky_flask'),
    ...soloRow('irn_bru'),
    ...soloRow('loch_water'),
    // Full 9-stack across every state
    { label: 'full / idle', accessories: LAYER_ORDER, state: 'idle' },
    { label: 'full / walking', accessories: LAYER_ORDER, state: 'walking' },
    { label: 'full / attacking f1', accessories: LAYER_ORDER, state: 'attacking', frame: 1 },
    { label: 'full / hurt f0', accessories: LAYER_ORDER, state: 'hurt', frame: 0 },
  ];

  // ── Section 2: every playable haggis variant, bare + full kit ──
  // Derived from VARIANTS so new variants automatically show up.
  for (const v of VARIANTS) {
    // Pull the human-readable name from the variant key — the nameKey
    // is an i18n path, not a display string, so we humanise the key
    // instead to avoid bringing an i18n runtime into a dev preview.
    const display = v.key.replace(/_/g, ' ');
    cells.push(...variantRow(v.key, display));
  }

  return cells;
}

const CELLS: Cell[] = buildCells();

const ZOOM = 2;
const CELL_W = 175;
const CELL_H = 170;
// 6 columns fills the 1094 px dev-build canvas width (6×175 + 24×2 = 1098).
// Keeps the horizontal real-estate utilised instead of the old 2-col layout
// that left more than half the window blank.
const COLS = 6;
const GRID_ORIGIN_X = 24;
const GRID_ORIGIN_Y = 64;

export class CombinationsPreviewScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CombinationsPreview' });
  }

  create(): void {
    const size = getHaggisSpriteSize();
    const spriteScale = ZOOM;

    this.cameras.main.setBackgroundColor('#1a1a1a');
    this.add
      .text(20, 10, 'Combinations Preview — ESC back, Wheel/Arrows scroll', {
        fontSize: '14px',
        color: '#c8a040',
      })
      .setScrollFactor(0);
    this.add
      .text(
        20,
        32,
        `${CELLS.length} cells — accessory solos, full stacks, and every variant`,
        { fontSize: '12px', color: '#8a9a6b' },
      )
      .setScrollFactor(0);

    const totalRows = Math.ceil(CELLS.length / COLS);
    const gridHeight = GRID_ORIGIN_Y + totalRows * CELL_H + 40;
    this.cameras.main.setBounds(0, 0, this.scale.width, gridHeight);

    CELLS.forEach((cell, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const cellX = GRID_ORIGIN_X + col * CELL_W;
      const cellY = GRID_ORIGIN_Y + row * CELL_H;
      const frame = cell.frame ?? 0;
      const variant = cell.variant ?? 'classic';

      // ── Cell chrome: background panel + label
      this.add.rectangle(
        cellX + CELL_W / 2 - 10,
        cellY + CELL_H / 2 - 10,
        CELL_W - 20,
        CELL_H - 30,
        0x2a2a30,
      );

      // Anchor (centre of the sprite stack) — helps spot off-centre drawers.
      const cx = cellX + CELL_W / 2 - 10;
      const cy = cellY + CELL_H / 2 - 20;

      // Haggis-body silhouette reference rectangle (56×56 at zoom).
      const bodyW = size * spriteScale;
      this.add
        .rectangle(cx, cy, bodyW, bodyW, 0x000000, 0)
        .setStrokeStyle(1, 0x3a4268, 0.6);

      // Centre crosshair — 9 px cross to sight-check drift across frames.
      this.add.line(0, 0, cx - 4, cy, cx + 4, cy, 0xff5566, 0.7).setOrigin(0);
      this.add.line(0, 0, cx, cy - 4, cx, cy + 4, 0xff5566, 0.7).setOrigin(0);

      // ── Sprite stack: behind-layer accessories, then variant body,
      // then body/front/above accessories in the declared layer order.
      // Same ordering the live render path produces. ──
      const included = new Set(cell.accessories);
      const drawSprite = (key: string): void => {
        this.add.sprite(cx, cy, key).setScale(spriteScale);
      };

      if (included.has('loch_water')) {
        drawSprite(`loch_water_${cell.state}_${frame}`);
      }
      if (included.has('highland_shield')) {
        drawSprite(`highland_shield_${cell.state}_${frame}`);
      }
      drawSprite(`haggis_${variant}_${cell.state}_${frame}`);
      if (included.has('kilt')) {
        drawSprite(`kilt_${cell.state}_${frame}`);
      }
      if (included.has('tartan_sash')) {
        drawSprite(`tartan_sash_${cell.state}_${frame}`);
      }
      if (included.has('sporran')) {
        drawSprite(`sporran_${cell.state}_${frame}`);
      }
      if (included.has('whisky_flask')) {
        drawSprite(`whisky_flask_${cell.state}_${frame}`);
      }
      if (included.has('irn_bru')) {
        drawSprite(`irn_bru_${cell.state}_${frame}`);
      }
      if (included.has('tam_o_shanter')) {
        drawSprite(`tam_o_shanter_${cell.state}_${frame}`);
      }
      if (included.has('thistle_crown')) {
        drawSprite(`thistle_crown_${cell.state}_${frame}`);
      }

      // Label pinned to the cell bottom.
      this.add.text(cellX + 6, cellY + CELL_H - 28, cell.label, {
        fontSize: '11px',
        color: '#9aa590',
      });
    });

    // ── Input: ESC to return, wheel + arrow keys to scroll ──
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop('CombinationsPreview');
      this.scene.resume('Game');
    });

    const scrollBy = (dy: number): void => {
      const cam = this.cameras.main;
      cam.scrollY = Phaser.Math.Clamp(cam.scrollY + dy, 0, cam.getBounds().height - cam.height);
    };
    this.input.keyboard?.on('keydown-UP', () => scrollBy(-60));
    this.input.keyboard?.on('keydown-DOWN', () => scrollBy(60));
    this.input.keyboard?.on('keydown-PAGE_UP', () => scrollBy(-this.scale.height));
    this.input.keyboard?.on('keydown-PAGE_DOWN', () => scrollBy(this.scale.height));
    this.input.on(
      'wheel',
      (_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
        scrollBy(dy);
      },
    );
  }
}
