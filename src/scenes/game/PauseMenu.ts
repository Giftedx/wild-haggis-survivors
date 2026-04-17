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
import { COLORS } from '../../config';
import type { GameScene } from '../GameScene';
import { t } from '../../core/i18n';
import { applyAudioFromUserSettings } from '../../core/applyAudioFromSettings';
import { getSettingsManager } from '../../core/SettingsManager';
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';
import { ELITE_AFFIX_DISPLAY_ORDER } from '../../data/eliteAffixes';
import { buildPauseStatsLines } from './pauseStats';
import {
  resolvePauseMenuStyle,
  PAUSE_RESUME_BUTTON_PALETTE,
  PAUSE_QUIT_BUTTON_PALETTE,
  resolvePauseCurseLineColor,
  resolvePauseEliteRefColor,
} from './pauseMenuStyle';
import { resolveToggleTextColor } from '../toggleTextPalette';
import { attachButtonHoverFill } from '../../ui/buttonHover';

// Both the RESUME and QUIT primary-action labels wear the same 22px
// white bold monospace coat — extract so tweaks stay in lockstep.
const PAUSE_BUTTON_LABEL_TEXT = {
  fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
} as const;

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
    const hc = this.settings.load().highContrastUi;
    const style = resolvePauseMenuStyle(height, hc);
    this.elements.push(
      scene.add.rectangle(x + width / 2, y + height / 2, width, height, COLORS.BG_DARK, style.backdropAlpha)
        .setScrollFactor(0).setDepth(d).setInteractive()
    );
    this.elements.push(
      scene.add.text(x + width / 2, y + height * 0.18, t('ui.pause.title'), {
        fontFamily: 'monospace', fontSize: style.titlePx, color: style.titleColor,
        fontStyle: 'bold', stroke: '#0a0a14', strokeThickness: style.titleStroke,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1)
    );
    const quipIndex = Phaser.Math.Between(1, 8);
    const quip = t(`ui.pause.quip_${quipIndex}`);
    this.elements.push(
      scene.add.text(x + width / 2, y + height * 0.26, quip, {
        fontFamily: 'monospace', fontSize: '14px', color: '#8a7a6a',
        fontStyle: 'italic',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1)
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
        fontFamily: 'monospace', fontSize: '14px', color: '#bbbbbb',
        align: 'center', lineSpacing: 6,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1)
    );

    const curseLine = this.hooks.getActiveCurseLine?.() ?? null;
    if (curseLine) {
      this.elements.push(
        scene.add.text(x + width / 2, y + height * 0.415, curseLine, {
          fontFamily: 'monospace', fontSize: '13px', color: resolvePauseCurseLineColor(hc),
          align: 'center',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1)
      );
    }

    // RESUME before the long elite-affix reference list so the button never covers traits text.
    const resumeY = y + height * 0.48;
    const resumeBtn = scene.add.rectangle(x + width / 2, resumeY, 220, 50, PAUSE_RESUME_BUTTON_PALETTE.idle)
      .setScrollFactor(0).setDepth(d + 1).setInteractive({ useHandCursor: true });
    attachButtonHoverFill(resumeBtn, PAUSE_RESUME_BUTTON_PALETTE.idle, PAUSE_RESUME_BUTTON_PALETTE.hover);
    resumeBtn.on('pointerdown', () => this.hooks.onResumeRequested());
    this.elements.push(resumeBtn);
    this.elements.push(
      scene.add.text(x + width / 2, resumeY, t('ui.pause.resume'), PAUSE_BUTTON_LABEL_TEXT)
        .setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
    );
    this.elements.push(
      scene.add.text(x + width / 2, resumeY + 30, t('ui.pause.keys_resume'), {
        fontFamily: 'monospace', fontSize: '11px', color: '#7a8a98',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
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
    this.elements.push(
      scene.add.text(
        x + width / 2,
        eliteAffixTop,
        `${t('ui.pause.elite_affix_heading')}\n${eliteAffixLines.join('\n')}`,
        {
          fontFamily: 'monospace',
          fontSize: style.shortViewport ? '9px' : '10px',
          color: resolvePauseEliteRefColor(hc),
          align: 'center',
          lineSpacing: 2,
          wordWrap: { width: Math.max(200, width - 56) },
        },
      ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d + 1)
    );

    const prefs = this.settings.load();
    let sfxOn = prefs.sfxVolume > 0.001;
    const sfxLabel = (on: boolean) =>
      t('ui.loadout.sfx_toggle', { state: t(on ? 'ui.common.on' : 'ui.common.off') });
    const sfxText = scene.add.text(x + width / 2 - 70, audioY, sfxLabel(sfxOn), {
      fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold',
      color: resolveToggleTextColor(sfxOn),
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
      .setInteractive({ useHandCursor: true });
    sfxText.on('pointerdown', () => {
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
    const musicText = scene.add.text(x + width / 2 + 80, audioY, musicLabel(musicOn), {
      fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold',
      color: resolveToggleTextColor(musicOn),
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
      .setInteractive({ useHandCursor: true });
    musicText.on('pointerdown', () => {
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
            fontFamily: 'monospace', fontSize: '12px', color: '#ddaa00',
            align: 'center', lineSpacing: 3,
          },
        ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(d + 1)
      );
    }

    const quitBtn = scene.add.rectangle(x + width / 2, quitY, 220, 50, PAUSE_QUIT_BUTTON_PALETTE.idle)
      .setScrollFactor(0).setDepth(d + 1).setInteractive({ useHandCursor: true });
    attachButtonHoverFill(quitBtn, PAUSE_QUIT_BUTTON_PALETTE.idle, PAUSE_QUIT_BUTTON_PALETTE.hover);
    quitBtn.on('pointerdown', () => this.hooks.onQuitRequested());
    this.elements.push(quitBtn);
    this.elements.push(
      scene.add.text(x + width / 2, quitY, t('ui.pause.quit'), PAUSE_BUTTON_LABEL_TEXT)
        .setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
    );
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
