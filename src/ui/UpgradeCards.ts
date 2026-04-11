import Phaser from 'phaser';
import { t } from '../core/i18n';
import { UpgradeCard, RARITY_COLORS } from '../data/upgrades';
import { getCameraViewport } from './cameraViewport';

/**
 * UpgradeCards — renders 3 selectable upgrade cards on level-up.
 *
 * Elements are added directly to the scene with scrollFactor(0) — NOT
 * in a Container — because Phaser's input system doesn't correctly
 * transform pointer coordinates for interactive objects inside
 * scrollFactor(0) containers when the camera has scrolled.
 */
export class UpgradeCardsUI {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];
  private pendingHandles: import('../utils/UpdateTickers').TickerHandle[] = [];
  private tickers: import('../utils/UpdateTickers').UpdateTickers;
  private onSelect: (card: UpgradeCard) => void;
  private onReroll: (() => void) | null = null;
  private rerollsLeft: number = 0;

  constructor(scene: Phaser.Scene, onSelect: (card: UpgradeCard) => void, tickers: import('../utils/UpdateTickers').UpdateTickers) {
    this.scene = scene;
    this.onSelect = onSelect;
    this.tickers = tickers;
  }

  private getUiViewport(): { x: number; y: number; width: number; height: number } {
    const { x, y, width, height } = getCameraViewport(this.scene);
    return { x, y, width, height };
  }

  /** Set the reroll callback and grant one reroll per level-up */
  setRerollCallback(cb: () => void): void {
    this.onReroll = cb;
  }

  /** Grant rerolls (called each time a level-up screen opens) */
  grantReroll(): void {
    this.rerollsLeft = 1;
  }

  show(
    cards: UpgradeCard[],
    level: number,
    opts?: { bannerTitle?: string; bannerSubtitle?: string; hideReroll?: boolean }
  ): void {
    this.hide();

    const { x: left, y: top, width, height } = this.getUiViewport();
    const depth = 200;
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // Dark overlay — high opacity to fully hide the green terrain behind
    // Interactive to block joystick/other input from activating through it
    const overlay = this.scene.add.rectangle(centerX, centerY, width, height, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(depth).setInteractive();
    this.elements.push(overlay);

    const titleStr = opts?.bannerTitle ?? t('ui.upgradeCards.level_title', { level });
    const subtitleStr = opts?.bannerSubtitle ?? t('ui.upgradeCards.choose_upgrade');

    // Title
    const title = this.scene.add.text(centerX, top + 55, titleStr, {
      fontFamily: 'monospace', fontSize: '40px', color: '#d4a017',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(title);

    const subtitle = this.scene.add.text(centerX, top + 100, subtitleStr, {
      fontFamily: 'monospace', fontSize: '18px', color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(subtitle);

    // Reroll button
    if (this.rerollsLeft > 0 && this.onReroll && !opts?.hideReroll) {
      const rerollBtn = this.scene.add.text(centerX, top + height - 48, t('ui.upgradeCards.reroll', { count: this.rerollsLeft }), {
        fontFamily: 'monospace', fontSize: '18px', color: '#d4a017',
        fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
        backgroundColor: '#2a2a3a', padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3)
        .setInteractive({ useHandCursor: true });
      this.elements.push(rerollBtn);

      rerollBtn.on('pointerover', () => rerollBtn.setColor('#ffcc44'));
      rerollBtn.on('pointerout', () => rerollBtn.setColor('#d4a017'));
      rerollBtn.on('pointerdown', () => {
        if (this.rerollsLeft > 0) {
          this.rerollsLeft--;
          this.hide();
          this.onReroll!();
        }
      });
    }

    // Card layout — scale down if too many cards for the screen width
    const maxCardW = 210;
    const gap = Math.max(10, Math.min(20, Math.round(width * 0.02)));
    const sideMargin = Math.max(16, Math.round(width * 0.06));
    const hoverScale = 1.05;
    const availableW = Math.max(160, width - sideMargin * 2);
    // Reserve room for hover expansion so edge cards do not clip at narrow widths.
    let cardW = Math.min(maxCardW, ((availableW - (cards.length - 1) * gap) / cards.length) / hoverScale);
    cardW = Math.max(90, cardW);
    if (cards.length * cardW + (cards.length - 1) * gap > availableW) {
      cardW = Math.max(72, (availableW - (cards.length - 1) * gap) / cards.length);
    }
    const cardH = Math.round(cardW * (260 / 210)); // maintain aspect ratio
    const totalW = cards.length * cardW + (cards.length - 1) * gap;
    const startX = left + sideMargin + cardW / 2 + Math.max(0, (availableW - totalW) / 2);
    const minCardY = cardH / 2 + 20;
    const maxCardY = height - cardH / 2 - 72;
    const cardY = top + Math.max(minCardY, Math.min(height / 2 + 20, maxCardY));

    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap);

      // Stagger animation — raw tickers (UI continues during gameplay pause)
      const handle = this.tickers.addOnce('raw', i * 120, () => {
        this.createCard(x, cardY, cardW, cardH, card, depth + 2);
      });
      this.pendingHandles.push(handle);
    });

    if (typeof globalThis !== 'undefined') {
      const win = globalThis as unknown as { AUTO_BATTLE?: boolean };
      if (win.AUTO_BATTLE && cards.length > 0) {
        const first = cards[0];
        const maxStaggerMs = (cards.length - 1) * 120;
        const autoPickHandle = this.tickers.addOnce('raw', maxStaggerMs + 100, () => {
          this.onSelect(first);
        });
        this.pendingHandles.push(autoPickHandle);
      }
    }
  }

  private createCard(
    x: number, y: number, w: number, h: number,
    card: UpgradeCard, depth: number
  ): void {
    const borderColor = RARITY_COLORS[card.rarity];

    // Card background — the interactive hit area
    const bg = this.scene.add.rectangle(x, y, w, h, 0x1a1a2e)
      .setStrokeStyle(3, borderColor)
      .setScrollFactor(0)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });
    this.elements.push(bg);

    // Rarity glow — animated for legendary, static for rare
    if (card.rarity === 'legendary') {
      const glow = this.scene.add.rectangle(x, y, w + 8, h + 8, borderColor, 0.15)
        .setScrollFactor(0).setDepth(depth - 1);
      this.elements.push(glow);

      // Pulsing golden glow
      this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0.1, to: 0.35 },
        scale: { from: 1, to: 1.03 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Sparkle particles around the card
      for (let s = 0; s < 4; s++) {
        const sx = x + Phaser.Math.Between(-w / 2, w / 2);
        const sy = y + Phaser.Math.Between(-h / 2, h / 2);
        const sparkle = this.scene.add.circle(sx, sy, 2, 0xffdd44, 0)
          .setScrollFactor(0).setDepth(depth + 2);
        this.elements.push(sparkle);

        this.scene.tweens.add({
          targets: sparkle,
          alpha: { from: 0, to: 0.8 },
          scale: { from: 0.5, to: 1.5 },
          y: sy - 15,
          duration: 800 + s * 200,
          delay: s * 300,
          yoyo: true,
          repeat: -1,
        });
      }
    } else if (card.rarity === 'rare') {
      const glow = this.scene.add.rectangle(x, y, w + 4, h + 4, borderColor, 0.1)
        .setScrollFactor(0).setDepth(depth - 1);
      this.elements.push(glow);
    }

    const textureManager = (this.scene as unknown as { textures?: { exists: (key: string) => boolean } }).textures;
    if (textureManager && !textureManager.exists(card.icon)) {
      throw new Error(`Missing upgrade card icon texture: ${card.icon} (${card.id})`);
    }

    // Card icon
    const icon = this.scene.add.sprite(x, y - 65, card.icon)
      .setScale(2.5).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(icon);

    // Name
    const name = this.scene.add.text(x, y - 18, t(card.name), {
      fontFamily: 'monospace', fontSize: '17px', color: '#ffffff',
      fontStyle: 'bold', align: 'center', wordWrap: { width: w - 20 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(name);

    // Description
    const desc = this.scene.add.text(x, y + 30, t(card.description), {
      fontFamily: 'monospace', fontSize: '14px', color: '#bbbbbb',
      align: 'center', lineSpacing: 4,
      wordWrap: { width: w - 20 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(desc);

    // Rarity label (resolved via i18n so future locales can translate)
    const rarityLabel = this.scene.add.text(x, y + h / 2 - 18, t(`ui.common.rarity.${card.rarity}`), {
      fontFamily: 'monospace', fontSize: '13px', fontStyle: 'bold',
      color: `#${borderColor.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(rarityLabel);

    // Hover — scale up card group
    const cardElements = [bg, icon, name, desc, rarityLabel];
    bg.on('pointerover', () => {
      bg.setFillStyle(0x2a2a4e);
      for (const el of cardElements) {
        (el as any).setScale?.((el as any).scaleX * 1.05, (el as any).scaleY * 1.05);
      }
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x1a1a2e);
      // Reset scales — must match the values set at creation (icon is 2.5,
      // everything else is 1). Using 2 here permanently shrinks the icon
      // every time the player hovers-then-unhovers a card.
      icon.setScale(2.5);
      name.setScale(1);
      desc.setScale(1);
      rarityLabel.setScale(1);
      bg.setScale(1);
    });

    // Click to select
    bg.on('pointerdown', () => {
      this.hide();
      this.onSelect(card);
    });
  }

  hide(): void {
    for (const h of this.pendingHandles) h.cancel();
    this.pendingHandles = [];

    for (const el of this.elements) {
      this.scene.tweens.killTweensOf(el);
      el.destroy();
    }
    this.elements = [];
  }
}
