import Phaser from 'phaser';
import { COLORS } from '../config';
import { applyAudioFromUserSettings } from '../core/applyAudioFromSettings';
import { getSettingsManager, type ISettingsData } from '../core/SettingsManager';
import { loadSave, writeSave } from '../utils/save';
import { audio } from '../systems/AudioSystem';

/**
 * Air-gapped preferences (volumes, shake, damage numbers, perf).
 */
export class SettingsScene extends Phaser.Scene {
  private settingsManager = getSettingsManager();
  private rowY = 0;
  private working: ISettingsData;

  constructor() {
    super({ key: 'Settings' });
    this.working = this.settingsManager.load();
  }

  create(): void {
    this.working = { ...this.settingsManager.load() };
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);
    this.add
      .text(width / 2, 36, 'OPTIONS', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#9ec8ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 68, 'Stored separately from meta progression / run saves.', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#6a7390',
      })
      .setOrigin(0.5);

    this.rowY = 104;
    this.addVolumeRow('Master volume', 'masterVolume', 0, 1);
    this.addVolumeRow('SFX volume', 'sfxVolume', 0, 1);
    this.addVolumeRow('Music volume', 'musicVolume', 0, 1);
    this.addToggleRow('Screen shake', 'screenShake');
    this.addToggleRow('Damage numbers', 'damageNumbers');
    this.addToggleRow('Reduce particles (perf)', 'reduceParticles');

    const back = this.add
      .rectangle(width / 2, height - 36, 200, 40, 0x3a4357, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, height - 36, 'BACK', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    back.on('pointerover', () => back.setFillStyle(0x4a5568));
    back.on('pointerout', () => back.setFillStyle(0x3a4357));
    back.on('pointerdown', () => {
      audio.playClick();
      this.persistAndApply();
      this.scene.start('MainMenu');
    });
  }

  private persistAndApply(): void {
    this.settingsManager.save(this.working);
    applyAudioFromUserSettings(this.working);
    try {
      const runSave = loadSave();
      runSave.settings.soundOn = this.working.sfxVolume > 0.001;
      runSave.settings.musicOn = this.working.musicVolume > 0.001;
      writeSave(runSave);
    } catch {
      /* ignore */
    }
  }

  private addVolumeRow(label: string, key: 'masterVolume' | 'sfxVolume' | 'musicVolume', min: number, max: number): void {
    const { width } = this.scale;
    const y = this.rowY;
    this.rowY += 44;

    this.add.text(40, y + 6, label, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#c8d0e0',
    });

    const valText = this.add.text(width / 2, y + 6, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#88aacc',
    }).setOrigin(0.5, 0);

    const step = 0.1;
    const bump = (delta: number) => {
      this.working[key] = Phaser.Math.Clamp(this.working[key] + delta, min, max);
      valText.setText(`${Math.round(this.working[key] * 100)}%`);
      this.persistAndApply();
    };

    valText.setText(`${Math.round(this.working[key] * 100)}%`);

    const mkBtn = (x: number, t: string, d: number) => {
      const b = this.add.rectangle(x, y + 10, 36, 28, 0x3a4a62, 1).setInteractive({ useHandCursor: true });
      this.add.text(x, y + 10, t, { fontFamily: 'monospace', fontSize: '16px', color: '#fff' }).setOrigin(0.5);
      b.on('pointerover', () => b.setFillStyle(0x4a5a72));
      b.on('pointerout', () => b.setFillStyle(0x3a4a62));
      b.on('pointerdown', () => {
        audio.playClick();
        bump(d);
      });
    };

    mkBtn(width - 120, '−', -step);
    mkBtn(width - 72, '+', step);
  }

  private addToggleRow(label: string, key: 'screenShake' | 'damageNumbers' | 'reduceParticles'): void {
    const { width } = this.scale;
    const y = this.rowY;
    this.rowY += 40;

    this.add.text(40, y + 4, label, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#c8d0e0',
    });

    const onColor = 0x2d6a3e;
    const offColor = 0x3a3148;
    const btn = this.add
      .rectangle(width - 88, y + 8, 72, 28, this.working[key] ? onColor : offColor, 1)
      .setInteractive({ useHandCursor: true });
    const txt = this.add
      .text(width - 88, y + 8, this.working[key] ? 'ON' : 'OFF', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const sync = () => {
      btn.setFillStyle(this.working[key] ? onColor : offColor);
      txt.setText(this.working[key] ? 'ON' : 'OFF');
    };

    btn.on('pointerdown', () => {
      audio.playClick();
      this.working[key] = !this.working[key];
      sync();
      this.persistAndApply();
    });
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', () => btn.emit('pointerdown'));
  }
}
