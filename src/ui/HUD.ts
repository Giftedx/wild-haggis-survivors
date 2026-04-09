import Phaser from 'phaser';
import { COLORS } from '../config';

/**
 * HUD — in-game overlay showing HP, XP bar, timer, level, kill count.
 * All elements use setScrollFactor(0) individually — NOT in a container —
 * to avoid Phaser's input/scroll bug with container children.
 */
export class HUD {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];

  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;

  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;

  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;

  private readonly HP_BAR_W = 160;
  private readonly HP_BAR_H = 12;
  private readonly XP_BAR_H = 8;
  private readonly DEPTH = 50;

  // Pause button callback
  private onPause: (() => void) | null = null;

  // Weapon icon slots
  private weaponSlots: { bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }[] = [];

  // Boss HP bar
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossBarVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
  }

  private addEl<T extends Phaser.GameObjects.GameObject>(el: T): T {
    this.elements.push(el);
    return el;
  }

  private build(): void {
    const { width, height } = this.scene.scale;
    const d = this.DEPTH;
    const style = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' };

    // HP bar
    this.hpBarBg = this.addEl(this.scene.add.rectangle(12, 12, this.HP_BAR_W, this.HP_BAR_H, 0x333333)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d));
    this.hpBarFill = this.addEl(this.scene.add.rectangle(12, 12, this.HP_BAR_W, this.HP_BAR_H, COLORS.HP_RED)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1));
    this.hpText = this.addEl(this.scene.add.text(12 + this.HP_BAR_W / 2, 12 + this.HP_BAR_H / 2, '', {
      ...style, fontSize: '10px',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2));

    // Level
    this.levelText = this.addEl(this.scene.add.text(12, 28, '', style)
      .setScrollFactor(0).setDepth(d));

    // Timer
    this.timerText = this.addEl(this.scene.add.text(width / 2, 12, '', {
      ...style, fontSize: '16px', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d));

    // Kill count
    this.killText = this.addEl(this.scene.add.text(width - 12, 12, '', style)
      .setOrigin(1, 0).setScrollFactor(0).setDepth(d));

    // XP bar
    const xpY = height - this.XP_BAR_H - 4;
    this.xpBarBg = this.addEl(this.scene.add.rectangle(0, xpY, width, this.XP_BAR_H, 0x222222)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d));
    this.xpBarFill = this.addEl(this.scene.add.rectangle(0, xpY, 0, this.XP_BAR_H, COLORS.XP_BAR)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1));

    // Pause button (visible on touch devices, small on desktop)
    const pauseBtn = this.addEl(this.scene.add.text(width - 12, 28, '| |', {
      fontFamily: 'monospace', fontSize: '16px', color: '#666666', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(d + 1)
      .setInteractive({ useHandCursor: true }));
    (pauseBtn as Phaser.GameObjects.Text).on('pointerdown', () => {
      if (this.onPause) this.onPause();
    });
    (pauseBtn as Phaser.GameObjects.Text).on('pointerover', () => {
      (pauseBtn as Phaser.GameObjects.Text).setColor('#ffffff');
    });
    (pauseBtn as Phaser.GameObjects.Text).on('pointerout', () => {
      (pauseBtn as Phaser.GameObjects.Text).setColor('#666666');
    });

    // Boss HP bar (hidden by default) — positioned below weapon slots
    const bossBarW = width * 0.5;
    const bossBarY = 80;
    this.bossBarBg = this.addEl(this.scene.add.rectangle(width / 2, bossBarY, bossBarW, 14, 0x333333)
      .setScrollFactor(0).setDepth(d).setVisible(false)) as Phaser.GameObjects.Rectangle;
    this.bossBarFill = this.addEl(this.scene.add.rectangle(width / 2 - bossBarW / 2, bossBarY, bossBarW, 14, 0xff4444)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 1).setVisible(false)) as Phaser.GameObjects.Rectangle;
    this.bossNameText = this.addEl(this.scene.add.text(width / 2, bossBarY - 12, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff9999', fontStyle: 'bold',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(d + 2).setVisible(false)) as Phaser.GameObjects.Text;
  }

  update(
    hp: number, maxHp: number,
    level: number,
    xpFraction: number,
    gameTimeSec: number,
    killCount: number,
    enemyCount: number,
    weapons?: { key: string; level: number; evolved?: boolean }[]
  ): void {
    const hpFrac = Math.max(0, hp / maxHp);
    this.hpBarFill.width = this.HP_BAR_W * hpFrac;
    this.hpText.setText(`${hp}/${maxHp}`);

    this.levelText.setText(`Lv ${level}`);

    const mins = Math.floor(gameTimeSec / 60);
    const secs = Math.floor(gameTimeSec % 60);
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

    this.killText.setText(`Kills: ${killCount}  Enemies: ${enemyCount}`);

    this.xpBarFill.width = this.scene.scale.width * xpFraction;

    // Update weapon slots
    if (weapons) {
      this.updateWeaponSlots(weapons);
    }
  }

  /** Show/update boss HP bar. Pass null to hide. */
  updateBossBar(boss: { name: string; hpFraction: number } | null): void {
    if (!boss) {
      if (this.bossBarVisible) {
        this.bossBarBg.setVisible(false);
        this.bossBarFill.setVisible(false);
        this.bossNameText.setVisible(false);
        this.bossBarVisible = false;
      }
      return;
    }

    if (!this.bossBarVisible) {
      this.bossBarBg.setVisible(true);
      this.bossBarFill.setVisible(true);
      this.bossNameText.setVisible(true);
      this.bossBarVisible = true;
    }

    const barW = this.scene.scale.width * 0.5;
    this.bossBarFill.width = barW * Math.max(0, boss.hpFraction);
    this.bossNameText.setText(boss.name);
  }

  private updateWeaponSlots(weapons: { key: string; level: number; evolved?: boolean }[]): void {
    // Only rebuild if count changed
    if (this.weaponSlots.length !== weapons.length) {
      // Clear old slots — remove from elements tracking to prevent double-destroy
      for (const slot of this.weaponSlots) {
        const bgIdx = this.elements.indexOf(slot.bg);
        if (bgIdx !== -1) this.elements.splice(bgIdx, 1);
        const lblIdx = this.elements.indexOf(slot.label);
        if (lblIdx !== -1) this.elements.splice(lblIdx, 1);
        slot.bg.destroy();
        slot.label.destroy();
      }
      this.weaponSlots = [];

      // Build new slots
      const startX = 12;
      const y = 44;
      const size = 28;
      const gap = 4;

      weapons.forEach((w, i) => {
        const x = startX + i * (size + gap);
        const bg = this.addEl(this.scene.add.rectangle(x, y, size, size, 0x333333)
          .setOrigin(0, 0).setStrokeStyle(1, 0x666666)
          .setScrollFactor(0).setDepth(this.DEPTH));
        const label = this.addEl(this.scene.add.text(x + size / 2, y + size / 2, '', {
          fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(this.DEPTH + 1));
        this.weaponSlots.push({ bg, label });
      });
    }

    // Update labels and evolved indicator
    weapons.forEach((w, i) => {
      if (i < this.weaponSlots.length) {
        const abbrev = w.key.split('_').map(s => s[0].toUpperCase()).join('');
        this.weaponSlots[i].label.setText(w.evolved ? `${abbrev}★` : `${abbrev}${w.level}`);
        this.weaponSlots[i].bg.setStrokeStyle(1, w.evolved ? 0xddaa00 : 0x666666);
      }
    });
  }

  setOnPause(callback: () => void): void {
    this.onPause = callback;
  }

  destroy(): void {
    for (const el of this.elements) el.destroy();
    this.elements = [];
  }
}
