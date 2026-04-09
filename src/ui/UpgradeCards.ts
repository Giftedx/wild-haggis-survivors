import Phaser from 'phaser';
import { UpgradeCard, RARITY_COLORS } from '../data/upgrades';

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
  private pendingTimers: Phaser.Time.TimerEvent[] = [];
  private onSelect: (card: UpgradeCard) => void;

  constructor(scene: Phaser.Scene, onSelect: (card: UpgradeCard) => void) {
    this.scene = scene;
    this.onSelect = onSelect;
  }

  show(cards: UpgradeCard[], level: number): void {
    this.hide();

    const { width, height } = this.scene.scale;
    const depth = 200;

    // Dark overlay — high opacity to fully hide the green terrain behind
    // Interactive to block joystick/other input from activating through it
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(depth).setInteractive();
    this.elements.push(overlay);

    // Title
    const title = this.scene.add.text(width / 2, 50, `LEVEL ${level}`, {
      fontFamily: 'monospace', fontSize: '32px', color: '#d4a017',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(title);

    const subtitle = this.scene.add.text(width / 2, 85, 'Choose an upgrade', {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(subtitle);

    // Card layout — scale down if too many cards for the screen width
    const maxCardW = 180;
    const gap = 20;
    const availableW = width - 40; // 20px margin each side
    const cardW = Math.min(maxCardW, (availableW - (cards.length - 1) * gap) / cards.length);
    const cardH = Math.round(cardW * (220 / 180)); // maintain aspect ratio
    const totalW = cards.length * cardW + (cards.length - 1) * gap;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = height / 2 + 20;

    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap);

      // Stagger animation — track timer for cleanup
      const timer = this.scene.time.delayedCall(i * 120, () => {
        this.createCard(x, cardY, cardW, cardH, card, depth + 2);
      });
      this.pendingTimers.push(timer);
    });
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

    // Icon placeholder
    const icon = this.scene.add.sprite(x, y - 55, card.icon)
      .setScale(2).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(icon);

    // Name
    const name = this.scene.add.text(x, y - 15, card.name, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
      fontStyle: 'bold', align: 'center', wordWrap: { width: w - 20 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(name);

    // Description
    const desc = this.scene.add.text(x, y + 25, card.description, {
      fontFamily: 'monospace', fontSize: '11px', color: '#aaaaaa',
      align: 'center', wordWrap: { width: w - 20 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(desc);

    // Rarity label
    const rarityLabel = this.scene.add.text(x, y + h / 2 - 15, card.rarity.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '10px',
      color: `#${borderColor.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.elements.push(rarityLabel);

    // Hover
    bg.on('pointerover', () => {
      bg.setFillStyle(0x2a2a4e);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x1a1a2e);
    });

    // Click to select
    bg.on('pointerdown', () => {
      this.hide();
      this.onSelect(card);
    });
  }

  hide(): void {
    // Cancel any pending stagger timers
    for (const timer of this.pendingTimers) {
      timer.destroy();
    }
    this.pendingTimers = [];

    for (const el of this.elements) {
      this.scene.tweens.killTweensOf(el);
      el.destroy();
    }
    this.elements = [];
  }
}
