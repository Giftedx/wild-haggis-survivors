import Phaser from 'phaser';
import { COLORS } from '../config';
import { SaveManager } from '../core/SaveManager';
import { getSettingsManager } from '../core/SettingsManager';
import { t } from '../core/i18n';
import { GamepadMenuNav, type GamepadMenuEntry } from '../utils/GamepadMenuNav';
import { DEFAULT_VARIANT_KEY, getVariantByKey } from '../data/variants';
import { audio } from '../systems/AudioSystem';
import { loadSave } from '../utils/save';
import { formatMenuHistorySummary, formatMenuStatsStrip } from './menuStatsStrip';
import { resolveMainMenuPalette } from './mainMenuPalette';
import { addSceneBackdrop } from './sceneFade';
import { resolveSeedLinkStyle } from './seedLinkStyle';
import { resolveMenuFooterPalette } from './menuFooterPalette';
import {
  MAIN_MENU_ABANDON_PALETTE,
  MAIN_MENU_DAILY_PALETTE,
  MAIN_MENU_META_PALETTE,
  MAIN_MENU_CHRONICLE_PALETTE,
  MAIN_MENU_DEEDS_PALETTE,
  MAIN_MENU_OPTIONS_PALETTE,
} from './mainMenuButtonPalettes';
import { MAIN_MENU_HEARTH } from './mainMenuHearthPalette';
import {
  currentDailyDateKey,
  dailyChallengeSeed,
  encodeSeed,
  parseSeedInput,
} from '../utils/rng';
import type { GameSceneInitData } from './GameScene';
import { getCameraViewport } from '../ui/cameraViewport';
import { resolveDailyStateDisplay } from './dailyMenuState';
import { findLastSeededRun } from '../ui/chronicleAggregates';
import { TWEEN_INFINITE_BREATHE } from '../utils/tweenPresets';
import { attachButtonHoverFill } from '../ui/buttonHover';
import { brightenColor } from '../utils/brightenColor';
import { clickToScene } from './clickToScene';

/**
 * Entry hub after boot: shows persistent meta stats and routes into loadout (Menu).
 *
 * Cozy redesign (Phase 6 Tier B):
 *  - Parallax mountain silhouettes behind the title
 *  - Scattered heather sprites on the ground level
 *  - Slow ambient enemy drift (dim silhouettes) in the lower third
 *  - Sleeping haggis mascot above the title with a gentle sway tween
 *  - Title bob tween
 *  - Small animated campfire detail below the buttons
 *  - Compressed button cluster to close the dead vertical space
 *  - Bottom credit strip: version + "built on the moor"
 *
 * All decoration respects `reduceParticles`, `uiScale`, and `highContrastUi`.
 * Gamepad nav is unchanged (3 or 4 entries depending on suspended run).
 */
export class MainMenuScene extends Phaser.Scene {
  private saveManager = new SaveManager();
  private gamepadNav: GamepadMenuNav | null = null;
  /** All tweens attached to decoration — killed on scene shutdown. */
  private cozyTweenTargets: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const { width, height } = this.scale;
    const vp = getCameraViewport(this);
    const cx = vp.x + vp.width / 2;
    const uiTop = vp.y;
    const uiBottom = vp.y + vp.height;
    const meta = this.saveManager.load();
    const gameplay = loadSave();
    const settings = getSettingsManager().load();
    const { uiScale, highContrastUi, reduceParticles } = settings;
    this.cozyTweenTargets = [];

    const palette = resolveMainMenuPalette(highContrastUi);
    const titleColor = palette.title;
    const subduedColor = palette.subdued;
    const hintColor = palette.hint;
    const mountainDark = palette.mountainDark;
    const mountainLight = palette.mountainLight;

    // === Background — depth -100 so negative-depth decoration layers are
    // visible in front of it. The canvas also has a dark bg from main.ts,
    // so this is belt-and-braces but ensures consistent color.
    addSceneBackdrop(this, -100);

    // === Layer -10: distant mountain ridge ===
    // Two passes of triangles for depth — back ridge further, front ridge lower.
    const mtGfx = this.add.graphics().setDepth(-10);
    const horizonY = height * 0.62; // full-canvas art — keeps moor edge-to-edge
    const rng = new Phaser.Math.RandomDataGenerator(['menu_mountains']);
    // Back ridge (darker, smaller triangles)
    mtGfx.fillStyle(mountainDark, 0.85);
    for (let i = 0; i < 16; i++) {
      const mx = (i / 15) * width + rng.between(-20, 20);
      const mh = rng.between(60, 140);
      const mw = rng.between(180, 320);
      mtGfx.fillTriangle(mx - mw / 2, horizonY, mx, horizonY - mh, mx + mw / 2, horizonY);
    }
    // Front ridge (lighter, larger, lower)
    mtGfx.fillStyle(mountainLight, 0.8);
    for (let i = 0; i < 12; i++) {
      const mx = (i / 11) * width + rng.between(-30, 30);
      const mh = rng.between(40, 90);
      const mw = rng.between(160, 300);
      mtGfx.fillTriangle(mx - mw / 2, horizonY + 30, mx, horizonY + 30 - mh, mx + mw / 2, horizonY + 30);
    }

    // === Layer -8: heather scatter in the foreground ===
    const heatherRng = new Phaser.Math.RandomDataGenerator(['menu_heather']);
    for (let i = 0; i < 28; i++) {
      const hx = heatherRng.between(10, width - 10);
      const hy = heatherRng.between(Math.floor(horizonY + 40), height - 20);
      const heather = this.add
        .image(hx, hy, 'deco_heather')
        .setDepth(-8)
        .setAlpha(heatherRng.realInRange(0.28, 0.55))
        .setScale(heatherRng.realInRange(0.6, 1.1))
        .setFlipX(heatherRng.frac() > 0.5);
      // Very subtle breeze sway, reduced-particles OFF only
      if (!reduceParticles) {
        this.tweens.add({
          targets: heather,
          angle: heatherRng.realInRange(-4, 4),
          duration: heatherRng.between(3200, 5600),
          ...TWEEN_INFINITE_BREATHE,
        });
        this.cozyTweenTargets.push(heather);
      }
    }

    // === Layer -6: drifting mist bands ===
    if (!reduceParticles) {
      for (let i = 0; i < 8; i++) {
        const mx = heatherRng.between(0, width);
        const my = heatherRng.between(Math.floor(horizonY - 10), Math.floor(horizonY + 40));
        const mist = this.add.ellipse(
          mx, my,
          heatherRng.between(120, 220),
          heatherRng.between(18, 32),
          0xccddee,
          heatherRng.realInRange(0.04, 0.09)
        ).setDepth(-6);
        this.tweens.add({
          targets: mist,
          x: mx + heatherRng.between(80, 220) * (heatherRng.frac() > 0.5 ? 1 : -1),
          alpha: mist.alpha * 0.4,
          duration: heatherRng.between(9000, 15000),
          ...TWEEN_INFINITE_BREATHE,
        });
        this.cozyTweenTargets.push(mist);
      }
    }

    // === Layer -5: ambient enemy silhouettes drifting across ===
    // Lifted from MenuScene pattern. Respects reduceParticles.
    if (!reduceParticles) {
      const enemyTextures = ['tourist', 'chef', 'midge', 'highland_cow', 'eagle', 'sheep'];
      for (let i = 0; i < 6; i++) {
        const tex = enemyTextures[i % enemyTextures.length];
        const ey = Phaser.Math.Between(Math.floor(horizonY + 20), height - 30);
        const sprite = this.add
          .sprite(-30, ey, tex)
          .setAlpha(0.07)
          .setScale(1.2)
          .setDepth(-5);
        this.tweens.add({
          targets: sprite,
          x: width + 30,
          duration: Phaser.Math.Between(9000, 14500),
          delay: i * 1500,
          repeat: -1,
          onRepeat: () => {
            sprite.setY(Phaser.Math.Between(Math.floor(horizonY + 20), height - 30));
          },
        });
        this.cozyTweenTargets.push(sprite);
      }
    }

    // === Layer -1: Sleeping haggis mascot above the title ===
    // Faces the player with wide eyes — the game's emotional center, resting
    // between runs. Gentle sway tween (skipped on reduceParticles).
    const mascotTexture = getVariantByKey(DEFAULT_VARIANT_KEY).textureKey;
    const mascot = this.add
      .sprite(cx, uiTop + 58, mascotTexture)
      .setScale(2.4 * uiScale)
      .setDepth(-1);
    if (!reduceParticles) {
      this.tweens.add({
        targets: mascot,
        y: mascot.y + 4,
        duration: 1800,
        ...TWEEN_INFINITE_BREATHE,
      });
      this.tweens.add({
        targets: mascot,
        angle: { from: -3, to: 3 },
        duration: 2600,
        ...TWEEN_INFINITE_BREATHE,
      });
      this.cozyTweenTargets.push(mascot);
    }

    // === Title (bigger, bobs) ===
    const titleY = uiTop + 116;
    const titleText = this.add
      .text(cx, titleY, t('ui.menu.title'), {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: titleColor,
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    titleText.setScale(uiScale);
    if (!reduceParticles) {
      this.tweens.add({
        targets: titleText,
        y: titleY + 2,
        duration: 2400,
        ...TWEEN_INFINITE_BREATHE,
      });
      this.cozyTweenTargets.push(titleText);
    }

    // Warmer zero-state on a fresh save: "The glen stirs — yir first run awaits."
    // instead of "The glen remembers: 0 lifetime culls".
    const killCreditCopy = meta.totalKills > 0
      ? t('ui.menu.kill_credits', { count: meta.totalKills })
      : t('ui.menu.kill_credits_fresh');
    const killCreditText = this.add
      .text(cx, titleY + 88, killCreditCopy, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: subduedColor,
      })
      .setOrigin(0.5);
    killCreditText.setScale(uiScale);

    const suspended = meta.activeRun != null;

    // First-ever visit (no kills yet and no suspended run) — surface the
    // Comfort panel so players discover motion / caption / readability
    // controls before they need them. After the first run the glen
    // remembers, so we stop nagging.
    const isFirstEverVisit = meta.totalKills === 0 && !suspended;
    const hintCopy = suspended
      ? t('ui.menu.hint_suspended')
      : isFirstEverVisit
        ? t('ui.menu.hint_fresh_with_comfort')
        : t('ui.menu.hint_fresh');

    const hintText = this.add
      .text(
        cx,
        titleY + 128,
        hintCopy,
        {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: hintColor,
          align: 'center',
          wordWrap: { width: Math.max(120, vp.width - 80) },
        }
      )
      .setOrigin(0.5);
    hintText.setScale(uiScale);

    // === Button cluster — tightened and pulled up ===
    // Previous layout had ~176px of dead space between the hint and the
    // first button. We now anchor the cluster to sit just below the hint
    // (with a ~60px cushion) and keep it compact.
    const btnW = 240;
    const btnH = 48;
    const bx = cx;
    const startY = titleY + 128 + 60;
    let metaY = startY + btnH + 14;
    let abandonBtn: Phaser.GameObjects.Rectangle | null = null;
    let goLoadoutFresh: (() => void) | null = null;

    const startBtn = this.add
      .rectangle(bx, startY, btnW, btnH, COLORS.SCOTTISH_BLUE, 1)
      .setInteractive({ useHandCursor: true });
    startBtn.setScale(uiScale);
    const startTxt = this.add
      .text(bx, startY, suspended ? t('ui.menu.resume_run') : t('ui.menu.start_run'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    startTxt.setScale(uiScale);

    const goPrimary = () => {
      if (suspended) {
        this.scene.start('Game');
      } else {
        this.scene.start('Menu');
      }
    };

    attachButtonHoverFill(startBtn, COLORS.SCOTTISH_BLUE, brightenColor(COLORS.SCOTTISH_BLUE, 18));
    startBtn.on('pointerdown', goPrimary);

    startTxt.setInteractive({ useHandCursor: true });
    startTxt.on('pointerdown', goPrimary);

    if (suspended) {
      const newY = startY + btnH + 10;
      metaY = newY + btnH + 14;
      goLoadoutFresh = () => {
        this.saveManager.clearActiveRun();
        this.scene.start('Menu');
      };
      abandonBtn = this.add
        .rectangle(bx, newY, btnW, 42, MAIN_MENU_ABANDON_PALETTE.idle, 1)
        .setInteractive({ useHandCursor: true });
      abandonBtn.setScale(uiScale);
      const abandonTxt = this.add
        .text(bx, newY, t('ui.menu.new_run_loadout'), {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#e0e4ee',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      abandonTxt.setScale(uiScale);
      attachButtonHoverFill(abandonBtn, MAIN_MENU_ABANDON_PALETTE.idle, MAIN_MENU_ABANDON_PALETTE.hover);
      abandonBtn.on('pointerdown', goLoadoutFresh);
      abandonTxt.setInteractive({ useHandCursor: true });
      abandonTxt.on('pointerdown', goLoadoutFresh);
    }

    // === Daily Challenge ===
    // Slotted between the primary start action and the meta shop. Shows a
    // one-line state readout (seed code + today's attempt/clear status) so
    // players can tell at a glance whether they've engaged with today's
    // challenge. Launches a seeded run that skips the loadout picker —
    // daily rules mean everyone gets the same variant.
    const dailyBtnY = metaY;
    const dailyBtn = this.add
      .rectangle(bx, dailyBtnY, btnW, btnH, MAIN_MENU_DAILY_PALETTE.idle, 1)
      .setInteractive({ useHandCursor: true });
    dailyBtn.setScale(uiScale);
    const dailySeed = dailyChallengeSeed();
    const daily = resolveDailyStateDisplay({
      todayKey: currentDailyDateKey(),
      seed: dailySeed,
      seedCode: encodeSeed(dailySeed),
      recorded: meta.dailyChallenge,
    });
    const dailyTitle = this.add
      .text(bx, dailyBtnY - 8, t('ui.menu.daily_challenge'), {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#fff3d1',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    dailyTitle.setScale(uiScale);
    const dailySubtitle = this.add
      .text(bx, dailyBtnY + 10, daily.subtitle, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: daily.completed ? '#9de6a8' : '#e2c97a',
      })
      .setOrigin(0.5);
    dailySubtitle.setScale(uiScale);
    attachButtonHoverFill(dailyBtn, MAIN_MENU_DAILY_PALETTE.idle, MAIN_MENU_DAILY_PALETTE.hover);
    const startDaily = () => this.startSeededRun(daily.seed, { isDaily: true });
    dailyBtn.on('pointerdown', startDaily);
    dailyTitle.setInteractive({ useHandCursor: true });
    dailyTitle.on('pointerdown', startDaily);
    dailySubtitle.setInteractive({ useHandCursor: true });
    dailySubtitle.on('pointerdown', startDaily);

    const metaY2 = dailyBtnY + btnH + 14;
    const metaBtn = this.add
      .rectangle(bx, metaY2, btnW, btnH, MAIN_MENU_META_PALETTE.idle, 1)
      .setInteractive({ useHandCursor: true });
    metaBtn.setScale(uiScale);
    const metaTxt = this.add
      .text(bx, metaY2, t('ui.menu.meta_upgrades'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    metaTxt.setScale(uiScale);
    attachButtonHoverFill(metaBtn, MAIN_MENU_META_PALETTE.idle, MAIN_MENU_META_PALETTE.hover);
    metaBtn.on('pointerdown', () => {
      this.scene.start('MetaShop');
    });
    metaTxt.setInteractive({ useHandCursor: true });
    metaTxt.on('pointerdown', () => {
      this.scene.start('MetaShop');
    });

    // === Reflection row: Chronicle + Deeds (side-by-side) ===
    // Two meta-reflection surfaces laid out horizontally to keep the menu
    // compact. Chronicle = runs journal; Deeds = achievements. Both hidden
    // on fresh saves so the first-run player sees only the core ladder.
    const hasAnyRun = gameplay.totalRuns > 0;
    const reflectionY = metaY2 + btnH + 14;
    const reflectionGap = 12;
    const halfBtnW = (btnW - reflectionGap) / 2;
    let chronicleBtn: Phaser.GameObjects.Rectangle | null = null;
    let deedsBtn: Phaser.GameObjects.Rectangle | null = null;
    const goChronicle = clickToScene(this, 'Chronicle');
    const goDeeds = clickToScene(this, 'Deeds');
    if (hasAnyRun) {
      // Chronicle (left) — centers align to full btnW with an exact 12px gap (was off by 3px).
      const chronicleX = bx - reflectionGap / 2 - halfBtnW / 2;
      chronicleBtn = this.add
        .rectangle(chronicleX, reflectionY, halfBtnW, 42, MAIN_MENU_CHRONICLE_PALETTE.idle, 1)
        .setInteractive({ useHandCursor: true });
      chronicleBtn.setScale(uiScale);
      const chronicleTxt = this.add
        .text(chronicleX, reflectionY, t('ui.menu.chronicle'), {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#e8d4a0',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: Math.max(72, halfBtnW - 16) },
        })
        .setOrigin(0.5, 0.5);
      chronicleTxt.setScale(uiScale);
      attachButtonHoverFill(chronicleBtn, MAIN_MENU_CHRONICLE_PALETTE.idle, MAIN_MENU_CHRONICLE_PALETTE.hover);
      chronicleBtn.on('pointerdown', goChronicle);
      chronicleTxt.setInteractive({ useHandCursor: true });
      chronicleTxt.on('pointerdown', goChronicle);

      // Deeds (right)
      const deedsX = bx + reflectionGap / 2 + halfBtnW / 2;
      deedsBtn = this.add
        .rectangle(deedsX, reflectionY, halfBtnW, 42, MAIN_MENU_DEEDS_PALETTE.idle, 1)
        .setInteractive({ useHandCursor: true });
      deedsBtn.setScale(uiScale);
      const deedsTxt = this.add
        .text(deedsX, reflectionY, t('ui.menu.deeds'), {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#f5e1a6',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: Math.max(72, halfBtnW - 16) },
        })
        .setOrigin(0.5, 0.5);
      deedsTxt.setScale(uiScale);
      attachButtonHoverFill(deedsBtn, MAIN_MENU_DEEDS_PALETTE.idle, MAIN_MENU_DEEDS_PALETTE.hover);
      deedsBtn.on('pointerdown', goDeeds);
      deedsTxt.setInteractive({ useHandCursor: true });
      deedsTxt.on('pointerdown', goDeeds);
    }

    const optY = (hasAnyRun ? reflectionY + 42 : metaY2 + btnH) + 14;
    const optBtn = this.add
      .rectangle(bx, optY, btnW, 42, MAIN_MENU_OPTIONS_PALETTE.idle, 1)
      .setInteractive({ useHandCursor: true });
    optBtn.setScale(uiScale);
    const optTxt = this.add
      .text(bx, optY, t('ui.menu.options'), {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    optTxt.setScale(uiScale);
    attachButtonHoverFill(optBtn, MAIN_MENU_OPTIONS_PALETTE.idle, MAIN_MENU_OPTIONS_PALETTE.hover);
    optBtn.on('pointerdown', () => {
      this.scene.start('Settings');
    });
    optTxt.setInteractive({ useHandCursor: true });
    optTxt.on('pointerdown', () => {
      this.scene.start('Settings');
    });

    // === Custom seed link ===
    // Secondary text-only affordance. Prompts the user for a 7-char share
    // code (or raw integer) and launches a seeded run. Uses window.prompt
    // for cross-platform simplicity — a full in-game keyboard overlay is
    // future work if mobile UX feedback demands it.
    const customSeedY = optY + 42 + 16;
    const seedLinkStyle = resolveSeedLinkStyle(highContrastUi, titleColor);
    const customSeedTxt = this.add
      .text(bx, customSeedY, t('ui.menu.enter_seed'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: seedLinkStyle.idle.color,
        fontStyle: 'italic',
        stroke: seedLinkStyle.idle.stroke,
        strokeThickness: seedLinkStyle.idle.strokeThickness,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    customSeedTxt.setScale(uiScale);
    customSeedTxt.on('pointerover', () => {
      customSeedTxt.setColor(seedLinkStyle.hover.color);
      customSeedTxt.setStroke(seedLinkStyle.hover.stroke, seedLinkStyle.hover.strokeThickness);
    });
    customSeedTxt.on('pointerout', () => {
      customSeedTxt.setColor(seedLinkStyle.idle.color);
      customSeedTxt.setStroke(seedLinkStyle.idle.stroke, seedLinkStyle.idle.strokeThickness);
    });
    customSeedTxt.on('pointerdown', () => this.promptCustomSeed());

    // === Rerun last seed link ===
    // One-tap shortcut to rerun the most recent history entry's seed +
    // variant. Hidden when history has no seeded entries (legacy saves
    // or fresh installs).
    const lastRunEntry = findLastSeededRun(gameplay.runHistory);
    if (lastRunEntry) {
      const rerunLastY = customSeedY + 22;
      const rerunTxt = this.add
        .text(bx, rerunLastY, t('ui.menu.rerun_last'), {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: seedLinkStyle.idle.color,
          fontStyle: 'italic',
          stroke: seedLinkStyle.idle.stroke,
          strokeThickness: seedLinkStyle.idle.strokeThickness,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      rerunTxt.setScale(uiScale);
      rerunTxt.on('pointerover', () => {
        rerunTxt.setColor(seedLinkStyle.hover.color);
        rerunTxt.setStroke(seedLinkStyle.hover.stroke, seedLinkStyle.hover.strokeThickness);
      });
      rerunTxt.on('pointerout', () => {
        rerunTxt.setColor(seedLinkStyle.idle.color);
        rerunTxt.setStroke(seedLinkStyle.idle.stroke, seedLinkStyle.idle.strokeThickness);
      });
      rerunTxt.on('pointerdown', () => {
        this.saveManager.clearActiveRun();
        this.scene.start('Game', {
          seed: lastRunEntry.runSeed,
          forceVariantKey: lastRunEntry.variantKey,
        });
      });
    }

    // === Campfire hearth anchor below the buttons ===
    // A tiny "glow" of three concentric ellipses pulsing gently, with a soft
    // orange cone above them. Visually anchors the button cluster as a
    // "sitting around the fire" moment. Skipped in reduceParticles.
    if (!reduceParticles) {
      const fireX = cx;
      // Slightly higher + warmer core so it reads as hearth embers, not an XP orb pickup.
      const fireY = optY + 52;
      const fireBase = this.add
        .ellipse(fireX, fireY + 6, 40, 8, MAIN_MENU_HEARTH.base, MAIN_MENU_HEARTH.baseAlpha)
        .setDepth(-1);
      const fireGlowOuter = this.add
        .ellipse(fireX, fireY, 38, 16, MAIN_MENU_HEARTH.glowOuter, MAIN_MENU_HEARTH.glowOuterAlpha)
        .setDepth(-1);
      const fireGlowInner = this.add
        .ellipse(fireX, fireY - 2, 22, 12, MAIN_MENU_HEARTH.glowInner, MAIN_MENU_HEARTH.glowInnerAlpha)
        .setDepth(-1);
      const fireCore = this.add
        .ellipse(fireX, fireY - 4, 8, 6, MAIN_MENU_HEARTH.core, MAIN_MENU_HEARTH.coreAlpha)
        .setDepth(-1);
      // ── Layered smoke wisps (multiple, staggered, drifting) ──
      const smokeWisps: Phaser.GameObjects.Ellipse[] = [];
      for (let si = 0; si < 3; si++) {
        const wisp = this.add
          .ellipse(fireX + (si - 1) * 4, fireY - 14, 12 + si * 4, 5 + si, MAIN_MENU_HEARTH.smoke, 0.12 - si * 0.02)
          .setDepth(-2);
        smokeWisps.push(wisp);
        this.tweens.add({
          targets: wisp,
          y: fireY - 40 - si * 8,
          x: fireX + Phaser.Math.Between(-8, 8),
          alpha: 0,
          scaleX: 1.3 + si * 0.2,
          duration: 2200 + si * 600,
          delay: si * 700,
          repeat: -1,
          onRepeat: () => {
            wisp.setPosition(fireX + Phaser.Math.Between(-3, 3), fireY - 14);
            wisp.setAlpha(0.12 - si * 0.02);
            wisp.setScale(1);
          },
        });
      }
      // ── Rising ember particles (tiny orange dots drifting up) ──
      const embers: Phaser.GameObjects.Arc[] = [];
      for (let ei = 0; ei < 4; ei++) {
        const ember = this.add
          .circle(fireX, fireY - 6, 1.5, MAIN_MENU_HEARTH.ember, MAIN_MENU_HEARTH.emberAlpha)
          .setDepth(-1);
        embers.push(ember);
        this.tweens.add({
          targets: ember,
          y: fireY - 28 - ei * 6,
          x: fireX + Phaser.Math.Between(-12, 12),
          alpha: 0,
          duration: 1200 + ei * 300,
          delay: ei * 400,
          repeat: -1,
          onRepeat: () => {
            ember.setPosition(fireX + Phaser.Math.Between(-6, 6), fireY - 6);
            ember.setAlpha(0.6 + Math.random() * 0.3);
          },
        });
      }
      // ── Pulsing flicker (fire breathes) ──
      this.tweens.add({
        targets: [fireGlowOuter, fireGlowInner, fireCore],
        alpha: { from: 0.55, to: 0.95 },
        duration: 520,
        ...TWEEN_INFINITE_BREATHE,
      });
      this.tweens.add({
        targets: [fireGlowOuter, fireGlowInner, fireCore],
        scaleX: { from: 0.92, to: 1.08 },
        scaleY: { from: 0.96, to: 1.04 },
        duration: 720,
        ...TWEEN_INFINITE_BREATHE,
      });
      // ── Warm ground glow (fire lights the ground around it) ──
      const groundGlow = this.add
        .ellipse(fireX, fireY + 10, 60, 12, 0xff6a10, 0.08)
        .setDepth(-2);
      this.tweens.add({
        targets: groundGlow,
        alpha: { from: 0.06, to: 0.12 },
        scaleX: { from: 0.95, to: 1.05 },
        duration: 600,
        ...TWEEN_INFINITE_BREATHE,
      });
      this.cozyTweenTargets.push(fireBase, fireGlowOuter, fireGlowInner, fireCore, groundGlow, ...smokeWisps, ...embers);
    }

    // === Stats summary for returning players ===
    // Two lines: existing bests strip + richer history summary with win rate
    // and trend. Warm, subdued — progress, not a scoreboard.
    if (gameplay.totalRuns > 0) {
      // MainMenu always shows the short strip (the full home page never has
      // room for the long variant regardless of viewport).
      const statsLine = formatMenuStatsStrip({
        bestTime: gameplay.bestTime,
        bestKills: gameplay.bestKills,
        bestCombo: gameplay.bestCombo,
        totalRuns: gameplay.totalRuns,
        victories: gameplay.victories,
        gold: gameplay.gold,
        viewWidth: 0, // < 1150 threshold → always picks the short variant
      });
      const footerPalette = resolveMenuFooterPalette(highContrastUi);
      this.add
        .text(cx, uiBottom - 58, statsLine, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: footerPalette.statsStrip,
          align: 'center',
          wordWrap: { width: Math.max(160, vp.width - 48) },
        })
        .setOrigin(0.5, 1)
        .setScale(uiScale);

      const runHistory = gameplay.runHistory;
      const historyLine = formatMenuHistorySummary(runHistory, gameplay.totalRuns);
      if (historyLine) {
        this.add
          .text(cx, uiBottom - 40, historyLine, {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: footerPalette.historyStrip,
            fontStyle: 'italic',
            align: 'center',
            wordWrap: { width: Math.max(160, vp.width - 48) },
          })
          .setOrigin(0.5, 1)
          .setScale(uiScale);
      }
    }

    // === Bottom credit strip (inside visible viewport / safe area) ===
    const footerPalette = resolveMenuFooterPalette(highContrastUi);
    const creditX = vp.x + vp.width - Math.max(10, 14 * uiScale);
    const creditBuilt = this.add
      .text(creditX, uiBottom - 28, t('ui.menu.built_on_moor'), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: footerPalette.creditText,
        fontStyle: 'italic',
      })
      .setOrigin(1, 1)
      .setScale(uiScale);
    const creditVer = this.add
      .text(creditX, uiBottom - 12, `v${__APP_VERSION__}`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: footerPalette.creditText,
      })
      .setOrigin(1, 1)
      .setScale(uiScale);
    if (footerPalette.creditStroke) {
      creditBuilt.setStroke(footerPalette.creditStroke.color, footerPalette.creditStroke.thickness);
      creditVer.setStroke(footerPalette.creditStroke.color, footerPalette.creditStroke.thickness);
    }

    // Ambient moor wind — cozy between storms
    if (!reduceParticles) audio.startAmbientWind();

    // === Gamepad navigation wiring ===
    // Daily Challenge sits between Start and Meta Upgrades in focus order so
    // a player with a controller can land on it without cycling through the
    // whole menu.
    const entries: GamepadMenuEntry[] = [{ rect: startBtn, activate: goPrimary }];
    if (abandonBtn && goLoadoutFresh) entries.push({ rect: abandonBtn, activate: goLoadoutFresh });
    entries.push(
      { rect: dailyBtn, activate: startDaily },
      { rect: metaBtn, activate: () => this.scene.start('MetaShop') },
    );
    if (chronicleBtn) entries.push({ rect: chronicleBtn, activate: goChronicle });
    if (deedsBtn) entries.push({ rect: deedsBtn, activate: goDeeds });
    entries.push({ rect: optBtn, activate: () => this.scene.start('Settings') });
    this.gamepadNav = new GamepadMenuNav(this, entries);
    this.events.once('shutdown', () => {
      audio.stopAmbientWind();
      // Kill every decoration tween so they don't leak across scene restarts.
      for (const target of this.cozyTweenTargets) {
        try { this.tweens.killTweensOf(target); } catch { /* ignore */ }
      }
      this.cozyTweenTargets = [];
      try { this.tweens.killAll(); } catch { /* ignore */ }
      this.gamepadNav?.destroy();
      this.gamepadNav = null;
    });
  }

  /**
   * Prompt for a seed share code (or raw integer) and launch a run with it.
   * Invalid input shows a best-effort message and no-ops. Uses the native
   * browser prompt so we don't need a full in-game keyboard overlay — seed
   * entry is an advanced feature; the Daily button is the main path.
   */
  private promptCustomSeed(): void {
    if (typeof window === 'undefined') return;
    const raw = window.prompt(t('ui.menu.seed_prompt'));
    if (raw == null) return; // user cancelled
    const seed = parseSeedInput(raw);
    if (seed == null) {
      if (typeof window.alert === 'function') {
        window.alert(t('ui.menu.seed_invalid'));
      }
      return;
    }
    this.startSeededRun(seed, { isDaily: false });
  }

  /** Launch GameScene with a specific seed, bypassing the loadout picker. */
  private startSeededRun(seed: number, opts: { isDaily: boolean }): void {
    // Clear any suspended run — a seeded start shouldn't collide with an
    // in-flight normal run's resume payload, and the player's persisted
    // variant choice is preserved (overridden per-run via init data).
    this.saveManager.clearActiveRun();
    const data: GameSceneInitData = {
      seed,
      isDaily: opts.isDaily,
      forceVariantKey: DEFAULT_VARIANT_KEY,
    };
    this.scene.start('Game', data);
  }
}
