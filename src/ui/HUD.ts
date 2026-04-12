import Phaser from 'phaser';
import { COLORS } from '../config';
import { BALANCE } from '../core/BalanceConfig';
import { getSettingsManager } from '../core/SettingsManager';
import { getCameraViewport } from './cameraViewport';
import { t } from '../core/i18n';

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
  private objectiveText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private pauseText!: Phaser.GameObjects.Text;

  private readonly HP_BAR_W = 260;
  private readonly HP_BAR_H = 20;
  private readonly XP_BAR_H = 14;
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
  private bossHpFraction = 1;

  // Passive items display
  private passiveSlots: Phaser.GameObjects.Text[] = [];
  private lastPassiveCount: number = 0;

  // Shield + dash row (sprites for shield / pips — no emoji or font glyphs)
  private shieldIcon!: Phaser.GameObjects.Image;
  private dashPrefixText!: Phaser.GameObjects.Text;
  private dashSuffixText!: Phaser.GameObjects.Text;
  private dashPipImages: Phaser.GameObjects.Image[] = [];
  private readonly dashPipPool = 4;
  private dashHudAnchorX = 0;
  private dashHudAnchorY = 0;

  // DPS tracking
  private dpsText!: Phaser.GameObjects.Text;
  private damageLog: number[] = [];
  private damageWindow: number = 0;

  // Smooth HP bar color lerping — avoids hard snaps between thresholds
  private displayHpR: number = 0x44;
  private displayHpG: number = 0xcc;
  private displayHpB: number = 0x44;

  // Low-HP pulse state (for the fill's alpha/scale wobble)
  private lowHpPulse: number = 0;
  // Kill count cap warning — track previous state to pulse on transition
  private wasOverCap: boolean = false;
  // XP bar level-up flash — track previous fraction to detect the reset
  private prevXpFraction: number = 0;
  // Dash-ready pulse phase — drives a subtle scale/alpha wobble on the dash
  // pips when a charge is available, so the player can glance at the HUD
  // under combat pressure and see "yes, dash is ready" at a single tick.
  private dashReadyPulse: number = 0;
  // Per-frame setText caching — only call setText when value changes
  private prevMins = -1;
  private prevSecs = -1;
  private prevKills = -1;
  private prevEnemyCount = -1;
  private prevLevel = -1;
  private layoutWidth = 0;
  private layoutHeight = 0;
  private layoutX = 0;
  private layoutY = 0;
  private layoutZoom = 1;
  private topSafePad = 12;
  private readonly uiScale: number;
  private readonly highContrastUi: boolean;
  /** Cached stroke for weapon slot bgs when high-contrast mode is active. */
  private hcSlotStroke: number | null = null;
  /**
   * High-contrast palette — populated once in build() when highContrastUi is on,
   * then referenced every frame in update() so dynamic color changes (wave ladder,
   * low-HP pulse, enemy cap warning) still respect the user's contrast preference.
   */
  private hcPalette: {
    text: string;
    textLowHp: string;
    timer: string;
    kill: string;
    killWarn: string;
    boss: string;
    objective: string;
    dps: string;
  } | null = null;

  private getUiViewport(): { x: number; y: number; width: number; height: number; zoom: number } {
    return getCameraViewport(this.scene);
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const settings = getSettingsManager().load();
    this.uiScale = settings.uiScale;
    this.highContrastUi = settings.highContrastUi;
    this.build();
  }

  private addEl<T extends Phaser.GameObjects.GameObject>(el: T): T {
    this.elements.push(el);
    return el;
  }

  private build(): void {
    const { width, height } = this.getUiViewport();
    const d = this.DEPTH;
    const style = { fontFamily: 'monospace', fontSize: '18px', color: '#e8d4a0' };

    // HP bar
    this.hpBarBg = this.addEl(this.scene.add.rectangle(12, 12, this.HP_BAR_W, this.HP_BAR_H, 0x1a1420)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d));
    this.hpBarFill = this.addEl(this.scene.add.rectangle(12, 12, this.HP_BAR_W, this.HP_BAR_H, COLORS.HP_RED)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1));
    this.hpText = this.addEl(this.scene.add.text(12 + this.HP_BAR_W / 2, 12 + this.HP_BAR_H / 2, '', {
      ...style, fontSize: '15px',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2));

    // Level
    this.levelText = this.addEl(this.scene.add.text(12, 40, '', style)
      .setScrollFactor(0).setDepth(d));

    // Timer
    this.timerText = this.addEl(this.scene.add.text(width / 2, 12, '', {
      ...style, fontSize: '28px', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d));
    this.objectiveText = this.addEl(this.scene.add.text(width / 2, 42, '', {
      ...style, fontSize: '14px', color: '#b8a88a',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d)) as Phaser.GameObjects.Text;

    // Kill count
    this.killText = this.addEl(this.scene.add.text(width - 12, 12, '', style)
      .setOrigin(1, 0).setScrollFactor(0).setDepth(d));

    // XP bar
    const xpY = height - this.XP_BAR_H - 4;
    this.xpBarBg = this.addEl(this.scene.add.rectangle(0, xpY, width, this.XP_BAR_H, 0x1a1420)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d));
    this.xpBarFill = this.addEl(this.scene.add.rectangle(0, xpY, 0, this.XP_BAR_H, COLORS.XP_BAR)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1));

    // Pause button (visible on touch devices, small on desktop)
    this.pauseText = this.addEl(this.scene.add.text(width - 12, 40, '| |', {
      fontFamily: 'monospace', fontSize: '24px', color: '#b8a88a', fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(d + 1)
      .setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Text;
    this.pauseText.on('pointerdown', () => {
      if (this.onPause) this.onPause();
    });
    this.pauseText.on('pointerover', () => {
      this.pauseText.setColor('#e8d4a0');
    });
    this.pauseText.on('pointerout', () => {
      this.pauseText.setColor('#666666');
    });

    this.shieldIcon = this.addEl(this.scene.add.image(12 + this.HP_BAR_W + 10, 12 + this.HP_BAR_H / 2, 'hud_shield')
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 2).setVisible(false)) as Phaser.GameObjects.Image;
    // Dash row — bumped 12px → 14px for readability under combat stress, and
    // pip pool rebuilt slightly larger so they scale along with the text.
    const dashStyle = { ...style, fontSize: '14px', color: '#d4a017', fontStyle: 'bold' };
    this.dashPrefixText = this.addEl(this.scene.add.text(12 + this.HP_BAR_W + 10, 12 + this.HP_BAR_H / 2 + 20, '', {
      ...dashStyle,
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 2).setVisible(false)) as Phaser.GameObjects.Text;
    for (let i = 0; i < this.dashPipPool; i++) {
      const pip = this.addEl(this.scene.add.image(0, 0, 'hud_dash_pip_full')
        .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(d + 2).setVisible(false)) as Phaser.GameObjects.Image;
      this.dashPipImages.push(pip);
    }
    this.dashSuffixText = this.addEl(this.scene.add.text(0, 0, '', {
      ...dashStyle,
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 2).setVisible(false)) as Phaser.GameObjects.Text;

    // DPS counter
    this.dpsText = this.addEl(this.scene.add.text(12, height - 26, '', {
      ...style, fontSize: '16px', color: '#8a7a6a',
    }).setScrollFactor(0).setDepth(d)) as Phaser.GameObjects.Text;

    // Boss HP bar (hidden by default) — positioned below weapon slots
    const bossBarW = width * 0.55;
    const bossBarY = 98;
    this.bossBarBg = this.addEl(this.scene.add.rectangle(width / 2, bossBarY, bossBarW, 22, 0x1a1420)
      .setScrollFactor(0).setDepth(d).setVisible(false)) as Phaser.GameObjects.Rectangle;
    this.bossBarFill = this.addEl(this.scene.add.rectangle(width / 2 - bossBarW / 2, bossBarY, bossBarW, 22, 0xff4444)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 1).setVisible(false)) as Phaser.GameObjects.Rectangle;
    this.bossNameText = this.addEl(this.scene.add.text(width / 2, bossBarY - 14, '', {
      fontFamily: 'monospace', fontSize: '17px', color: '#ff9999', fontStyle: 'bold',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(d + 2).setVisible(false)) as Phaser.GameObjects.Text;
    if (this.uiScale !== 1) {
      const scaleTargets: Phaser.GameObjects.GameObject[] = [
        this.hpText,
        this.levelText,
        this.timerText,
        this.objectiveText,
        this.killText,
        this.pauseText,
        this.shieldIcon,
        this.dashPrefixText,
        this.dashSuffixText,
        this.dpsText,
        this.bossNameText,
      ];
      for (const target of scaleTargets) {
        (target as unknown as { setScale?: (x: number, y?: number) => void }).setScale?.(this.uiScale);
      }
    }
    if (this.highContrastUi) {
      // High-contrast palette — recolors every HUD text surface + bar backgrounds
      // so the entire HUD shifts together, not just the objective/dps line.
      // Respects the Soul Charter's "accessibility is part of kindness" principle.
      // Stored as an instance field so update() can re-apply these colors every
      // frame without losing them to wave-ladder / low-HP / cap-warning logic.
      this.hcPalette = {
        text: '#f0f6ff',     // general white-on-dark for numeric / label text
        textLowHp: '#ffd0d6', // HP text when low — lifted from the default #ffcccc
        timer: '#fff4d0',    // warmer timer to stand out against the wave ladder
        kill: '#e0e8ff',     // kill / enemy readout when under cap
        killWarn: '#ff9a9a', // kill readout when enemy cap warn triggers
        boss: '#ff9595',     // boss name — lifted from the default dim red
        objective: '#e6efff',
        dps: '#d9e4ff',
      };
      this.hpBarBg.setFillStyle(0x080b12, 0.95);
      this.xpBarBg.setFillStyle(0x080b12, 0.95);
      this.objectiveText.setColor(this.hcPalette.objective);
      this.dpsText.setColor(this.hcPalette.dps);
      this.hpText.setColor(this.hcPalette.text);
      this.levelText.setColor(this.hcPalette.text);
      this.timerText.setColor(this.hcPalette.timer);
      this.killText.setColor(this.hcPalette.kill);
      this.pauseText.setColor(this.hcPalette.text);
      this.bossNameText.setColor(this.hcPalette.boss);
      // Cache slot stroke for weapon slot construction (applied in updateWeaponSlots)
      this.hcSlotStroke = 0x8fb4ff;
    }
    this.refreshResponsiveLayout();
  }

  private refreshResponsiveLayout(): void {
    const { x, y, width, height, zoom } = this.getUiViewport();
    // Skip full layout recalc when viewport hasn't changed
    if (x === this.layoutX && y === this.layoutY &&
        width === this.layoutWidth && height === this.layoutHeight &&
        zoom === this.layoutZoom) {
      return;
    }
    this.layoutX = x;
    this.layoutY = y;
    this.layoutWidth = width;
    this.layoutHeight = height;
    this.layoutZoom = zoom;

    const padPx = Math.max(8, (12 * this.uiScale) / Math.max(0.001, zoom));
    const bottomPad = Math.max(2, 4 / Math.max(0.001, zoom));
    this.topSafePad = padPx;
    const padX = Math.max(x + 8, Math.min(x + 12 * this.uiScale, x + Math.max(8, width - this.HP_BAR_W - 8)));
    const padY = y + this.topSafePad;
    const xpY = y + height - this.XP_BAR_H - bottomPad;

    this.hpBarBg.setPosition(padX, padY);
    this.hpBarFill.setPosition(padX, padY);
    this.hpText.setPosition(padX + this.HP_BAR_W / 2, padY + this.HP_BAR_H / 2);
    this.levelText.setPosition(padX, padY + 28 * this.uiScale);
    this.shieldIcon.setPosition(padX + this.HP_BAR_W + 10, padY + this.HP_BAR_H / 2);
    this.shieldIcon.setScale(this.uiScale * 0.92);
    this.dashHudAnchorX = padX + this.HP_BAR_W + 10;
    this.dashHudAnchorY = padY + this.HP_BAR_H / 2 + 18 * this.uiScale;

    this.xpBarBg.setPosition(x, xpY);
    this.xpBarBg.width = width;
    this.xpBarFill.setPosition(x, xpY);

    const topY = y + this.topSafePad;
    this.timerText.setPosition(x + width / 2, topY);
    this.objectiveText.setPosition(x + width / 2, topY + 30 * this.uiScale);
    this.killText.setPosition(x + width - 12, topY);
    this.pauseText.setPosition(x + width - 12, topY + 28 * this.uiScale);
    this.dpsText.setPosition(x + 12, y + height - ((24 * this.uiScale) + this.XP_BAR_H + bottomPad));

    const bossBarW = width * 0.55;
    const bossBarY = Math.max(y + 44, Math.min(y + this.topSafePad + 86, y + Math.max(44, height - 80)));
    this.bossBarBg.setPosition(x + width / 2, bossBarY);
    this.bossBarBg.width = bossBarW;
    this.bossBarFill.setPosition(x + width / 2 - bossBarW / 2, bossBarY);
    this.bossBarFill.width = bossBarW * Math.max(0, this.bossHpFraction);
    this.bossNameText.setPosition(x + width / 2, bossBarY - 14);
  }

  update(
    hp: number, maxHp: number,
    level: number,
    xpFraction: number,
    gameTimeSec: number,
    killCount: number,
    enemyCount: number,
    dashCharges?: number,
    maxDashCharges?: number,
    dashCooldownFrac?: number,
    weapons?: { key: string; level: number; evolved?: boolean; evolutionKey?: string; cooldownFrac?: number }[],
    passives?: string[],
    /** When reusing a pre-sized weapons buffer, only the first N entries are read. */
    weaponSlotCount?: number
  ): void {
    this.refreshResponsiveLayout();
    const hpDisplay = Math.max(0, Math.round(hp));
    const maxDisplay = Math.max(1, Math.round(maxHp));
    const hpFrac = Math.max(0, Math.min(1, hpDisplay / maxDisplay));
    this.hpBarFill.width = this.HP_BAR_W * hpFrac;
    this.hpText.setText(`${hpDisplay}/${maxDisplay}`);

    // Dynamic HP bar color: green > yellow > orange > red — smooth lerp
    const targetColor = hpFrac > 0.6 ? { r: 0x44, g: 0xcc, b: 0x44 }
      : hpFrac > 0.35 ? { r: 0xcc, g: 0xcc, b: 0x44 }
      : hpFrac > 0.15 ? { r: 0xdd, g: 0x88, b: 0x44 }
      : { r: 0xcc, g: 0x33, b: 0x33 };
    const lerpSpeed = 0.08; // ~300ms to resolve at 60fps
    this.displayHpR += (targetColor.r - this.displayHpR) * lerpSpeed;
    this.displayHpG += (targetColor.g - this.displayHpG) * lerpSpeed;
    this.displayHpB += (targetColor.b - this.displayHpB) * lerpSpeed;
    this.hpBarFill.setFillStyle(
      (Math.round(this.displayHpR) << 16) | (Math.round(this.displayHpG) << 8) | Math.round(this.displayHpB)
    );

    // Low-HP urgency pulse — below 30% the fill softly pulses alpha and the
    // HP text color shifts to match. High-contrast palette has its own
    // low/normal text colors so the HP readout stays readable at all times.
    if (hpFrac < 0.3 && hpFrac > 0) {
      this.lowHpPulse += 0.12;
      const pulseAlpha = 0.7 + Math.sin(this.lowHpPulse) * 0.3;
      this.hpBarFill.setAlpha(pulseAlpha);
      this.hpText.setColor(this.hcPalette?.textLowHp ?? '#ffcccc');
    } else {
      this.hpBarFill.setAlpha(1);
      this.hpText.setColor(this.hcPalette?.text ?? '#ffffff');
      this.lowHpPulse = 0;
    }

    if (level !== this.prevLevel) {
      this.prevLevel = level;
      this.levelText.setText(t('ui.hud.level_fmt', { level }));
    }

    const mins = Math.floor(gameTimeSec / 60);
    const secs = Math.floor(gameTimeSec % 60);
    // Wave difficulty indicator — resolved from BALANCE.hud so tuning stays
    // single-sourced with the wave timeline, not drifting inside UI code.
    let wave: string = BALANCE.hud.WAVE_DIFFICULTY_MARKS[0].label;
    let waveColor: string = BALANCE.hud.WAVE_DIFFICULTY_MARKS[0].color;
    for (const mark of BALANCE.hud.WAVE_DIFFICULTY_MARKS) {
      if (gameTimeSec >= mark.minSec) {
        wave = mark.label;
        waveColor = mark.color;
      }
    }
    // Only update timer + objective text when the displayed second changes
    if (mins !== this.prevMins || secs !== this.prevSecs) {
      this.prevMins = mins;
      this.prevSecs = secs;
      const remaining = Math.max(0, BALANCE.run.RUN_WIN_TIME_SEC - gameTimeSec);
      const remMins = Math.floor(remaining / 60);
      const remSecs = Math.floor(remaining % 60);
      const goalText =
        remaining > 0
          ? t('ui.hud.goal_countdown', { m: remMins, s: remSecs.toString().padStart(2, '0') })
          : t('ui.hud.goal_finale');
      this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
      this.objectiveText.setText(t('ui.hud.wave_objective', { wave, goal: goalText }));
    }
    // In high-contrast mode the timer keeps its warm palette color so the
    // HUD stays readable; the wave difficulty is still conveyed through the
    // objective-line text (e.g. "Wave III — Goal 2:15"). Otherwise tint the
    // timer with the ladder color for visual feedback on difficulty ramps.
    this.timerText.setColor(this.hcPalette?.timer ?? waveColor);
    this.objectiveText.setColor(this.hcPalette?.objective ?? '#9fb0cf');

    const overCap = enemyCount >= BALANCE.hud.ENEMY_WARN_THRESHOLD;
    // Only update kill/enemy text when values change
    if (killCount !== this.prevKills || enemyCount !== this.prevEnemyCount) {
      this.prevKills = killCount;
      this.prevEnemyCount = enemyCount;
      const enemyWarning = overCap ? t('ui.hud.enemies_capped_suffix') : '';
      const enemyColor = overCap
        ? (this.hcPalette?.killWarn ?? '#ff4444')
        : (this.hcPalette?.kill ?? '#ffffff');
      this.killText.setText(
        t('ui.hud.kills_enemies', { kills: killCount, count: enemyCount, suffix: enemyWarning })
      );
      this.killText.setColor(enemyColor);
    }

    // Pulse on cap transition — draws attention once, not every frame
    if (overCap && !this.wasOverCap) {
      this.scene.tweens.add({
        targets: this.killText, scaleX: this.uiScale * 1.15, scaleY: this.uiScale * 1.15,
        duration: 120, yoyo: true, ease: 'Sine.easeOut',
      });
    }
    this.wasOverCap = overCap;
    if (
      dashCharges !== undefined
      && maxDashCharges !== undefined
      && maxDashCharges > 0
    ) {
      const clampedCharges = Phaser.Math.Clamp(Math.floor(dashCharges), 0, maxDashCharges);
      const cooldownPct = dashCooldownFrac !== undefined
        ? Math.round(Math.max(0, Math.min(1, dashCooldownFrac)) * 100)
        : 0;
      const dashReady = clampedCharges > 0;
      const suffix = dashReady ? t('ui.hud.dash_ready') : t('ui.hud.dash_cooldown_pct', { pct: cooldownPct });
      const ay = this.dashHudAnchorY;

      // Animated "ready" glow — scale and alpha wobble on the full pips when
      // a charge is available. Drives on raw frame phase so the pulse runs
      // even when the game is timeScaled down (hit freeze, slow-mo), giving
      // the player a consistent "dash is there" signal.
      if (dashReady) {
        this.dashReadyPulse += 0.1;
      } else {
        this.dashReadyPulse = 0;
      }
      const readyPulseScale = dashReady
        ? 1 + Math.sin(this.dashReadyPulse) * 0.12
        : 1;
      const readyPulseAlpha = dashReady
        ? 0.75 + Math.sin(this.dashReadyPulse) * 0.25
        : 1;

      this.dashPrefixText.setVisible(true);
      this.dashPrefixText.setText(t('ui.hud.dash_label'));
      this.dashPrefixText.setPosition(this.dashHudAnchorX, ay);
      // Prefix color follows the state: gold + bright when ready,
      // dim-grey-gold when on cooldown.
      this.dashPrefixText.setColor(
        dashReady
          ? (this.highContrastUi ? '#ffe68a' : '#ffcc44')
          : (this.highContrastUi ? '#8a7a4a' : '#7a6a3a')
      );
      // Pips rendered at a slightly larger stride so they breathe under
      // the bumped dash font.
      const pipStride = 14 * this.uiScale;
      let x = this.dashPrefixText.x + this.dashPrefixText.width + 4 * this.uiScale;
      const fullKey = 'hud_dash_pip_full';
      const emptyKey = 'hud_dash_pip_empty';
      for (let i = 0; i < this.dashPipPool; i++) {
        const pip = this.dashPipImages[i];
        if (i < maxDashCharges) {
          pip.setVisible(true);
          const isFull = i < clampedCharges;
          pip.setTexture(isFull ? fullKey : emptyKey);
          // Only the full pips pulse — empties stay static.
          pip.setScale(this.uiScale * (isFull ? readyPulseScale : 1));
          pip.setAlpha(isFull ? readyPulseAlpha : 0.65);
          pip.setPosition(x + pipStride / 2, ay);
          x += pipStride;
        } else {
          pip.setVisible(false);
        }
      }
      this.dashSuffixText.setVisible(true);
      this.dashSuffixText.setText(` ${suffix}`);
      this.dashSuffixText.setPosition(x + 2 * this.uiScale, ay);
      this.dashSuffixText.setColor(
        dashReady
          ? (this.highContrastUi ? '#ffe68a' : '#ffcc44')
          : (this.highContrastUi ? '#8a7a4a' : '#7a6a3a')
      );
    } else {
      this.dashPrefixText.setVisible(false);
      this.dashSuffixText.setVisible(false);
      for (const pip of this.dashPipImages) pip.setVisible(false);
    }

    this.xpBarFill.width = this.layoutWidth * xpFraction;

    // XP bar level-up flash — fires when the bar resets (fraction drops after being high)
    if (this.prevXpFraction > 0.8 && xpFraction < 0.2) {
      const flash = this.scene.add.rectangle(
        this.xpBarBg.x, this.xpBarBg.y,
        this.layoutWidth, this.XP_BAR_H, 0xffffff, 0.6
      ).setOrigin(0, 0).setScrollFactor(0).setDepth(this.DEPTH + 2);
      this.scene.tweens.add({
        targets: flash, alpha: 0, duration: 250,
        onComplete: () => flash.destroy(),
      });
    }
    this.prevXpFraction = xpFraction;

    // Update weapon slots
    if (weapons) {
      const wCount = weaponSlotCount ?? weapons.length;
      this.updateWeaponSlots(weapons, wCount);
    }

    // Update passive items display
    if (passives && passives.length !== this.lastPassiveCount) {
      this.updatePassiveSlots(passives);
    }
  }

  /** Show/update boss HP bar. Pass null to hide. */
  updateBossBar(boss: { name: string; hpFraction: number } | null): void {
    this.refreshResponsiveLayout();
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

    this.bossHpFraction = Math.max(0, boss.hpFraction);
    const barW = this.layoutWidth * 0.55;
    this.bossBarFill.width = barW * this.bossHpFraction;
    this.bossNameText.setText(boss.name);
  }

  private updateWeaponSlots(
    weapons: { key: string; level: number; evolved?: boolean; evolutionKey?: string; cooldownFrac?: number }[],
    weaponCount: number
  ): void {
    const startX = this.layoutX + 12;
    const y = this.layoutY + this.topSafePad + 46;
    const size = 40;
    const gap = 6;

    // Only rebuild if count changed
    if (this.weaponSlots.length !== weaponCount) {
      for (const slot of this.weaponSlots) {
        for (const obj of [slot.bg, slot.icon, slot.label, slot.cdFill]) {
          const idx = this.elements.indexOf(obj);
          if (idx !== -1) this.elements.splice(idx, 1);
          obj.destroy();
        }
      }
      this.weaponSlots = [];

      const normalSlotStroke = this.hcSlotStroke ?? 0x666666;
      for (let i = 0; i < weaponCount; i++) {
        const w = weapons[i];
        const x = startX + i * (size + gap);
        const bg = this.addEl(this.scene.add.rectangle(x, y, size, size, 0x1a1a2e, 0.85)
          .setOrigin(0, 0).setStrokeStyle(2, normalSlotStroke)
          .setScrollFactor(0).setDepth(this.DEPTH));
        const cdFill = this.addEl(this.scene.add.rectangle(x, y + size - 4, size, 4, 0x005eb8, 0.85)
          .setOrigin(0, 0).setScrollFactor(0).setDepth(this.DEPTH + 2)) as Phaser.GameObjects.Rectangle;
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
          .setScrollFactor(0).setDepth(this.DEPTH + 2).setScale(0.8)) as Phaser.GameObjects.Image;
        // Small level pip in bottom-right corner (replaces the old full-cell text)
        const label = this.addEl(this.scene.add.text(x + size - 2, y + 2, '', {
          fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(this.DEPTH + 3));
        this.weaponSlots.push({ bg, icon, label, cdFill });
      }
    }

    // Update icon texture, level pip, evolved indicator, and cooldown fill
    for (let i = 0; i < weaponCount; i++) {
      const w = weapons[i];
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
        slot.bg.setStrokeStyle(2, w.evolved ? 0xddaa00 : (this.hcSlotStroke ?? 0x666666));

        // Cooldown bar: fills left-to-right along the bottom edge.
        const cdFrac = w.cooldownFrac ?? 1;
        slot.cdFill.width = size * cdFrac;
        slot.cdFill.setFillStyle(cdFrac >= 1 ? 0x44cc44 : 0x005eb8, 0.4);
      }
    }
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

    // Bottom-left placement — above DPS line and XP bar, so the top-left
    // cluster (HP, level, weapons, shield, dash) has room to breathe.
    const startX = this.layoutX + 12;
    const y = this.layoutY + this.layoutHeight - (54 * this.uiScale) - this.XP_BAR_H;

    passives.forEach((key, i) => {
      const x = startX + i * 42;
      // HUD pill labels live in ui.passive.hud_abbrev.<key>. When no entry
      // exists (e.g. new passive added without an abbrev yet), fall back to
      // the first three characters of the internal key.
      const abbrevKey = `ui.passive.hud_abbrev.${key}`;
      const resolved = t(abbrevKey);
      const abbrev = resolved === abbrevKey ? key.slice(0, 3).toUpperCase() : resolved;
      const label = this.addEl(this.scene.add.text(x + 16, y, abbrev, {
        fontFamily: 'monospace', fontSize: '12px', color: '#ddaa00', fontStyle: 'bold',
        backgroundColor: '#2a2a3a', padding: { x: 5, y: 3 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(this.DEPTH + 1));
      this.passiveSlots.push(label);
    });
  }

  /** Update shield indicator */
  updateShield(hasShield: boolean): void {
    this.shieldIcon.setVisible(hasShield);
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
      this.dpsText.setText(t('ui.hud.dps_line', { dps }));
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
