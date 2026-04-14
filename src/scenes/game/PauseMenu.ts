/**
 * PauseMenu — builds and tears down the in-run pause overlay.
 *
 * Owns the backdrop, Scots quip, stats block, resume button, sfx/music
 * toggles, passive summary, and quit button. Exactly the UI that used to
 * live in GameScene.toggleUiPause — extracted so GameScene stops carrying
 * ~140 lines of widget construction.
 *
 * Does NOT own the timeScale lock (timeManager handles that) or the
 * deferred-chest drain (GameScene keeps ownership of gameplay state).
 * This module is strictly display-object construction + teardown.
 */
import Phaser from 'phaser';
import type { GameScene } from '../GameScene';
import { t } from '../../core/i18n';
import { applyAudioFromUserSettings } from '../../core/applyAudioFromSettings';
import { getSettingsManager } from '../../core/SettingsManager';
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';
import { ELITE_AFFIX_DISPLAY_ORDER } from '../../data/eliteAffixes';

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
    const shortViewport = height < 420;
    const titlePx = shortViewport ? '34px' : '46px';
    const titleStroke = shortViewport ? (hc ? 6 : 4) : (hc ? 8 : 5);
    const backdropAlpha = hc ? 0.95 : 0.85;
    this.elements.push(
      scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x1a1a2e, backdropAlpha)
        .setScrollFactor(0).setDepth(d).setInteractive()
    );
    this.elements.push(
      scene.add.text(x + width / 2, y + height * 0.18, t('ui.pause.title'), {
        fontFamily: 'monospace', fontSize: titlePx, color: hc ? '#ffe08a' : '#d4a017',
        fontStyle: 'bold', stroke: '#0a0a14', strokeThickness: titleStroke,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1)
    );
    const quipIndex = Phaser.Math.Between(1, 6);
    const quip = t(`ui.pause.quip_${quipIndex}`);
    this.elements.push(
      scene.add.text(x + width / 2, y + height * 0.26, quip, {
        fontFamily: 'monospace', fontSize: '14px', color: '#8a7a6a',
        fontStyle: 'italic',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1)
    );

    const timeSec = this.hooks.getGameTimeSec();
    const pMins = Math.floor(timeSec / 60);
    const pSecs = Math.floor(timeSec % 60);
    const statLines = [
      t('ui.pause.time_line', { m: pMins, s: pSecs.toString().padStart(2, '0') }),
      t('ui.pause.stats_mid', { kills: this.hooks.getKillCount(), level: this.hooks.getLevel() }),
      t('ui.pause.stats_loadout', {
        w: this.hooks.getEquippedWeaponCount(),
        c: this.hooks.getOwnedPassives().length,
      }),
    ];
    const runGold = this.hooks.getRunGoldEarned?.() ?? 0;
    if (runGold > 0) {
      statLines.push(t('ui.pause.stats_gold', { gold: runGold }));
    }
    const streak = this.hooks.getKillStreakStats?.();
    if (streak && (streak.best >= 2 || streak.current >= 2)) {
      statLines.push(t('ui.pause.stats_streak', { current: streak.current, best: streak.best }));
    }
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
          fontFamily: 'monospace', fontSize: '13px', color: hc ? '#f5d0e8' : '#c49bbf',
          align: 'center',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1)
      );
    }

    // RESUME before the long elite-affix reference list so the button never covers traits text.
    const resumeY = y + height * 0.48;
    const resumeBtn = scene.add.rectangle(x + width / 2, resumeY, 220, 50, 0x005eb8)
      .setScrollFactor(0).setDepth(d + 1).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerover', () => resumeBtn.setFillStyle(0x0077dd));
    resumeBtn.on('pointerout', () => resumeBtn.setFillStyle(0x005eb8));
    resumeBtn.on('pointerdown', () => this.hooks.onResumeRequested());
    this.elements.push(resumeBtn);
    this.elements.push(
      scene.add.text(x + width / 2, resumeY, t('ui.pause.resume'), {
        fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
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
          fontSize: shortViewport ? '9px' : '10px',
          color: hc ? '#a8b8c8' : '#6a7a88',
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
      color: sfxOn ? '#88cc88' : '#886666',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
      .setInteractive({ useHandCursor: true });
    sfxText.on('pointerdown', () => {
      sfxOn = !sfxOn;
      sfxText.setText(sfxLabel(sfxOn));
      sfxText.setColor(sfxOn ? '#88cc88' : '#886666');
      this.settings.update((st) => ({ ...st, sfxVolume: sfxOn ? 1 : 0 }));
      applyAudioFromUserSettings(this.settings.load());
    });
    this.elements.push(sfxText);

    let musicOn = prefs.musicVolume > 0.001;
    const musicLabel = (on: boolean) =>
      t('ui.loadout.music_toggle', { state: t(on ? 'ui.common.on' : 'ui.common.off') });
    const musicText = scene.add.text(x + width / 2 + 80, audioY, musicLabel(musicOn), {
      fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold',
      color: musicOn ? '#88cc88' : '#886666',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
      .setInteractive({ useHandCursor: true });
    musicText.on('pointerdown', () => {
      musicOn = !musicOn;
      musicText.setText(musicLabel(musicOn));
      musicText.setColor(musicOn ? '#88cc88' : '#886666');
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

    const quitBtn = scene.add.rectangle(x + width / 2, quitY, 220, 50, 0x444444)
      .setScrollFactor(0).setDepth(d + 1).setInteractive({ useHandCursor: true });
    quitBtn.on('pointerover', () => quitBtn.setFillStyle(0x555555));
    quitBtn.on('pointerout', () => quitBtn.setFillStyle(0x444444));
    quitBtn.on('pointerdown', () => this.hooks.onQuitRequested());
    this.elements.push(quitBtn);
    this.elements.push(
      scene.add.text(x + width / 2, quitY, t('ui.pause.quit'), {
        fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
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
