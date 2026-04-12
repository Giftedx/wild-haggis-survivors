import Phaser from 'phaser';
import { COLORS } from '../config';
import { ACHIEVEMENT_DEFS } from '../core/BalanceConfig';
import { t } from '../core/i18n';
import { SaveManager } from '../core/SaveManager';
import { tryPurchaseMetaUpgrade } from '../core/MetaPurchase';
import { META_SHOP_ITEMS, listMetaShopItemKeys, type MetaShopItemKey } from '../data/metaShopItems';
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

    const fadeIn = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1).setDepth(999);
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
    lineGfx.lineStyle(2, 0x444444, 1);
    lineGfx.lineBetween(24, 108, width - 24, 108);
    lineGfx.lineBetween(24, 510, width - 24, 510);

    this.backButton = this.add
      .rectangle(width / 2, height - 28, 200, 38, 0x3a4357, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, height - 28, t('ui.metaShop.back'), {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.backButton.on('pointerover', () => this.backButton.setFillStyle(0x4a566f));
    this.backButton.on('pointerout', () => this.backButton.setFillStyle(0x3a4357));
    this.backButton.on('pointerdown', () => {
      audio.playClick();
      this.scene.start('MainMenu');
    });

    this.renderRows();

    this.events.once('shutdown', () => {
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

    const { width } = this.scale;
    const keys = listMetaShopItemKeys();
    const entries: GamepadMenuEntry[] = [];

    keys.forEach((key, index) => {
      const item = META_SHOP_ITEMS[key];
      const y = 124 + index * 72;
      const owned = save.unlockedUpgrades.includes(key);
      const req = 'requiresAchievement' in item ? item.requiresAchievement : undefined;
      const achievementMet = !req || save.unlockedAchievements.includes(req);
      const locked = !achievementMet && !owned;
      const canAfford = !owned && achievementMet && save.totalKills >= item.cost;

      const rowBg = this.add.rectangle(width / 2, y + 28, width - 30, 64, index % 2 === 0 ? 0x1b2337 : 0x172031, 0.82);
      const nameText = this.add.text(34, y + 6, t(item.nameKey), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: owned ? '#73c37d' : locked ? '#8a7a98' : '#ffffff',
        fontStyle: 'bold',
      });
      const descExtra = req && !achievementMet
        ? `\n${t('ui.metaShop.requires', { title: t(ACHIEVEMENT_DEFS[req]!.titleKey) })}`
        : '';
      const descText = this.add.text(34, y + 28, t(item.descriptionKey) + descExtra, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9ea7b9',
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

      const buttonFill = canAfford ? 0x2d6a3e : 0x293140;
      const buttonTextColor = canAfford ? '#ffffff' : '#7c8698';
      const buyButton = this.add
        .rectangle(width - 80, y + 32, 108, 40, buttonFill, 1)
        .setStrokeStyle(1, canAfford ? 0x5acf72 : 0x475163, 1)
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

    // Gold particle burst — purchase feels celebratory
    const gx = this.killsText.x;
    const gy = this.killsText.y;
    for (let i = 0; i < 3; i++) {
      const dot = this.add.circle(
        gx + Phaser.Math.Between(-20, 20), gy,
        Phaser.Math.Between(2, 4), 0x77c977, 0.7
      ).setDepth(10);
      this.tweens.add({
        targets: dot, y: gy - 20 - i * 8, alpha: 0, scale: 0,
        duration: 300 + i * 80, ease: 'Power2',
        onComplete: () => dot.destroy(),
      });
    }

    this.renderRows();
  }

  private clearElements(elements: Phaser.GameObjects.GameObject[]): void {
    for (const el of elements) el.destroy();
    elements.length = 0;
  }
}
