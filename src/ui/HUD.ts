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

  private readonly HP_BAR_W = 200;
  private readonly HP_BAR_H = 16;
  private readonly XP_BAR_H = 10;
  private readonly DEPTH = 50;

  // Pause button callback
  private onPause: (() => void) | null = null;

  // Weapon icon slots — each slot has a background, a sprite icon for the
  // weapon, a small level pip label, and a cooldown fill overlay.
  private weaponSlots: {
    bg: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
    cdFill: Phaser.GameObjects.Rectangle;
  }[] = [];

  // Boss HP bar
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossBarVisible: boolean = false;

  // Passive items display
  private passiveSlots: Phaser.GameObjects.Text[] = [];
  private lastPassiveCount: number = 0;

  // Shield indicator
  private shieldText!: Phaser.GameObjects.Text;

  // DPS tracking
  private dpsText!: Phaser.GameObjects.Text;
  private damageLog: number[] = [];
  private damageWindow: number = 0;

  // Low-HP pulse state (for the fill's alpha/scale wobble)
  private lowHpPulse: number = 0;

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
    const style = { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' };

    // HP bar
    this.hpBarBg = this.addEl(this.scene.add.rectangle(12, 12, this.HP_BAR_W, this.HP_BAR_H, 0x333333)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d));
    this.hpBarFill = this.addEl(this.scene.add.rectangle(12, 12, this.HP_BAR_W, this.HP_BAR_H, COLORS.HP_RED)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1));
    this.hpText = this.addEl(this.scene.add.text(12 + this.HP_BAR_W / 2, 12 + this.HP_BAR_H / 2, '', {
      ...style, fontSize: '13px',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2));

    // Level
    this.levelText = this.addEl(this.scene.add.text(12, 34, '', style)
      .setScrollFactor(0).setDepth(d));

    // Timer
    this.timerText = this.addEl(this.scene.add.text(width / 2, 12, '', {
      ...style, fontSize: '22px', fontStyle: 'bold',
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
    const pauseBtn = this.addEl(this.scene.add.text(width - 12, 34, '| |', {
      fontFamily: 'monospace', fontSize: '20px', color: '#888888', fontStyle: 'bold',
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

    // Shield status indicator
    this.shieldText = this.addEl(this.scene.add.text(12 + this.HP_BAR_W + 8, 12 + this.HP_BAR_H / 2, '', {
      ...style, fontSize: '14px', color: '#88ccff',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 2)) as Phaser.GameObjects.Text;

    // DPS counter
    this.dpsText = this.addEl(this.scene.add.text(12, height - 26, '', {
      ...style, fontSize: '14px', color: '#aaaaaa',
    }).setScrollFactor(0).setDepth(d)) as Phaser.GameObjects.Text;

    // Boss HP bar (hidden by default) — positioned below weapon slots
    const bossBarW = width * 0.55;
    const bossBarY = 90;
    this.bossBarBg = this.addEl(this.scene.add.rectangle(width / 2, bossBarY, bossBarW, 18, 0x333333)
      .setScrollFactor(0).setDepth(d).setVisible(false)) as Phaser.GameObjects.Rectangle;
    this.bossBarFill = this.addEl(this.scene.add.rectangle(width / 2 - bossBarW / 2, bossBarY, bossBarW, 18, 0xff4444)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 1).setVisible(false)) as Phaser.GameObjects.Rectangle;
    this.bossNameText = this.addEl(this.scene.add.text(width / 2, bossBarY - 14, '', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ff9999', fontStyle: 'bold',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(d + 2).setVisible(false)) as Phaser.GameObjects.Text;
  }

  update(
    hp: number, maxHp: number,
    level: number,
    xpFraction: number,
    gameTimeSec: number,
    killCount: number,
    enemyCount: number,
    weapons?: { key: string; level: number; evolved?: boolean; evolutionKey?: string; cooldownFrac?: number }[],
    passives?: string[]
  ): void {
    const hpFrac = Math.max(0, hp / maxHp);
    this.hpBarFill.width = this.HP_BAR_W * hpFrac;
    this.hpText.setText(`${hp}/${maxHp}`);

    // Dynamic HP bar color: green > yellow > orange > red
    const hpColor = hpFrac > 0.6 ? 0x44cc44 : hpFrac > 0.35 ? 0xcccc44 : hpFrac > 0.15 ? 0xdd8844 : 0xcc3333;
    this.hpBarFill.setFillStyle(hpColor);

    // Low-HP urgency pulse — below 30% the fill softly pulses alpha and the
    // HP text color shifts to match.
    if (hpFrac < 0.3 && hpFrac > 0) {
      this.lowHpPulse += 0.12;
      const pulseAlpha = 0.7 + Math.sin(this.lowHpPulse) * 0.3;
      this.hpBarFill.setAlpha(pulseAlpha);
      this.hpText.setColor('#ffcccc');
    } else {
      this.hpBarFill.setAlpha(1);
      this.hpText.setColor('#ffffff');
      this.lowHpPulse = 0;
    }

    this.levelText.setText(`Lv ${level}`);

    const mins = Math.floor(gameTimeSec / 60);
    const secs = Math.floor(gameTimeSec % 60);
    // Wave difficulty indicator + victory countdown
    const wave = gameTimeSec < 180 ? 'I' : gameTimeSec < 420 ? 'II' : gameTimeSec < 720 ? 'III' : gameTimeSec < 1200 ? 'IV' : 'V';
    const waveColor = gameTimeSec < 180 ? '#88cc88' : gameTimeSec < 420 ? '#cccc44' : gameTimeSec < 720 ? '#dd8844' : gameTimeSec < 1200 ? '#dd4444' : '#ff2222';
    const victoryTime = 1500; // 25:00
    const remaining = Math.max(0, victoryTime - gameTimeSec);
    const remMins = Math.floor(remaining / 60);
    const remSecs = Math.floor(remaining % 60);
    const goalText = remaining > 0 ? `  (-${remMins}:${remSecs.toString().padStart(2, '0')})` : '  FINAL!';
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}  W${wave}${goalText}`);
    this.timerText.setColor(waveColor);

    const enemyWarning = enemyCount >= 350 ? ' MAX!' : '';
    const enemyColor = enemyCount >= 350 ? '#ff4444' : '#ffffff';
    this.killText.setText(`Kills: ${killCount}  Enemies: ${enemyCount}${enemyWarning}`);
    this.killText.setColor(enemyColor);

    this.xpBarFill.width = this.scene.scale.width * xpFraction;

    // Update weapon slots
    if (weapons) {
      this.updateWeaponSlots(weapons);
    }

    // Update passive items display
    if (passives && passives.length !== this.lastPassiveCount) {
      this.updatePassiveSlots(passives);
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

  private updateWeaponSlots(weapons: { key: string; level: number; evolved?: boolean; evolutionKey?: string; cooldownFrac?: number }[]): void {
    const startX = 12;
    const y = 58;
    const size = 40;
    const gap = 6;

    // Only rebuild if count changed
    if (this.weaponSlots.length !== weapons.length) {
      for (const slot of this.weaponSlots) {
        for (const obj of [slot.bg, slot.icon, slot.label, slot.cdFill]) {
          const idx = this.elements.indexOf(obj);
          if (idx !== -1) this.elements.splice(idx, 1);
          obj.destroy();
        }
      }
      this.weaponSlots = [];

      weapons.forEach((w, i) => {
        const x = startX + i * (size + gap);
        const bg = this.addEl(this.scene.add.rectangle(x, y, size, size, 0x1a1a2e, 0.85)
          .setOrigin(0, 0).setStrokeStyle(2, 0x666666)
          .setScrollFactor(0).setDepth(this.DEPTH));
        const cdFill = this.addEl(this.scene.add.rectangle(x, y + size, size, 0, 0x005eb8, 0.45)
          .setOrigin(0, 1).setScrollFactor(0).setDepth(this.DEPTH + 1)) as Phaser.GameObjects.Rectangle;
        // Weapon icon — real sprite instead of cryptic "TS1" abbreviation.
        // Each weapon has a pre-rendered `wicon_{key}` or `wicon_{evolutionKey}`
        // texture from BootScene. Pick the evolved one if it exists, else the
        // base, else the thistle_shot fallback.
        const evoInitKey = w.evolved && w.evolutionKey ? `wicon_${w.evolutionKey}` : '';
        const baseInitKey = `wicon_${w.key}`;
        const initialKey = (evoInitKey && this.scene.textures.exists(evoInitKey))
          ? evoInitKey
          : (this.scene.textures.exists(baseInitKey) ? baseInitKey : 'wicon_thistle_shot');
        const icon = this.addEl(this.scene.add.image(x + size / 2, y + size / 2, initialKey)
          .setScrollFactor(0).setDepth(this.DEPTH + 2).setScale(1.4)) as Phaser.GameObjects.Image;
        // Small level pip in bottom-right corner (replaces the old full-cell text)
        const label = this.addEl(this.scene.add.text(x + size - 2, y + size - 2, '', {
          fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(1, 1).setScrollFactor(0).setDepth(this.DEPTH + 3));
        this.weaponSlots.push({ bg, icon, label, cdFill });
      });
    }

    // Update icon texture, level pip, evolved indicator, and cooldown fill
    weapons.forEach((w, i) => {
      if (i < this.weaponSlots.length) {
        const slot = this.weaponSlots[i];
        // Evolved weapons use their evolution icon (wicon_{evolutionKey});
        // fall back to base icon if the evolution texture doesn't exist.
        const evoKey = w.evolved ? `wicon_${w.evolutionKey}` : '';
        const baseKey = `wicon_${w.key}`;
        const desiredKey = (evoKey && this.scene.textures.exists(evoKey))
          ? evoKey
          : (this.scene.textures.exists(baseKey) ? baseKey : 'wicon_thistle_shot');
        if (slot.icon.texture.key !== desiredKey) {
          slot.icon.setTexture(desiredKey);
        }
        slot.label.setText(w.evolved ? '★' : `${w.level}`);
        slot.label.setColor(w.evolved ? '#ffdd44' : '#ffffff');
        slot.bg.setStrokeStyle(2, w.evolved ? 0xddaa00 : 0x666666);

        // Cooldown fill: grows upward as cooldown progresses, full = ready to fire
        const cdFrac = w.cooldownFrac ?? 1;
        slot.cdFill.height = size * cdFrac;
        slot.cdFill.setFillStyle(cdFrac >= 1 ? 0x44cc44 : 0x005eb8, 0.4);
      }
    });
  }

  private updatePassiveSlots(passives: string[]): void {
    // Clear old
    for (const slot of this.passiveSlots) {
      const idx = this.elements.indexOf(slot);
      if (idx !== -1) this.elements.splice(idx, 1);
      slot.destroy();
    }
    this.passiveSlots = [];
    this.lastPassiveCount = passives.length;

    const PASSIVE_ABBREVS: Record<string, string> = {
      sporran: 'SPR', whisky_flask: 'WFL', kilt: 'KLT',
      tam_o_shanter: 'TAM', irn_bru: 'IRN', loch_water: 'LOC',
    };

    const startX = 12;
    const y = 100;

    passives.forEach((key, i) => {
      const x = startX + i * 42;
      const label = this.addEl(this.scene.add.text(x + 16, y + 10, PASSIVE_ABBREVS[key] ?? key.slice(0, 3).toUpperCase(), {
        fontFamily: 'monospace', fontSize: '12px', color: '#ddaa00', fontStyle: 'bold',
        backgroundColor: '#2a2a3a', padding: { x: 5, y: 3 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(this.DEPTH + 1));
      this.passiveSlots.push(label);
    });
  }

  /** Update shield indicator */
  updateShield(hasShield: boolean): void {
    this.shieldText.setText(hasShield ? '🛡' : '');
  }

  /** Log damage dealt for DPS tracking */
  logDamage(amount: number): void {
    this.damageLog.push(amount);
  }

  /** Update DPS display — call each frame with delta */
  updateDPS(delta: number): void {
    this.damageWindow += delta;
    // Calculate DPS every second
    if (this.damageWindow >= 1000) {
      const totalDmg = this.damageLog.reduce((a, b) => a + b, 0);
      const dps = Math.round(totalDmg / (this.damageWindow / 1000));
      this.dpsText.setText(`DPS: ${dps}`);
      this.damageLog = [];
      this.damageWindow = 0;
    }
  }

  setOnPause(callback: () => void): void {
    this.onPause = callback;
  }

  destroy(): void {
    for (const el of this.elements) el.destroy();
    this.elements = [];
  }
}
