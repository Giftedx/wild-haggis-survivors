/**
 * Dev-only Combinations Preview.
 *
 * Grid layout: per variant, TWO columns side-by-side.
 *   • Col A  → variant bare.
 *   • Col B  → variant with that row's accessory equipped.
 *
 * Cols repeat for every playable variant (classic, moor_runner,
 * iron_belly, glen_forager, surefoot, pipe_breath, wee_ghostie,
 * laird, glaswegian) so breeds sit next to each other horizontally
 * — you can compare "moor_runner with kilt" vs "classic with kilt"
 * without scrolling.
 *
 * Rows step through every accessory (one per row), with a final
 * "full" row showing the 9-stack and a "bare" row for a clean
 * baseline comparison.
 *
 * Cells render at 2× zoom with a subtle crosshair + body-outline
 * reference so clipping and anchor drift show up at a glance.
 *
 * Navigation:
 *   ESC                         → return to Game
 *   Mouse wheel                 → vertical scroll
 *   Shift + Mouse wheel         → horizontal scroll
 *   Arrow keys                  → scroll (directional)
 *   PageUp / PageDown           → vertical page
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

const LAYER_ORDER: ReadonlyArray<AccessoryId> = [
  'loch_water',
  'highland_shield',
  'kilt',
  'tartan_sash',
  'sporran',
  'whisky_flask',
  'irn_bru',
  'tam_o_shanter',
  'thistle_crown',
];

/**
 * A single row of the preview — describes which accessory the "with"
 * column shows. The "bare" column is implicit on every row.
 */
interface RowSpec {
  readonly label: string;
  readonly withAccessories: ReadonlyArray<AccessoryId>;
}

const ROWS: ReadonlyArray<RowSpec> = [
  { label: 'bare', withAccessories: [] },
  { label: 'tam', withAccessories: ['tam_o_shanter'] },
  { label: 'crown', withAccessories: ['thistle_crown'] },
  { label: 'shield', withAccessories: ['highland_shield'] },
  { label: 'kilt', withAccessories: ['kilt'] },
  { label: 'sash', withAccessories: ['tartan_sash'] },
  { label: 'sporran', withAccessories: ['sporran'] },
  { label: 'flask', withAccessories: ['whisky_flask'] },
  { label: 'irn-bru', withAccessories: ['irn_bru'] },
  { label: 'water', withAccessories: ['loch_water'] },
  { label: 'full', withAccessories: LAYER_ORDER },
];

const ZOOM = 2;
const CELL_W = 130;
const CELL_H = 140;
// 2 cols per variant → 9 variants × 2 = 18 cols total.
const COLS_PER_VARIANT = 2;
const GRID_ORIGIN_X = 24;
const GRID_ORIGIN_Y = 92;
// Space reserved above the grid for the variant-name header row.
const HEADER_BAND_H = 24;

const STATE_FOR_PREVIEW: CellState = 'idle';

export class CombinationsPreviewScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CombinationsPreview' });
  }

  create(): void {
    const size = getHaggisSpriteSize();
    const spriteScale = ZOOM;

    const variants = VARIANTS;
    const totalCols = variants.length * COLS_PER_VARIANT;
    const totalRows = ROWS.length;
    const gridWidth = GRID_ORIGIN_X + totalCols * CELL_W + 24;
    const gridHeight = GRID_ORIGIN_Y + totalRows * CELL_H + 40;

    this.cameras.main.setBackgroundColor('#1a1a1a');
    this.cameras.main.setBounds(0, 0, gridWidth, gridHeight);

    // ── Header band — title + variant names across the top ──
    this.add
      .text(
        20,
        10,
        'Combinations — 2 cols per variant (bare | with item), ESC back',
        { fontSize: '14px', color: '#c8a040' },
      )
      .setScrollFactor(1, 0);
    this.add
      .text(
        20,
        32,
        `${variants.length} variants × ${totalRows} rows = ${variants.length * totalRows * 2} cells`,
        { fontSize: '12px', color: '#8a9a6b' },
      )
      .setScrollFactor(1, 0);

    variants.forEach((v, vIdx) => {
      const xLeft = GRID_ORIGIN_X + vIdx * COLS_PER_VARIANT * CELL_W;
      this.add
        .rectangle(xLeft + CELL_W - 2, GRID_ORIGIN_Y - HEADER_BAND_H / 2 - 4, CELL_W * 2 - 8, HEADER_BAND_H - 4, 0x242830)
        .setOrigin(0, 0.5)
        .setScrollFactor(1, 0);
      const display = v.key.replace(/_/g, ' ');
      this.add
        .text(xLeft + CELL_W, GRID_ORIGIN_Y - HEADER_BAND_H / 2 - 3, display, {
          fontSize: '12px',
          color: '#c8a040',
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(1, 0);
    });

    // ── Grid cells ──
    ROWS.forEach((row, rIdx) => {
      const cellY = GRID_ORIGIN_Y + rIdx * CELL_H;

      // Row label pinned to the far left (scrolls vertically with the
      // grid but sticks to the viewport left edge).
      this.add
        .text(4, cellY + CELL_H / 2 - 5, row.label, {
          fontSize: '12px',
          color: '#8a9a6b',
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0, 1);

      variants.forEach((variant, vIdx) => {
        const xLeft = GRID_ORIGIN_X + vIdx * COLS_PER_VARIANT * CELL_W;
        this.drawCell(xLeft, cellY, size, spriteScale, variant.key, [], `${variant.key} / bare`);
        this.drawCell(
          xLeft + CELL_W,
          cellY,
          size,
          spriteScale,
          variant.key,
          row.withAccessories,
          `${variant.key} / ${row.label}`,
        );
      });
    });

    // ── Input: ESC → resume Game; wheel + arrow keys → scroll ──
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop('CombinationsPreview');
      this.scene.resume('Game');
    });

    const scrollBy = (dx: number, dy: number): void => {
      const cam = this.cameras.main;
      const bounds = cam.getBounds();
      cam.scrollX = Phaser.Math.Clamp(cam.scrollX + dx, 0, Math.max(0, bounds.width - cam.width));
      cam.scrollY = Phaser.Math.Clamp(cam.scrollY + dy, 0, Math.max(0, bounds.height - cam.height));
    };
    this.input.keyboard?.on('keydown-UP', () => scrollBy(0, -80));
    this.input.keyboard?.on('keydown-DOWN', () => scrollBy(0, 80));
    this.input.keyboard?.on('keydown-LEFT', () => scrollBy(-160, 0));
    this.input.keyboard?.on('keydown-RIGHT', () => scrollBy(160, 0));
    this.input.keyboard?.on('keydown-PAGE_UP', () => scrollBy(0, -this.scale.height));
    this.input.keyboard?.on('keydown-PAGE_DOWN', () => scrollBy(0, this.scale.height));
    this.input.on(
      'wheel',
      (pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
        if (pointer.event.shiftKey) scrollBy(dy, 0);
        else scrollBy(0, dy);
      },
    );
  }

  private drawCell(
    cellX: number,
    cellY: number,
    size: number,
    spriteScale: number,
    variantKey: VariantKey,
    accessories: ReadonlyArray<AccessoryId>,
    label: string,
  ): void {
    const cx = cellX + CELL_W / 2;
    const cy = cellY + CELL_H / 2 - 6;

    // Cell panel + body-outline reference + centre crosshair.
    this.add.rectangle(cx, cy, CELL_W - 6, CELL_H - 20, 0x2a2a30);
    const bodyW = size * spriteScale;
    this.add.rectangle(cx, cy, bodyW, bodyW, 0x000000, 0).setStrokeStyle(1, 0x3a4268, 0.5);
    this.add.line(0, 0, cx - 4, cy, cx + 4, cy, 0xff5566, 0.55).setOrigin(0);
    this.add.line(0, 0, cx, cy - 4, cx, cy + 4, 0xff5566, 0.55).setOrigin(0);

    const state = STATE_FOR_PREVIEW;
    const frame = 0;
    const included = new Set(accessories);
    const drawSprite = (key: string): void => {
      this.add.sprite(cx, cy, key).setScale(spriteScale);
    };

    if (included.has('loch_water')) drawSprite(`loch_water_${state}_${frame}`);
    if (included.has('highland_shield')) drawSprite(`highland_shield_${state}_${frame}`);
    drawSprite(`haggis_${variantKey}_${state}_${frame}`);
    if (included.has('kilt')) drawSprite(`kilt_${state}_${frame}`);
    if (included.has('tartan_sash')) drawSprite(`tartan_sash_${state}_${frame}`);
    if (included.has('sporran')) drawSprite(`sporran_${state}_${frame}`);
    if (included.has('whisky_flask')) drawSprite(`whisky_flask_${state}_${frame}`);
    if (included.has('irn_bru')) drawSprite(`irn_bru_${state}_${frame}`);
    if (included.has('tam_o_shanter')) drawSprite(`tam_o_shanter_${state}_${frame}`);
    if (included.has('thistle_crown')) drawSprite(`thistle_crown_${state}_${frame}`);

    // Cell label — tiny, pinned to the bottom edge.
    this.add.text(cellX + 4, cellY + CELL_H - 14, label, {
      fontSize: '9px',
      color: '#70806a',
    });
  }
}
