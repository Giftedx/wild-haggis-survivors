import Phaser from 'phaser';
import { t } from '../core/i18n';
import { SaveManager } from '../core/SaveManager';
import { tryPurchaseMetaUpgrade } from '../core/MetaPurchase';
import { META_SHOP_ITEMS, listMetaShopItemKeys, type MetaShopItemKey } from '../data/metaShopItems';
import {
  resolveMetaShopRowState,
  resolveMetaShopRowPalette,
  resolveMetaShopBuyButtonPalette,
  buildMetaShopLockReasonSuffix,
  META_SHOP_OWNED_PILL_COLOR,
  META_SHOP_LOCKED_PILL_COLOR,
  META_SHOP_PAGE_BUTTON_STYLE,
} from './metaShopRowState';
import { paginationState } from '../ui/pagination';
import { playPurchaseBurst } from './purchaseBurst';
import { clearGameObjects } from '../utils/clearGameObjects';
import { attachButtonHoverFill } from '../ui/buttonHover';
import { clickToScene } from './clickToScene';
import { audio } from '../systems/AudioSystem';
import { GamepadMenuNav, type GamepadMenuEntry } from '../utils/GamepadMenuNav';
import { resolveBackButtonPalette } from './backButtonPalette';
import { resolveShopRowBgColor } from './shopRowBg';
import { installShopBackdrop } from './installShopBackdrop';

/**
 * Spend meta kill currency on StatComposer upgrade keys (SaveManager v2).
 */
export class MetaShopScene extends Phaser.Scene {
  private saveManager = new SaveManager();
  private rowElements: Phaser.GameObjects.GameObject[] = [];
  private killsText!: Phaser.GameObjects.Text;
  private backButton!: Phaser.GameObjects.Rectangle;
  private gamepadNav: GamepadMenuNav | null = null;
  private page = 0;
  private readonly ROWS_PER_PAGE = 5;
  private pageText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MetaShop' });
  }

  create(): void {
    const { width, height } = this.scale;

    installShopBackdrop(this);

    this.add
      .text(width / 2, 32, t('ui.metaShop.title'), {
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
      .text(width / 2, 94, t('ui.metaShop.subtitle'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#8a93a8',
      })
      .setOrigin(0.5);

    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(2, 0x3a2a3a, 1);
    lineGfx.lineBetween(24, 108, width - 24, 108);
    lineGfx.lineBetween(24, 510, width - 24, 510);

    const backPalette = resolveBackButtonPalette();
    this.backButton = this.add
      .rectangle(width / 2, height - 28, 200, 38, backPalette.idle, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, height - 28, t('ui.metaShop.back'), {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#e8d4a0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    attachButtonHoverFill(this.backButton, backPalette.idle, backPalette.hover);
    this.backButton.on('pointerdown', clickToScene(this, 'MainMenu'));

    // Page indicator
    this.pageText = this.add
      .text(width / 2, height - 58, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8a93a8',
      })
      .setOrigin(0.5);

    this.page = 0;
    this.renderRows();

    this.events.once('shutdown', () => {
      audio.stopAmbientWind();
      this.gamepadNav?.destroy();
      this.gamepadNav = null;
    });
  }

  private renderRows(): void {
    this.gamepadNav?.destroy();
    this.gamepadNav = null;

    clearGameObjects(this.rowElements);
    const save = this.saveManager.load();
    const killCreditsCopy = save.totalKills > 0
      ? t('ui.metaShop.kill_credits', { count: save.totalKills })
      : t('ui.metaShop.kill_credits_fresh');
    this.killsText.setText(killCreditsCopy);

    const { width, height } = this.scale;
    const allKeys = listMetaShopItemKeys();
    const pagination = paginationState(allKeys.length, this.ROWS_PER_PAGE, this.page);
    this.page = pagination.clampedPage;
    const pageKeys = allKeys.slice(pagination.startIndex, pagination.endIndex);
    const entries: GamepadMenuEntry[] = [];

    // Page navigation (prev / next)
    if (pagination.pageVisible) {
      this.pageText.setText(t('ui.shop.page', { current: pagination.clampedPage + 1, total: pagination.pageCount }));

      if (pagination.prevEnabled) {
        const prevBtn = this.add
          .text(width / 2 - 90, height - 58, t('ui.shop.prev'), {
            fontFamily: 'monospace', fontSize: '13px', ...META_SHOP_PAGE_BUTTON_STYLE,
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => { this.page--; this.renderRows(); });
        this.rowElements.push(prevBtn);
      }
      if (pagination.nextEnabled) {
        const nextBtn = this.add
          .text(width / 2 + 90, height - 58, t('ui.shop.next'), {
            fontFamily: 'monospace', fontSize: '13px', ...META_SHOP_PAGE_BUTTON_STYLE,
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => { this.page++; this.renderRows(); });
        this.rowElements.push(nextBtn);
      }
    } else {
      this.pageText.setText('');
    }

    pageKeys.forEach((key, index) => {
      const item = META_SHOP_ITEMS[key];
      const y = 124 + index * 72;
      const state = resolveMetaShopRowState(item, key, save);
      const { owned, locked, canAfford } = state;
      const rowPalette = resolveMetaShopRowPalette(state);

      const rowBg = this.add.rectangle(width / 2, y + 28, width - 30, 64, resolveShopRowBgColor(index), 0.82);
      const nameText = this.add.text(34, y + 6, t(item.nameKey), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: rowPalette.nameColor,
        fontStyle: 'bold',
      });

      // Build lock description — show what's needed.
      const descExtra = buildMetaShopLockReasonSuffix(item, state);

      const descText = this.add.text(34, y + 28, t(item.descriptionKey) + descExtra, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: rowPalette.descColor,
        wordWrap: { width: 420 },
      });
      this.rowElements.push(rowBg, nameText, descText);

      if (owned) {
        const maxLabel = this.add.text(width - 80, y + 28, t('ui.common.owned'), {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: META_SHOP_OWNED_PILL_COLOR,
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.rowElements.push(maxLabel);
        return;
      }

      if (locked) {
        const lockLabel = this.add.text(width - 80, y + 28, t('ui.common.locked'), {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: META_SHOP_LOCKED_PILL_COLOR,
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.rowElements.push(lockLabel);
        return;
      }

      const buyPalette = resolveMetaShopBuyButtonPalette(canAfford);
      const buyButton = this.add
        .rectangle(width - 80, y + 32, 108, 40, buyPalette.fillColor, 1)
        .setStrokeStyle(1, buyPalette.strokeColor, 1)
        .setInteractive({ useHandCursor: canAfford });
      const buyText = this.add
        .text(width - 80, y + 32, t('ui.common.buy_kills', { cost: item.cost }), {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: buyPalette.textColor,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      if (canAfford) {
        attachButtonHoverFill(buyButton, buyPalette.fillColor, 0x3a8f4f);
        buyButton.on('pointerdown', () => this.tryBuy(key));
        entries.push({ rect: buyButton, activate: () => this.tryBuy(key) });
      }

      this.rowElements.push(buyButton, buyText);
    });

    entries.push({
      rect: this.backButton,
      activate: clickToScene(this, 'MainMenu'),
    });
    this.gamepadNav = new GamepadMenuNav(this, entries);
  }

  private tryBuy(key: MetaShopItemKey): void {
    const cur = this.saveManager.load();
    const r = tryPurchaseMetaUpgrade(cur, key);
    if (!r.ok) return;
    audio.playClick();
    this.saveManager.save(r.next);
    audio.playPurchase();

    // Green crystal burst — weighty feel
    playPurchaseBurst(this, this.killsText.x, this.killsText.y, 0x77c977, 0.25);

    this.renderRows();
  }

}
