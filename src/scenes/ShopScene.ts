import Phaser from 'phaser';
import { SaveData, loadSave, writeSave } from '../utils/save';
import { PERMANENT_UPGRADES, PermanentUpgrade, getUpgradeCost } from '../data/permanentUpgrades';
import { COLORS } from '../config';
import { audio } from '../systems/AudioSystem';
import { t } from '../core/i18n';

/**
 * ShopScene — paged upgrade shop that fits the default 800x600 canvas.
 */
export class ShopScene extends Phaser.Scene {
  private currentPage = 0;
  private readonly upgradesPerPage = 8;
  private saveData!: SaveData;
  private rowElements: Phaser.GameObjects.GameObject[] = [];
  private footerElements: Phaser.GameObjects.GameObject[] = [];
  private goldText!: Phaser.GameObjects.Text;
  private pageText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Shop' });
  }

  init(data: { page?: number }): void {
    this.currentPage = data.page ?? 0;
  }

  create(): void {
    const { width, height } = this.scale;
    this.saveData = loadSave();
    this.currentPage = Phaser.Math.Clamp(this.currentPage, 0, this.getTotalPages() - 1);

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);
    // Warm amber wash at the top — cozy between storms
    this.add.rectangle(width / 2, 30, width, 60, 0xd4a017, 0.03);
    this.add.rectangle(width / 2, 318, width - 26, 452, 0x11182a, 0.62).setStrokeStyle(2, 0x2d3e62, 0.8);
    // Heather strip at the bottom for highland warmth
    if (this.textures.exists('deco_heather')) {
      for (let i = 0; i < 5; i++) {
        const hx = 60 + i * (width - 120) / 4;
        this.add.image(hx, height - 12, 'deco_heather').setAlpha(0.35).setScale(1.2).setDepth(0);
      }
    }

    // Ambient moor wind — cozy between storms
    audio.startAmbientWind();

    const fadeIn = this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e, 1).setDepth(999);
    this.tweens.add({ targets: fadeIn, alpha: 0, duration: 360, onComplete: () => fadeIn.destroy() });

    this.add
      .text(width / 2, 32, t('ui.shop.title'), {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#d4a017',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.goldText = this.add
      .text(width / 2, 70, '', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#d4a017',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(2, 0x3a2a3a, 1);
    lineGfx.lineBetween(24, 92, width - 24, 92);
    lineGfx.lineBetween(24, 510, width - 24, 510);
    lineGfx.lineBetween(24, 548, width - 24, 548);

    this.pageText = this.add
      .text(width / 2, 528, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#b8a88a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.updateHeader();
    this.renderRows();
    this.renderFooter();

    this.events.once('shutdown', () => {
      audio.stopAmbientWind();
    });
  }

  private getTotalPages(): number {
    return Math.max(1, Math.ceil(PERMANENT_UPGRADES.length / this.upgradesPerPage));
  }

  private updateHeader(): void {
    const goldCopy = this.saveData.gold > 0
      ? t('ui.shop.gold_bank', { count: this.saveData.gold })
      : t('ui.shop.gold_bank_fresh');
    this.goldText.setText(goldCopy);
    this.pageText.setText(t('ui.shop.page', { current: this.currentPage + 1, total: this.getTotalPages() }));
  }

  private renderRows(): void {
    this.clearElements(this.rowElements);

    const { width } = this.scale;
    const visibleUpgrades = PERMANENT_UPGRADES.slice(
      this.currentPage * this.upgradesPerPage,
      (this.currentPage + 1) * this.upgradesPerPage
    );

    visibleUpgrades.forEach((upgrade, index) => {
      this.renderUpgradeRow(upgrade, index, width);
    });
  }

  private renderUpgradeRow(upgrade: PermanentUpgrade, index: number, width: number): void {
    const y = 114 + index * 49;
    const currentLevel = this.saveData.upgrades[upgrade.key] ?? 0;
    const isMaxed = currentLevel >= upgrade.maxLevel;
    const cost = isMaxed ? 0 : getUpgradeCost(upgrade, currentLevel);
    const canAfford = !isMaxed && this.saveData.gold >= cost;

    const rowBg = this.add.rectangle(
      width / 2,
      y + 18,
      width - 30,
      44,
      index % 2 === 0 ? 0x1a1828 : 0x161422,
      0.82
    );
    const nameText = this.add.text(34, y + 3, t(upgrade.nameKey), {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: isMaxed ? '#73c37d' : '#ffffff',
      fontStyle: 'bold',
    });
    const descText = this.add.text(34, y + 21, t(upgrade.descriptionKey), {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#9ea7b9',
      wordWrap: { width: 320 },
    });

    this.rowElements.push(rowBg, nameText, descText);

    for (let level = 0; level < upgrade.maxLevel; level++) {
      const pipX = width - 228 + level * 18;
      const filled = level < currentLevel;
      const pip = this.add
        .rectangle(pipX, y + 16, 12, 12, filled ? COLORS.WHISKY_GOLD : 0x273043, 1)
        .setStrokeStyle(1, filled ? 0xffcc44 : 0x4a5569, 1);
      this.rowElements.push(pip);
    }

    if (isMaxed) {
      const maxLabel = this.add
        .text(width - 74, y + 16, t('ui.shop.max'), {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#73c37d',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.rowElements.push(maxLabel);
      return;
    }

    const buttonFill = canAfford ? COLORS.SCOTTISH_BLUE : 0x1a1828;
    const buttonTextColor = canAfford ? '#ffffff' : '#6a5a4a';
    const buyButton = this.add
      .rectangle(width - 74, y + 16, 96, 36, buttonFill, 1)
      .setStrokeStyle(1, canAfford ? 0x8bb4ff : 0x3a2a3a, 1)
      .setInteractive({ useHandCursor: canAfford });
    const buyText = this.add
      .text(width - 74, y + 16, t('ui.shop.cost_gold', { cost }), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: buttonTextColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    if (canAfford) {
      buyButton.on('pointerover', () => buyButton.setFillStyle(0x3a6a3a));
      buyButton.on('pointerout', () => buyButton.setFillStyle(COLORS.SCOTTISH_BLUE));
      buyButton.on('pointerdown', () => this.purchaseUpgrade(upgrade));
    }

    this.rowElements.push(buyButton, buyText);
  }

  private purchaseUpgrade(upgrade: PermanentUpgrade): void {
    const currentLevel = this.saveData.upgrades[upgrade.key] ?? 0;
    if (currentLevel >= upgrade.maxLevel) return;

    const cost = getUpgradeCost(upgrade, currentLevel);
    if (this.saveData.gold < cost) return;

    audio.playClick();
    this.saveData.gold -= cost;
    this.saveData.upgrades[upgrade.key] = currentLevel + 1;
    this.saveData = writeSave(this.saveData);
    audio.playPurchase();

    // Gold particle burst from the gold bank text — purchase feels celebratory
    const gx = this.goldText.x;
    const gy = this.goldText.y;
    for (let i = 0; i < 3; i++) {
      const dot = this.add.circle(
        gx + Phaser.Math.Between(-20, 20), gy,
        Phaser.Math.Between(2, 4), 0xd4a017, 0.7
      ).setDepth(10);
      this.tweens.add({
        targets: dot, y: gy - 20 - i * 8, alpha: 0, scale: 0,
        duration: 300 + i * 80, ease: 'Power2',
        onComplete: () => dot.destroy(),
      });
    }

    this.updateHeader();
    this.renderRows();
    this.renderFooter();
  }

  private renderFooter(): void {
    this.clearElements(this.footerElements);

    const { width, height } = this.scale;
    const totalPages = this.getTotalPages();

    this.createPageButton(136, height - 20 - 52, t('ui.shop.prev'), this.currentPage > 0, () => {
      audio.playClick();
      this.currentPage--;
      this.updateHeader();
      this.renderRows();
      this.renderFooter();
    });

    this.createPageButton(width - 136, height - 20 - 52, t('ui.shop.next'), this.currentPage < totalPages - 1, () => {
      audio.playClick();
      this.currentPage++;
      this.updateHeader();
      this.renderRows();
      this.renderFooter();
    });

    const backButton = this.add
      .rectangle(width / 2, height - 26, 188, 36, 0x3a4357, 1)
      .setInteractive({ useHandCursor: true });
    const backText = this.add
      .text(width / 2, height - 26, t('ui.shop.back_to_menu'), {
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
      const fade = this.add
        .rectangle(width / 2, height / 2, width, height, 0x1a1a2e, 0)
        .setDepth(999);
      this.tweens.add({
        targets: fade,
        alpha: 1,
        duration: 260,
        onComplete: () => this.scene.start('MainMenu'),
      });
    });

    this.footerElements.push(backButton, backText);
  }

  private createPageButton(
    x: number,
    y: number,
    label: string,
    enabled: boolean,
    onClick: () => void
  ): void {
    const fill = enabled ? 0x24314f : 0x1b2230;
    const stroke = enabled ? 0x698ac2 : 0x343c4b;
    const textColor = enabled ? '#d6e3ff' : '#6a7384';
    const button = this.add
      .rectangle(x, y, 116, 34, fill, 1)
      .setStrokeStyle(1, stroke, 1)
      .setInteractive({ useHandCursor: enabled });
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: textColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    if (enabled) {
      button.on('pointerover', () => button.setFillStyle(0x304269));
      button.on('pointerout', () => button.setFillStyle(fill));
      button.on('pointerdown', onClick);
    }

    this.footerElements.push(button, text);
  }

  private clearElements(elements: Phaser.GameObjects.GameObject[]): void {
    for (const element of elements) {
      element.destroy();
    }
    elements.length = 0;
  }
}
