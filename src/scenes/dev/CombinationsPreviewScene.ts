/**
 * Dev-only Combinations Preview. Phase 0 minimal version: renders the
 * classic haggis with tam on/off, across idle and walking states,
 * side by side.
 *
 * Phase 2 expands this to the full variant × accessory grid. For now
 * it's a 2 × 2 preview:
 *   (classic no-tam, classic with-tam) × (idle, walking).
 */

import Phaser from 'phaser';
import { getHaggisSpriteSize } from '../../animation/frameDrawers/haggisFrames';

interface Cell {
  readonly label: string;
  readonly withTam: boolean;
  readonly state: 'idle' | 'walking';
}

const CELLS: Cell[] = [
  { label: 'no-tam / idle', withTam: false, state: 'idle' },
  { label: 'no-tam / walking', withTam: false, state: 'walking' },
  { label: 'with-tam / idle', withTam: true, state: 'idle' },
  { label: 'with-tam / walking', withTam: true, state: 'walking' },
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

      // Cell background
      this.add.rectangle(x + size / 2, y + size / 2, cellW - 10, cellH - 10, 0x2a2a30);
      this.add.text(x - 10, y + size + 10, cell.label, {
        fontSize: '11px',
        color: '#9aa590',
      });

      // Display the pre-baked frame 0 of the state (static preview, no animation).
      const bodyKey = `haggis_classic_${cell.state}_0`;
      this.add.sprite(x + size / 2, y + size / 2, bodyKey);

      if (cell.withTam) {
        const tamKey = `tam_o_shanter_${cell.state}_0`;
        this.add.sprite(x + size / 2, y + size / 2, tamKey);
      }
    });

    // Return to game on ESC
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop('CombinationsPreview');
      this.scene.resume('Game');
    });
  }
}
