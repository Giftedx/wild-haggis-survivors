import Phaser from 'phaser';
import { COLORS } from '../config';
import { loadSave, writeSave } from '../utils/save';
import { audio } from '../systems/AudioSystem';
import { music } from '../systems/MusicSystem';

/**
 * MenuScene — polished main menu with animated title and floating haggis mascot.
 */
export class MenuScene extends Phaser.Scene {
  private transitioning = false;

  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    this.transitioning = false;
    const { width, height } = this.scale;
    const save = loadSave();

    // Background with subtle gradient feel
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);

    // Floating decorative heather dots in background
    for (let i = 0; i < 30; i++) {
      const dot = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(2, 5),
        COLORS.HEATHER,
        Phaser.Math.FloatBetween(0.05, 0.15)
      );
      this.tweens.add({
        targets: dot,
        y: dot.y - Phaser.Math.Between(20, 60),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        yoyo: true,
      });
    }

    // Floating haggis mascot
    const mascot = this.add.sprite(width / 2, height * 0.15, 'haggis').setScale(3);
    this.tweens.add({
      targets: mascot,
      y: mascot.y + 8,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    // Gentle rotation
    this.tweens.add({
      targets: mascot,
      angle: { from: -5, to: 5 },
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Title with slide-in animation
    const title = this.add.text(width / 2, height * 0.32, 'Wild Haggis\nSurvivors', {
      fontFamily: 'monospace', fontSize: '48px', color: '#d4a017',
      align: 'center', fontStyle: 'bold', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: height * 0.30,
      duration: 800,
      ease: 'Power2',
    });

    // Subtitle fades in after title
    const subtitle = this.add.text(width / 2, height * 0.45, 'Survive the Highlands', {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      delay: 400,
      duration: 600,
    });

    // Stats line
    if (save.totalRuns > 0) {
      const bestMins = Math.floor(save.bestTime / 60);
      const bestSecs = Math.floor(save.bestTime % 60);
      const stats = this.add.text(width / 2, height * 0.51,
        `Best: ${bestMins}:${bestSecs.toString().padStart(2, '0')}  |  Runs: ${save.totalRuns}  |  Gold: ${save.gold}`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#888888',
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: stats, alpha: 1, delay: 600, duration: 600 });
    }

    // Buttons slide up with stagger
    this.createButton(width / 2, height * 0.64, 'PLAY', () => {
      audio.playClick();
      this.fadeToScene('Game');
    }, COLORS.SCOTTISH_BLUE, 700);

    this.createButton(width / 2, height * 0.76, 'UPGRADES', () => {
      audio.playClick();
      this.fadeToScene('Shop');
    }, 0x444444, 850);

    // Sound/Music toggles
    this.createToggle(width - 100, height - 30, 'SFX', save.settings.soundOn, (on) => {
      const s = loadSave();
      s.settings.soundOn = on;
      writeSave(s);
      audio.setEnabled(on);
    }, 1000);

    this.createToggle(width - 40, height - 30, 'Music', save.settings.musicOn, (on) => {
      const s = loadSave();
      s.settings.musicOn = on;
      writeSave(s);
      if (on) { music.start(); } else { music.stop(); }
    }, 1050);

    // Apply saved audio settings on scene load
    audio.setEnabled(save.settings.soundOn);
    if (!save.settings.musicOn) music.stop();

    // Version tag
    this.add.text(width - 8, height - 8, 'v1.0', {
      fontFamily: 'monospace', fontSize: '10px', color: '#333333',
    }).setOrigin(1, 1);
  }

  private fadeToScene(key: string): void {
    if (this.transitioning) return;
    this.transitioning = true;

    const { width, height } = this.scale;
    const fade = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(999);
    this.tweens.add({
      targets: fade,
      alpha: 1,
      duration: 400,
      onComplete: () => this.scene.start(key),
    });
  }

  private createToggle(
    x: number, y: number, label: string, initialState: boolean,
    onChange: (on: boolean) => void, delay: number
  ): void {
    let on = initialState;
    const text = this.add.text(x, y, `${label}: ${on ? 'ON' : 'OFF'}`, {
      fontFamily: 'monospace', fontSize: '11px',
      color: on ? '#88cc88' : '#886666',
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: text, alpha: 1, delay, duration: 400 });

    text.on('pointerdown', () => {
      on = !on;
      text.setText(`${label}: ${on ? 'ON' : 'OFF'}`);
      text.setColor(on ? '#88cc88' : '#886666');
      onChange(on);
    });
  }

  private createButton(
    x: number, y: number, label: string, onClick: () => void,
    color: number = COLORS.SCOTTISH_BLUE, delay: number = 0
  ): void {
    const bg = this.add.rectangle(x, y + 30, 200, 45, color)
      .setInteractive({ useHandCursor: true }).setAlpha(0);

    const text = this.add.text(x, y + 30, label, {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // Slide up + fade in
    this.tweens.add({
      targets: [bg, text],
      alpha: 1,
      y: y,
      delay,
      duration: 500,
      ease: 'Power2',
    });

    bg.on('pointerover', () => {
      bg.setScale(1.05); text.setScale(1.05);
      bg.setFillStyle(Phaser.Display.Color.ValueToColor(color).lighten(20).color);
    });
    bg.on('pointerout', () => {
      bg.setScale(1); text.setScale(1);
      bg.setFillStyle(color);
    });
    bg.on('pointerdown', onClick);
  }
}
