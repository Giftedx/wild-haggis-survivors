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
import Phaser from 'phaser';
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
  onResumeRequested(): void;
  onQuitRequested(): void;
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
    const audioY = quitY - 42;
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
