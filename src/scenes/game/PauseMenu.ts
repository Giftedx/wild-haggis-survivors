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
import { createGameButton } from '../../ui/gameButton';
import { textStyle } from '../../ui/typography';
import { audio } from '../../systems/AudioSystem';
import { saveScreenshot } from '../../utils/screenshot';
import { buildCaptureFilename } from '../../utils/captureFilename';
import { formatLocalYmd } from '../../utils/formatDate';
import { TOAST_COLORS } from '../../ui/toastPalette';
import { ClipRecorder } from '../../utils/clipRecorder';

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

  constructor(private readonly scene: GameScene, private readonly hooks: PauseMenuHooks) {}

  isOpen(): boolean {
    return this.elements.length > 0;
  }

  open(): void {
    const { x, y, width, height } = this.hooks.getUiViewport();
    const d = 250;
    const scene = this.scene;
    const prefs = this.settings.load();
    const hc = prefs.highContrastUi;
    const uiScale = prefs.uiScale;
    const style = resolvePauseMenuStyle(height, hc);
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
      rect.on('pointerdown', () => {
        onClick();
        this.close();
        this.open();
      });
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
    sfxText.on('pointerdown', () => {
      audio.playClick();
      sfxOn = !sfxOn;
      sfxText.setText(sfxLabel(sfxOn));
      sfxText.setColor(resolveToggleTextColor(sfxOn));
      this.settings.update((st) => ({ ...st, sfxVolume: sfxOn ? 1 : 0 }));
      applyAudioFromUserSettings(this.settings.load());
    });
    this.elements.push(sfxText);

    let musicOn = prefs.musicVolume > 0.001;
    const musicLabel = (on: boolean) =>
      t('ui.loadout.music_toggle', { state: t(on ? 'ui.common.on' : 'ui.common.off') });
    const musicText = scene.add.text(x + width / 2 + Math.round(75 * uiScale), audioY, musicLabel(musicOn),
      textStyle('body', { color: resolveToggleTextColor(musicOn) }),
    ).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
      .setScale(uiScale)
      .setInteractive({ useHandCursor: true });
    musicText.on('pointerdown', () => {
      audio.playClick();
      musicOn = !musicOn;
      musicText.setText(musicLabel(musicOn));
      musicText.setColor(resolveToggleTextColor(musicOn));
      this.settings.update((st) => ({ ...st, musicVolume: musicOn ? 1 : 0 }));
      applyAudioFromUserSettings(this.settings.load());
      if (musicOn && !musicEngine.isPlaying()) musicEngine.start();
    });
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
    quitLabel.setScrollFactor(0).setDepth(d + 2);
    this.elements.push(quitBtn);
    this.elements.push(quitLabel);
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
    for (const el of this.elements) {
      if ('removeAllListeners' in el) {
        (el as Phaser.GameObjects.GameObject).removeAllListeners();
      }
      el.destroy();
    }
    this.elements = [];
  }
}
