import Phaser from 'phaser';
import { COLORS } from '../config';
import { SaveManager } from '../core/SaveManager';
import { tryPurchaseMetaUpgrade } from '../core/MetaPurchase';
import { META_SHOP_ITEMS, listMetaShopItemKeys, type MetaShopItemKey } from '../data/metaShopItems';
import { audio } from '../systems/AudioSystem';

/**
 * Spend meta kill currency on StatComposer upgrade keys (SaveManager v2).
 */
export class MetaShopScene extends Phaser.Scene {
  private saveManager = new SaveManager();
  private rowElements: Phaser.GameObjects.GameObject[] = [];
  private killsText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MetaShop' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);
    this.add.rectangle(width / 2, 318, width - 26, 452, 0x11182a, 0.62).setStrokeStyle(2, 0x2d3e62, 0.8);

    const fadeIn = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1).setDepth(999);
    this.tweens.add({ targets: fadeIn, alpha: 0, duration: 360, onComplete: () => fadeIn.destroy() });

    this.add
      .text(width / 2, 32, 'META UPGRADES', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#77c977',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.killsText = this.add
      .text(width / 2, 70, '', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#d4a017',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 94, 'Spend lifetime kills on permanent run bonuses.', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#8a93a8',
      })
      .setOrigin(0.5);

    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(2, 0x444444, 1);
    lineGfx.lineBetween(24, 108, width - 24, 108);
    lineGfx.lineBetween(24, 510, width - 24, 510);

    this.renderRows();

    const backButton = this.add
      .rectangle(width / 2, height - 28, 200, 38, 0x3a4357, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, height - 28, 'BACK', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    backButton.on('pointerover', () => backButton.setFillStyle(0x4a566f));
    backButton.on('pointerout', () => backButton.setFillStyle(0x3a4357));
    backButton.on('pointerdown', () => {
      audio.playClick();
      this.scene.start('MainMenu');
    });
  }

  private renderRows(): void {
    this.clearElements(this.rowElements);
    const save = this.saveManager.load();
    this.killsText.setText(`Kill credits: ${save.totalKills}`);

    const { width } = this.scale;
    const keys = listMetaShopItemKeys();

    keys.forEach((key, index) => {
      const item = META_SHOP_ITEMS[key];
      const y = 124 + index * 72;
      const owned = save.unlockedUpgrades.includes(key);
      const canAfford = !owned && save.totalKills >= item.cost;

      const rowBg = this.add.rectangle(width / 2, y + 28, width - 30, 64, index % 2 === 0 ? 0x1b2337 : 0x172031, 0.82);
      const nameText = this.add.text(34, y + 6, item.name, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: owned ? '#73c37d' : '#ffffff',
        fontStyle: 'bold',
      });
      const descText = this.add.text(34, y + 28, item.description, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9ea7b9',
        wordWrap: { width: 420 },
      });
      this.rowElements.push(rowBg, nameText, descText);

      if (owned) {
        const maxLabel = this.add.text(width - 80, y + 28, 'OWNED', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#73c37d',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.rowElements.push(maxLabel);
        return;
      }

      const buttonFill = canAfford ? 0x2d6a3e : 0x293140;
      const buttonTextColor = canAfford ? '#ffffff' : '#7c8698';
      const buyButton = this.add
        .rectangle(width - 80, y + 32, 108, 40, buttonFill, 1)
        .setStrokeStyle(1, canAfford ? 0x5acf72 : 0x475163, 1)
        .setInteractive({ useHandCursor: canAfford });
      const buyText = this.add
        .text(width - 80, y + 32, `${item.cost} kills`, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: buttonTextColor,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      if (canAfford) {
        buyButton.on('pointerover', () => buyButton.setFillStyle(0x3a8f4f));
        buyButton.on('pointerout', () => buyButton.setFillStyle(0x2d6a3e));
        buyButton.on('pointerdown', () => this.tryBuy(key));
      }

      this.rowElements.push(buyButton, buyText);
    });
  }

  private tryBuy(key: MetaShopItemKey): void {
    const cur = this.saveManager.load();
    const r = tryPurchaseMetaUpgrade(cur, key);
    if (!r.ok) return;
    audio.playClick();
    this.saveManager.save(r.next);
    audio.playLevelUp();
    this.renderRows();
  }

  private clearElements(elements: Phaser.GameObjects.GameObject[]): void {
    for (const el of elements) el.destroy();
    elements.length = 0;
  }
}
