import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
import { BALANCE } from '../core/BalanceConfig';
import { getSettingsManager } from '../core/SettingsManager';
import { getCameraViewport } from './cameraViewport';
import { t } from '../core/i18n';
import type { CurseKey } from '../data/curses';
import { formatHudCurseChipLine } from './formatHudCurseChip';
import { resolveWeaponIconKey } from './hudWeaponIcon';
import { weaponPulseState } from './hudWeaponPulse';
import { formatClockTime } from '../utils/formatClockTime';
import { formatSpeedrunTime } from '../utils/formatSpeedrunTime';
import { TWEEN_ONE_SHOT_PULSE } from '../utils/tweenPresets';
import { resolvePassiveAbbrev } from './hudPassiveAbbrev';
import { audio } from '../systems/AudioSystem';
import {
  targetHpBarColor,
  packRgbColor,
  isLowHpPulseActive,
  hpLowPulseAlpha,
  HP_LOW_PULSE_PHASE_STEP,
} from './hudHpBarColor';
import { resolveWaveLabel } from './hudWaveLabel';
import { shouldTriggerXpLevelUpFlash } from './hudXpFlashGate';
import {
  dashLabelColor,
  dashPulseScale,
  dashPulseAlpha,
  DASH_PULSE_PHASE_STEP,
} from './hudDashStyle';
import {
  bossHpBarStyle,
  BOSS_BAR_BG,
  BOSS_BAR_BASELINE_FILL,
  BOSS_BAR_BASELINE_HIGHLIGHT,
  BOSS_BAR_WARN_GLOW_COLOR,
} from './hudBossBar';
import { resolveHudWeaponSlotStyle } from './hudWeaponSlotStyle';
import { resolveHudCooldownBarStyle } from './hudCooldownBarStyle';
import { clamp01 } from '../utils/math';
import { textStyle } from './typography';
import { computeMinTapHitArea } from '../utils/touchTargets';

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
  /** Top edge shadow on the XP bar — must move with `refreshResponsiveLayout` (was stuck at initial Y). */
  private xpBarTopLine!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private xpBarHighlight!: Phaser.GameObjects.Rectangle;

  private levelText!: Phaser.GameObjects.Text;
  /** Mid-run gold balance (earned − spent). Sits below the level readout. */
  private goldText!: Phaser.GameObjects.Text;
  private prevGold = -1;
  private timerText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  /** Shown when the run has an active curse (trade reminder). */
  private curseChipText!: Phaser.GameObjects.Text;
  /** Cache active curse key so chip text updates only when the run curse changes. */
  private prevCurseChipSig: string = '';
  /** W2 Moor Road — small "Act 2/3" chip shown once the player has cleared an act. */
  private actChipText!: Phaser.GameObjects.Text;
  private prevAct: 1 | 2 | 3 = 1;
  /** W66 Ironmoor — small "IRONMOOR" chip shown when single-life mode is active. */
  private ironmoorChipText!: Phaser.GameObjects.Text;
  private dailyChipText!: Phaser.GameObjects.Text;
  /** T1 replay — persistent "REPLAY" chip shown during best-effort playback. */
  private replayChipText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private pauseText!: Phaser.GameObjects.Text;

  /** Drift Mastery pip widget (DESIGN_IDEAS §1). Three small dots
   *  anchored below the HP bar; each fills (warm-cyan) when a Grip
   *  pip is banked, sits dim-empty otherwise. The whole strip pulses
   *  briefly while a burst is active. Hidden until first bank so a
   *  fresh run doesn't surface the mechanic before it's been earned. */
  private gripPipDots: Phaser.GameObjects.Arc[] = [];
  private gripPipsVisible = false;
  private prevGripPips = -1;
  private prevGripBurstActive = false;

  /** HP bar width — shrinks on narrow viewports so the centered timer
   *  doesn't overlap the HP fill. Mutable so `refreshResponsiveLayout`
   *  can rebalance against the live viewport (was a fixed 260 which
   *  obscured the timer at width 390 — audit 09g). */
  private HP_BAR_W = 260;
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
  private bossBarHighlight!: Phaser.GameObjects.Rectangle;
  private bossBarShadow!: Phaser.GameObjects.Rectangle;
  private bossBarGlow!: Phaser.GameObjects.Rectangle;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossBarVisible: boolean = false;
  private bossHpFraction = 1;

  // Passive items display — Image when the ucard texture exists, Text
  // fallback for any passive without a baked icon.
  private passiveSlots: Phaser.GameObjects.GameObject[] = [];
  private lastPassiveCount: number = 0;
  private lastPassiveKeys = new Set<string>();

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
  /** Last value written to the DPS line — for pause-menu stats. */
  private lastDisplayedDps: number = 0;

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
  private readonly speedrunTimerVisible: boolean;
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
    curse: string;
  } | null = null;

  private getUiViewport(): { x: number; y: number; width: number; height: number; zoom: number } {
    return getCameraViewport(this.scene);
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const settings = getSettingsManager().load();
    this.uiScale = settings.uiScale;
    this.highContrastUi = settings.highContrastUi;
    this.speedrunTimerVisible = settings.speedrunTimerVisible === true;
    this.build();
  }

  private addEl<T extends Phaser.GameObjects.GameObject>(el: T): T {
    this.elements.push(el);
    return el;
  }

  private removeEl(el: Phaser.GameObjects.GameObject): void {
    const idx = this.elements.indexOf(el);
    if (idx !== -1) this.elements.splice(idx, 1);
  }

  private build(): void {
    const { width, height } = this.getUiViewport();
    const d = this.DEPTH;
    const style = textStyle('body', { color: COLORS_CSS.WARM_TAN });

    // HP bar
    this.hpBarBg = this.addEl(this.scene.add.rectangle(12, 12, this.HP_BAR_W, this.HP_BAR_H, 0x1a1420)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d));
    this.hpBarFill = this.addEl(this.scene.add.rectangle(12, 12, this.HP_BAR_W, this.HP_BAR_H, COLORS.HP_RED)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1));
    this.hpText = this.addEl(this.scene.add.text(12 + this.HP_BAR_W / 2, 12 + this.HP_BAR_H / 2, '',
      textStyle('body', { color: COLORS_CSS.WARM_TAN }),
    ).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2));

    // Drift Mastery pip strip — three 4 px-radius dots anchored to the
    // RIGHT end of the HP bar so they don't compete with the level/gold
    // column on the left. Hidden until `setGripPips()` first reports
    // a pip > 0; until then the widget never paints. Each dot is its
    // own Arc so the fill toggles instantly without a tween, and the
    // whole strip can be lifted by a brief setScale tween on burst.
    const gripBaseX = 12 + this.HP_BAR_W + 8;
    const gripY = 12 + this.HP_BAR_H / 2;
    for (let i = 0; i < 3; i++) {
      const dot = this.addEl(
        this.scene.add.circle(gripBaseX + i * 12, gripY, 4, 0x2a3344, 1)
          .setStrokeStyle(1, 0x4a5566, 0.6)
          .setScrollFactor(0).setDepth(d + 2)
          .setVisible(false),
      ) as Phaser.GameObjects.Arc;
      this.gripPipDots.push(dot);
    }

    // Level
    this.levelText = this.addEl(this.scene.add.text(12, 40, '', style)
      .setScrollFactor(0).setDepth(d));

    // Gold balance chip (whisky-gold tint — matches dash/coin palette).
    // Updated in `update()` whenever the balance changes; hidden until
    // the first setText fires from GameScene.
    this.goldText = this.addEl(this.scene.add.text(12, 62, '',
      textStyle('body', { color: COLORS_CSS.WHISKY_GOLD }),
    ).setScrollFactor(0).setDepth(d).setVisible(false)) as Phaser.GameObjects.Text;

    // Timer
    this.timerText = this.addEl(this.scene.add.text(width / 2, 12, '',
      textStyle('title', { color: COLORS_CSS.WARM_TAN }),
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d));
    // Wraps divided by uiScale so scaled text still fits inside the
    // responsive horizontal budget (setScale(uiScale) multiplies the
    // pre-wrap measurement — leaving the wrap un-divided means a 1.4x
    // UI scale pushes a centered 720px wrap to ~1008px rendered width,
    // clipping off the canvas edges).
    const uiScaleClamp = Math.max(1, this.uiScale);
    this.objectiveText = this.addEl(this.scene.add.text(width / 2, 42, '',
      textStyle('label', { color: COLORS_CSS.DUSTY_TAN, wordWrap: { width: Math.max(160, (width - 80) / uiScaleClamp) } }),
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d)) as Phaser.GameObjects.Text;

    this.curseChipText = this.addEl(this.scene.add.text(width / 2, 62, '',
      textStyle('label', { color: '#c49bbf', wordWrap: { width: Math.max(160, (width - 80) / uiScaleClamp) } }),
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d).setVisible(false)) as Phaser.GameObjects.Text;

    // W2 Moor Road act chip — hidden until the first picker resolves.
    this.actChipText = this.addEl(this.scene.add.text(width / 2, 78, '',
      textStyle('body', { color: COLORS_CSS.WARM_TAN }),
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d + 1).setVisible(false)) as Phaser.GameObjects.Text;

    // W66 Ironmoor chip — only shown when single-life mode is active.
    this.ironmoorChipText = this.addEl(this.scene.add.text(width / 2, 94, '',
      textStyle('label', { color: '#c8a0a0' }),
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d + 1).setVisible(false)) as Phaser.GameObjects.Text;

    // P2.12 — DAILY chip. Shown only when the run was launched via the
    // Daily Challenge button. Pre-fix: a daily run looked identical to
    // a normal run during play — no on-screen reminder. Right-anchored
    // top-band so it pairs with the Kills readout and doesn't fight
    // the centred countdown / banter overlays.
    this.dailyChipText = this.addEl(this.scene.add.text(width - 12, 64, '',
      textStyle('label', { color: '#e2c97a' }),
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(d + 1).setVisible(false)) as Phaser.GameObjects.Text;

    // T1 replay chip — persistent indicator during best-effort playback.
    // Bottom-right, above the XP bar, right-origin so it doesn't clash
    // with the minimap at the bottom-right corner (minimap anchors from
    // the scene edge). Light-blue tint matches the watching-toast so the
    // two cues read as one language.
    this.replayChipText = this.addEl(this.scene.add.text(width - 12, height - this.XP_BAR_H - 24, '',
      textStyle('label', { color: '#88ccff' }),
    ).setOrigin(1, 1).setScrollFactor(0).setDepth(d + 1).setVisible(false)) as Phaser.GameObjects.Text;

    // Kill count — constrain width so it doesn't overlap the centered timer.
    // 0.30 ratio divided by uiScale keeps the right-anchored kill readout
    // clear of the 30px-title timer even at 1.4x comfort scale (previously
    // 0.38 × 1.4 overlapped the timer bounding box).
    const killStyle = textStyle('body', { color: COLORS_CSS.WARM_TAN, wordWrap: { width: Math.max(100, Math.floor((width * 0.30) / uiScaleClamp)) } });
    this.killText = this.addEl(this.scene.add.text(width - 12, 12, '', killStyle)
      .setOrigin(1, 0).setScrollFactor(0).setDepth(d));

    // XP bar — layered for depth (bg → dark shadow → fill → top highlight)
    const xpY = height - this.XP_BAR_H - 4;
    // Dark slate — not near-black — so an empty XP track reads as UI chrome, not a dead band.
    this.xpBarBg = this.addEl(this.scene.add.rectangle(0, xpY, width, this.XP_BAR_H, 0x161a22)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d));
    // Inner shadow line at top of bg (depth)
    this.xpBarTopLine = this.addEl(this.scene.add.rectangle(0, xpY, width, 1, 0x000000, 0.38)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d)) as Phaser.GameObjects.Rectangle;
    this.xpBarFill = this.addEl(this.scene.add.rectangle(0, xpY, 0, this.XP_BAR_H, COLORS.XP_BAR)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1));
    // Top highlight on fill (gold shimmer line at top)
    this.xpBarHighlight = this.addEl(this.scene.add.rectangle(0, xpY, 0, 2, 0xffe066, 0.7)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 2));

    // Pause button (visible on touch devices, small on desktop).
    // W95 — explicit ≥44pt hit area so the bare "| |" glyphs (≈18×24px)
    // hit the iOS HIG / Android Material minimum tap target on phones.
    this.pauseText = this.addEl(this.scene.add.text(width - 12, 40, '| |',
      textStyle('heading', { fontSize: '24px', color: '#b8a88a' }),
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(d + 1)) as Phaser.GameObjects.Text;
    {
      const hit = computeMinTapHitArea(
        this.pauseText.width,
        this.pauseText.height,
        { x: 1, y: 0 },
      );
      this.pauseText.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(hit.x, hit.y, hit.width, hit.height),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      } as Phaser.Types.Input.InputConfiguration);
    }
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
    const dashStyle = textStyle('body', { fontSize: '14px', color: COLORS_CSS.WHISKY_GOLD });
    this.dashPrefixText = this.addEl(this.scene.add.text(12 + this.HP_BAR_W + 10, 12 + this.HP_BAR_H / 2 + 20, '',
      dashStyle,
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 2).setVisible(false)) as Phaser.GameObjects.Text;
    for (let i = 0; i < this.dashPipPool; i++) {
      const pip = this.addEl(this.scene.add.image(0, 0, 'hud_dash_pip_full')
        .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(d + 2).setVisible(false)) as Phaser.GameObjects.Image;
      this.dashPipImages.push(pip);
    }
    this.dashSuffixText = this.addEl(this.scene.add.text(0, 0, '',
      dashStyle,
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 2).setVisible(false)) as Phaser.GameObjects.Text;

    // DPS counter — dev/observability HUD element. Hidden in normal play
    // so the bottom-left edge stays clean (the pause menu already shows
    // DPS in the run-stats column). Re-enable with `?devDps=1` in the
    // URL or by setting `window.__SHOW_HUD_DPS = true` before scene.start.
    this.dpsText = this.addEl(this.scene.add.text(12, height - 26, '',
      textStyle('body', { color: '#8a7a6a' }),
    ).setScrollFactor(0).setDepth(d)) as Phaser.GameObjects.Text;
    const showDps = (() => {
      try {
        const w = window as unknown as { __SHOW_HUD_DPS?: boolean };
        if (w.__SHOW_HUD_DPS === true) return true;
        const params = new URLSearchParams(window.location?.search ?? '');
        return params.get('devDps') === '1';
      } catch { return false; }
    })();
    if (!showDps) this.dpsText.setVisible(false);

    // Boss HP bar — layered: dark bg → dark fill shadow → red fill → bright top highlight.
    // Boss bar lives ABOVE the banter / tutorial-tip layer (depths 85-92) so a
    // boss fight can never have its HP bar hidden behind ambient toast text
    // (P1.11 fix). Stays well below modal underlays (599+) so pause/level-up
    // still occlude it.
    const bossBarW = width * 0.55;
    const bossBarY = 98;
    const bd = 95;
    // Warning glow (sits behind everything, fades in when low HP)
    this.bossBarGlow = this.addEl(this.scene.add.rectangle(width / 2, bossBarY, bossBarW + 12, 30, BOSS_BAR_WARN_GLOW_COLOR, 0)
      .setScrollFactor(0).setDepth(bd - 1).setVisible(false)) as Phaser.GameObjects.Rectangle;
    this.bossBarBg = this.addEl(this.scene.add.rectangle(width / 2, bossBarY, bossBarW, 22, BOSS_BAR_BG)
      .setScrollFactor(0).setDepth(bd).setVisible(false)) as Phaser.GameObjects.Rectangle;
    // Inner shadow line
    this.bossBarShadow = this.addEl(this.scene.add.rectangle(width / 2, bossBarY - 9, bossBarW, 2, 0x000000, 0.6)
      .setScrollFactor(0).setDepth(bd).setVisible(false)) as Phaser.GameObjects.Rectangle;
    this.bossBarFill = this.addEl(this.scene.add.rectangle(width / 2 - bossBarW / 2, bossBarY, bossBarW, 22, BOSS_BAR_BASELINE_FILL)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(bd + 1).setVisible(false)) as Phaser.GameObjects.Rectangle;
    // Top highlight on fill (reads as 3D depth)
    this.bossBarHighlight = this.addEl(this.scene.add.rectangle(width / 2 - bossBarW / 2, bossBarY - 8, bossBarW, 3, BOSS_BAR_BASELINE_HIGHLIGHT, 0.6)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(bd + 2).setVisible(false)) as Phaser.GameObjects.Rectangle;
    this.bossNameText = this.addEl(this.scene.add.text(width / 2, bossBarY - 14, '',
      textStyle('body', { fontSize: '17px', color: '#ff9999', wordWrap: { width: Math.max(200, bossBarW / uiScaleClamp) } }),
    ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(bd + 2).setVisible(false)) as Phaser.GameObjects.Text;
    if (this.uiScale !== 1) {
      const scaleTargets: Phaser.GameObjects.GameObject[] = [
        this.hpText,
        this.levelText,
        this.goldText,
        this.timerText,
        this.objectiveText,
        this.curseChipText,
        this.killText,
        this.pauseText,
        this.shieldIcon,
        this.dashPrefixText,
        this.dashSuffixText,
        this.dpsText,
        this.bossNameText,
        this.actChipText,
        this.ironmoorChipText,
        this.dailyChipText,
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
        curse: '#f5e0f8',
      };
      this.hpBarBg.setFillStyle(0x080b12, 0.95);
      this.xpBarBg.setFillStyle(0x121820, 0.94);
      this.objectiveText.setColor(this.hcPalette.objective);
      this.curseChipText.setColor(this.hcPalette.curse);
      this.dpsText.setColor(this.hcPalette.dps);
      this.hpText.setColor(this.hcPalette.text);
      this.levelText.setColor(this.hcPalette.text);
      this.goldText.setColor(this.hcPalette.text);
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
    // Cap HP bar to ~38% of viewport width so the centered timer stays
    // clear of the bar fill on narrow viewports (mobile + windowed).
    // Floor at 140 keeps the bar usable; ceiling at 260 preserves the
    // desktop look unchanged.
    this.HP_BAR_W = Math.round(Math.max(140, Math.min(260, width * 0.38)));
    const padX = Math.max(x + 8, Math.min(x + 12 * this.uiScale, x + Math.max(8, width - this.HP_BAR_W - 8)));
    // Resize HP bar bg + fill to match the new HP_BAR_W. Phaser
    // Rectangles let you assign `.width` / `.height` directly; using the
    // raw fields stays compatible with the HUD test mocks (which don't
    // implement setSize).
    this.hpBarBg.width = this.HP_BAR_W;
    this.hpBarBg.height = this.HP_BAR_H;
    if (this.hpBarFill.width > this.HP_BAR_W) this.hpBarFill.width = this.HP_BAR_W;
    this.hpBarFill.height = this.HP_BAR_H;
    const padY = y + this.topSafePad;
    const xpY = y + height - this.XP_BAR_H - bottomPad;

    this.hpBarBg.setPosition(padX, padY);
    this.hpBarFill.setPosition(padX, padY);
    this.hpText.setPosition(padX + this.HP_BAR_W / 2, padY + this.HP_BAR_H / 2);
    this.levelText.setPosition(padX, padY + 28 * this.uiScale);
    this.goldText.setPosition(padX, padY + 50 * this.uiScale);
    const hpGap = Math.round(10 * this.uiScale);
    this.shieldIcon.setPosition(padX + this.HP_BAR_W + hpGap, padY + this.HP_BAR_H / 2);
    this.shieldIcon.setScale(this.uiScale * 0.92);
    this.dashHudAnchorX = padX + this.HP_BAR_W + hpGap;
    this.dashHudAnchorY = padY + this.HP_BAR_H / 2 + 18 * this.uiScale;

    this.xpBarBg.setPosition(x, xpY);
    this.xpBarBg.width = width;
    this.xpBarTopLine.setPosition(x, xpY);
    this.xpBarTopLine.width = width;
    this.xpBarFill.setPosition(x, xpY);
    this.xpBarHighlight.setPosition(x, xpY);

    const topY = y + this.topSafePad;
    this.timerText.setPosition(x + width / 2, topY);
    this.objectiveText.setPosition(x + width / 2, topY + 30 * this.uiScale);
    this.curseChipText.setPosition(x + width / 2, topY + 50 * this.uiScale);
    this.actChipText.setPosition(x + width / 2, topY + 66 * this.uiScale);
    this.ironmoorChipText.setPosition(x + width / 2, topY + 82 * this.uiScale);
    // P2.12 — daily chip sits ABOVE the timer at the top edge so it
    // never collides with countdown / banter overlays that occupy the
    // upper third. Right-anchored so it pairs with the Kills readout.
    this.dailyChipText.setPosition(x + width - 12, topY + 64 * this.uiScale);
    this.killText.setPosition(x + width - 12, topY);
    this.pauseText.setPosition(x + width - 12, topY + 28 * this.uiScale);
    this.dpsText.setPosition(x + 12, y + height - ((24 * this.uiScale) + this.XP_BAR_H + bottomPad));

    const bossBarW = width * 0.55;
    // Clear the top-center chip stack (objective + curse + act + ironmoor).
    // Ironmoor sits lowest at topY + 82*uiScale; add ~30px for chip height
    // and gap so the bar never kisses the ironmoor/act label even at uiScale 1.4.
    const chipStackBottom = this.topSafePad + 82 * this.uiScale + 30;
    const bossBarY = Math.max(y + 44, Math.min(y + chipStackBottom, y + Math.max(44, height - 80)));
    const bossBarLeft = x + width / 2 - bossBarW / 2;
    this.bossBarBg.setPosition(x + width / 2, bossBarY);
    this.bossBarBg.width = bossBarW;
    this.bossBarGlow.setPosition(x + width / 2, bossBarY);
    this.bossBarGlow.width = bossBarW + 12;
    this.bossBarShadow.setPosition(x + width / 2, bossBarY - 9);
    this.bossBarShadow.width = bossBarW;
    this.bossBarFill.setPosition(bossBarLeft, bossBarY);
    this.bossBarFill.width = bossBarW * Math.max(0, this.bossHpFraction);
    this.bossBarHighlight.setPosition(bossBarLeft, bossBarY - 8);
    this.bossBarHighlight.width = bossBarW * Math.max(0, this.bossHpFraction);
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
    weaponSlotCount?: number,
    /** Active run curse, or null/omit if none — same source as pause overlay (`formatHudCurseChipLine`). */
    activeCurseKey?: CurseKey | null,
  ): void {
    this.refreshResponsiveLayout();
    const hpDisplay = Math.max(0, Math.round(hp));
    const maxDisplay = Math.max(1, Math.round(maxHp));
    const hpFrac = clamp01(hpDisplay / maxDisplay);
    this.hpBarFill.width = this.HP_BAR_W * hpFrac;
    this.hpText.setText(`${hpDisplay}/${maxDisplay}`);

    // Dynamic HP bar color: green > yellow > orange > red — smooth lerp
    const targetColor = targetHpBarColor(hpFrac);
    const lerpSpeed = 0.08; // ~300ms to resolve at 60fps
    this.displayHpR += (targetColor.r - this.displayHpR) * lerpSpeed;
    this.displayHpG += (targetColor.g - this.displayHpG) * lerpSpeed;
    this.displayHpB += (targetColor.b - this.displayHpB) * lerpSpeed;
    this.hpBarFill.setFillStyle(packRgbColor({
      r: this.displayHpR, g: this.displayHpG, b: this.displayHpB,
    }));

    // Low-HP urgency pulse — below 30% the fill softly pulses alpha and the
    // HP text color shifts to match. High-contrast palette has its own
    // low/normal text colors so the HP readout stays readable at all times.
    if (isLowHpPulseActive(hpFrac)) {
      this.lowHpPulse += HP_LOW_PULSE_PHASE_STEP;
      this.hpBarFill.setAlpha(hpLowPulseAlpha(this.lowHpPulse));
      this.hpText.setColor(this.hcPalette?.textLowHp ?? '#ffcccc');
    } else {
      this.hpBarFill.setAlpha(1);
      this.hpText.setColor(this.hcPalette?.text ?? COLORS_CSS.WHITE);
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
    const { label: wave, color: waveColor } = resolveWaveLabel(gameTimeSec);
    // Speedrun timer mode renders every frame (centisecond precision);
    // default timer renders once per second like before. Setting is read
    // fresh at HUD construction in create(); toggling mid-run takes effect
    // on next scene start.
    if (this.speedrunTimerVisible) {
      this.timerText.setText(formatSpeedrunTime(gameTimeSec));
    }
    if (mins !== this.prevMins || secs !== this.prevSecs) {
      this.prevMins = mins;
      this.prevSecs = secs;
      const remaining = Math.max(0, BALANCE.run.RUN_WIN_TIME_SEC - gameTimeSec);
      const goalText =
        remaining > 0
          ? t('ui.hud.goal_countdown', { time: formatClockTime(remaining) })
          : t('ui.hud.goal_finale');
      if (!this.speedrunTimerVisible) {
        this.timerText.setText(formatClockTime(gameTimeSec));
      }
      this.objectiveText.setText(t('ui.hud.wave_objective', { wave, goal: goalText }));
    }
    // In high-contrast mode the timer keeps its warm palette color so the
    // HUD stays readable; the wave difficulty is still conveyed through the
    // objective-line text (e.g. "Wave III — Goal 2:15"). Otherwise tint the
    // timer with the ladder color for visual feedback on difficulty ramps.
    this.timerText.setColor(this.hcPalette?.timer ?? waveColor);
    this.objectiveText.setColor(this.hcPalette?.objective ?? '#9fb0cf');

    const sig = activeCurseKey ?? '';
    if (sig !== this.prevCurseChipSig) {
      this.prevCurseChipSig = sig;
      const line = formatHudCurseChipLine(activeCurseKey ?? null);
      if (line) {
        this.curseChipText.setText(line);
        this.curseChipText.setVisible(true);
      } else {
        this.curseChipText.setVisible(false);
      }
    }

    const overCap = enemyCount >= BALANCE.hud.ENEMY_WARN_THRESHOLD;
    // Only update kill/enemy text when values change
    if (killCount !== this.prevKills || enemyCount !== this.prevEnemyCount) {
      this.prevKills = killCount;
      this.prevEnemyCount = enemyCount;
      const enemyWarning = overCap ? t('ui.hud.enemies_capped_suffix') : '';
      const enemyColor = overCap
        ? (this.hcPalette?.killWarn ?? COLORS_CSS.DANGER_RED)
        : (this.hcPalette?.kill ?? COLORS_CSS.WHITE);
      // P1.8 — below 600 px the long "Kills: X  Enemies: Y" string wrapped
      // to two lines and bled into the dash row at y=44. Switch to a
      // compact " K:X · E:Y " single-line format on mobile so the row
      // stays clear of the dash readout.
      const isMobileWidth = this.layoutWidth < 600;
      const labelKey = isMobileWidth ? 'ui.hud.kills_enemies_compact' : 'ui.hud.kills_enemies';
      this.killText.setText(
        t(labelKey, { kills: killCount, count: enemyCount, suffix: enemyWarning })
      );
      this.killText.setColor(enemyColor);
    }

    // Pulse on cap transition — draws attention once, not every frame
    if (overCap && !this.wasOverCap) {
      this.scene.tweens.add({
        targets: this.killText, scaleX: this.uiScale * 1.15, scaleY: this.uiScale * 1.15,
        duration: 120, ...TWEEN_ONE_SHOT_PULSE,
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
        ? Math.round(clamp01(dashCooldownFrac) * 100)
        : 0;
      const dashReady = clampedCharges > 0;
      const suffix = dashReady ? t('ui.hud.dash_ready') : t('ui.hud.dash_cooldown_pct', { pct: cooldownPct });
      const ay = this.dashHudAnchorY;

      // Animated "ready" glow — scale and alpha wobble on the full pips when
      // a charge is available. Drives on raw frame phase so the pulse runs
      // even when the game is timeScaled down (hit freeze, slow-mo), giving
      // the player a consistent "dash is there" signal.
      if (dashReady) {
        this.dashReadyPulse += DASH_PULSE_PHASE_STEP;
      } else {
        this.dashReadyPulse = 0;
      }
      const readyPulseScale = dashPulseScale(dashReady, this.dashReadyPulse);
      const readyPulseAlpha = dashPulseAlpha(dashReady, this.dashReadyPulse);

      this.dashPrefixText.setVisible(true);
      this.dashPrefixText.setText(t('ui.hud.dash_label'));
      this.dashPrefixText.setPosition(this.dashHudAnchorX, ay);
      // Prefix color follows the state: gold + bright when ready,
      // dim-grey-gold when on cooldown.
      this.dashPrefixText.setColor(dashLabelColor(dashReady, this.highContrastUi));
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
      this.dashSuffixText.setColor(dashLabelColor(dashReady, this.highContrastUi));
    } else {
      this.dashPrefixText.setVisible(false);
      this.dashSuffixText.setVisible(false);
      for (const pip of this.dashPipImages) pip.setVisible(false);
    }

    const xpFillWidth = this.layoutWidth * xpFraction;
    this.xpBarFill.width = xpFillWidth;
    this.xpBarHighlight.width = xpFillWidth;

    // XP bar level-up flash — brighter, wider pulse when the bar resets
    if (shouldTriggerXpLevelUpFlash(this.prevXpFraction, xpFraction)) {
      // Primary bright flash across the bar
      const flash = this.addEl(this.scene.add.rectangle(
        this.xpBarBg.x, this.xpBarBg.y,
        this.layoutWidth, this.XP_BAR_H, 0xffee88, 0.9
      ).setOrigin(0, 0).setScrollFactor(0).setDepth(this.DEPTH + 3));
      this.scene.tweens.add({
        targets: flash, alpha: 0, duration: 400,
        onComplete: () => { this.removeEl(flash); flash.destroy(); },
      });
      const glow = this.addEl(this.scene.add.rectangle(
        this.xpBarBg.x, this.xpBarBg.y - 4,
        this.layoutWidth, this.XP_BAR_H + 8, 0xffdd44, 0.4
      ).setOrigin(0, 0).setScrollFactor(0).setDepth(this.DEPTH + 2));
      this.scene.tweens.add({
        targets: glow, alpha: 0, scaleY: 1.5, duration: 500,
        onComplete: () => { this.removeEl(glow); glow.destroy(); },
      });
    }
    this.prevXpFraction = xpFraction;

    // Update weapon slots
    if (weapons) {
      const wCount = weaponSlotCount ?? weapons.length;
      this.updateWeaponSlots(weapons, wCount);
    }

    // Update passive items display
    if (passives && (passives.length !== this.lastPassiveCount || passives.some(k => !this.lastPassiveKeys.has(k)))) {
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
        this.bossBarHighlight.setVisible(false);
        this.bossBarShadow.setVisible(false);
        this.bossBarGlow.setVisible(false);
        this.bossNameText.setVisible(false);
        this.bossBarVisible = false;
      }
      return;
    }

    if (!this.bossBarVisible) {
      this.bossBarBg.setVisible(true);
      this.bossBarFill.setVisible(true);
      this.bossBarHighlight.setVisible(true);
      this.bossBarShadow.setVisible(true);
      this.bossBarGlow.setVisible(true);
      this.bossNameText.setVisible(true);
      this.bossBarVisible = true;
    }

    this.bossHpFraction = Math.max(0, boss.hpFraction);
    const barW = this.layoutWidth * 0.55;
    const fillW = barW * this.bossHpFraction;
    this.bossBarFill.width = fillW;
    this.bossBarHighlight.width = fillW;
    this.bossNameText.setText(boss.name);

    // Colour shift based on HP — see hudBossBar for the three tiers.
    const bossStyle = bossHpBarStyle(this.bossHpFraction, this.scene.time.now);
    this.bossBarGlow.setFillStyle(bossStyle.glowColor, bossStyle.glowAlpha);
    this.bossBarFill.setFillStyle(bossStyle.fillColor);
    this.bossBarHighlight.setFillStyle(bossStyle.highlightColor);
  }

  private updateWeaponSlots(
    weapons: { key: string; level: number; evolved?: boolean; evolutionKey?: string; cooldownFrac?: number }[],
    weaponCount: number
  ): void {
    const uiS = this.uiScale;
    const startX = this.layoutX + Math.round(12 * uiS);
    const y = this.layoutY + this.topSafePad + Math.round(46 * uiS);
    const size = Math.round(40 * uiS);
    const gap = Math.round(6 * uiS);

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
        const bg = this.addEl(this.scene.add.rectangle(x, y, size, size, COLORS.BG_DARK, 0.85)
          .setOrigin(0, 0).setStrokeStyle(2, normalSlotStroke)
          .setScrollFactor(0).setDepth(this.DEPTH));
        const cdBarH = Math.max(2, Math.round(4 * uiS));
        const cdFill = this.addEl(this.scene.add.rectangle(x, y + size - cdBarH, size, cdBarH, COLORS.SCOTTISH_BLUE, 0.85)
          .setOrigin(0, 0).setScrollFactor(0).setDepth(this.DEPTH + 2)) as Phaser.GameObjects.Rectangle;
        // Weapon icon — real sprite instead of cryptic "TS1" abbreviation.
        // Each weapon has a pre-rendered `wicon_{key}` or `wicon_{evolutionKey}`
        // texture from BootScene. Pick the evolved one if it exists, else the
        // base, else the thistle_shot fallback.
        const initialKey = resolveWeaponIconKey(w, (k) => this.scene.textures.exists(k));
        const icon = this.addEl(this.scene.add.image(x + size / 2, y + size / 2, initialKey)
          .setScrollFactor(0).setDepth(this.DEPTH + 2).setScale(0.8 * uiS)) as Phaser.GameObjects.Image;
        // Small level pip in bottom-right corner (replaces the old full-cell text)
        const label = this.addEl(this.scene.add.text(x + size - 2, y + 2, '',
          textStyle('small', { color: COLORS_CSS.WHITE }),
        ).setOrigin(1, 0).setScrollFactor(0).setDepth(this.DEPTH + 3));
        label.setScale(uiS);
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
        const desiredKey = resolveWeaponIconKey(w, (k) => this.scene.textures.exists(k));
        if (slot.icon.texture.key !== desiredKey) {
          slot.icon.setTexture(desiredKey);
        }
        slot.label.setText(w.evolved ? '★' : `${w.level}`);
        const slotStyle = resolveHudWeaponSlotStyle(w.evolved, this.hcSlotStroke);
        slot.label.setColor(slotStyle.labelColor);
        slot.bg.setStrokeStyle(2, slotStyle.strokeColor);

        // Cooldown bar: fills left-to-right along the bottom edge.
        const cdFrac = w.cooldownFrac ?? 1;
        slot.cdFill.width = size * cdFrac;
        const isReady = cdFrac >= 1;
        const cdStyle = resolveHudCooldownBarStyle(isReady);
        slot.cdFill.setFillStyle(cdStyle.fillColor, cdStyle.alpha);

        // Ready-state pulse: icon breathes gently when ready, dims when cooling.
        // Phase advance is ms-based — animation speed is frame-rate-independent.
        // Compose pulse.scale on top of the uiScale-adjusted base (0.8 × uiS).
        const pulse = weaponPulseState(this.scene.time.now, i, isReady);
        slot.icon.setScale(0.8 * uiS * pulse.scale);
        slot.icon.setAlpha(pulse.alpha);
      }
    }
  }

  private updatePassiveSlots(passives: string[]): void {
    // Identify newly added passives before destroying old slots
    const newKeys = passives.filter(k => !this.lastPassiveKeys.has(k));

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
    const startX = this.layoutX + Math.round(12 * this.uiScale);
    const y = this.layoutY + this.layoutHeight - (54 * this.uiScale) - this.XP_BAR_H;
    const slotStride = Math.round(42 * this.uiScale);
    const slotCenterOffset = Math.round(16 * this.uiScale);

    // Icons are 32px baked textures; scale to match the old pill footprint
    // (~26px at uiScale 1.0) so the bottom-left cluster keeps its breathing room.
    const iconScale = this.uiScale * 0.82;
    let playedSfx = false;
    passives.forEach((key, i) => {
      const x = startX + i * slotStride;
      const iconKey = `ucard_${key}`;
      const hasIcon = this.scene.textures.exists(iconKey);

      let slot: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
      let flashW: number;
      let flashH: number;
      if (hasIcon) {
        // Preferred path — pre-rendered passive icon (mirrors weapon slot icons).
        const icon = this.addEl(this.scene.add.image(x + slotCenterOffset, y, iconKey)
          .setOrigin(0.5).setScrollFactor(0).setDepth(this.DEPTH + 1)) as Phaser.GameObjects.Image;
        icon.setScale(iconScale);
        slot = icon;
        flashW = icon.displayWidth + 6;
        flashH = icon.displayHeight + 6;
      } else {
        // Fallback for any passive without a baked icon — old 3-letter pill.
        const abbrev = resolvePassiveAbbrev(key);
        const label = this.addEl(this.scene.add.text(x + slotCenterOffset, y, abbrev, {
          ...textStyle('label', { fontSize: '12px', color: COLORS_CSS.LEGENDARY }),
          backgroundColor: '#2a2a3a', padding: { x: 5, y: 3 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(this.DEPTH + 1)) as Phaser.GameObjects.Text;
        slot = label;
        flashW = label.width + 14;
        flashH = label.height + 10;
      }
      this.passiveSlots.push(slot);

      if (newKeys.includes(key)) {
        const targetScale = hasIcon ? iconScale : 1;
        (slot as Phaser.GameObjects.Image | Phaser.GameObjects.Text).setScale(0);
        this.scene.tweens.add({
          targets: slot, scale: targetScale, duration: 250, ease: 'Back.easeOut',
        });

        // Gold flash rect behind the slot — size matches the rendered element.
        const flash = this.scene.add.rectangle(
          (slot as Phaser.GameObjects.Image | Phaser.GameObjects.Text).x,
          (slot as Phaser.GameObjects.Image | Phaser.GameObjects.Text).y,
          flashW, flashH,
          0xffdd44, 0.6,
        ).setScrollFactor(0).setDepth(this.DEPTH);
        this.scene.tweens.add({
          targets: flash, alpha: 0, duration: 400,
          onComplete: () => flash.destroy(),
        });

        // Bell SFX — once per updatePassiveSlots call, not once per pill
        if (!playedSfx) {
          audio.playStoneGrant();
          playedSfx = true;
        }
      }
    });

    this.lastPassiveKeys = new Set(passives);
  }

  /** Update shield indicator */
  updateShield(hasShield: boolean): void {
    this.shieldIcon.setVisible(hasShield);
  }

  /**
   * Drift Mastery pip widget update. Caller passes the live state
   * read from `Player.getDriftMasteryState()`; this writes the three
   * dots' fill colour + visibility and pulses the strip on a fresh
   * burst-fired edge.
   *
   * Stays hidden until the player banks the first pip — keeps the
   * mechanic discoverable without spamming a fresh run with empty
   * widgets. Once visible, it remains so for the rest of the run.
   * Caching `prevGripPips` / `prevGripBurstActive` avoids per-frame
   * setFillStyle / tween calls on the steady state (cheapest path
   * is no-op on every frame the player isn't actively interacting
   * with the mechanic).
   */
  setGripPips(pips: number, burstActive: boolean): void {
    const safePips = Math.max(0, Math.min(3, Math.floor(pips)));
    if (!this.gripPipsVisible && safePips > 0) {
      this.gripPipsVisible = true;
      for (const dot of this.gripPipDots) dot.setVisible(true);
    }
    if (safePips !== this.prevGripPips) {
      this.prevGripPips = safePips;
      // Filled = warm-cyan (0x6ad4ff, matches first-bank caption tint
      // #a8d4f0); empty = dim slate (0x2a3344, sits on the HUD's dark
      // chrome without competing with the HP bar).
      for (let i = 0; i < this.gripPipDots.length; i++) {
        this.gripPipDots[i]!.setFillStyle(i < safePips ? 0x6ad4ff : 0x2a3344, 1);
      }
    }
    // Pulse the strip on burst-fired edge — a single short scale-up +
    // fade-back tween confirms the spend without lingering. Detect
    // the edge as `burstActive && !prevBurstActive` so a burst that
    // straddles multiple frames doesn't restart the tween every tick.
    if (burstActive && !this.prevGripBurstActive) {
      for (const dot of this.gripPipDots) {
        this.scene.tweens.add({
          targets: dot,
          scale: 1.6,
          duration: 120,
          yoyo: true,
          ease: 'Sine.easeOut',
        });
      }
    }
    this.prevGripBurstActive = burstActive;
  }

  /**
   * Mid-run gold balance chip. Caches the last written value so the
   * setText / setVisible calls only fire on change — matches the rest
   * of the HUD's prev-value caching pattern.
   */
  setGold(balance: number): void {
    const safe = Math.max(0, Math.floor(balance));
    if (safe === this.prevGold) return;
    this.prevGold = safe;
    this.goldText.setText(t('ui.hud.gold_chip', { gold: String(safe) }));
    this.goldText.setVisible(true);
  }

  /**
   * W2 Moor Road: update the act chip. Hidden for act 1 (run start —
   * before any picker has resolved) and shown as "Act 2" / "Act 3"
   * once the player has cleared the gordon / tour_bus gate.
   * No-op when the act hasn't changed.
   */
  /**
   * W66 Ironmoor: show/hide the single-life chip. Called once at run
   * start from GameScene after settings are read.
   */
  setIronmoor(active: boolean): void {
    if (!active) {
      this.ironmoorChipText.setVisible(false);
      return;
    }
    this.ironmoorChipText.setText(t('ui.hud.ironmoor_chip'));
    this.ironmoorChipText.setVisible(true);
  }

  /**
   * P2.12 — DAILY chip. Called once at run-start from GameScene when
   * `runIsDaily` is true; persistent for the whole run as a reminder
   * the player is on the daily attempt (parity with the menu badge).
   */
  setDaily(active: boolean, seedCode?: string): void {
    if (!active) {
      this.dailyChipText.setVisible(false);
      return;
    }
    this.dailyChipText.setText(t('ui.hud.daily_chip', { seed: seedCode ?? '' }));
    this.dailyChipText.setVisible(true);
  }

  /**
   * T1 replay — toggles the persistent REPLAY chip in the HUD's top-left.
   * Shown for the whole playback run so the player doesn't forget which
   * mode they're in (the watching-toast is transient).
   */
  setReplayMode(active: boolean): void {
    if (!active) {
      this.replayChipText.setVisible(false);
      return;
    }
    this.replayChipText.setText(t('ui.replay.hud_chip'));
    this.replayChipText.setVisible(true);
  }

  setAct(currentAct: 1 | 2 | 3): void {
    if (currentAct === this.prevAct) return;
    this.prevAct = currentAct;
    if (currentAct === 1) {
      this.actChipText.setVisible(false);
      return;
    }
    this.actChipText.setText(t('ui.hud.act_chip', { act: currentAct }));
    this.actChipText.setVisible(true);
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
      this.lastDisplayedDps = dps;
      this.dpsText.setText(t('ui.hud.dps_line', { dps }));
      this.damageLog = [];
      this.damageWindow = 0;
    }
  }

  /** Rolling 1s DPS shown bottom-left — 0 until the first full window elapses. */
  getLastDisplayedDps(): number {
    return this.lastDisplayedDps;
  }

  setOnPause(callback: () => void): void {
    this.onPause = callback;
  }

  destroy(): void {
    for (const el of this.elements) {
      this.scene.tweens.killTweensOf(el);
      el.destroy();
    }
    this.elements = [];
  }
}
