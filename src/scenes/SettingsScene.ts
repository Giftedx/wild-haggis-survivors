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
import { cycleColorblindMode, labelForColorblindMode } from './settingsColorblind';
import { applyColorblindFilterToCanvas } from '../systems/accessibility/applyColorblindFilter';
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
import {
  resolveSceneReturnTarget,
  returnTargetData,
  type SceneReturnData,
  type SceneReturnTarget,
} from './returnTarget';
import { createDomFocusLayer, type DomFocusLayer } from '../ui/domFocusLayer';
import {
  buildSettingsDomFocusActions,
  type SettingsDomActionInput,
} from './settingsDomFocusActions';

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
  | 'assistModeInvincibility'
  | 'disableSeasonalEvents'
  | 'disableHazards';

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
  /** Per-row hook that re-reads the row's current value text and pushes
   *  the refreshed action label into the DOM mirror. Indices line up
   *  one-for-one with `gpRows` so the focus mirror, gamepad index, and
   *  this array stay in lockstep. */
  private domRowSyncs: Array<() => SettingsDomActionInput> = [];
  private domFocusLayer: DomFocusLayer | null = null;
  private gpIdx = 0;
  private gpPrevU = false;
  private gpPrevD = false;
  private gpPrevL = false;
  private gpPrevR = false;
  private gpPrevA = false;
  private gpUpdate?: (time: number, delta: number) => void;
  private glowTweens: Phaser.Tweens.Tween[] = [];
  private previewHandle?: SettingsPreviewHandle;
  private returnTo: SceneReturnTarget = 'MainMenu';
  /** Base row stride before uiScale — shrunk from 42 to fit the 15-row
   *  panel once W18 language + W66 ironmoor + W2 skip rows landed. */
  private readonly BASE_ROW_STEP = 38;
  private readonly BASE_SECTION_GAP = 18;

  constructor() {
    super({ key: 'Settings' });
    this.working = this.settingsManager.load();
  }

  init(data?: SceneReturnData): void {
    this.returnTo = resolveSceneReturnTarget(data?.returnTo);
  }

  create(): void {
    this.working = { ...this.settingsManager.load() };
    // Scene reuse: tear down any DOM mirror left over from a previous
    // mount (locale cycle / reset both call `scene.start('Settings')`).
    // The shutdown handler also disposes; this guard covers the case
    // where create() runs before shutdown fires (Phaser scene reuse).
    this.uninstallDomFocusLayer();
    this.gpRows = [];
    this.domRowSyncs = [];
    this.glowTweens = [];
    const { width, height } = this.scale;

    // Respect the player's comfort settings even on the scene that configures
    // them. Without this, SettingsScene was the ONE scene that ignored
    // uiScale / highContrastUi — the Phase 3 accessibility work had a hole.
    const { uiScale, highContrastUi } = this.settingsManager.load();
    this.uiScale = uiScale;
    this.highContrastUi = highContrastUi;
    // Derive layoutScale — clamp so 22 rows + 3 section headers fit inside
    // the current viewport height. Pre-fix the floor was 0.8 which couldn't
    // shrink the stack enough at 720p; the BACK + RESET buttons pinned to
    // height-40 ended up overlapping the bottom rows (audit 03c). A 0.55
    // floor keeps labels legible at the densest stride while guaranteeing
    // every row sits above the button strip. Text remains at `uiScale`
    // for readability; only vertical stride compresses.
    const rowsCount = 22;
    const sectionCount = 3;
    const rowBase = rowsCount * this.BASE_ROW_STEP;
    // P1.4 — verticalReserve was 190 (130 + 60) which only matched a 56-px
    // sticky bar inside a 60-px reserve. The Controls sub-header at the
    // bottom of the row stack was being clipped under the bar. Bumped to
    // 130 + 80 = 210 to keep the last header clear of the bar's top edge.
    const verticalReserve = 130 + 80;
    const availableH = Math.max(200, height - verticalReserve);
    const requiredH = sectionCount * this.BASE_SECTION_GAP + (rowBase + sectionCount * 22) * uiScale;
    if (requiredH > availableH) {
      const fitScale = (availableH - sectionCount * this.BASE_SECTION_GAP) / (rowBase + sectionCount * 22);
      // P1.4 — floor dropped 0.55 → 0.45 so the densest stride still
      // squeezes the last "Controls" header above the sticky bar at 720 p.
      this.layoutScale = Math.max(0.45, Math.min(uiScale, fitScale));
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
        fontSize: width < 600 ? '10px' : '13px',
        color: subtitleColor,
        align: 'center',
        wordWrap: { width: (width - 40) / Math.max(1, uiScale) },
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
    const previewIsMobile = width < 600;
    if (!previewIsMobile) {
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
    } else {
      this.previewHandle = undefined;
    }

    // --- Rows (grouped) -------------------------------------------------
    this.rowY = previewIsMobile ? 122 : 130;
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
    this.addColorblindRow();
    this.addToggleRow(t('ui.settings.high_contrast_ui'), 'highContrastUi');
    this.addToggleRow(t('ui.settings.reduce_particles'), 'reduceParticles');
    this.addToggleRow(t('ui.settings.reduce_flashing'), 'reduceFlashing');
    this.addToggleRow(t('ui.settings.capture_enabled'), 'captureEnabled');
    this.addToggleRow(t('ui.settings.telemetry_opt_in'), 'telemetryOptIn');
    this.addToggleRow(t('ui.settings.disable_seasonal_events'), 'disableSeasonalEvents');
    this.addToggleRow(t('ui.settings.disable_hazards'), 'disableHazards');
    this.addLocaleRow();
    this.addInputRebindRow();

    // Assist Mode preferences remain persisted for future builds, but the
    // visible controls stay hidden until their runtime effects are wired.

    // --- BACK button (sticky bottom bar) -------------------------------
    // Pre-fix BACK + RESET sat at `Math.min(rowY+32, height-40)` with no
    // backdrop, so the row stack could extend underneath them on dense
    // viewports — the audit caught BACK overlapping the High-contrast UI
    // row (03c). Sticky bar with an opaque underlay hides any residual
    // overflow above and gives the buttons a clear seat at the bottom.
    const stickyBarH = 56;
    const stickyBarY = height - stickyBarH / 2 - 8;
    this.add
      .rectangle(width / 2, stickyBarY, width, stickyBarH, 0x0a1322, 0.96)
      .setStrokeStyle(1, 0x1f2a44, 0.9)
      .setDepth(20);
    const backY = stickyBarY;
    const narrowLayout = this.isNarrowLayout();
    const { rect: back, label: backLabel } = createGameButton(this, {
      x: narrowLayout ? width / 2 - 34 : width / 2,
      y: backY,
      width: narrowLayout ? 150 : 220,
      height: 42,
      label: t('ui.settings.back'),
      tier: 'tertiary',
      fontSize: narrowLayout ? '14px' : '16px',
      uiScale,
    });
    back.setStrokeStyle(2, SETTINGS_TROUGH_STROKE, 0.8);
    back.setScale(uiScale).setDepth(21);
    backLabel.setScale(uiScale).setDepth(22);
    const goBack = () => {
      audio.playClick();
      this.persistAndApply();
      this.scene.start(this.returnTo);
    };
    back.on('pointerdown', goBack);

    const backMark = this.add
      .rectangle(width / 2, backY, width - 48, 44, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({ kind: 'back', go: goBack, mark: backMark });
    // DOM mirror — BACK action persists settings + returns to caller.
    const backRowLabel = t('ui.settings.back');
    this.domRowSyncs.push(() => ({
      id: 'launch-back',
      kind: 'launch',
      label: backRowLabel,
      onActivate: goBack,
    }));

    // Reset-to-defaults chip — sits on the BACK row rather than adding
    // another row. Visual reset of every slider/toggle is its own
    // confirmation, so no modal.
    this.addResetChip(backY);

    this.gpIdx = 0;
    this.applyGpHighlight();
    this.installDomFocusLayer();

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
      this.uninstallDomFocusLayer();
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

  private isNarrowLayout(): boolean {
    return this.scale.width < 600;
  }

  private compactSettingsLabel(label: string): string {
    if (!this.isNarrowLayout()) return label;
    const stripped = label.replace(/\s*\([^)]*\)/g, '');
    if (/^Skip road-forks/i.test(stripped)) return 'Skip road-forks';
    if (/^Speedrun timer/i.test(stripped)) return 'Speedrun timer';
    if (/^Ironmoor/i.test(stripped)) return 'Ironmoor';
    if (/^Reduce particles/i.test(stripped)) return 'Reduce particles';
    if (/^Reduce flashing/i.test(stripped)) return 'Reduce flashing';
    if (/^Share anonymous/i.test(stripped)) return 'Share run stats';
    return stripped;
  }

  private addRowLabel(label: string, y: number, yOffset = 4): Phaser.GameObjects.Text {
    const narrow = this.isNarrowLayout();
    return this.add
      .text(narrow ? 28 : 40, y + yOffset, this.compactSettingsLabel(label), {
        fontFamily: 'monospace',
        fontSize: narrow ? '12px' : '14px',
        color: this.settingsLabelColor,
      })
      .setScale(this.uiScale);
  }

  private rightControlCenter(controlWidth: number): number {
    return this.isNarrowLayout()
      ? this.scale.width - controlWidth / 2 - 24
      : this.scale.width - 88;
  }

  private applyGpHighlight(): void {
    for (let i = 0; i < this.gpRows.length; i++) {
      const m = this.gpRows[i].mark;
      if (!m.active) continue;
      if (i === this.gpIdx) m.setStrokeStyle(2, 0xffe066, 0.9);
      else m.setStrokeStyle(0);
    }
    // Mirror the visible Phaser cursor into the DOM focus layer so an
    // assistive-tech user hears the same row the sighted player sees.
    this.domFocusLayer?.setFocusedIndex(this.gpIdx);
  }

  /**
   * T407 — install the DOM-visible focus mirror after every row has
   * been registered. Each row pushed an entry on `domRowSyncs` that
   * recomputes its current value text + activation callback; we run
   * that array once now to seed the action list.
   */
  private installDomFocusLayer(): void {
    if (typeof document === 'undefined') return;
    const inputs = this.domRowSyncs.map((sync) => sync());
    const actions = buildSettingsDomFocusActions(inputs);
    this.domFocusLayer = createDomFocusLayer({
      id: 'whs-settings-focus-layer',
      label: t('ui.settings.title'),
      description: t('ui.settings.subtitle'),
      role: 'group',
      actions,
      initialFocusIndex: this.gpIdx >= 0 ? this.gpIdx : 0,
      onFocusIndexChange: (index) => {
        // DOM-side focus drives the canonical gamepad index. Re-render
        // the visible Phaser focus stroke without round-tripping back
        // into setFocusedIndex on the layer (it's already current).
        if (index < 0 || index >= this.gpRows.length) return;
        this.gpIdx = index;
        for (let i = 0; i < this.gpRows.length; i++) {
          const m = this.gpRows[i].mark;
          if (!m.active) continue;
          if (i === this.gpIdx) m.setStrokeStyle(2, 0xffe066, 0.9);
          else m.setStrokeStyle(0);
        }
      },
    });
  }

  private uninstallDomFocusLayer(): void {
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;
  }

  /**
   * Refresh the entire DOM action set from the per-row sync hooks.
   * Called after any row's value mutates (slider bump, toggle flip,
   * cycle step) so the accessible label reflects the new state. The
   * focused index is preserved through the rebuild.
   */
  private refreshDomActions(): void {
    if (!this.domFocusLayer) return;
    const inputs = this.domRowSyncs.map((sync) => sync());
    this.domFocusLayer.setActions(buildSettingsDomFocusActions(inputs));
    this.domFocusLayer.setFocusedIndex(this.gpIdx);
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

    this.addRowLabel(label, y, 6);

    // Slider track geometry — keep the right margin clear for the value text.
    const narrow = this.isNarrowLayout();
    const trackX = narrow ? Math.round(width * 0.46) : Math.round(width * 0.46);
    const trackY = y + 14;
    const trackW = narrow ? Math.max(104, width - trackX - 76) : 240;
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
      .text(Math.min(width - 44, trackX + (trackW + 14) * this.uiScale), y + 6, '', {
        fontFamily: 'monospace',
        fontSize: narrow ? '11px' : '14px',
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
      this.refreshDomActions();
    };

    const bump = (direction: number) => {
      this.working[key] = steppedSliderBump(this.working[key], direction, min, max, step);
      syncVisual();
      this.persistAndApply();
      this.refreshDomActions();
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

    // P1.3 — mark height tracks rowStep so the focus ring doesn't overflow
    // into adjacent rows at low layoutScale (was fixed 36 px while rowStep
    // can drop to ~21 px when settings condense to fit a small viewport).
    const markH = Math.max(20, rowStep - 4);
    const mark = this.add
      .rectangle(width / 2, y + 14, width - 56, markH, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'slider',
      minus: () => bump(-1),
      plus: () => bump(+1),
      mark,
    });
    // DOM mirror — Enter / Space activates the same +1 bump path the
    // gamepad confirm button uses. The current value is folded into the
    // accessible label so a screen reader announces "Master volume — 80%".
    this.domRowSyncs.push(() => ({
      id: `slider-${key}`,
      kind: 'slider',
      label: this.compactSettingsLabel(label),
      valueText: formatSliderValue(key, this.working[key]),
      onActivate: () => bump(+1),
    }));
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

    this.addRowLabel(label, y);

    // Proper toggle switch: track + sliding thumb + side labels
    const trackStyle = resolveToggleTrackStyle(this.working[key]);
    const narrow = this.isNarrowLayout();
    const cx = this.rightControlCenter(narrow ? 54 : 58);
    const cy = y + 18;
    const trackW = narrow ? 54 : 58;
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
      .text(narrow ? cx : cx - trackW / 2 - 8, cy, initialState.text, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: initialState.color,
        fontStyle: 'bold',
      })
      .setOrigin(narrow ? 0.5 : 1, 0.5)
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
          this.refreshDomActions();
        });
        return;
      }
      this.working[key] = nextValue;
      sync();
      this.persistAndApply();
      this.refreshDomActions();
    };

    btn.on('pointerdown', doToggle);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', doToggle);
    // Shadow and thumb components also clickable for forgiving hitbox
    thumb.setInteractive({ useHandCursor: true });
    thumb.on('pointerdown', doToggle);
    // Silence unused-variable warning for shadow (it's drawn, not interacted with)
    void shadow;

    // P1.3 — mark height tracks rowStep so the focus ring doesn't overflow
    // into adjacent rows at low layoutScale.
    const markH = Math.max(20, rowStep - 4);
    const mark = this.add
      .rectangle(width / 2, y + 10, width - 56, markH, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'toggle',
      toggle: doToggle,
      mark,
    });
    // DOM mirror — Enter / Space drives the same flip-or-confirm path as
    // the canvas pointer. The current ON/OFF state folds into the label.
    this.domRowSyncs.push(() => ({
      id: `toggle-${key}`,
      kind: 'toggle',
      label: this.compactSettingsLabel(label),
      valueText: toggleStateDisplay(this.working[key]).text,
      onActivate: doToggle,
    }));
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

    this.addRowLabel(t('ui.settings.banter_frequency'), y);

    const chipW = this.isNarrowLayout() ? 104 : 110;
    const chipH = 26;
    const cx = this.rightControlCenter(chipW);
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
      this.refreshDomActions();
    };

    btn.on('pointerdown', cycle);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', cycle);

    // P1.3 — mark height tracks rowStep so the focus ring doesn't overflow
    // into adjacent rows at low layoutScale.
    const markH = Math.max(20, rowStep - 4);
    const mark = this.add
      .rectangle(width / 2, y + 10, width - 56, markH, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'toggle',
      toggle: cycle,
      mark,
    });
    // DOM mirror — cycles forward through the four banter levels.
    const banterLabel = t('ui.settings.banter_frequency');
    this.domRowSyncs.push(() => ({
      id: 'cycle-banter',
      kind: 'cycle',
      label: this.compactSettingsLabel(banterLabel),
      valueText: labelForBanterFrequency(this.working.banterFrequency),
      onActivate: cycle,
    }));
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

    this.addRowLabel(t('ui.settings.language'), y);

    const chipW = this.isNarrowLayout() ? 118 : 130;
    const chipH = 26;
    const cx = this.rightControlCenter(chipW);
    const cy = y + 18;
    const btn = this.add
      .rectangle(cx, cy, chipW, chipH, 0x2d6a3e, 1)
      .setStrokeStyle(1.5, 0x4a9a5e, 0.9)
      .setInteractive({ useHandCursor: true });
    btn.setScale(this.uiScale);

    const current = (): LocaleKey => this.working.localeKey ?? 'en';
    const localeLabel = () => this.isNarrowLayout() ? current().toUpperCase() : labelForLocale(current());
    const txt = this.add
      .text(cx, cy, localeLabel(), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d4c2e8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(this.uiScale);

    const sync = () => {
      txt.setText(localeLabel());
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
      this.scene.start('Settings', returnTargetData(this.returnTo));
    };

    btn.on('pointerdown', cycle);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', cycle);

    // P1.3 — mark height tracks rowStep so the focus ring doesn't overflow
    // into adjacent rows at low layoutScale.
    const markH = Math.max(20, rowStep - 4);
    const mark = this.add
      .rectangle(width / 2, y + 10, width - 56, markH, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'toggle',
      toggle: cycle,
      mark,
    });
    // DOM mirror — locale cycle. Activation restarts the scene which
    // reinstalls the layer with the new locale's labels, so no
    // refreshDomActions is needed here.
    const langLabel = t('ui.settings.language');
    this.domRowSyncs.push(() => ({
      id: 'cycle-locale',
      kind: 'cycle',
      label: this.compactSettingsLabel(langLabel),
      valueText: localeLabel(),
      onActivate: cycle,
    }));
  }

  /**
   * A1 M2 — cycle row for colorblind LUT mode. Pattern mirrors the
   * locale row: a dim chip on the right cycles through the modes;
   * each change persists, applies the SVG filter live, and restarts
   * the scene so downstream palette references re-resolve cleanly.
   */
  private addColorblindRow(): void {
    const { width } = this.scale;
    const y = this.rowY;
    const rowStep = Math.round(this.BASE_ROW_STEP * this.layoutScale);
    this.rowY += rowStep;

    this.addRowLabel(t('ui.settings.colorblind_mode'), y);

    const chipW = this.isNarrowLayout() ? 118 : 130;
    const chipH = 26;
    const cx = this.rightControlCenter(chipW);
    const cy = y + 18;
    const btn = this.add
      .rectangle(cx, cy, chipW, chipH, 0x2d6a3e, 1)
      .setStrokeStyle(1.5, 0x4a9a5e, 0.9)
      .setInteractive({ useHandCursor: true });
    btn.setScale(this.uiScale);

    const current = () => this.working.colorblindMode;
    const txt = this.add
      .text(cx, cy, labelForColorblindMode(current()), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d4c2e8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(this.uiScale);

    const cycle = () => {
      audio.playClick();
      this.working = { ...this.working, colorblindMode: cycleColorblindMode(current()) };
      txt.setText(labelForColorblindMode(current()));
      this.persistAndApply();
      // Apply live so player previews without a restart. Canvas ref
      // taken from the game game instance.
      const canvas = this.sys.game.canvas as HTMLCanvasElement | undefined;
      if (canvas) applyColorblindFilterToCanvas(canvas, current());
      this.refreshDomActions();
    };

    btn.on('pointerdown', cycle);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', cycle);

    // P1.3 — mark height tracks rowStep so the focus ring doesn't overflow
    // into adjacent rows at low layoutScale.
    const markH = Math.max(20, rowStep - 4);
    const mark = this.add
      .rectangle(width / 2, y + 10, width - 56, markH, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'toggle',
      toggle: cycle,
      mark,
    });
    // DOM mirror — colorblind cycle. Re-emit the action set after each
    // step so the announce string carries the new mode label.
    const cbLabel = t('ui.settings.colorblind_mode');
    this.domRowSyncs.push(() => ({
      id: 'cycle-colorblind',
      kind: 'cycle',
      label: this.compactSettingsLabel(cbLabel),
      valueText: labelForColorblindMode(current()),
      onActivate: cycle,
    }));
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

    this.addRowLabel(t('ui.inputRebind.title'), y);

    const chipW = this.isNarrowLayout() ? 118 : 130;
    const chipH = 26;
    const cx = this.rightControlCenter(chipW);
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
      this.scene.start('SettingsInput', returnTargetData(this.returnTo));
    };

    btn.on('pointerdown', openRebindScene);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', openRebindScene);

    // P1.3 — mark height tracks rowStep so the focus ring doesn't overflow
    // into adjacent rows at low layoutScale.
    const markH = Math.max(20, rowStep - 4);
    const mark = this.add
      .rectangle(width / 2, y + 10, width - 56, markH, 0x000000, 0)
      .setStrokeStyle(0);
    this.gpRows.push({
      kind: 'toggle',
      toggle: openRebindScene,
      mark,
    });
    // DOM mirror — launch action; opens the rebind sub-scene which
    // restarts SettingsScene on return, so no live refresh needed.
    const rebindLabel = t('ui.inputRebind.title');
    this.domRowSyncs.push(() => ({
      id: 'launch-rebind',
      kind: 'launch',
      label: this.compactSettingsLabel(rebindLabel),
      onActivate: openRebindScene,
    }));
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
    const narrow = this.isNarrowLayout();
    const chipW = narrow ? 84 : 110;
    const chipH = 32;
    const cx = narrow ? width - chipW / 2 - 28 : width - 90;
    const { rect: btn, label: txt } = createGameButton(this, {
      x: cx, y, width: chipW, height: chipH,
      label: t('ui.settings.reset_action'),
      tier: 'secondary', fontSize: narrow ? '11px' : '13px', uiScale: this.uiScale,
      fillOverride: 0x2a2430, hoverOverride: 0x3a3040, textColorOverride: '#c8b8d4',
    });
    btn.setStrokeStyle(1.5, 0x5a4e64, 0.9);
    btn.setScale(this.uiScale).setDepth(21);
    txt.setScale(this.uiScale).setDepth(22);

    const doReset = () => {
      audio.playClick();
      performSettingsReset({
        settingsManager: this.settingsManager,
        restartScene: () => {
          this.scene.stop();
          this.scene.start('Settings', returnTargetData(this.returnTo));
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
    // DOM mirror — RESET action restarts the scene so no live refresh.
    const resetLabel = t('ui.settings.reset_action');
    this.domRowSyncs.push(() => ({
      id: 'launch-reset',
      kind: 'launch',
      label: resetLabel,
      onActivate: doReset,
    }));
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

    const narrow = width < 600;
    const panelW = Math.min(width - (narrow ? 40 : 80), 520);
    const panelH = narrow ? 280 : 280;
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
    const btnGap = narrow ? 16 : 40;
    const btnW = narrow ? Math.floor((panelW - 48 - btnGap) / 2) : 180;
    const btnOffset = btnW / 2 + btnGap / 2;
    const { rect: noBtn, label: noLabel } = createGameButton(this, {
      x: width / 2 - btnOffset, y: btnY, width: btnW, height: 40,
      label: t('ui.settings.ironmoor_confirm_no'),
      tier: 'tertiary', fontSize: narrow ? '13px' : '15px', uiScale: this.uiScale,
    });
    noBtn.setStrokeStyle(2, SETTINGS_TROUGH_STROKE, 0.9).setDepth(DEPTH_BASE + 2);
    noLabel.setDepth(DEPTH_BASE + 3);

    const { rect: yesBtn, label: yesLabel } = createGameButton(this, {
      x: width / 2 + btnOffset, y: btnY, width: btnW, height: 40,
      label: t('ui.settings.ironmoor_confirm_yes'),
      tier: 'primary', fontSize: narrow ? '13px' : '15px', uiScale: this.uiScale,
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
