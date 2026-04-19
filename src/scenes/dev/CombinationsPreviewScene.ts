/**
 * Dev-only Combinations Preview. Renders the classic haggis with
 * various accessory builds across idle, walking, attacking and hurt
 * states so wear-build combinations can be eyeballed side by side
 * without playing the whole run.
 */

import Phaser from 'phaser';
import { getHaggisSpriteSize } from '../../animation/frameDrawers/haggisFrames';

type CellState = 'idle' | 'walking' | 'attacking' | 'hurt';
type AccessoryId = 'tam_o_shanter' | 'kilt' | 'highland_shield' | 'sporran';

interface Cell {
  readonly label: string;
  readonly accessories: ReadonlyArray<AccessoryId>;
  readonly state: CellState;
  /** Which frame of the state's atlas to show. Default 0. */
  readonly frame?: number;
}

// Ordered bottom→top to match render depth (shield → kilt → sporran → tam).
const ALL_ACCESSORIES: ReadonlyArray<AccessoryId> = [
  'highland_shield',
  'kilt',
  'sporran',
  'tam_o_shanter',
];

const CELLS: Cell[] = [
  { label: 'bare / idle', accessories: [], state: 'idle' },
  { label: 'bare / walking', accessories: [], state: 'walking' },
  { label: 'tam / idle', accessories: ['tam_o_shanter'], state: 'idle' },
  { label: 'tam / walking', accessories: ['tam_o_shanter'], state: 'walking' },
  { label: 'full / idle', accessories: ALL_ACCESSORIES, state: 'idle' },
  { label: 'full / walking', accessories: ALL_ACCESSORIES, state: 'walking' },
  { label: 'full / attacking f1', accessories: ALL_ACCESSORIES, state: 'attacking', frame: 1 },
  { label: 'full / hurt f0', accessories: ALL_ACCESSORIES, state: 'hurt', frame: 0 },
];

export class CombinationsPreviewScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CombinationsPreview' });
  }

  create(): void {
    const size = getHaggisSpriteSize();
    const cellW = size + 40;
    const cellH = size + 60;
    const cols = 2;

    this.cameras.main.setBackgroundColor('#1a1a1a');
    this.add.text(20, 10, 'Combinations Preview (Phase 0)', {
      fontSize: '16px',
      color: '#c8a040',
    });
    this.add.text(20, 34, 'Press ESC to return to game', {
      fontSize: '12px',
      color: '#8a9a6b',
    });

    CELLS.forEach((cell, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 40 + col * cellW;
      const y = 70 + row * cellH;
      const frame = cell.frame ?? 0;

      // Cell background
      this.add.rectangle(x + size / 2, y + size / 2, cellW - 10, cellH - 10, 0x2a2a30);
      this.add.text(x - 10, y + size + 10, cell.label, {
        fontSize: '11px',
        color: '#9aa590',
      });

      // Behind-layer accessories render below the body; render them
      // first, then the body, then any front/above layer accessories.
      if (cell.accessories.includes('highland_shield')) {
        this.add.sprite(x + size / 2, y + size / 2, `highland_shield_${cell.state}_${frame}`);
      }

      // Body
      this.add.sprite(x + size / 2, y + size / 2, `haggis_classic_${cell.state}_${frame}`);

      if (cell.accessories.includes('kilt')) {
        this.add.sprite(x + size / 2, y + size / 2, `kilt_${cell.state}_${frame}`);
      }
      if (cell.accessories.includes('sporran')) {
        this.add.sprite(x + size / 2, y + size / 2, `sporran_${cell.state}_${frame}`);
      }
      if (cell.accessories.includes('tam_o_shanter')) {
        this.add.sprite(x + size / 2, y + size / 2, `tam_o_shanter_${cell.state}_${frame}`);
      }
    });

    // Return to game on ESC
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop('CombinationsPreview');
      this.scene.resume('Game');
    });
  }
}
