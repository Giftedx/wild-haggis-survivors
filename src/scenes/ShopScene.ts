import Phaser from 'phaser';
import { loadSave, writeSave } from '../utils/save';
import { PERMANENT_UPGRADES, getUpgradeCost } from '../data/permanentUpgrades';
import { COLORS } from '../config';
import { audio } from '../systems/AudioSystem';

/**
 * ShopScene — polished upgrade shop with animated rows and hover effects.
 */
export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Shop' });
  }

  create(): void {
    const { width, height } = this.scale;
    const save = loadSave();

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);

    // Fade in
    const fadeIn = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1).setDepth(999);
    this.tweens.add({ targets: fadeIn, alpha: 0, duration: 400, onComplete: () => fadeIn.destroy() });

    // Title
    this.add.text(width / 2, 25, 'UPGRADES', {
      fontFamily: 'monospace', fontSize: '28px', color: '#d4a017',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Gold display with icon
    this.add.text(width / 2, 55, `Gold: ${save.gold}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#d4a017',
    }).setOrigin(0.5);

    // Separator line
    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(1, 0x333333, 1);
    lineGfx.lineBetween(20, 72, width - 20, 72);

    // Upgrade rows with staggered entrance
    const startY = 85;
    const rowH = 52;

    PERMANENT_UPGRADES.forEach((upgrade, i) => {
      const y = startY + i * rowH;
      const currentLevel = save.upgrades[upgrade.key] ?? 0;
      const isMaxed = currentLevel >= upgrade.maxLevel;
      const cost = isMaxed ? 0 : getUpgradeCost(upgrade, currentLevel);
      const canAfford = !isMaxed && save.gold >= cost;

      // Row background (subtle stripe)
      const rowBg = this.add.rectangle(width / 2, y + 12, width - 20, rowH - 4,
        i % 2 === 0 ? 0x1e1e3a : 0x222244, 0.3
      ).setAlpha(0);
      this.tweens.add({ targets: rowBg, alpha: 1, duration: 200, delay: i * 60 });

      // Name
      const nameText = this.add.text(24, y, upgrade.name, {
        fontFamily: 'monospace', fontSize: '13px',
        color: isMaxed ? '#66aa66' : '#ffffff', fontStyle: 'bold',
      }).setAlpha(0);
      this.tweens.add({ targets: nameText, alpha: 1, duration: 200, delay: i * 60 + 30 });

      // Description
      const descText = this.add.text(24, y + 17, upgrade.description, {
        fontFamily: 'monospace', fontSize: '10px', color: '#999999',
      }).setAlpha(0);
      this.tweens.add({ targets: descText, alpha: 1, duration: 200, delay: i * 60 + 60 });

      // Level pips
      for (let l = 0; l < upgrade.maxLevel; l++) {
        const px = width - 195 + l * 18;
        const filled = l < currentLevel;
        const pip = this.add.rectangle(px, y + 12, 12, 12,
          filled ? COLORS.WHISKY_GOLD : 0x2a2a3a
        ).setStrokeStyle(1, filled ? 0xffcc44 : 0x444444).setAlpha(0);
        this.tweens.add({ targets: pip, alpha: 1, duration: 200, delay: i * 60 + 80 });
      }

      // Buy button or MAX label
      if (!isMaxed) {
        const btnX = width - 65;
        const btn = this.add.rectangle(btnX, y + 12, 75, 32,
          canAfford ? COLORS.SCOTTISH_BLUE : 0x2a2a3a
        ).setInteractive({ useHandCursor: canAfford }).setAlpha(0);

        const btnLabel = this.add.text(btnX, y + 12, `${cost}g`, {
          fontFamily: 'monospace', fontSize: '11px',
          color: canAfford ? '#ffffff' : '#888888', fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: [btn, btnLabel], alpha: 1, duration: 200, delay: i * 60 + 100 });

        if (canAfford) {
          btn.on('pointerover', () => btn.setFillStyle(0x0077dd));
          btn.on('pointerout', () => btn.setFillStyle(COLORS.SCOTTISH_BLUE));
          btn.on('pointerdown', () => {
            audio.playClick();
            btn.disableInteractive();
            const s = loadSave();
            const lvl = s.upgrades[upgrade.key] ?? 0;
            const c = getUpgradeCost(upgrade, lvl);
            if (s.gold >= c && lvl < upgrade.maxLevel) {
              s.gold -= c;
              s.upgrades[upgrade.key] = lvl + 1;
              writeSave(s);
              audio.playLevelUp();
              this.scene.restart();
            }
          });
        }
      } else {
        const maxLabel = this.add.text(width - 65, y + 12, 'MAX', {
          fontFamily: 'monospace', fontSize: '11px', color: '#66aa66', fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: maxLabel, alpha: 1, duration: 200, delay: i * 60 + 100 });
      }
    });

    // Back button
    const backBtn = this.add.rectangle(width / 2, height - 35, 150, 38, 0x444444)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 35, 'BACK', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    backBtn.on('pointerover', () => backBtn.setFillStyle(0x555555));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x444444));
    backBtn.on('pointerdown', () => {
      audio.playClick();
      // Fade out
      const fade = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0).setDepth(999);
      this.tweens.add({
        targets: fade, alpha: 1, duration: 300,
        onComplete: () => this.scene.start('Menu'),
      });
    });
  }
}
