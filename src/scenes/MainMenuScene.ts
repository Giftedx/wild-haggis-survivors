import Phaser from 'phaser';
import { COLORS } from '../config';
import { SaveManager } from '../core/SaveManager';

/**
 * Entry hub after boot: shows persistent meta stats and routes into loadout (Menu).
 */
export class MainMenuScene extends Phaser.Scene {
  private saveManager = new SaveManager();

  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const { width, height } = this.scale;
    const meta = this.saveManager.load();

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);

    this.add
      .text(width / 2, 96, 'Wild Haggis Survivors', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#d4a017',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 154, `Kill credits: ${meta.totalKills}`, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#95a5c3',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 196, 'Choose your loadout on the next screen.', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#6a7390',
      })
      .setOrigin(0.5);

    const btnW = 240;
    const btnH = 48;
    const bx = width / 2;
    const startY = height / 2 + 12;
    const metaY = startY + btnH + 14;

    const startBtn = this.add
      .rectangle(bx, startY, btnW, btnH, COLORS.SCOTTISH_BLUE, 1)
      .setInteractive({ useHandCursor: true });
    const startTxt = this.add
      .text(bx, startY, 'START RUN', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    startBtn.on('pointerover', () => startBtn.setFillStyle(Phaser.Display.Color.ValueToColor(COLORS.SCOTTISH_BLUE).lighten(18).color));
    startBtn.on('pointerout', () => startBtn.setFillStyle(COLORS.SCOTTISH_BLUE));
    startBtn.on('pointerdown', () => {
      this.scene.start('Menu');
    });

    startTxt.setInteractive({ useHandCursor: true });
    startTxt.on('pointerdown', () => {
      this.scene.start('Menu');
    });

    const metaBtn = this.add
      .rectangle(bx, metaY, btnW, btnH, 0x2d6a3e, 1)
      .setInteractive({ useHandCursor: true });
    const metaTxt = this.add
      .text(bx, metaY, 'META UPGRADES', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    metaBtn.on('pointerover', () => metaBtn.setFillStyle(0x3a8f4f));
    metaBtn.on('pointerout', () => metaBtn.setFillStyle(0x2d6a3e));
    metaBtn.on('pointerdown', () => {
      this.scene.start('MetaShop');
    });
    metaTxt.setInteractive({ useHandCursor: true });
    metaTxt.on('pointerdown', () => {
      this.scene.start('MetaShop');
    });
  }
}
