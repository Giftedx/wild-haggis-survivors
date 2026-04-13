import Phaser from 'phaser';
import { COLORS } from '../config';
import { applyAudioFromUserSettings } from '../core/applyAudioFromSettings';
import { getSettingsManager, type ISettingsData } from '../core/SettingsManager';
import { audio } from '../systems/AudioSystem';
import { t } from '../core/i18n';
import {
  sliderRatioFromValue,
  sliderValueFromRatio,
  steppedSliderBump,
} from './settingsSliderMath';

type SettingsGpRow =
  | {
      kind: 'slider';
      minus: () => void;
      plus: () => void;
      mark: Phaser.GameObjects.Rectangle;
    }
  | {
      kind: 'toggle';
      toggle: () => void;
      mark: Phaser.GameObjects.Rectangle;
    }
  | {
      kind: 'back';
      go: () => void;
      mark: Phaser.GameObjects.Rectangle;
    };

type VolumeKey = 'masterVolume' | 'sfxVolume' | 'musicVolume' | 'uiScale' | 'motionScale';
type ToggleKey = 'screenShake' | 'damageNumbers' | 'reduceParticles' | 'highContrastUi' | 'captionsEnabled';

/**
 * Air-gapped preferences (volumes, shake, damage numbers, perf).
 *
 * Phase 6 Tier B cozy redesign:
 *  - Warm gradient backdrop with a soft ember glow behind the title,
 *    matching the MainMenu hearth language so the screens feel like
 *    the same place rather than two different apps.
 *  - Rows grouped into three named sections ("Hearth sound", "Comfort
 *    & motion", "Accessibility") with warm subheadings and quiet
 *    divider lines. Scanning to a setting now takes a glance, not a
 *    full read of eight labels.
 *  - Draggable sliders replace the old −/+ buttons — players see the
 *    full range at a glance, and dragging is much faster than clicking
 *    a button 10 times for a full sweep. Clicking anywhere on the
 *    track jumps to that value. Keyboard/gamepad still bump by step.
 *  - All text scales with uiScale, row spacing scales too (previously
 *    row spacing was fixed so uiScale 1.4 overlapped labels).
 */
export class SettingsScene extends Phaser.Scene {
  private settingsManager = getSettingsManager();
  private rowY = 0;
  private working: ISettingsData;
  private uiScale = 1;
  private highContrastUi = false;
  private settingsLabelColor = '#c8d0e0';
  private sectionColor = '#d8b877';
  private valueColor = '#88aacc';
  private gpRows: SettingsGpRow[] = [];
  private gpIdx = 0;
  private gpPrevU = false;
  private gpPrevD = false;
  private gpPrevL = false;
  private gpPrevR = false;
  private gpPrevA = false;
  private gpUpdate?: (time: number, delta: number) => void;
  private glowTweens: Phaser.Tweens.Tween[] = [];
  /** Base row stride before uiScale — cozier than the previous 44px. */
  private readonly BASE_ROW_STEP = 42;
  private readonly BASE_SECTION_GAP = 18;

  constructor() {
    super({ key: 'Settings' });
    this.working = this.settingsManager.load();
  }

  create(): void {
    this.working = { ...this.settingsManager.load() };
    this.gpRows = [];
    this.glowTweens = [];
    const { width, height } = this.scale;

    // Respect the player's comfort settings even on the scene that configures
    // them. Without this, SettingsScene was the ONE scene that ignored
    // uiScale / highContrastUi — the Phase 3 accessibility work had a hole.
    const { uiScale, highContrastUi } = this.settingsManager.load();
    this.uiScale = uiScale;
    this.highContrastUi = highContrastUi;

    // Ambient moor wind — matches MainMenu cozy feel
    if (!this.working.reduceParticles) audio.startAmbientWind();

    const titleColor = highContrastUi ? '#ffe6a8' : '#ffd98a';
    const subtitleColor = highContrastUi ? '#b8c3d4' : '#8a93a8';
    const hintColor = highContrastUi ? '#9ba6bc' : '#6a7388';
    const labelColor = highContrastUi ? '#e6efff' : '#c8d0e0';
    const sectionColor = highContrastUi ? '#ffe066' : '#d8b877';
    const valueColor = highContrastUi ? '#a0c8f0' : '#88aacc';
    this.settingsLabelColor = labelColor;
    this.sectionColor = sectionColor;
    this.valueColor = valueColor;

    // --- Cozy backdrop ---------------------------------------------------
    // Dark base rect, then a soft radial ember glow behind the title in
    // the same warm palette as the MainMenu campfire. Respects
    // reduceParticles by drawing only the glow (no moving pieces).
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);

    const glow = this.add.graphics().setDepth(-10);
    const emberColor = highContrastUi ? 0x4a2a12 : 0x2a1a0c;
    for (let r = 260; r > 40; r -= 30) {
      const alpha = (1 - r / 260) * 0.18;
      glow.fillStyle(emberColor, alpha);
      glow.fillCircle(width / 2, 88, r);
    }

    // Gentle heather strip along the bottom — quiet visual anchor,
    // matches the MainMenu heather scatter. Skipped if the player has
    // reduceParticles enabled; the dots are static either way.
    if (!this.working.reduceParticles) {
      const strip = this.add.graphics().setDepth(-5);
      const stripSeed = 0xbadfeed; // stable layout across scene restarts
      let seed = stripSeed;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return (seed >>> 8) / 0xffffff;
      };
      for (let i = 0; i < 60; i++) {
        const hx = rand() * width;
        const hy = height - 6 - rand() * 24;
        const hue = rand() < 0.5 ? 0x7a5cb8 : 0xa674d4;
        strip.fillStyle(hue, 0.25 + rand() * 0.25);
        strip.fillCircle(hx, hy, 1.5 + rand() * 1.5);
      }
    }

    // --- Title + intro --------------------------------------------------
    const title = this.add
      .text(width / 2, 42, t('ui.settings.title'), {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: titleColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    // A gentle breath on the title — the same slow bob used on MainMenu,
    // cut in half so it does not distract players reading the rows.
    const titleTween = this.tweens.add({
      targets: title,
      scale: { from: uiScale, to: uiScale * 1.02 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.glowTweens.push(titleTween);

    this.add
      .text(width / 2, 72, t('ui.settings.subtitle'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: subtitleColor,
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    this.add
      .text(width / 2, 96, t('ui.settings.comfort_hint'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: hintColor,
        align: 'center',
        wordWrap: { width: width - 64 },
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    // --- Rows (grouped) -------------------------------------------------
    this.rowY = 130;
    this.addSectionHeader(t('ui.settings.section_sound'));
    this.addSliderRow(t('ui.settings.master_volume'), 'masterVolume', 0, 1, 0.1);
    this.addSliderRow(t('ui.settings.sfx_volume'), 'sfxVolume', 0, 1, 0.1);
    this.addSliderRow(t('ui.settings.music_volume'), 'musicVolume', 0, 1, 0.1);

    this.addSectionHeader(t('ui.settings.section_comfort'));
    this.addSliderRow(t('ui.settings.ui_scale'), 'uiScale', 0.8, 1.4, 0.05);
    this.addSliderRow(t('ui.settings.motion_scale'), 'motionScale', 0, 1, 0.1);
    this.addToggleRow(t('ui.settings.screen_shake'), 'screenShake');
    this.addToggleRow(t('ui.settings.damage_numbers'), 'damageNumbers');
    this.addBanterFrequencyRow();

    this.addSectionHeader(t('ui.settings.section_access'));
    this.addToggleRow(t('ui.settings.captions'), 'captionsEnabled');
    this.addToggleRow(t('ui.settings.high_contrast_ui'), 'highContrastUi');
    this.addToggleRow(t('ui.settings.reduce_particles'), 'reduceParticles');

    // --- BACK button ----------------------------------------------------
    // Sit just below the last row with a breathing gap rather than pinned
    // to the bottom of the viewport.
    const backY = Math.min(this.rowY + 32, height - 40);
    const back = this.add
      .rectangle(width / 2, backY, 220, 42, 0x252540, 1)
      .setStrokeStyle(2, 0x4a3a5a, 0.8)
      .setInteractive({ useHandCursor: true });
    back.setScale(uiScale);
    this.add
      .text(width / 2, backY, t('ui.settings.back'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(uiScale);
    back.on('pointerover', () => back.setFillStyle(0x2a2244));
    back.on('pointerout', () => back.setFillStyle(0x252540));
    const goBack = () => {
      audio.playClick();
      this.persistAndApply();
      this.scene.start('MainMenu');
    };
    back.on('pointerdown', goBack);

    const backMark = this.add
      .rectangle(width / 2, backY, width - 48, 44, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({ kind: 'back', go: goBack, mark: backMark });

    this.gpIdx = 0;
    this.applyGpHighlight();

    this.gpUpdate = (_t: number, delta: number) => this.tickGamepad(delta);
    this.events.on('update', this.gpUpdate);
    this.events.once('shutdown', () => {
      audio.stopAmbientWind();
      if (this.gpUpdate) this.events.off('update', this.gpUpdate);
      this.gpUpdate = undefined;
      // Kill any tweens we started so they do not fire into a torn-down scene.
      for (const tw of this.glowTweens) tw.stop();
      this.glowTweens = [];
    });
  }

  private addSectionHeader(label: string): void {
    const { width } = this.scale;
    // Small gap above each header so sections feel grouped.
    this.rowY += this.BASE_SECTION_GAP;
    const y = this.rowY;

    const text = this.add
      .text(40, y, label, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: this.sectionColor,
        fontStyle: 'bold',
      })
      .setScale(this.uiScale);

    // Quiet divider line reaching to the right edge, starting just
    // after the heading text.
    const textEnd = 40 + text.width * this.uiScale + 12;
    const lineY = y + 8 * this.uiScale;
    const divider = this.add
      .rectangle(textEnd, lineY, Math.max(0, width - textEnd - 40), 1, 0x5a6478, 0.35)
      .setOrigin(0, 0.5);
    void divider;

    this.rowY += 22 + Math.round((this.uiScale - 1) * 8);
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

    if (row.kind === 'slider') {
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
      if (row.kind === 'slider') {
        audio.playClick();
        row.plus();
      } else if (row.kind === 'toggle') {
        row.toggle();
      } else {
        row.go();
      }
    }

    // delta is wired for a future held-direction accumulator; edge-only
    // for now so the gamepad behaviour matches keyboard.
    void delta;
  }

  private persistAndApply(): void {
    this.settingsManager.save(this.working);
    applyAudioFromUserSettings(this.working);
  }

  private addSliderRow(
    label: string,
    key: VolumeKey,
    min: number,
    max: number,
    step: number
  ): void {
    const { width } = this.scale;
    const y = this.rowY;
    const rowStep = Math.round(this.BASE_ROW_STEP * this.uiScale);
    this.rowY += rowStep;

    this.add
      .text(40, y + 6, label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: this.settingsLabelColor,
      })
      .setScale(this.uiScale);

    // Slider track geometry — keep the right margin clear for the value text.
    const trackX = Math.round(width * 0.46);
    const trackY = y + 14;
    const trackW = 240;
    const trackH = 8;

    // Dim background trough.
    const trough = this.add
      .rectangle(trackX, trackY, trackW, trackH, 0x1a1420, 1)
      .setStrokeStyle(1, 0x4a3a5a, 0.8)
      .setOrigin(0, 0.5);
    trough.setScale(this.uiScale, this.uiScale);

    // Warm fill showing the current value.
    const fillColor = this.highContrastUi ? 0xffe066 : 0xd8b877;
    const fill = this.add.rectangle(trackX, trackY, 1, trackH - 2, fillColor, 1).setOrigin(0, 0.5);
    fill.setScale(1, this.uiScale);

    // Round thumb sits centered on the fill end.
    const thumb = this.add
      .circle(trackX, trackY, 7, fillColor, 1)
      .setStrokeStyle(2, 0x1a1e2a, 1)
      .setInteractive({ useHandCursor: true, draggable: true });
    thumb.setScale(this.uiScale);

    // Readable value on the right of the track.
    const valText = this.add
      .text(trackX + (trackW + 18) * this.uiScale, y + 6, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: this.valueColor,
      })
      .setOrigin(0, 0)
      .setScale(this.uiScale);

    const scaledTrackW = trackW * this.uiScale;
    const trackLeftScaled = trackX;

    const syncVisual = () => {
      const current = this.working[key];
      const ratio = sliderRatioFromValue(current, min, max);
      // Fill width lives in track-local units so it respects the scaleX.
      fill.width = Math.max(1, ratio * trackW);
      thumb.x = trackLeftScaled + ratio * scaledTrackW;
      valText.setText(
        key === 'uiScale' ? `${current.toFixed(2)}x` : `${Math.round(current * 100)}%`
      );
    };

    const setFromRatio = (ratio: number) => {
      this.working[key] = sliderValueFromRatio(ratio, min, max, step);
      syncVisual();
      this.persistAndApply();
    };

    const bump = (direction: number) => {
      this.working[key] = steppedSliderBump(this.working[key], direction, min, max, step);
      syncVisual();
      this.persistAndApply();
    };

    syncVisual();

    // Click-anywhere-on-track-to-jump. Uses a transparent hit area
    // the full width of the visible track (scaled).
    const hit = this.add
      .rectangle(trackLeftScaled, trackY, scaledTrackW, 30 * this.uiScale, 0x000000, 0)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const ratio = (pointer.x - trackLeftScaled) / scaledTrackW;
      audio.playClick();
      setFromRatio(ratio);
    });

    // Draggable thumb — Phaser handles the drag loop for us.
    thumb.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const ratio = (dragX - trackLeftScaled) / scaledTrackW;
      setFromRatio(ratio);
    });
    thumb.on('dragend', () => {
      audio.playClick();
    });

    const mark = this.add
      .rectangle(width / 2, y + 14, width - 56, 36, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'slider',
      minus: () => bump(-1),
      plus: () => bump(+1),
      mark,
    });
  }

  private addToggleRow(label: string, key: ToggleKey): void {
    const { width } = this.scale;
    const y = this.rowY;
    const rowStep = Math.round(this.BASE_ROW_STEP * this.uiScale);
    this.rowY += rowStep;

    this.add
      .text(40, y + 4, label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: this.settingsLabelColor,
      })
      .setScale(this.uiScale);

    // Proper toggle switch: track + sliding thumb + side labels
    const onColor = 0x2d6a3e;
    const offColor = 0x3a3148;
    const onBorder = 0x4a9a5e;
    const offBorder = 0x4a3a5a;
    const thumbOnColor = 0x99cc88;
    const thumbOffColor = 0x8a7a9a;
    const cx = width - 88;
    const cy = y + 18;
    const trackW = 58;
    const trackH = 22;
    const thumbR = 9;
    // Track (rounded rect appearance via stroked rect)
    const btn = this.add
      .rectangle(cx, cy, trackW, trackH, this.working[key] ? onColor : offColor, 1)
      .setStrokeStyle(1.5, this.working[key] ? onBorder : offBorder, 0.9)
      .setInteractive({ useHandCursor: true });
    btn.setScale(this.uiScale);
    // Track inner shadow (depth)
    const shadow = this.add
      .rectangle(cx, cy - (trackH / 2) + 2, trackW - 4, 2, 0x000000, 0.3)
      .setScale(this.uiScale);
    // Thumb (sliding circle)
    const thumbLeftX = cx - trackW / 2 + thumbR + 3;
    const thumbRightX = cx + trackW / 2 - thumbR - 3;
    const thumb = this.add
      .circle(
        this.working[key] ? thumbRightX : thumbLeftX,
        cy,
        thumbR,
        this.working[key] ? thumbOnColor : thumbOffColor,
        1
      )
      .setStrokeStyle(1, 0x000000, 0.4)
      .setScale(this.uiScale);
    // Thumb highlight (glossy top)
    const thumbGloss = this.add
      .circle(
        this.working[key] ? thumbRightX : thumbLeftX,
        cy - 2,
        thumbR * 0.5,
        0xffffff,
        0.35
      )
      .setScale(this.uiScale);
    // Status text beside the toggle
    const txt = this.add
      .text(cx - trackW / 2 - 8, cy, this.working[key] ? t('ui.settings.on') : t('ui.settings.off'), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: this.working[key] ? '#99cc88' : '#8a7a8a',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5)
      .setScale(this.uiScale);

    const sync = () => {
      const isOn = this.working[key];
      btn.setFillStyle(isOn ? onColor : offColor);
      btn.setStrokeStyle(1.5, isOn ? onBorder : offBorder, 0.9);
      txt.setText(isOn ? t('ui.settings.on') : t('ui.settings.off'));
      txt.setColor(isOn ? '#99cc88' : '#8a7a8a');
      // Animate the thumb slide
      this.tweens.killTweensOf(thumb);
      this.tweens.killTweensOf(thumbGloss);
      const targetX = isOn ? thumbRightX : thumbLeftX;
      this.tweens.add({
        targets: [thumb, thumbGloss],
        x: targetX,
        duration: 140,
        ease: 'Quad.easeOut',
      });
      thumb.setFillStyle(isOn ? thumbOnColor : thumbOffColor);
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
    // Shadow and thumb components also clickable for forgiving hitbox
    thumb.setInteractive({ useHandCursor: true });
    thumb.on('pointerdown', doToggle);
    // Silence unused-variable warning for shadow (it's drawn, not interacted with)
    void shadow;

    const mark = this.add
      .rectangle(width / 2, y + 10, width - 56, 34, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'toggle',
      toggle: doToggle,
      mark,
    });
  }

  /**
   * Banter frequency — cycling row (Wheesht / Sparing / Natural / Gabby).
   * Styled like a toggle but clicking cycles forward through the 4 values.
   * Keeps the setting adjustable from gamepad via the same 'toggle' gp kind.
   */
  private addBanterFrequencyRow(): void {
    const { width } = this.scale;
    const y = this.rowY;
    const rowStep = Math.round(this.BASE_ROW_STEP * this.uiScale);
    this.rowY += rowStep;

    const ORDER: ReadonlyArray<ISettingsData['banterFrequency']> = ['off', 'sparing', 'normal', 'chatty'];
    const labelFor = (v: ISettingsData['banterFrequency']): string => {
      switch (v) {
        case 'off': return t('ui.settings.banter_off');
        case 'sparing': return t('ui.settings.banter_sparing');
        case 'normal': return t('ui.settings.banter_normal');
        case 'chatty': return t('ui.settings.banter_chatty');
      }
    };

    this.add
      .text(40, y + 4, t('ui.settings.banter_frequency'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: this.settingsLabelColor,
      })
      .setScale(this.uiScale);

    const chipW = 110;
    const chipH = 26;
    const cx = width - 88;
    const cy = y + 18;
    const btn = this.add
      .rectangle(cx, cy, chipW, chipH, 0x2a2244, 1)
      .setStrokeStyle(1.5, 0x4a3a5a, 0.9)
      .setInteractive({ useHandCursor: true });
    btn.setScale(this.uiScale);

    const txt = this.add
      .text(cx, cy, labelFor(this.working.banterFrequency), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: this.working.banterFrequency === 'off' ? '#8a7a8a' : '#d4c2e8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(this.uiScale);

    const sync = () => {
      const v = this.working.banterFrequency;
      txt.setText(labelFor(v));
      txt.setColor(v === 'off' ? '#8a7a8a' : '#d4c2e8');
      btn.setFillStyle(v === 'off' ? 0x2a2244 : 0x2d6a3e);
      btn.setStrokeStyle(1.5, v === 'off' ? 0x4a3a5a : 0x4a9a5e, 0.9);
    };

    const cycle = () => {
      audio.playClick();
      const idx = ORDER.indexOf(this.working.banterFrequency);
      this.working = {
        ...this.working,
        banterFrequency: ORDER[(idx + 1) % ORDER.length],
      };
      sync();
      this.persistAndApply();
    };

    btn.on('pointerdown', cycle);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', cycle);

    const mark = this.add
      .rectangle(width / 2, y + 10, width - 56, 34, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'toggle',
      toggle: cycle,
      mark,
    });
  }
}
