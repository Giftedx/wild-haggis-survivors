import * as Phaser from 'phaser';
import { applyAudioFromUserSettings } from '../core/applyAudioFromSettings';
import { applyLocaleFromUserSettings } from '../core/applyLocaleFromSettings';
import { getSettingsManager, type ISettingsData } from '../core/SettingsManager';
import type { LocaleKey } from '../core/i18n';
import { audio } from '../systems/AudioSystem';
import { t } from '../core/i18n';
import {
  sliderRatioFromValue,
  sliderValueFromRatio,
  steppedSliderBump,
  formatSliderValue,
} from './settingsSliderMath';
import { toggleStateDisplay, resolveToggleTrackStyle } from './settingsToggle';
import { cycleLocaleKey, labelForLocale } from './settingsLocale';
import {
  banterChipStyle,
  cycleBanterFrequency,
  labelForBanterFrequency,
} from './settingsBanterFrequency';
import {
  resolveSettingsPalette,
  SETTINGS_TROUGH_FILL,
  SETTINGS_TROUGH_STROKE,
  SETTINGS_THUMB_STROKE,
} from './settingsPalette';
import { addSceneBackdrop } from './sceneFade';
import { TWEEN_INFINITE_BREATHE } from '../utils/tweenPresets';
import { createGameButton } from '../ui/gameButton';
import { performSettingsReset } from './settingsResetAction';
import { renderSettingsPreview, type SettingsPreviewHandle } from './settingsPreviewCard';

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

type VolumeKey =
  | 'masterVolume'
  | 'sfxVolume'
  | 'musicVolume'
  | 'uiScale'
  | 'motionScale'
  | 'captionTextScale'
  | 'assistModeGameSpeed';
type ToggleKey =
  | 'screenShake'
  | 'damageNumbers'
  | 'reduceParticles'
  | 'reduceFlashing'
  | 'highContrastUi'
  | 'captionsEnabled'
  | 'telemetryOptIn'
  | 'skipActIntermissions'
  | 'ironmoorMode'
  | 'speedrunTimerVisible'
  | 'captureEnabled'
  | 'assistMode'
  | 'assistModeExtendedIFrames'
  | 'assistModeExtendedComboWindow'
  | 'assistModeInvincibility';

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
  /** Scale used for row stride + section gap. Equals `uiScale` unless the
   *  full cascade of 16 rows + 3 section headers would overflow the
   *  viewport vertically — in that case it clamps to the largest factor
   *  that still fits, so tall comfort settings don't push the last rows
   *  off-canvas. Text inside rows still uses `uiScale` for legibility. */
  private layoutScale = 1;
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
  private previewHandle?: SettingsPreviewHandle;
  /** Base row stride before uiScale — shrunk from 42 to fit the 15-row
   *  panel once W18 language + W66 ironmoor + W2 skip rows landed. */
  private readonly BASE_ROW_STEP = 38;
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
    // Derive layoutScale — clamp so 16 rows + 3 section headers fit inside
    // the current viewport height. Without this, uiScale 1.4 on a 768px
    // canvas pushes the BACK-button row off the bottom and hides the last
    // ~4 toggles. Text remains at `uiScale` so readability stays intact;
    // only vertical stride compresses. Floor of 0.8 keeps labels from
    // crashing into each other on very short viewports.
    const rowsCount = 17;
    const sectionCount = 3;
    const rowBase = rowsCount * this.BASE_ROW_STEP;
    const verticalReserve = 130 + 80; // rowY start + back-button margin
    const availableH = Math.max(200, height - verticalReserve);
    const requiredH = sectionCount * this.BASE_SECTION_GAP + (rowBase + sectionCount * 22) * uiScale;
    if (requiredH > availableH) {
      const fitScale = (availableH - sectionCount * this.BASE_SECTION_GAP) / (rowBase + sectionCount * 22);
      this.layoutScale = Math.max(0.8, Math.min(uiScale, fitScale));
    } else {
      this.layoutScale = uiScale;
    }

    // Ambient moor wind — matches MainMenu cozy feel
    if (!this.working.reduceParticles) audio.startAmbientWind();

    const palette = resolveSettingsPalette(highContrastUi);
    const { titleColor, subtitleColor, hintColor, labelColor, sectionColor, valueColor } = palette;
    this.settingsLabelColor = labelColor;
    this.sectionColor = sectionColor;
    this.valueColor = valueColor;

    // --- Cozy backdrop ---------------------------------------------------
    // Dark base rect, then a soft radial ember glow behind the title in
    // the same warm palette as the MainMenu campfire. Respects
    // reduceParticles by drawing only the glow (no moving pieces).
    addSceneBackdrop(this);

    const glow = this.add.graphics().setDepth(-10);
    const emberColor = palette.emberGlow;
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
      ...TWEEN_INFINITE_BREATHE,
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
        wordWrap: { width: (width - 64) / Math.max(1, uiScale) },
      })
      .setOrigin(0.5)
      .setScale(uiScale);

    // --- Live preview card ---------------------------------------------
    // Small chip in the top-right corner that shows a sample HUD label and
    // a faux damage number, both re-rendering as the player tweaks uiScale,
    // damageNumbers, highContrastUi, and screenShake. Gives the "what does
    // this setting do" answer without requiring a trip to a live run.
    this.previewHandle = renderSettingsPreview(this, {
      centerX: width - 128,
      centerY: 72,
      width: 220,
      height: 76,
      depth: 4,
    }, {
      uiScale: this.working.uiScale,
      damageNumbers: this.working.damageNumbers,
      highContrastUi: this.working.highContrastUi,
      screenShake: this.working.screenShake,
    });

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
    this.addToggleRow(t('ui.settings.skipActIntermissions'), 'skipActIntermissions');
    this.addToggleRow(t('ui.settings.speedrun_timer'), 'speedrunTimerVisible');
    this.addToggleRow(t('ui.settings.ironmoorMode'), 'ironmoorMode', (proceed) =>
      this.promptIronmoorConfirm(proceed)
    );
    this.addBanterFrequencyRow();

    this.addSectionHeader(t('ui.settings.section_access'));
    this.addToggleRow(t('ui.settings.captions'), 'captionsEnabled');
    this.addSliderRow(t('ui.settings.caption_text_scale'), 'captionTextScale', 0.8, 1.4, 0.05);
    this.addToggleRow(t('ui.settings.high_contrast_ui'), 'highContrastUi');
    this.addToggleRow(t('ui.settings.reduce_particles'), 'reduceParticles');
    this.addToggleRow(t('ui.settings.reduce_flashing'), 'reduceFlashing');
    this.addToggleRow(t('ui.settings.capture_enabled'), 'captureEnabled');
    this.addToggleRow(t('ui.settings.telemetry_opt_in'), 'telemetryOptIn');
    this.addLocaleRow();
    this.addInputRebindRow();

    // A1 M6 — Assist Mode scaffold. Master toggle + game-speed slider
    // + three effect flags. Prefs persist today; the effects themselves
    // land in a follow-up update (see AssistMode.ts readers).
    this.addSectionHeader(t('ui.settings.section_assist'));
    this.addToggleRow(t('ui.settings.assist_mode'), 'assistMode');
    this.addSliderRow(t('ui.settings.assist_mode_speed'), 'assistModeGameSpeed', 0.5, 1, 0.05);
    this.addToggleRow(t('ui.settings.assist_mode_extended_iframes'), 'assistModeExtendedIFrames');
    this.addToggleRow(t('ui.settings.assist_mode_extended_combo'), 'assistModeExtendedComboWindow');
    this.addToggleRow(t('ui.settings.assist_mode_invincibility'), 'assistModeInvincibility');

    // --- BACK button ----------------------------------------------------
    // Sit just below the last row with a breathing gap rather than pinned
    // to the bottom of the viewport.
    const backY = Math.min(this.rowY + 32, height - 40);
    const { rect: back, label: backLabel } = createGameButton(this, {
      x: width / 2, y: backY, width: 220, height: 42,
      label: t('ui.settings.back'), tier: 'tertiary', fontSize: '16px', uiScale,
    });
    back.setStrokeStyle(2, SETTINGS_TROUGH_STROKE, 0.8);
    back.setScale(uiScale);
    backLabel.setScale(uiScale);
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

    // Reset-to-defaults chip — sits on the BACK row rather than adding
    // another row. Visual reset of every slider/toggle is its own
    // confirmation, so no modal.
    this.addResetChip(backY);

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
      this.previewHandle?.destroy();
      this.previewHandle = undefined;
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

    this.rowY += Math.round(22 * this.layoutScale);
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
    // Scots overlay is lazy-loaded; the promise resolves when the chunk
    // is cached. The locale row calls `scene.stop() + scene.start()` to
    // force a rebuild, which gives the dynamic import time to settle
    // before any strings are re-resolved — fire-and-forget is safe.
    void applyLocaleFromUserSettings(this.working);
    // Live preview tracks the working values so tweaks show up immediately.
    this.previewHandle?.refresh({
      uiScale: this.working.uiScale,
      damageNumbers: this.working.damageNumbers,
      highContrastUi: this.working.highContrastUi,
      screenShake: this.working.screenShake,
    });
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
    const rowStep = Math.round(this.BASE_ROW_STEP * this.layoutScale);
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
      .rectangle(trackX, trackY, trackW, trackH, SETTINGS_TROUGH_FILL, 1)
      .setStrokeStyle(1, SETTINGS_TROUGH_STROKE, 0.8)
      .setOrigin(0, 0.5);
    trough.setScale(this.uiScale, this.uiScale);

    // Warm fill showing the current value.
    const fillColor = resolveSettingsPalette(this.highContrastUi).sectionAccent;
    const fill = this.add.rectangle(trackX, trackY, 1, trackH - 2, fillColor, 1).setOrigin(0, 0.5);
    fill.setScale(1, this.uiScale);

    // Round thumb sits centered on the fill end.
    const thumb = this.add
      .circle(trackX, trackY, 7, fillColor, 1)
      .setStrokeStyle(2, SETTINGS_THUMB_STROKE, 1)
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
      valText.setText(formatSliderValue(key, current));
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

  private addToggleRow(
    label: string,
    key: ToggleKey,
    confirmOnEnable?: (proceed: () => void) => void
  ): void {
    const { width } = this.scale;
    const y = this.rowY;
    const rowStep = Math.round(this.BASE_ROW_STEP * this.layoutScale);
    this.rowY += rowStep;

    this.add
      .text(40, y + 4, label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: this.settingsLabelColor,
      })
      .setScale(this.uiScale);

    // Proper toggle switch: track + sliding thumb + side labels
    const trackStyle = resolveToggleTrackStyle(this.working[key]);
    const cx = width - 88;
    const cy = y + 18;
    const trackW = 58;
    const trackH = 22;
    const thumbR = 9;
    // Track (rounded rect appearance via stroked rect)
    const btn = this.add
      .rectangle(cx, cy, trackW, trackH, trackStyle.trackFill, 1)
      .setStrokeStyle(1.5, trackStyle.trackBorder, 0.9)
      .setInteractive({ useHandCursor: true });
    btn.setScale(this.uiScale);
    // Track inner shadow (depth)
    const shadow = this.add
      .rectangle(cx, cy - (trackH / 2) + Math.round(2 * this.uiScale), trackW - 4, 2, 0x000000, 0.3)
      .setScale(this.uiScale);
    // Thumb (sliding circle)
    const thumbLeftX = cx - trackW / 2 + thumbR + 3;
    const thumbRightX = cx + trackW / 2 - thumbR - 3;
    const thumb = this.add
      .circle(
        this.working[key] ? thumbRightX : thumbLeftX,
        cy,
        thumbR,
        trackStyle.thumbFill,
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
    const initialState = toggleStateDisplay(this.working[key]);
    const txt = this.add
      .text(cx - trackW / 2 - 8, cy, initialState.text, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: initialState.color,
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5)
      .setScale(this.uiScale);

    const sync = () => {
      const isOn = this.working[key];
      const s = resolveToggleTrackStyle(isOn);
      btn.setFillStyle(s.trackFill);
      btn.setStrokeStyle(1.5, s.trackBorder, 0.9);
      const state = toggleStateDisplay(isOn);
      txt.setText(state.text);
      txt.setColor(state.color);
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
      thumb.setFillStyle(s.thumbFill);
    };

    const doToggle = () => {
      audio.playClick();
      const nextValue = !this.working[key];
      if (nextValue && confirmOnEnable) {
        // Opt-in ceremony: defer the flip until the player commits through
        // the confirmation modal. Cancel leaves the toggle in its prior state.
        confirmOnEnable(() => {
          this.working[key] = true;
          sync();
          this.persistAndApply();
        });
        return;
      }
      this.working[key] = nextValue;
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
    const rowStep = Math.round(this.BASE_ROW_STEP * this.layoutScale);
    this.rowY += rowStep;

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
    const initialStyle = banterChipStyle(this.working.banterFrequency);
    const btn = this.add
      .rectangle(cx, cy, chipW, chipH, initialStyle.fillColor, 1)
      .setStrokeStyle(1.5, initialStyle.strokeColor, 0.9)
      .setInteractive({ useHandCursor: true });
    btn.setScale(this.uiScale);

    const txt = this.add
      .text(cx, cy, labelForBanterFrequency(this.working.banterFrequency), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: initialStyle.textColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(this.uiScale);

    const sync = () => {
      const v = this.working.banterFrequency;
      const style = banterChipStyle(v);
      txt.setText(labelForBanterFrequency(v));
      txt.setColor(style.textColor);
      btn.setFillStyle(style.fillColor);
      btn.setStrokeStyle(1.5, style.strokeColor, 0.9);
    };

    const cycle = () => {
      audio.playClick();
      this.working = {
        ...this.working,
        banterFrequency: cycleBanterFrequency(this.working.banterFrequency),
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

  /**
   * W18 language cycle row. Same chip UI as the banter row — a cycle
   * button with a label. English is the reference; Scots is an overlay
   * that falls back to English for unresolved keys. More locales slot
   * into `LOCALE_ORDER` without scene-level forks.
   */
  private addLocaleRow(): void {
    const { width } = this.scale;
    const y = this.rowY;
    const rowStep = Math.round(this.BASE_ROW_STEP * this.layoutScale);
    this.rowY += rowStep;

    this.add
      .text(40, y + 4, t('ui.settings.language'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: this.settingsLabelColor,
      })
      .setScale(this.uiScale);

    const chipW = 130;
    const chipH = 26;
    const cx = width - 88;
    const cy = y + 18;
    const btn = this.add
      .rectangle(cx, cy, chipW, chipH, 0x2d6a3e, 1)
      .setStrokeStyle(1.5, 0x4a9a5e, 0.9)
      .setInteractive({ useHandCursor: true });
    btn.setScale(this.uiScale);

    const current = (): LocaleKey => this.working.localeKey ?? 'en';
    const txt = this.add
      .text(cx, cy, labelForLocale(current()), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d4c2e8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(this.uiScale);

    const sync = () => {
      txt.setText(labelForLocale(current()));
    };

    const cycle = () => {
      audio.playClick();
      this.working = { ...this.working, localeKey: cycleLocaleKey(current()) };
      sync();
      this.persistAndApply();
      // Existing labels were rendered against the previous locale.
      // scene.restart() doesn't reliably tear down the rendered display
      // list before create() re-runs; stop + start forces a clean rebuild
      // so every row picks up the new overlay.
      this.scene.stop();
      this.scene.start('Settings');
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

  /**
   * A1 M3 — row that launches `SettingsInputScene` for key + gamepad
   * remap. Matches the locale-row chip style so it scans like the
   * rest of the accessibility cluster.
   */
  private addInputRebindRow(): void {
    const { width } = this.scale;
    const y = this.rowY;
    const rowStep = Math.round(this.BASE_ROW_STEP * this.layoutScale);
    this.rowY += rowStep;

    this.add
      .text(40, y + 4, t('ui.inputRebind.title'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: this.settingsLabelColor,
      })
      .setScale(this.uiScale);

    const chipW = 130;
    const chipH = 26;
    const cx = width - 88;
    const cy = y + 18;
    const btn = this.add
      .rectangle(cx, cy, chipW, chipH, 0x2d6a3e, 1)
      .setStrokeStyle(1.5, 0x4a9a5e, 0.9)
      .setInteractive({ useHandCursor: true });
    btn.setScale(this.uiScale);

    const txt = this.add
      .text(cx, cy, t('ui.inputRebind.title'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d4c2e8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(this.uiScale);

    const openRebindScene = () => {
      audio.playClick();
      this.persistAndApply();
      this.scene.start('SettingsInput');
    };

    btn.on('pointerdown', openRebindScene);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', openRebindScene);

    const mark = this.add
      .rectangle(width / 2, y + 10, width - 56, 34, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'toggle',
      toggle: openRebindScene,
      mark,
    });
  }

  /**
   * Reset-to-defaults chip — dim, quiet button on the BACK row (right
   * side) so it can't be mistaken for a primary action and doesn't add
   * another row to an already-tight panel. Click wipes persisted
   * settings via `SettingsManager.reset()` and restarts the scene so
   * every slider/toggle snaps back to default in one visible motion.
   */
  private addResetChip(y: number): void {
    const { width } = this.scale;
    const chipW = 110;
    const chipH = 32;
    const cx = width - 90;
    const { rect: btn, label: txt } = createGameButton(this, {
      x: cx, y, width: chipW, height: chipH,
      label: t('ui.settings.reset_action'),
      tier: 'secondary', fontSize: '13px', uiScale: this.uiScale,
      fillOverride: 0x2a2430, hoverOverride: 0x3a3040, textColorOverride: '#c8b8d4',
    });
    btn.setStrokeStyle(1.5, 0x5a4e64, 0.9);
    btn.setScale(this.uiScale);
    txt.setScale(this.uiScale);

    const doReset = () => {
      audio.playClick();
      performSettingsReset({
        settingsManager: this.settingsManager,
        restartScene: () => {
          this.scene.stop();
          this.scene.start('Settings');
        },
      });
    };

    btn.on('pointerdown', doReset);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', doReset);

    const mark = this.add
      .rectangle(cx, y, chipW + 10, chipH + 6, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'toggle',
      toggle: doReset,
      mark,
    });
  }

  /**
   * W66 Ironmoor opt-in ceremony. Modal blocks input until the player picks
   * Yes/No. Yes calls `proceed` (which flips the setting); No tears down and
   * leaves the toggle at its prior value. Keyboard Enter/Y confirms, Esc/N
   * cancels. Gamepad A confirms, B cancels.
   */
  private promptIronmoorConfirm(proceed: () => void): void {
    const { width, height } = this.scale;
    const DEPTH_BASE = 100;
    const palette = resolveSettingsPalette(this.highContrastUi);

    const scrim = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.72)
      .setDepth(DEPTH_BASE)
      .setInteractive();

    const panelW = Math.min(width - 80, 520);
    const panelH = 280;
    const panel = this.add
      .rectangle(width / 2, height / 2, panelW, panelH, 0x1a1420, 1)
      .setStrokeStyle(2, palette.sectionAccent, 1)
      .setDepth(DEPTH_BASE + 1);

    const title = this.add
      .text(width / 2, height / 2 - panelH / 2 + 36, t('ui.settings.ironmoor_confirm_title'), {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: palette.sectionColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(this.uiScale)
      .setDepth(DEPTH_BASE + 2);

    const body = this.add
      .text(width / 2, height / 2 - 10, t('ui.settings.ironmoor_confirm_body'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: palette.labelColor,
        align: 'center',
        wordWrap: { width: (panelW - 48) / Math.max(1, this.uiScale) },
        lineSpacing: 2,
      })
      .setOrigin(0.5)
      .setScale(this.uiScale)
      .setDepth(DEPTH_BASE + 2);

    const btnY = height / 2 + panelH / 2 - 44;
    const { rect: noBtn, label: noLabel } = createGameButton(this, {
      x: width / 2 - 110, y: btnY, width: 180, height: 40,
      label: t('ui.settings.ironmoor_confirm_no'),
      tier: 'tertiary', fontSize: '15px', uiScale: this.uiScale,
    });
    noBtn.setStrokeStyle(2, SETTINGS_TROUGH_STROKE, 0.9).setDepth(DEPTH_BASE + 2);
    noLabel.setDepth(DEPTH_BASE + 3);

    const { rect: yesBtn, label: yesLabel } = createGameButton(this, {
      x: width / 2 + 110, y: btnY, width: 180, height: 40,
      label: t('ui.settings.ironmoor_confirm_yes'),
      tier: 'primary', fontSize: '15px', uiScale: this.uiScale,
      fillOverride: 0x3a2218, hoverOverride: 0x4a2a20,
      textColorOverride: this.highContrastUi ? palette.sectionColor : palette.titleColor,
    });
    yesBtn.setStrokeStyle(2, palette.dangerAccent, 0.9).setDepth(DEPTH_BASE + 2);
    yesLabel.setDepth(DEPTH_BASE + 3);

    const cleanup: Phaser.GameObjects.GameObject[] = [
      scrim, panel, title, body, noBtn, noLabel, yesBtn, yesLabel,
    ];
    let closed = false;

    const close = () => {
      if (closed) return;
      closed = true;
      this.input.keyboard?.off('keydown', onKey);
      for (const go of cleanup) go.destroy();
    };

    const onYes = () => {
      if (closed) return;
      audio.playClick();
      close();
      proceed();
    };
    const onNo = () => {
      if (closed) return;
      audio.playClick();
      close();
    };

    // Factory already wired hover-fill and click sound for both buttons.
    noBtn.on('pointerdown', onNo);
    noLabel.setInteractive({ useHandCursor: true }).on('pointerdown', onNo);

    yesBtn.on('pointerdown', onYes);
    yesLabel.setInteractive({ useHandCursor: true }).on('pointerdown', onYes);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onNo();
      } else if (e.key === 'Enter' || e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        onYes();
      }
    };
    this.input.keyboard?.on('keydown', onKey);
  }
}
