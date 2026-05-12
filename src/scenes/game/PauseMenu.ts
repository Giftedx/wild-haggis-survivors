/**
 * PauseMenu — builds and tears down the in-run pause overlay.
 *
 * Owns the backdrop, Scots quip, stats block (time, kills, loadout, optional
 * gold + streak), resume + key hint, sfx/music toggles, passive summary,
 * and quit button. Exactly the UI that used to
 * live in GameScene.toggleUiPause — extracted so GameScene stops carrying
 * ~140 lines of widget construction.
 *
 * Does NOT own the timeScale lock (timeManager handles that) or the
 * deferred-chest drain (GameScene keeps ownership of gameplay state).
 * This module is strictly display-object construction + teardown.
 *
 * T407 — Row focus: keyboard (↑↓ / Tab / Enter / 1–8) and gamepad (D-pad /
 * stick + confirm) mirror the DOM focus layer; gold stroke on buttons,
 * gold text tint on SFX/Music toggles, pointer-hover syncs the index.
 */
import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../../config';
import type { GameScene } from '../GameScene';
import { t } from '../../core/i18n';
import { applyAudioFromUserSettings } from '../../core/applyAudioFromSettings';
import { getSettingsManager } from '../../core/SettingsManager';
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';
import { ELITE_AFFIX_DISPLAY_ORDER } from '../../data/eliteAffixes';
import { buildPauseStatsLines } from './pauseStats';
import {
  resolvePauseMenuStyle,
  resolvePauseCurseLineColor,
  resolvePauseEliteRefColor,
} from './pauseMenuStyle';
import { resolveToggleTextColor } from '../toggleTextPalette';
import { createGameButton, resolveTierBorder, type ButtonTier } from '../../ui/gameButton';
import { textStyle } from '../../ui/typography';
import { audio } from '../../systems/AudioSystem';
import { saveScreenshot } from '../../utils/screenshot';
import { buildCaptureFilename } from '../../utils/captureFilename';
import { formatLocalYmd } from '../../utils/formatDate';
import { TOAST_COLORS } from '../../ui/toastPalette';
import { ClipRecorder } from '../../utils/clipRecorder';
import { createDomFocusLayer, type DomFocusAction, type DomFocusLayer } from '../../ui/domFocusLayer';
import { buildPauseMenuDomFocusActions } from './pauseMenuDomFocusActions';
import {
  firstEnabledModalFocusIndex,
  moveModalFocusIndex,
  type ModalFocusEntry,
} from '../../ui/modalFocus';

const PAUSE_FOCUS_STROKE_COLOR = 0xffe080;

/** One row in the pause overlay focus ring + activation stack. */
interface PauseFocusEntry extends ModalFocusEntry {
  readonly kind: 'rect' | 'text';
  readonly rect?: Phaser.GameObjects.Rectangle;
  readonly text?: Phaser.GameObjects.Text;
  readonly tier?: ButtonTier;
  readonly highContrast?: boolean;
  /** For `text` rows — re-read idle colour after toggles (SFX/Music). */
  readonly getIdleTextColor?: () => string;
  readonly activate: () => void;
}

export interface PauseMenuHooks {
  getUiViewport(): { x: number; y: number; width: number; height: number; zoom: number };
  getGameTimeSec(): number;
  getKillCount(): number;
  getLevel(): number;
  getEquippedWeaponCount(): number;
  getOwnedPassives(): readonly string[];
  /** Same copy as the in-run curse chip (`ui.hud.curse_chip`); null if no curse. */
  getActiveCurseLine?: () => string | null;
  /** Coin pickups + kill milestones + overflow gold this run (GameScene). */
  getRunGoldEarned?: () => number;
  /** Kill-combo chain vs best — from JuiceSystem. */
  getKillStreakStats?: () => { current: number; best: number };
  /** Rolling HUD DPS (1s window, same as bottom-left). */
  getLastHudDps?: () => number;
  /** Sum of weapon damage tracked this run (RunStatsTracker). */
  getRunDamageDealt?: () => number;
  /** T402 — Moor Road act, 1-3. Omitted hide line on act 1 (default). */
  getCurrentAct?: () => 1 | 2 | 3;
  /** T402 — picker history this run, resolved to display labels. */
  getRouteLabels?: () => readonly string[];
  /** T402 — held relic display labels in slot order. */
  getRelicLabels?: () => readonly string[];
  /** T402 follow-up — variant display label (haggis pick), already i18n-resolved. */
  getVariantLabel?: () => string;
  /** T402 follow-up — owned rune display labels, already i18n-resolved. */
  getRuneLabels?: () => readonly string[];
  onResumeRequested(): void;
  onQuitRequested(): void;
  /**
   * R1 M3 T21 — Whisky Dram active-relic button. Returns true iff the
   * player is holding whisky_dram and hasn't drunk it yet this run.
   */
  isWhiskyDramAvailable?: () => boolean;
  /**
   * R1 M3 T21 — triggered by the "Use" button when the relic is held.
   * Scene side applies the heal + toast + SFX; menu just requests.
   */
  onWhiskyDramRequested?: () => void;

  /**
   * R1 M4.5 P5 — Fingal's Horn active-relic button. Returns true iff
   * the player holds fingals_horn and hasn't blown it yet this run.
   */
  isFingalsHornAvailable?: () => boolean;
  /**
   * R1 M4.5 P5 — triggered by the "Sound" button when the horn is
   * held. Scene summons 3 Fianna spirits + plays the SFX/toast.
   */
  onFingalsHornRequested?: () => void;
}

export class PauseMenu {
  private elements: Phaser.GameObjects.GameObject[] = [];
  private readonly settings = getSettingsManager();
  /** T407 — visually hidden DOM mirror for pause actions (screen readers / Tab). */
  private domFocusLayer: DomFocusLayer | null = null;
  /** T407 — keyboard/gamepad row focus (Phaser stroke + DOM sync). */
  private pauseFocusEntries: PauseFocusEntry[] = [];
  private focusedPauseIndex = -1;
  private pauseKeyHandler?: (e: KeyboardEvent) => void;
  private pauseGamepadUpdateHandler: (() => void) | null = null;
  private prevPausePadBack = false;
  private prevPausePadForward = false;
  private prevPausePadConfirm = false;

  constructor(private readonly scene: GameScene, private readonly hooks: PauseMenuHooks) {}

  isOpen(): boolean {
    return this.elements.length > 0;
  }

  open(): void {
    let refreshPauseDomActions: () => void = () => {};
    this.pauseFocusEntries = [];
    this.focusedPauseIndex = -1;
    const { x, y, width, height } = this.hooks.getUiViewport();
    const d = 250;
    const scene = this.scene;
    const prefs = this.settings.load();
    const hc = prefs.highContrastUi;
    const uiScale = prefs.uiScale;
    const style = resolvePauseMenuStyle(height, hc);
    const pushRectFocus = (
      rect: Phaser.GameObjects.Rectangle,
      tier: ButtonTier,
      activate: () => void,
    ): void => {
      const idx = this.pauseFocusEntries.length;
      this.pauseFocusEntries.push({
        kind: 'rect',
        rect,
        tier,
        highContrast: hc,
        activate,
      });
      rect.on('pointerover', () => {
        this.focusedPauseIndex = idx;
        this.applyPauseFocus();
      });
    };
    const pushTextFocus = (
      textObj: Phaser.GameObjects.Text,
      getIdleTextColor: () => string,
      activate: () => void,
    ): void => {
      const idx = this.pauseFocusEntries.length;
      this.pauseFocusEntries.push({
        kind: 'text',
        text: textObj,
        getIdleTextColor,
        activate,
      });
      textObj.on('pointerover', () => {
        this.focusedPauseIndex = idx;
        this.applyPauseFocus();
      });
    };
    this.elements.push(
      scene.add.rectangle(x + width / 2, y + height / 2, width, height, COLORS.BG_DARK, style.backdropAlpha)
        .setScrollFactor(0).setDepth(d).setInteractive()
    );
    this.elements.push(
      scene.add.text(x + width / 2, y + height * 0.18, t('ui.pause.title'),
        textStyle('heading', { fontSize: style.titlePx, color: style.titleColor }),
      ).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setScale(uiScale)
    );
    const runName = scene.getRunName?.() ?? '';
    if (runName) {
      this.elements.push(
        scene.add.text(x + width / 2, y + height * 0.22, t('ui.pause.name_header', { name: runName }),
          textStyle('subtitle', { fontSize: '14px', color: COLORS_CSS.STATUS_TAN }),
        ).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setScale(uiScale)
      );
    }
    const quipIndex = Phaser.Math.Between(1, 8);
    const quip = t(`ui.pause.quip_${quipIndex}`);
    this.elements.push(
      scene.add.text(x + width / 2, y + height * 0.26, quip,
        textStyle('subtitle', { fontSize: '14px', color: COLORS_CSS.STATUS_TAN }),
      ).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setScale(uiScale)
    );

    const statLines = buildPauseStatsLines({
      timeSec: this.hooks.getGameTimeSec(),
      killCount: this.hooks.getKillCount(),
      level: this.hooks.getLevel(),
      weaponCount: this.hooks.getEquippedWeaponCount(),
      passiveCount: this.hooks.getOwnedPassives().length,
      runGold: this.hooks.getRunGoldEarned?.(),
      dps: this.hooks.getLastHudDps?.(),
      dmgDealt: this.hooks.getRunDamageDealt?.(),
      streak: this.hooks.getKillStreakStats?.(),
      currentAct: this.hooks.getCurrentAct?.(),
      routeLabels: this.hooks.getRouteLabels?.(),
      relicLabels: this.hooks.getRelicLabels?.(),
      variantLabel: this.hooks.getVariantLabel?.(),
      runeLabels: this.hooks.getRuneLabels?.(),
    });
    this.elements.push(
      scene.add.text(x + width / 2, y + height * 0.34, statLines.join('\n'), {
        ...textStyle('body', { fontSize: '14px', color: COLORS_CSS.COOL_GREY, align: 'center' }),
        lineSpacing: 6,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setScale(uiScale)
    );

    const curseLine = this.hooks.getActiveCurseLine?.() ?? null;
    if (curseLine) {
      this.elements.push(
        scene.add.text(x + width / 2, y + height * 0.415, curseLine,
          textStyle('label', { color: resolvePauseCurseLineColor(hc), align: 'center' }),
        ).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setScale(uiScale)
      );
    }

    // R1 M3 T21 — Whisky Dram active-relic button. Shown only while the
    // relic is held + unused. Positioned just below the curse chip so it
    // reads as another run-scoped status affordance, not a settings toggle.
    // R1 M4.5 P5 — Fingal's Horn stacks beneath Whisky Dram when both
    // relics are held and unused.
    const activeSlotBaseY = y + height * (curseLine ? 0.445 : 0.415);
    let activeSlotIdx = 0;
    const renderActiveRelicButton = (
      label: string,
      onClick: () => void,
    ): void => {
      const btnY = activeSlotBaseY + activeSlotIdx * 48;
      activeSlotIdx++;
      const { rect, label: lbl } = createGameButton(scene, {
        x: x + width / 2, y: btnY, width: 240, height: 40,
        label, tier: 'secondary', fontSize: '16px', uiScale,
      });
      rect.setScrollFactor(0).setDepth(d + 1);
      lbl.setScrollFactor(0).setDepth(d + 2);
      const doRelic = (): void => {
        onClick();
        this.close();
        this.open();
      };
      rect.on('pointerdown', doRelic);
      pushRectFocus(rect, 'secondary', doRelic);
      this.elements.push(rect);
      this.elements.push(lbl);
    };
    if (this.hooks.isWhiskyDramAvailable?.() === true) {
      renderActiveRelicButton(
        t('ui.pause.whisky_dram_use'),
        () => this.hooks.onWhiskyDramRequested?.(),
      );
    }
    if (this.hooks.isFingalsHornAvailable?.() === true) {
      renderActiveRelicButton(
        t('ui.pause.fingals_horn_use'),
        () => this.hooks.onFingalsHornRequested?.(),
      );
    }

    // RESUME before the long elite-affix reference list so the button never covers traits text.
    const resumeY = y + height * 0.48;
    const { rect: resumeBtn, label: resumeLabel } = createGameButton(scene, {
      x: x + width / 2, y: resumeY, width: 220, height: 50,
      label: t('ui.pause.resume'), tier: 'primary', fontSize: '22px', uiScale,
    });
    resumeBtn.setScrollFactor(0).setDepth(d + 1);
    resumeBtn.on('pointerdown', () => this.hooks.onResumeRequested());
    pushRectFocus(resumeBtn, 'primary', () => this.hooks.onResumeRequested());
    resumeLabel.setScrollFactor(0).setDepth(d + 2);
    this.elements.push(resumeBtn);
    this.elements.push(resumeLabel);
    this.elements.push(
      scene.add.text(x + width / 2, resumeY + Math.round(30 * uiScale), t('ui.pause.keys_resume'),
        textStyle('small', { color: COLORS_CSS.TEXT_SUBTITLE }),
      ).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2).setScale(uiScale)
    );

    const passives = this.hooks.getOwnedPassives();
    // Bottom-anchored controls so END RUN / audio never clip off short viewports (mobile landscape, etc.).
    const quitY = y + height - 33;
    const captureEnabled = this.settings.load().captureEnabled;
    const clipRecorder = (scene as GameScene).getClipRecorder();
    const clipAvailable = captureEnabled && clipRecorder != null && clipRecorder.isAvailable();
    // Each capture button occupies 58px above Quit (50px button + 8px gap).
    const saveScreenshotY = captureEnabled ? quitY - 58 : null;
    const saveClipY = clipAvailable ? quitY - 116 : null;
    // audioY shifts up by the number of capture buttons present.
    const captureButtonCount = (captureEnabled ? 1 : 0) + (clipAvailable ? 1 : 0);
    const audioY = captureButtonCount > 0 ? quitY - 42 - captureButtonCount * 58 : quitY - 42;
    const passiveBottomY = passives.length > 0 ? audioY - 14 : null;
    const eliteRegionBottom = passiveBottomY !== null ? passiveBottomY : audioY - 10;
    // Below RESUME label + ESC/P hint — keeps elite reference block from crowding keys.
    const eliteMinY = resumeY + 52;
    const eliteMaxY = Math.max(eliteRegionBottom - 24, eliteMinY);
    let eliteAffixTop = Math.min(y + height * 0.56, eliteRegionBottom - 100);
    eliteAffixTop = Phaser.Math.Clamp(eliteAffixTop, eliteMinY, eliteMaxY);

    const eliteAffixLines = ELITE_AFFIX_DISPLAY_ORDER.map((id) => {
      const name = t(`ui.elite_affix.${id}.name`);
      const blurb = t(`ui.elite_affix.${id}.blurb`);
      return `${name} — ${blurb}`;
    });
    const maxEliteH = Math.max(40, eliteRegionBottom - eliteAffixTop - 4);
    const eliteText = scene.add.text(
      x + width / 2,
      eliteAffixTop,
      `${t('ui.pause.elite_affix_heading')}\n${eliteAffixLines.join('\n')}`,
      {
        ...textStyle('small', { fontSize: style.shortViewport ? '9px' : '10px', color: resolvePauseEliteRefColor(hc), align: 'center', wordWrap: { width: Math.max(200, (width - 56) / Math.max(1, uiScale)) } }),
        lineSpacing: 2,
      },
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d + 1).setScale(uiScale);
    if (eliteText.height > maxEliteH) {
      eliteText.setCrop(0, 0, eliteText.width, maxEliteH);
    }
    this.elements.push(eliteText);

    let sfxOn = prefs.sfxVolume > 0.001;
    const sfxLabel = (on: boolean) =>
      t('ui.loadout.sfx_toggle', { state: t(on ? 'ui.common.on' : 'ui.common.off') });
    const sfxText = scene.add.text(x + width / 2 - Math.round(75 * uiScale), audioY, sfxLabel(sfxOn),
      textStyle('body', { color: resolveToggleTextColor(sfxOn) }),
    ).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
      .setScale(uiScale)
      .setInteractive({ useHandCursor: true });
    const toggleSfx = (): void => {
      audio.playClick();
      sfxOn = !sfxOn;
      sfxText.setText(sfxLabel(sfxOn));
      sfxText.setColor(resolveToggleTextColor(sfxOn));
      this.settings.update((st) => ({ ...st, sfxVolume: sfxOn ? 1 : 0 }));
      applyAudioFromUserSettings(this.settings.load());
      refreshPauseDomActions();
      this.applyPauseFocusVisualsOnly();
    };
    sfxText.on('pointerdown', toggleSfx);
    pushTextFocus(sfxText, () => resolveToggleTextColor(sfxOn), toggleSfx);
    this.elements.push(sfxText);

    let musicOn = prefs.musicVolume > 0.001;
    const musicLabel = (on: boolean) =>
      t('ui.loadout.music_toggle', { state: t(on ? 'ui.common.on' : 'ui.common.off') });
    const musicText = scene.add.text(x + width / 2 + Math.round(75 * uiScale), audioY, musicLabel(musicOn),
      textStyle('body', { color: resolveToggleTextColor(musicOn) }),
    ).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
      .setScale(uiScale)
      .setInteractive({ useHandCursor: true });
    const toggleMusic = (): void => {
      audio.playClick();
      musicOn = !musicOn;
      musicText.setText(musicLabel(musicOn));
      musicText.setColor(resolveToggleTextColor(musicOn));
      this.settings.update((st) => ({ ...st, musicVolume: musicOn ? 1 : 0 }));
      applyAudioFromUserSettings(this.settings.load());
      if (musicOn && !musicEngine.isPlaying()) musicEngine.start();
      refreshPauseDomActions();
      this.applyPauseFocusVisualsOnly();
    };
    musicText.on('pointerdown', toggleMusic);
    pushTextFocus(musicText, () => resolveToggleTextColor(musicOn), toggleMusic);
    this.elements.push(musicText);

    if (passives.length > 0 && passiveBottomY !== null) {
      const passivePauseLine = (k: string) => {
        const path = `ui.passive.pause_short.${k}`;
        const s = t(path);
        return s === path ? k : s;
      };
      const names = passives.map(passivePauseLine);
      let passiveList: string;
      if (names.length <= 4) {
        passiveList = names.join('\n');
      } else {
        const rows: string[] = [];
        for (let i = 0; i < names.length; i += 2) {
          rows.push(names[i] + (names[i + 1] ? '   •   ' + names[i + 1] : ''));
        }
        passiveList = rows.join('\n');
      }
      this.elements.push(
        scene.add.text(
          x + width / 2, passiveBottomY,
          `${t('ui.pause.passives_heading')}\n${passiveList}`,
          {
            ...textStyle('label', { fontSize: '12px', color: COLORS_CSS.LEGENDARY, align: 'center' }),
            lineSpacing: 3,
          },
        ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(d + 1).setScale(uiScale)
      );
    }

    if (saveClipY !== null && clipRecorder != null) {
      const { rect: clipBtn, label: clipLabel } = createGameButton(scene, {
        x: x + width / 2, y: saveClipY, width: 220, height: 50,
        label: t('ui.pause.save_clip'), tier: 'secondary', fontSize: '18px', uiScale,
      });
      clipBtn.setScrollFactor(0).setDepth(d + 1);
      clipBtn.on('pointerdown', () => { void this.handleSaveClip(clipRecorder); });
      pushRectFocus(clipBtn, 'secondary', () => {
        void this.handleSaveClip(clipRecorder);
      });
      clipLabel.setScrollFactor(0).setDepth(d + 2);
      this.elements.push(clipBtn);
      this.elements.push(clipLabel);
    }

    if (saveScreenshotY !== null) {
      const { rect: ssBtn, label: ssLabel } = createGameButton(scene, {
        x: x + width / 2, y: saveScreenshotY, width: 220, height: 50,
        label: t('ui.pause.save_screenshot'), tier: 'secondary', fontSize: '18px', uiScale,
      });
      ssBtn.setScrollFactor(0).setDepth(d + 1);
      ssBtn.on('pointerdown', () => { void this.handleSaveScreenshot(); });
      pushRectFocus(ssBtn, 'secondary', () => {
        void this.handleSaveScreenshot();
      });
      ssLabel.setScrollFactor(0).setDepth(d + 2);
      this.elements.push(ssBtn);
      this.elements.push(ssLabel);
    }

    const { rect: quitBtn, label: quitLabel } = createGameButton(scene, {
      x: x + width / 2, y: quitY, width: 220, height: 50,
      label: t('ui.pause.quit'), tier: 'secondary', fontSize: '22px', uiScale,
    });
    quitBtn.setScrollFactor(0).setDepth(d + 1);
    quitBtn.on('pointerdown', () => this.hooks.onQuitRequested());
    pushRectFocus(quitBtn, 'secondary', () => this.hooks.onQuitRequested());
    quitLabel.setScrollFactor(0).setDepth(d + 2);
    this.elements.push(quitBtn);
    this.elements.push(quitLabel);

    const buildPauseDomActions = (): DomFocusAction[] =>
      buildPauseMenuDomFocusActions({
        showWhiskyDram: this.hooks.isWhiskyDramAvailable?.() === true,
        whiskyDramLabel: t('ui.pause.whisky_dram_use'),
        onWhiskyDram: () => {
          this.hooks.onWhiskyDramRequested?.();
          this.close();
          this.open();
        },
        showFingalsHorn: this.hooks.isFingalsHornAvailable?.() === true,
        fingalsHornLabel: t('ui.pause.fingals_horn_use'),
        onFingalsHorn: () => {
          this.hooks.onFingalsHornRequested?.();
          this.close();
          this.open();
        },
        resumeLabel: t('ui.pause.resume'),
        onResume: () => this.hooks.onResumeRequested(),
        sfxLabel: sfxLabel(sfxOn),
        onToggleSfx: toggleSfx,
        musicLabel: musicLabel(musicOn),
        onToggleMusic: toggleMusic,
        showSaveClip: clipAvailable,
        saveClipLabel: t('ui.pause.save_clip'),
        onSaveClip: () => {
          if (clipRecorder != null) void this.handleSaveClip(clipRecorder);
        },
        showSaveScreenshot: captureEnabled,
        saveScreenshotLabel: t('ui.pause.save_screenshot'),
        onSaveScreenshot: () => {
          void this.handleSaveScreenshot();
        },
        quitLabel: t('ui.pause.quit'),
        onQuit: () => this.hooks.onQuitRequested(),
      });

    refreshPauseDomActions = () => {
      this.domFocusLayer?.setActions(buildPauseDomActions());
    };

    this.focusedPauseIndex = firstEnabledModalFocusIndex(this.pauseFocusEntries);
    this.installPauseKeyboardShortcuts();
    this.installPauseGamepadShortcuts();

    this.mountPauseDomFocusLayer(buildPauseDomActions);
    this.applyPauseFocus();
  }

  private applyRectIdleStroke(
    rect: Phaser.GameObjects.Rectangle,
    tier: ButtonTier,
    useHc: boolean,
  ): void {
    const b = resolveTierBorder(tier, useHc);
    if (b) rect.setStrokeStyle(b.width, b.color, b.alpha);
    else rect.setStrokeStyle(0);
  }

  private applyPauseFocusVisualsOnly(): void {
    for (let i = 0; i < this.pauseFocusEntries.length; i++) {
      const e = this.pauseFocusEntries[i]!;
      if (e.kind === 'rect' && e.rect && e.tier !== undefined) {
        if (i === this.focusedPauseIndex) {
          e.rect.setStrokeStyle(3, PAUSE_FOCUS_STROKE_COLOR, 1);
        } else {
          this.applyRectIdleStroke(e.rect, e.tier, e.highContrast ?? false);
        }
      } else if (e.kind === 'text' && e.text && e.getIdleTextColor) {
        e.text.setColor(this.focusedPauseIndex === i ? '#ffe080' : e.getIdleTextColor());
      }
    }
  }

  private applyPauseFocus(): void {
    this.applyPauseFocusVisualsOnly();
    if (
      this.domFocusLayer
      && this.focusedPauseIndex >= 0
      && this.focusedPauseIndex < this.pauseFocusEntries.length
    ) {
      this.domFocusLayer.setFocusedIndex(this.focusedPauseIndex);
    }
  }

  private movePauseFocus(direction: -1 | 1): void {
    this.focusedPauseIndex = moveModalFocusIndex(
      this.pauseFocusEntries,
      this.focusedPauseIndex,
      direction,
    );
    this.applyPauseFocus();
  }

  private activatePauseFocused(): void {
    const entry = this.pauseFocusEntries[this.focusedPauseIndex];
    if (!entry || entry.disabled) return;
    entry.activate();
  }

  private installPauseKeyboardShortcuts(): void {
    const kb = this.scene.input.keyboard;
    if (!kb) return;
    this.pauseKeyHandler = (e: KeyboardEvent) => {
      const n = this.pauseFocusEntries.length;
      const digit = parseInt(e.key, 10);
      if (Number.isFinite(digit) && digit >= 1 && digit <= n) {
        const row = this.pauseFocusEntries[digit - 1];
        if (row && !row.disabled) {
          e.preventDefault();
          this.focusedPauseIndex = digit - 1;
          this.applyPauseFocus();
          row.activate();
        }
        return;
      }
      if (
        e.key === 'ArrowLeft' || e.key === 'ArrowUp'
        || (e.key === 'Tab' && e.shiftKey)
      ) {
        e.preventDefault();
        this.movePauseFocus(-1);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Tab') {
        e.preventDefault();
        this.movePauseFocus(1);
        return;
      }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      this.activatePauseFocused();
    };
    kb.on('keydown', this.pauseKeyHandler);
  }

  private uninstallPauseKeyboardShortcuts(): void {
    if (!this.pauseKeyHandler) return;
    this.scene.input.keyboard?.off('keydown', this.pauseKeyHandler);
    this.pauseKeyHandler = undefined;
  }

  private installPauseGamepadShortcuts(): void {
    this.uninstallPauseGamepadShortcuts();
    this.prevPausePadBack = this.prevPausePadForward = this.prevPausePadConfirm = false;
    this.pauseGamepadUpdateHandler = () => {
      const pad = this.scene.input.gamepad?.pad1;
      if (!pad?.connected) {
        this.prevPausePadBack = this.prevPausePadForward = this.prevPausePadConfirm = false;
        return;
      }
      const back = pad.left || pad.up || pad.leftStick.x < -0.5 || pad.leftStick.y < -0.5;
      const forward = pad.right || pad.down || pad.leftStick.x > 0.5 || pad.leftStick.y > 0.5;
      const confirm = pad.buttons[0]?.pressed === true || pad.buttons[9]?.pressed === true;
      if (back && !this.prevPausePadBack) this.movePauseFocus(-1);
      if (forward && !this.prevPausePadForward) this.movePauseFocus(1);
      if (confirm && !this.prevPausePadConfirm) this.activatePauseFocused();
      this.prevPausePadBack = back;
      this.prevPausePadForward = forward;
      this.prevPausePadConfirm = confirm;
    };
    this.scene.events.on('update', this.pauseGamepadUpdateHandler);
  }

  private uninstallPauseGamepadShortcuts(): void {
    if (!this.pauseGamepadUpdateHandler) return;
    this.scene.events.off('update', this.pauseGamepadUpdateHandler);
    this.pauseGamepadUpdateHandler = null;
  }

  private mountPauseDomFocusLayer(buildActions: () => DomFocusAction[]): void {
    this.unmountPauseDomFocusLayer();
    if (typeof document === 'undefined') return;
    this.domFocusLayer = createDomFocusLayer({
      id: 'whs-pause-focus-layer',
      label: t('ui.pause.title'),
      description: t('ui.pause.keys_resume'),
      role: 'dialog',
      actions: buildActions(),
      initialFocusIndex: this.focusedPauseIndex >= 0 ? this.focusedPauseIndex : 0,
      onFocusIndexChange: (index) => {
        if (index < 0 || index >= this.pauseFocusEntries.length) return;
        const row = this.pauseFocusEntries[index];
        if (row?.disabled) return;
        this.focusedPauseIndex = index;
        this.applyPauseFocusVisualsOnly();
      },
    });
  }

  private unmountPauseDomFocusLayer(): void {
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;
  }

  private async handleSaveClip(recorder: ClipRecorder): Promise<void> {
    const scene = this.scene as GameScene;
    const ctx = scene.getRunContextForCapture();
    const filename = buildCaptureFilename('clip', {
      mode: ctx.mode,
      variantLabel: ctx.variantLabel,
      timeSurvivedSec: ctx.timeSurvivedSec,
      seedCode: ctx.seedCode,
      dateYmd: formatLocalYmd(new Date()),
      clipExtension: recorder.selectedExtension(),
    });
    try {
      const blob = await recorder.saveLast((b) => {
        const url = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
      const msgKey = blob === null ? 'ui.toast.clip_empty' : 'ui.toast.clip_saved';
      const color = blob === null ? TOAST_COLORS.warning : TOAST_COLORS.positive;
      scene.getJuice()?.showToast(t(msgKey), color);
    } catch {
      scene.getJuice()?.showToast(t('ui.toast.clip_failed'), TOAST_COLORS.warning);
    }
  }

  private async handleSaveScreenshot(): Promise<void> {
    const scene = this.scene;
    const canvas = scene.game.canvas as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = scene.getRunContextForCapture();
    const filename = buildCaptureFilename('screenshot', {
      mode: ctx.mode,
      variantLabel: ctx.variantLabel,
      timeSurvivedSec: ctx.timeSurvivedSec,
      seedCode: ctx.seedCode,
      dateYmd: formatLocalYmd(new Date()),
    });
    const ok = await saveScreenshot(canvas, filename);
    const msg = ok ? t('ui.toast.screenshot_saved') : t('ui.toast.screenshot_failed');
    const color = ok ? TOAST_COLORS.positive : TOAST_COLORS.warning;
    scene.getJuice().showToast(msg, color);
  }

  close(): void {
    this.uninstallPauseKeyboardShortcuts();
    this.uninstallPauseGamepadShortcuts();
    this.pauseFocusEntries = [];
    this.focusedPauseIndex = -1;
    this.unmountPauseDomFocusLayer();
    for (const el of this.elements) {
      if ('removeAllListeners' in el) {
        (el as Phaser.GameObjects.GameObject).removeAllListeners();
      }
      el.destroy();
    }
    this.elements = [];
  }
}
