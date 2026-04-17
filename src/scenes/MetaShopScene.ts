import Phaser from 'phaser';
import { COLORS } from '../config';
import { t } from '../core/i18n';
import { SaveManager } from '../core/SaveManager';
import { tryPurchaseMetaUpgrade } from '../core/MetaPurchase';
import { META_SHOP_ITEMS, listMetaShopItemKeys, type MetaShopItemKey } from '../data/metaShopItems';
import { resolveMetaShopRowState, buildMetaShopLockReasonSuffix } from './metaShopRowState';
import { audio } from '../systems/AudioSystem';
import { GamepadMenuNav, type GamepadMenuEntry } from '../utils/GamepadMenuNav';

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

    this.backButton = this.add
      .rectangle(width / 2, height - 28, 200, 38, 0x252540, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, height - 28, t('ui.metaShop.back'), {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#e8d4a0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.backButton.on('pointerover', () => this.backButton.setFillStyle(0x2a2244));
    this.backButton.on('pointerout', () => this.backButton.setFillStyle(0x252540));
    this.backButton.on('pointerdown', () => {
      audio.playClick();
      this.scene.start('MainMenu');
    });

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

    this.clearElements(this.rowElements);
    const save = this.saveManager.load();
    const killCreditsCopy = save.totalKills > 0
      ? t('ui.metaShop.kill_credits', { count: save.totalKills })
      : t('ui.metaShop.kill_credits_fresh');
    this.killsText.setText(killCreditsCopy);

    const { width, height } = this.scale;
    const allKeys = listMetaShopItemKeys();
    const totalPages = Math.ceil(allKeys.length / this.ROWS_PER_PAGE);
    this.page = Math.min(this.page, totalPages - 1);
    const pageStart = this.page * this.ROWS_PER_PAGE;
    const pageKeys = allKeys.slice(pageStart, pageStart + this.ROWS_PER_PAGE);
    const entries: GamepadMenuEntry[] = [];

    // Page navigation (prev / next)
    if (totalPages > 1) {
      this.pageText.setText(t('ui.shop.page', { current: this.page + 1, total: totalPages }));

      if (this.page > 0) {
        const prevBtn = this.add
          .text(width / 2 - 90, height - 58, t('ui.shop.prev'), {
            fontFamily: 'monospace', fontSize: '13px', color: '#8ab8ff', fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => { this.page--; this.renderRows(); });
        this.rowElements.push(prevBtn);
      }
      if (this.page < totalPages - 1) {
        const nextBtn = this.add
          .text(width / 2 + 90, height - 58, t('ui.shop.next'), {
            fontFamily: 'monospace', fontSize: '13px', color: '#8ab8ff', fontStyle: 'bold',
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

      const rowBg = this.add.rectangle(width / 2, y + 28, width - 30, 64, index % 2 === 0 ? 0x1a1828 : 0x161422, 0.82);
      const nameText = this.add.text(34, y + 6, t(item.nameKey), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: owned ? '#73c37d' : locked ? '#8a7a98' : '#ffffff',
        fontStyle: 'bold',
      });

      // Build lock description — show what's needed.
      const descExtra = buildMetaShopLockReasonSuffix(item, state);

      const descText = this.add.text(34, y + 28, t(item.descriptionKey) + descExtra, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: locked ? '#7a7a8a' : '#9ea7b9',
        wordWrap: { width: 420 },
      });
      this.rowElements.push(rowBg, nameText, descText);

      if (owned) {
        const maxLabel = this.add.text(width - 80, y + 28, t('ui.common.owned'), {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#73c37d',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.rowElements.push(maxLabel);
        return;
      }

      if (locked) {
        const lockLabel = this.add.text(width - 80, y + 28, t('ui.common.locked'), {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#7a6a88',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.rowElements.push(lockLabel);
        return;
      }

      const buttonFill = canAfford ? 0x2d6a3e : 0x1a1828;
      const buttonTextColor = canAfford ? '#ffffff' : '#6a5a4a';
      const buyButton = this.add
        .rectangle(width - 80, y + 32, 108, 40, buttonFill, 1)
        .setStrokeStyle(1, canAfford ? 0x5acf72 : 0x3a2a3a, 1)
        .setInteractive({ useHandCursor: canAfford });
      const buyText = this.add
        .text(width - 80, y + 32, t('ui.common.buy_kills', { cost: item.cost }), {
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
        entries.push({ rect: buyButton, activate: () => this.tryBuy(key) });
      }

      this.rowElements.push(buyButton, buyText);
    });

    entries.push({
      rect: this.backButton,
      activate: () => {
        audio.playClick();
        this.scene.start('MainMenu');
      },
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

    // Green crystal burst — scatter with gravity for a weighty feel
    const gx = this.killsText.x;
    const gy = this.killsText.y;
    const flash = this.add.circle(gx, gy, 20, 0x77c977, 0.25).setDepth(9);
    this.tweens.add({
      targets: flash, scale: 2, alpha: 0, duration: 300,
      onComplete: () => flash.destroy(),
    });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const speed = Phaser.Math.Between(20, 40);
      const dot = this.add.circle(gx, gy,
        Phaser.Math.Between(2, 4), 0x77c977, 0.9
      ).setDepth(10);
      const endX = gx + Math.cos(angle) * speed;
      const peakY = gy - Phaser.Math.Between(15, 30);
      const endY = gy + Phaser.Math.Between(5, 15);
      this.tweens.add({
        targets: dot, x: endX, duration: 400 + i * 30,
        onComplete: () => dot.destroy(),
      });
      this.tweens.add({
        targets: dot,
        y: { value: peakY, duration: 180, ease: 'Quad.easeOut' },
      });
      this.tweens.add({
        targets: dot,
        y: { value: endY, duration: 220, ease: 'Quad.easeIn', delay: 180 },
        alpha: { value: 0, duration: 200, delay: 200 },
      });
    }

    this.renderRows();
  }

  private clearElements(elements: Phaser.GameObjects.GameObject[]): void {
    for (const el of elements) el.destroy();
    elements.length = 0;
  }
}
