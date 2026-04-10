import Phaser from 'phaser';
import { COLORS } from '../config';
import { SaveManager } from '../core/SaveManager';
import { SaveData, loadSave, writeSave } from '../utils/save';
import { audio } from '../systems/AudioSystem';
import { musicEngine } from '../systems/music/ProceduralMusicEngine';
import {
  DEFAULT_VARIANT_KEY,
  VARIANTS,
  VariantKey,
  formatVariantModifierSummary,
  getVariantByKey,
  getVariantUnlockProgress,
  isVariantUnlocked,
} from '../data/variants';

/**
 * MenuScene — main menu with variant loadout selection.
 */
export class MenuScene extends Phaser.Scene {
  private transitioning = false;
  private carouselIndex = 0;
  private selectedVariantKey: VariantKey = DEFAULT_VARIANT_KEY;
  private saveData!: SaveData;
  private variantPanelElements: Phaser.GameObjects.GameObject[] = [];
  private mascot: Phaser.GameObjects.Sprite | null = null;
  private loadoutBanner: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    this.transitioning = false;
    this.clearVariantPanel();
    this.saveData = loadSave();
    this.selectedVariantKey = this.saveData.selectedVariant;
    this.carouselIndex = Math.max(0, VARIANTS.findIndex((variant) => variant.key === this.selectedVariantKey));

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);
    this.add.rectangle(width / 2, 106, width - 64, 200, 0x11172b, 0.58).setStrokeStyle(2, 0x263655, 0.9);
    this.add.rectangle(width / 2, 468, width - 40, 166, 0x0d1323, 0.92).setStrokeStyle(2, 0x31476e, 0.95);

    for (let i = 0; i < 24; i++) {
      const dot = this.add.circle(
        Phaser.Math.Between(30, width - 30),
        Phaser.Math.Between(24, 260),
        Phaser.Math.Between(2, 5),
        COLORS.HEATHER,
        Phaser.Math.FloatBetween(0.04, 0.12)
      );
      this.tweens.add({
        targets: dot,
        y: dot.y - Phaser.Math.Between(18, 40),
        alpha: 0,
        duration: Phaser.Math.Between(2600, 5200),
        repeat: -1,
        yoyo: true,
      });
    }

    this.mascot = this.add
      .sprite(width / 2, 82, getVariantByKey(this.selectedVariantKey).textureKey)
      .setScale(3.15);
    this.tweens.add({
      targets: this.mascot,
      y: this.mascot.y + 8,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    this.tweens.add({
      targets: this.mascot,
      angle: { from: -5, to: 5 },
      duration: 1900,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    const title = this.add
      .text(width / 2, 150, 'Wild Haggis\nSurvivors', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#d4a017',
        align: 'center',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: 146,
      duration: 700,
      ease: 'Power2',
    });

    const subtitle = this.add
      .text(width / 2, 214, 'Survive the Highlands. Bank the gold. Grow the herd.', {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#95a5c3',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 500, delay: 260 });

    this.loadoutBanner = this.add
      .text(width / 2, 246, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#b7d4ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: this.loadoutBanner, alpha: 1, duration: 400, delay: 420 });
    this.updateLoadoutBanner();

    const statsLabel = this.saveData.totalRuns > 0
      ? this.formatStatsStrip()
      : 'Achievement-unlocked variants are sidegrades. Gold still buys permanent upgrades.';
    const statsText = this.add
      .text(width / 2, 274, statsLabel, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#7f8ca7',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: statsText, alpha: 1, duration: 450, delay: 520 });

    this.createButton(width / 2 - 128, 330, 220, 54, 'PLAY', COLORS.SCOTTISH_BLUE, () => {
      audio.playClick();
      new SaveManager().clearActiveRun();
      this.fadeToScene('Game');
    }, 560);

    this.createButton(width / 2 + 128, 330, 220, 54, 'UPGRADES', 0x3a4357, () => {
      audio.playClick();
      this.fadeToScene('Shop');
    }, 660);

    audio.setEnabled(this.saveData.settings.soundOn);
    musicEngine.setEnabled(this.saveData.settings.musicOn);

    this.createToggle(104, height - 26, 'SFX', this.saveData.settings.soundOn, (on) => {
      this.saveData.settings.soundOn = on;
      this.commitSave();
      audio.setEnabled(on);
    }, 760);

    this.createToggle(218, height - 26, 'Music', this.saveData.settings.musicOn, (on) => {
      this.saveData.settings.musicOn = on;
      this.commitSave();
      musicEngine.setEnabled(on);
    }, 820);

    const enemyTextures = ['tourist', 'chef', 'terrier', 'highland_cow', 'eagle', 'sheep'];
    for (let i = 0; i < 7; i++) {
      const tex = enemyTextures[i % enemyTextures.length];
      const ey = Phaser.Math.Between(520, height - 18);
      const sprite = this.add.sprite(-30, ey, tex).setAlpha(0.08).setScale(1.45);
      this.tweens.add({
        targets: sprite,
        x: width + 30,
        duration: Phaser.Math.Between(7600, 12400),
        delay: i * 900,
        repeat: -1,
        onRepeat: () => {
          sprite.setY(Phaser.Math.Between(520, height - 18));
        },
      });
    }

    this.renderVariantCarousel();

    this.add
      .text(width - 10, height - 10, 'v2.1', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#44506a',
      })
      .setOrigin(1, 1);
  }

  private renderVariantCarousel(): void {
    this.clearVariantPanel();

    const { width } = this.scale;
    const panelX = width / 2;
    const panelY = 470;
    const panelWidth = 680;
    const panelHeight = 150;
    const variant = VARIANTS[this.carouselIndex];
    const unlocked = isVariantUnlocked(variant, this.saveData);
    const selected = this.selectedVariantKey === variant.key;
    const unlockProgress = getVariantUnlockProgress(variant, this.saveData);
    const infoX = panelX - 92;

    const panel = this.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, 0x10192d, 0.95)
      .setStrokeStyle(2, unlocked ? 0x4f77b7 : 0x3f4657, 1);
    this.variantPanelElements.push(panel);

    const header = this.add.text(panelX - panelWidth / 2 + 18, panelY - 68, 'VARIANT LOADOUT', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#8aa4d7',
      fontStyle: 'bold',
      letterSpacing: 1,
    });
    const pageText = this.add
      .text(panelX + panelWidth / 2 - 18, panelY - 68, `${this.carouselIndex + 1} / ${VARIANTS.length}`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#6f83a9',
      })
      .setOrigin(1, 0);
    this.variantPanelElements.push(header, pageText);

    this.createCarouselButton(panelX - panelWidth / 2 + 34, panelY, '<', () => {
      audio.playClick();
      this.carouselIndex = (this.carouselIndex - 1 + VARIANTS.length) % VARIANTS.length;
      this.renderVariantCarousel();
    });

    this.createCarouselButton(panelX + panelWidth / 2 - 34, panelY, '>', () => {
      audio.playClick();
      this.carouselIndex = (this.carouselIndex + 1) % VARIANTS.length;
      this.renderVariantCarousel();
    });

    const previewFrame = this.add
      .rectangle(panelX - 238, panelY + 8, 118, 112, 0x16213a, 0.95)
      .setStrokeStyle(1, unlocked ? 0x406099 : 0x374157, 1);
    const preview = this.add
      .sprite(previewFrame.x, previewFrame.y - 2, variant.textureKey)
      .setScale(3.05)
      .setAlpha(unlocked ? 1 : 0.42);
    this.variantPanelElements.push(previewFrame, preview);

    const nameText = this.add.text(infoX, panelY - 42, variant.name, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: unlocked ? '#ffffff' : '#d1d6e0',
      fontStyle: 'bold',
    });
    const flavorText = this.add.text(infoX, panelY - 18, this.truncateLine(variant.flavorText, 32), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#8fa0c0',
    });
    const modifierText = this.add.text(infoX, panelY + 18, formatVariantModifierSummary(variant), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#e7ebf5',
      wordWrap: { width: 300 },
    });
    const progressLine = this.add.text(
      infoX,
      panelY + 46,
      unlocked
        ? 'Requirement met. This loadout is ready.'
        : `${unlockProgress?.label ?? 'Unlock'}: ${unlockProgress?.currentText ?? '0'} / ${unlockProgress?.requiredText ?? '0'}`,
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: unlocked ? '#77c977' : '#d6aa55',
      }
    );
    this.variantPanelElements.push(nameText, flavorText, modifierText, progressLine);

    const barX = infoX;
    const barY = panelY + 66;
    const barWidth = 286;
    const progressBg = this.add.rectangle(barX, barY, barWidth, 8, 0x202839, 1).setOrigin(0, 0.5);
    const progressFill = this.add
      .rectangle(
        barX + 1,
        barY,
        Math.max(0, (barWidth - 2) * (unlocked ? 1 : unlockProgress?.ratio ?? 0)),
        6,
        unlocked ? 0x51b36d : 0xd4a017,
        1
      )
      .setOrigin(0, 0.5);
    const progressBorder = this.add.rectangle(barX + barWidth / 2, barY, barWidth, 8, 0, 0).setStrokeStyle(1, 0x46536f, 1);
    this.variantPanelElements.push(progressBg, progressFill, progressBorder);

    const badgeColor = selected ? 0x2c7d45 : unlocked ? COLORS.SCOTTISH_BLUE : 0x3a3f4d;
    const badgeText = selected ? 'SELECTED' : unlocked ? 'SELECT' : 'LOCKED';
    const badgeLabelColor = unlocked || selected ? '#ffffff' : '#a4a9b4';
    const badge = this.add
      .rectangle(panelX + 235, panelY - 6, 126, 38, badgeColor, 1)
      .setStrokeStyle(1, unlocked ? 0x8bb4ff : 0x5a6070, 1);
    const badgeLabel = this.add
      .text(badge.x, badge.y, badgeText, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: badgeLabelColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.variantPanelElements.push(badge, badgeLabel);

    const statusNote = this.add
      .text(
        badge.x,
        panelY + 30,
        selected ? 'Current run archetype' : unlocked ? 'Switch for the next run' : 'Achievement locked',
        {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#9aa4b6',
          align: 'center',
          wordWrap: { width: 150 },
        }
      )
      .setOrigin(0.5);
    this.variantPanelElements.push(statusNote);

    if (unlocked && !selected) {
      badge.setInteractive({ useHandCursor: true });
      badge.on('pointerover', () => badge.setFillStyle(0x0b73d1));
      badge.on('pointerout', () => badge.setFillStyle(COLORS.SCOTTISH_BLUE));
      badge.on('pointerdown', () => {
        audio.playClick();
        this.selectVariant(variant.key);
      });
    }
  }

  private createCarouselButton(x: number, y: number, label: string, onClick: () => void): void {
    const button = this.add
      .rectangle(x, y, 38, 38, 0x24314f, 1)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y - 1, label, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    button.on('pointerover', () => button.setFillStyle(0x304269));
    button.on('pointerout', () => button.setFillStyle(0x24314f));
    button.on('pointerdown', onClick);

    this.variantPanelElements.push(button, text);
  }

  private selectVariant(key: VariantKey): void {
    if (!this.saveData.unlockedVariants.includes(key)) return;

    this.saveData.selectedVariant = key;
    this.commitSave();
    this.selectedVariantKey = this.saveData.selectedVariant;
    this.mascot?.setTexture(getVariantByKey(this.selectedVariantKey).textureKey);
    this.updateLoadoutBanner();
    this.renderVariantCarousel();
  }

  private commitSave(): void {
    this.saveData = writeSave(this.saveData);
    this.selectedVariantKey = this.saveData.selectedVariant;
  }

  private updateLoadoutBanner(): void {
    if (!this.loadoutBanner) return;
    const variant = getVariantByKey(this.selectedVariantKey);
    this.loadoutBanner.setText(`CURRENT LOADOUT: ${variant.name.toUpperCase()}`);
  }

  private truncateLine(text: string, maxLength: number): string {
    return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
  }

  private formatStatsStrip(): string {
    const bestMins = Math.floor(this.saveData.bestTime / 60);
    const bestSecs = Math.floor(this.saveData.bestTime % 60);
    return `Best ${bestMins}:${bestSecs.toString().padStart(2, '0')}  |  Kills ${this.saveData.bestKills}  |  Combo ${this.saveData.bestCombo}x  |  Runs ${this.saveData.totalRuns}  |  Wins ${this.saveData.victories}  |  Gold ${this.saveData.gold}`;
  }

  private clearVariantPanel(): void {
    for (const element of this.variantPanelElements) {
      element.destroy();
    }
    this.variantPanelElements = [];
  }

  private fadeToScene(key: string): void {
    if (this.transitioning) return;
    this.transitioning = true;

    const { width, height } = this.scale;
    const fade = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(999);
    this.tweens.add({
      targets: fade,
      alpha: 1,
      duration: 320,
      onComplete: () => this.scene.start(key),
    });
  }

  private createToggle(
    x: number,
    y: number,
    label: string,
    initialState: boolean,
    onChange: (on: boolean) => void,
    delay: number
  ): void {
    let on = initialState;
    const text = this.add
      .text(x, y, `${label}: ${on ? 'ON' : 'OFF'}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: on ? '#88cc88' : '#886666',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: text, alpha: 1, delay, duration: 320 });

    text.on('pointerdown', () => {
      on = !on;
      text.setText(`${label}: ${on ? 'ON' : 'OFF'}`);
      text.setColor(on ? '#88cc88' : '#886666');
      onChange(on);
    });
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: number,
    onClick: () => void,
    delay: number
  ): void {
    const bg = this.add
      .rectangle(x, y + 24, width, height, color)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const text = this.add
      .text(x, y + 24, label, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: [bg, text],
      alpha: 1,
      y,
      delay,
      duration: 420,
      ease: 'Power2',
    });

    bg.on('pointerover', () => {
      bg.setScale(1.03);
      text.setScale(1.03);
      bg.setFillStyle(Phaser.Display.Color.ValueToColor(color).lighten(18).color);
    });
    bg.on('pointerout', () => {
      bg.setScale(1);
      text.setScale(1);
      bg.setFillStyle(color);
    });
    bg.on('pointerdown', onClick);
  }
}
