import Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
import { SaveData, loadSave, writeSave } from '../utils/save';
import { PERMANENT_UPGRADES, PermanentUpgrade } from '../data/permanentUpgrades';
import {
  resolveShopUpgradeRowState,
  type ShopUpgradeRowState,
  resolveShopPipStyle,
  resolveShopBuyButtonPalette,
  resolveShopPageButtonPalette,
  SHOP_PAGE_BUTTON_HOVER_FILL,
} from './shopUpgradeRowState';
import { paginationState } from '../ui/pagination';
import { resolveShopRowBgColor } from './shopRowBg';
import { addSceneFadeIn, startSceneFadeOut } from './sceneFade';
import { playPurchaseBurst } from './purchaseBurst';
import { installShopBackdrop } from './installShopBackdrop';
import { clearGameObjects } from '../utils/clearGameObjects';
import { createGameButton } from '../ui/gameButton';
import { audio } from '../systems/AudioSystem';
import { stopAmbientWindOnShutdown } from './stopAmbientWindOnShutdown';
import { globalEventBus } from '../core/GlobalEventBus';
import { t } from '../core/i18n';
import { ShopAmbientLoop } from '../systems/music/ShopAmbientLoop';

/**
 * ShopScene — paged upgrade shop that fits the default 800x600 canvas.
 */
export class ShopScene extends Phaser.Scene {
  private currentPage = 0;
  private readonly upgradesPerPage = 8;
  private saveData!: SaveData;
  private shopMusic = new ShopAmbientLoop();
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
    const { width } = this.scale;
    this.saveData = loadSave();
    this.currentPage = Phaser.Math.Clamp(this.currentPage, 0, this.getTotalPages() - 1);

    installShopBackdrop(this);

    this.add
      .text(width / 2, 32, t('ui.shop.title'), {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: COLORS_CSS.WHISKY_GOLD,
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.goldText = this.add
      .text(width / 2, 70, '', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: COLORS_CSS.WHISKY_GOLD,
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

    this.shopMusic.start();
    stopAmbientWindOnShutdown(this);
    this.events.once('shutdown', () => this.shopMusic.stop());
    addSceneFadeIn(this, 400, 0x1a1008);
  }

  private getPagination() {
    return paginationState(PERMANENT_UPGRADES.length, this.upgradesPerPage, this.currentPage);
  }

  private getTotalPages(): number {
    return this.getPagination().pageCount;
  }

  private updateHeader(): void {
    const goldCopy = this.saveData.gold > 0
      ? t('ui.shop.gold_bank', { count: this.saveData.gold })
      : t('ui.shop.gold_bank_fresh');
    this.goldText.setText(goldCopy);
    const pagination = this.getPagination();
    this.pageText.setText(t('ui.shop.page', { current: pagination.clampedPage + 1, total: pagination.pageCount }));
  }

  private renderRows(): void {
    clearGameObjects(this.rowElements);

    const { width } = this.scale;
    const pagination = this.getPagination();
    const visibleUpgrades = PERMANENT_UPGRADES.slice(pagination.startIndex, pagination.endIndex);

    visibleUpgrades.forEach((upgrade, index) => {
      this.renderUpgradeRow(upgrade, index, width);
    });
  }

  private renderUpgradeRow(upgrade: PermanentUpgrade, index: number, width: number): void {
    const y = 114 + index * 49;
    const rowState = resolveShopUpgradeRowState(
      upgrade,
      this.saveData.upgrades[upgrade.key],
      this.saveData.gold,
    );
    const { currentLevel, isMaxed, cost, canAfford } = rowState;

    const rowBg = this.add.rectangle(
      width / 2,
      y + 18,
      width - 30,
      44,
      resolveShopRowBgColor(index),
      0.82
    );
    const nameText = this.add.text(34, y + 3, t(upgrade.nameKey), {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: isMaxed ? '#73c37d' : COLORS_CSS.WHITE,
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
      const pipStyle = resolveShopPipStyle(level < currentLevel);
      const pip = this.add
        .rectangle(pipX, y + 16, 12, 12, pipStyle.fillColor, 1)
        .setStrokeStyle(1, pipStyle.strokeColor, 1);
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

    const buyPalette = resolveShopBuyButtonPalette(canAfford);
    const { rect: buyButton, label: buyText } = createGameButton(this, {
      x: width - 74, y: y + 16, width: 96, height: 36,
      label: t('ui.shop.cost_gold', { cost }),
      tier: 'primary', fontSize: '13px',
      fillOverride: buyPalette.fillColor,
      hoverOverride: canAfford ? 0x3a6a3a : buyPalette.fillColor,
      textColorOverride: buyPalette.textColor,
    });
    buyButton.setStrokeStyle(1, buyPalette.strokeColor, 1);

    if (!canAfford) {
      buyButton.disableInteractive();
    } else {
      buyButton.on('pointerdown', () => this.purchaseUpgrade(upgrade, rowState));
    }

    this.rowElements.push(buyButton, buyText);
  }

  private purchaseUpgrade(upgrade: PermanentUpgrade, rowState: ShopUpgradeRowState): void {
    const { currentLevel, isMaxed, cost, canAfford } = rowState;
    if (isMaxed || !canAfford) return;

    audio.playClick();
    this.saveData.gold -= cost;
    const newLevel = currentLevel + 1;
    this.saveData.upgrades[upgrade.key] = newLevel;
    this.saveData = writeSave(this.saveData);
    audio.playPurchase();
    // Cross-scene fan-out — AnalyticsManager listens for upgrade popularity.
    globalEventBus.emit('GLOBAL_SHOP_PURCHASE', {
      itemKey: upgrade.key,
      scope: 'gold_shop',
      cost,
      newLevel,
    });

    // Gold particle burst — "cha-ching" feel
    playPurchaseBurst(this, this.goldText.x, this.goldText.y, COLORS.WHISKY_GOLD, 0.3);

    this.updateHeader();
    this.renderRows();
    this.renderFooter();
  }

  private renderFooter(): void {
    clearGameObjects(this.footerElements);

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

    const { rect: backButton, label: backText } = createGameButton(this, {
      x: width / 2, y: height - 26, width: 188, height: 36,
      label: t('ui.shop.back_to_menu'),
      tier: 'secondary', fontSize: '15px',
    });
    backButton.on('pointerdown', () => {
      audio.playClick();
      startSceneFadeOut(this, 260, () => this.scene.start('MainMenu'), 0x1a1008);
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
    const pageBtnStyle = resolveShopPageButtonPalette(enabled);
    const { rect: button, label: text } = createGameButton(this, {
      x, y, width: 116, height: 34, label,
      tier: 'tertiary', fontSize: '13px',
      fillOverride: pageBtnStyle.fillColor,
      hoverOverride: enabled ? SHOP_PAGE_BUTTON_HOVER_FILL : pageBtnStyle.fillColor,
      textColorOverride: pageBtnStyle.textColor,
    });
    button.setStrokeStyle(1, pageBtnStyle.strokeColor, 1);

    if (!enabled) {
      button.disableInteractive();
    } else {
      button.on('pointerdown', onClick);
    }

    this.footerElements.push(button, text);
  }

}
