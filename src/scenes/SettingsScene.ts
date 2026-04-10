import Phaser from 'phaser';
import { COLORS } from '../config';
import { applyAudioFromUserSettings } from '../core/applyAudioFromSettings';
import { getSettingsManager, type ISettingsData } from '../core/SettingsManager';
import { loadSave, writeSave } from '../utils/save';
import { audio } from '../systems/AudioSystem';
import { t } from '../core/i18n';

type SettingsGpRow =
  | { kind: 'volume'; minus: () => void; plus: () => void; mark: Phaser.GameObjects.Rectangle }
  | { kind: 'toggle'; toggle: () => void; mark: Phaser.GameObjects.Rectangle }
  | { kind: 'back'; go: () => void; mark: Phaser.GameObjects.Rectangle };

/**
 * Air-gapped preferences (volumes, shake, damage numbers, perf).
 */
export class SettingsScene extends Phaser.Scene {
  private settingsManager = getSettingsManager();
  private rowY = 0;
  private working: ISettingsData;
  private gpRows: SettingsGpRow[] = [];
  private gpIdx = 0;
  private gpPrevU = false;
  private gpPrevD = false;
  private gpPrevL = false;
  private gpPrevR = false;
  private gpPrevA = false;
  private gpUpdate?: (time: number, delta: number) => void;

  constructor() {
    super({ key: 'Settings' });
    this.working = this.settingsManager.load();
  }

  create(): void {
    this.working = { ...this.settingsManager.load() };
    this.gpRows = [];
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);
    this.add
      .text(width / 2, 36, t('ui.settings.title'), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#9ec8ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 68, t('ui.settings.subtitle'), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#6a7390',
      })
      .setOrigin(0.5);

    this.rowY = 104;
    this.addVolumeRow(t('ui.settings.master_volume'), 'masterVolume', 0, 1);
    this.addVolumeRow(t('ui.settings.sfx_volume'), 'sfxVolume', 0, 1);
    this.addVolumeRow(t('ui.settings.music_volume'), 'musicVolume', 0, 1);
    this.addToggleRow(t('ui.settings.screen_shake'), 'screenShake');
    this.addToggleRow(t('ui.settings.damage_numbers'), 'damageNumbers');
    this.addToggleRow(t('ui.settings.reduce_particles'), 'reduceParticles');

    const back = this.add
      .rectangle(width / 2, height - 36, 200, 40, 0x3a4357, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, height - 36, t('ui.settings.back'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    back.on('pointerover', () => back.setFillStyle(0x4a5568));
    back.on('pointerout', () => back.setFillStyle(0x3a4357));
    const goBack = () => {
      audio.playClick();
      this.persistAndApply();
      this.scene.start('MainMenu');
    };
    back.on('pointerdown', goBack);

    const backMark = this.add
      .rectangle(width / 2, height - 36, width - 48, 44, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({ kind: 'back', go: goBack, mark: backMark });

    this.gpIdx = 0;
    this.applyGpHighlight();

    this.gpUpdate = (_t: number, delta: number) => this.tickGamepad(delta);
    this.events.on('update', this.gpUpdate);
    this.events.once('shutdown', () => {
      if (this.gpUpdate) this.events.off('update', this.gpUpdate);
      this.gpUpdate = undefined;
    });
  }

  private applyGpHighlight(): void {
    for (let i = 0; i < this.gpRows.length; i++) {
      const m = this.gpRows[i].mark;
      if (!m.active) continue;
      if (i === this.gpIdx) m.setStrokeStyle(2, 0xffe066, 0.9);
      else m.setStrokeStyle(0);
    }
  }

  private tickGamepad(delta: number): void {
    const pad = this.input.gamepad?.pad1;
    if (!pad?.connected) {
      this.gpPrevU = this.gpPrevD = this.gpPrevL = this.gpPrevR = this.gpPrevA = false;
      return;
    }

    const up = pad.up || pad.leftStick.y < -0.5;
    const down = pad.down || pad.leftStick.y > 0.5;
    const uE = up && !this.gpPrevU;
    const dE = down && !this.gpPrevD;
    this.gpPrevU = up;
    this.gpPrevD = down;

    if (uE) {
      this.gpIdx = (this.gpIdx - 1 + this.gpRows.length) % this.gpRows.length;
      this.applyGpHighlight();
    } else if (dE) {
      this.gpIdx = (this.gpIdx + 1) % this.gpRows.length;
      this.applyGpHighlight();
    }

    const row = this.gpRows[this.gpIdx];
    if (!row) return;

    const left = pad.left || pad.leftStick.x < -0.45;
    const right = pad.right || pad.leftStick.x > 0.45;
    const lE = left && !this.gpPrevL;
    const rE = right && !this.gpPrevR;
    this.gpPrevL = left;
    this.gpPrevR = right;

    if (row.kind === 'volume') {
      if (lE) {
        audio.playClick();
        row.minus();
      }
      if (rE) {
        audio.playClick();
        row.plus();
      }
    }

    const a = pad.buttons[0]?.pressed ?? false;
    const startB = pad.buttons[9]?.pressed ?? false;
    const confirm = a || startB;
    const aE = confirm && !this.gpPrevA;
    this.gpPrevA = confirm;
    if (aE) {
      if (row.kind === 'volume') {
        audio.playClick();
        row.plus();
      } else if (row.kind === 'toggle') {
        row.toggle();
      } else {
        row.go();
      }
    }

    // Slow repeat for held directions (volume rows)
    if (row.kind === 'volume' && (left || right) && delta > 0) {
      /* optional: could add accumulator — keep edge-only for clarity */
    }
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

    const mark = this.add
      .rectangle(width / 2, y + 12, width - 56, 36, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'volume',
      minus: () => bump(-step),
      plus: () => bump(step),
      mark,
    });
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
      .text(width - 88, y + 8, this.working[key] ? t('ui.settings.on') : t('ui.settings.off'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const sync = () => {
      btn.setFillStyle(this.working[key] ? onColor : offColor);
      txt.setText(this.working[key] ? t('ui.settings.on') : t('ui.settings.off'));
    };

    const doToggle = () => {
      audio.playClick();
      this.working[key] = !this.working[key];
      sync();
      this.persistAndApply();
    };

    btn.on('pointerdown', doToggle);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', doToggle);

    const mark = this.add
      .rectangle(width / 2, y + 10, width - 56, 34, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'toggle',
      toggle: doToggle,
      mark,
    });
  }
}
