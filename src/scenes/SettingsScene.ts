import * as Phaser from 'phaser';
import { applyAudioFromUserSettings } from '../core/applyAudioFromSettings';
import { applyLocaleFromUserSettings } from '../core/applyLocaleFromSettings';
import { getSettingsManager, type ISettingsData } from '../core/SettingsManager';
import { globalEventBus } from '../core/GlobalEventBus';
import { audio } from '../systems/AudioSystem';
import { t } from '../core/i18n';
import {
  resolveSettingsPalette,
  SETTINGS_TROUGH_STROKE,
} from './settingsPalette';
import { addSceneBackdrop } from './sceneFade';
import { TWEEN_INFINITE_BREATHE } from '../utils/tweenPresets';
import { createGameButton } from '../ui/gameButton';
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
import { addSliderRow } from './settings/addSliderRow';
import { addToggleRow } from './settings/addToggleRow';
import { addBanterFrequencyRow } from './settings/addBanterFrequencyRow';
import { addLocaleRow } from './settings/addLocaleRow';
import { addColorblindRow } from './settings/addColorblindRow';
import { addInputRebindRow } from './settings/addInputRebindRow';
import { addResetChip } from './settings/addResetChip';
import type { SettingsRowContext } from './settings/rowContext';
import {
  createSettingsGamepadState,
  tickSettingsGamepad,
  type SettingsGamepadState,
} from './settings/tickSettingsGamepad';
import { promptIronmoorConfirm } from './settings/promptIronmoorConfirm';

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
  private saveFailureBanner?: Phaser.GameObjects.Text;
  private saveFailureUnsub?: () => void;
  private gamepadState: SettingsGamepadState = createSettingsGamepadState();
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
    this.uninstallSaveFailureListener();
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

    this.saveFailureBanner = this.add
      .text(width / 2, 116, '', {
        fontFamily: 'monospace',
        fontSize: width < 600 ? '10px' : '12px',
        color: '#ffb070',
        align: 'center',
        wordWrap: { width: (width - 64) / Math.max(1, uiScale) },
      })
      .setOrigin(0.5)
      .setScale(uiScale)
      .setDepth(30)
      .setVisible(false);
    this.saveFailureUnsub = globalEventBus.on('GLOBAL_SAVE_FAILED', (payload) => {
      if (payload.path !== 'settings') return;
      this.saveFailureBanner
        ?.setText(t('ui.game.save_failed', { path: payload.path }))
        .setVisible(true);
    });

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
      promptIronmoorConfirm({
        scene: this,
        uiScale: this.uiScale,
        highContrastUi: this.highContrastUi,
        proceed,
      }),
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

    // Assist Mode preferences remain runtime-wired but hidden until the
    // broader balance / replay-parity unhide pass clears.

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

    this.gamepadState.index = 0;
    this.applyGpHighlight();
    this.installDomFocusLayer();

    this.gpUpdate = () => this.tickGamepad();
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
      this.uninstallSaveFailureListener();
      this.saveFailureBanner = undefined;
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
      if (i === this.gamepadState.index) m.setStrokeStyle(2, 0xffe066, 0.9);
      else m.setStrokeStyle(0);
    }
    // Mirror the visible Phaser cursor into the DOM focus layer so an
    // assistive-tech user hears the same row the sighted player sees.
    this.domFocusLayer?.setFocusedIndex(this.gamepadState.index);
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
      initialFocusIndex: this.gamepadState.index >= 0 ? this.gamepadState.index : 0,
      onFocusIndexChange: (index) => {
        // DOM-side focus drives the canonical gamepad index. Re-render
        // the visible Phaser focus stroke without round-tripping back
        // into setFocusedIndex on the layer (it's already current).
        if (index < 0 || index >= this.gpRows.length) return;
        this.gamepadState.index = index;
        for (let i = 0; i < this.gpRows.length; i++) {
          const m = this.gpRows[i].mark;
          if (!m.active) continue;
          if (i === this.gamepadState.index) m.setStrokeStyle(2, 0xffe066, 0.9);
          else m.setStrokeStyle(0);
        }
      },
    });
  }

  private uninstallDomFocusLayer(): void {
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;
  }

  private uninstallSaveFailureListener(): void {
    this.saveFailureUnsub?.();
    this.saveFailureUnsub = undefined;
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
    this.domFocusLayer.setFocusedIndex(this.gamepadState.index);
  }

  private tickGamepad(): void {
    tickSettingsGamepad(
      this.input.gamepad?.pad1,
      this.gamepadState,
      this.gpRows,
      () => this.applyGpHighlight(),
    );
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
    step: number,
  ): void {
    addSliderRow(this.rowContext(), label, key, min, max, step);
  }

  /**
   * Builds the shared row-builder context the per-row helpers use.
   * One context is fine across every row — `takeRowY` advances the
   * shared cursor field, and `gpRows`/`domRowSyncs` are mutated by
   * reference. `working` is also shared; the slider+toggle path
   * mutates by property assignment, while cycle rows that replace
   * `this.working` always restart the scene immediately so any stale
   * reference inside a domAction thunk dies with the old layer.
   */
  private rowContext(): SettingsRowContext {
    return {
      scene: this,
      working: this.working,
      uiScale: this.uiScale,
      layoutScale: this.layoutScale,
      baseRowStep: this.BASE_ROW_STEP,
      valueColor: this.valueColor,
      highContrastUi: this.highContrastUi,
      takeRowY: () => {
        const y = this.rowY;
        const rowStep = Math.round(this.BASE_ROW_STEP * this.layoutScale);
        this.rowY += rowStep;
        return { y, rowStep };
      },
      gpRows: this.gpRows,
      domRowSyncs: this.domRowSyncs,
      isNarrowLayout: () => this.isNarrowLayout(),
      addRowLabel: (l, y, yOffset) => this.addRowLabel(l, y, yOffset),
      rightControlCenter: (w) => this.rightControlCenter(w),
      compactSettingsLabel: (l) => this.compactSettingsLabel(l),
      persistAndApply: () => this.persistAndApply(),
      refreshDomActions: () => this.refreshDomActions(),
    };
  }

  private addToggleRow(
    label: string,
    key: ToggleKey,
    confirmOnEnable?: (proceed: () => void) => void,
  ): void {
    addToggleRow(this.rowContext(), label, key, confirmOnEnable);
  }

  /**
   * Banter frequency — cycling row (Wheesht / Sparing / Natural / Gabby).
   * Styled like a toggle but clicking cycles forward through the 4 values.
   * Keeps the setting adjustable from gamepad via the same 'toggle' gp kind.
   */
  private addBanterFrequencyRow(): void {
    addBanterFrequencyRow(this.rowContext());
  }

  /**
   * W18 language cycle row. Same chip UI as the banter row — a cycle
   * button with a label. English is the reference; Scots is an overlay
   * that falls back to English for unresolved keys. More locales slot
   * into `LOCALE_ORDER` without scene-level forks.
   */
  private addLocaleRow(): void {
    addLocaleRow(this.rowContext(), {
      restartScene: () => {
        this.scene.stop();
        this.scene.start('Settings', returnTargetData(this.returnTo));
      },
    });
  }

  /**
   * A1 M2 — cycle row for colorblind LUT mode. Pattern mirrors the
   * locale row: a dim chip on the right cycles through the modes;
   * each change persists, applies the SVG filter live, and restarts
   * the scene so downstream palette references re-resolve cleanly.
   */
  private addColorblindRow(): void {
    addColorblindRow(this.rowContext());
  }

  /**
   * A1 M3 — row that launches `SettingsInputScene` for key + gamepad
   * remap. Matches the locale-row chip style so it scans like the
   * rest of the accessibility cluster.
   */
  private addInputRebindRow(): void {
    addInputRebindRow(this.rowContext(), {
      openRebindScene: () => {
        this.scene.start('SettingsInput', returnTargetData(this.returnTo));
      },
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
    addResetChip(this.rowContext(), {
      y,
      settingsManager: this.settingsManager,
      restartScene: () => {
        this.scene.stop();
        this.scene.start('Settings', returnTargetData(this.returnTo));
      },
    });
  }

}
