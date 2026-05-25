import * as Phaser from 'phaser';
import { ACTION_KEYS, type ActionKey, DEFAULT_KEYBINDINGS, DEFAULT_GAMEPAD_BINDINGS } from '../core/actions';
import { getSettingsManager } from '../core/SettingsManager';
import { audio } from '../systems/AudioSystem';
import { t } from '../core/i18n';
import { addSceneBackdrop } from './sceneFade';
import { createGameButton } from '../ui/gameButton';
import { resolveSettingsPalette } from './settingsPalette';
import { formatKeyCode } from '../input/keyCodeDisplay';
import { applyKeyRebind, type RebindSlot } from '../input/applyKeyRebind';
import { applyGamepadRebind } from '../input/applyGamepadRebind';
import {
  resolveSceneReturnTarget,
  returnTargetData,
  type SceneReturnData,
  type SceneReturnTarget,
} from './returnTarget';
import { createDomFocusLayer, type DomFocusLayer } from '../ui/domFocusLayer';
import { bindHubMenuKeyboardNav } from '../ui/hubMenuKeyboardNav';
import { GamepadMenuNav, type GamepadMenuEntry } from '../utils/GamepadMenuNav';
import {
  buildCaptureModeActions,
  buildSettingsInputDomFocusActions,
  type SettingsInputActionLabels,
} from './settingsInputDomFocusActions';

type CaptureKind = 'keyboard' | 'gamepad';

interface CaptureTarget {
  action: ActionKey;
  slot: RebindSlot;
  kind: CaptureKind;
}

/**
 * A1 M3 — keyboard + gamepad remapping scene.
 *
 * Each row has two clickable slot chips (primary / secondary) per action.
 * Click a slot → scene enters capture mode: the next non-ESC `keydown`
 * is written to that slot via `applyKeyRebind` (pure resolver — conflict
 * detection lives there). ESC cancels capture.
 *
 * After every successful rebind the scene restarts so the row text
 * re-renders with the new bindings. Rebinds persist via
 * `SettingsManager.update` so reloading the game picks up the change
 * immediately; the next `InputMapper.refresh()` in whichever scene takes
 * focus rebuilds the Phaser Key objects.
 *
 * T407 — `GamepadMenuNav` + hub keyboard nav mirror the DOM focus layer
 * ordering from `buildSettingsInputDomFocusActions` (ghost hit rects sit
 * above chips for highlight rings without clobbering chip strokes). No
 * nav while a capture is active — the pad resolves binding capture directly.
 */
export class SettingsInputScene extends Phaser.Scene {
  private settingsManager = getSettingsManager();
  private uiScale = 1;
  private capture?: CaptureTarget;
  private statusText?: Phaser.GameObjects.Text;
  /** Button states at the moment gamepad capture entered, so we only
   *  match *new* button presses. Otherwise a held button would instantly
   *  resolve the capture. */
  private captureGamepadBaseline: boolean[] = [];
  private returnTo: SceneReturnTarget = 'MainMenu';
  /** T407 adoption #5 — DOM-visible focus mirror. Re-mounts on every
   *  scene.restart() since `create()` is the single seed point. */
  private domFocusLayer: DomFocusLayer | null = null;
  private gamepadNav: GamepadMenuNav | null = null;
  /** Same order as `buildSettingsInputDomFocusActions` — ghost rects for nav. */
  private t407Entries: GamepadMenuEntry[] = [];
  private hubKeyboardUnbind?: () => void;

  constructor() {
    super({ key: 'SettingsInput' });
  }

  init(data?: SceneReturnData): void {
    this.returnTo = resolveSceneReturnTarget(data?.returnTo);
  }

  create(): void {
    const { width, height } = this.scale;
    const { uiScale, highContrastUi } = this.settingsManager.load();
    this.uiScale = uiScale;
    this.hubKeyboardUnbind?.();
    this.hubKeyboardUnbind = undefined;
    this.gamepadNav?.destroy();
    this.gamepadNav = null;
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;
    this.t407Entries = [];
    const palette = resolveSettingsPalette(highContrastUi);

    addSceneBackdrop(this);

    this.add
      .text(width / 2, 40, t('ui.inputRebind.title'), {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: palette.titleColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScale(uiScale);

    this.add
      .text(width / 2, 72, t('ui.inputRebind.subtitle'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: palette.subtitleColor,
      })
      .setOrigin(0.5, 0)
      .setScale(uiScale);

    // Status line — shows capture prompt / conflict warning. Starts empty.
    this.statusText = this.add
      .text(width / 2, 100, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffd08a',
      })
      .setOrigin(0.5, 0)
      .setScale(uiScale);

    let y = 130;
    for (const action of ACTION_KEYS) {
      this.renderActionRow(action, y, palette);
      y += 48;
    }

    const backY = Math.min(y + 28, height - 40);
    this.renderResetChip(backY, palette);
    this.renderBackButton(backY, uiScale);

    // Global keyboard capture for rebinds.
    this.input.keyboard?.on('keydown', this.onKeydown);

    // T407 — DOM focus mirror + gamepad / hub keyboard nav.
    this.mountT407FocusStack();

    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleSettingsInputShutdown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSettingsInputShutdown, this);
  }

  private readonly handleSettingsInputShutdown = (): void => {
    this.hubKeyboardUnbind?.();
    this.hubKeyboardUnbind = undefined;
    this.gamepadNav?.destroy();
    this.gamepadNav = null;
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;
  };

  private renderActionRow(
    action: ActionKey,
    y: number,
    palette: ReturnType<typeof resolveSettingsPalette>,
  ): void {
    const { width } = this.scale;
    const { keyBindings, gamepadBindings } = this.settingsManager.load();
    const key = keyBindings[action];
    const pad = gamepadBindings[action];

    this.add
      .text(40, y, t(`ui.inputRebind.action.${action}`), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: palette.labelColor,
      })
      .setScale(this.uiScale);

    const slotX = Math.round(width * 0.40);
    this.renderKeySlotChip(action, 'primary', key.primary, slotX, y);
    this.renderKeySlotChip(action, 'secondary', key.secondary ?? '', slotX + 90, y);

    // Gamepad chips only render for actions with a default gamepad
    // binding (dash + pause). Movement actions rely on sticks / D-pad.
    if (pad) {
      this.renderGamepadSlotChip(action, 'primary', pad.primary, slotX + 190, y);
      this.renderGamepadSlotChip(
        action,
        'secondary',
        pad.secondary ?? null,
        slotX + 250,
        y,
      );
    }
  }

  private renderKeySlotChip(
    action: ActionKey,
    slot: RebindSlot,
    code: string,
    x: number,
    y: number,
  ): void {
    const capturing =
      this.capture?.action === action
      && this.capture.slot === slot
      && this.capture.kind === 'keyboard';
    const label = capturing
      ? '…'
      : code
        ? formatKeyCode(code)
        : t('ui.inputRebind.unbound');
    this.drawSlotChip(x, y, 82, label, capturing, () => this.beginCapture(action, slot, 'keyboard'));
  }

  private renderGamepadSlotChip(
    action: ActionKey,
    slot: RebindSlot,
    button: number | null,
    x: number,
    y: number,
  ): void {
    const capturing =
      this.capture?.action === action
      && this.capture.slot === slot
      && this.capture.kind === 'gamepad';
    const label = capturing
      ? '…'
      : button != null
        ? `${t('ui.inputRebind.gamepadPrefix')} ${button}`
        : t('ui.inputRebind.unbound');
    this.drawSlotChip(x, y, 56, label, capturing, () => this.beginCapture(action, slot, 'gamepad'));
  }

  private drawSlotChip(
    cx: number,
    y: number,
    w: number,
    label: string,
    capturing: boolean,
    onClick: () => void,
  ): void {
    const chipH = 26;
    const cy = y + 10;
    const chip = this.add
      .rectangle(cx, cy, w, chipH, capturing ? 0x6a4a2a : 0x2d3e5a, 1)
      .setStrokeStyle(1.5, capturing ? 0xffaa55 : 0x4a6a8a, 0.9)
      .setInteractive({ useHandCursor: true })
      .setDepth(1);
    chip.setScale(this.uiScale);

    const txt = this.add
      .text(cx, cy, label, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: capturing ? '#ffd08a' : '#c8d4ea',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(this.uiScale)
      .setDepth(4);

    chip.on('pointerdown', onClick);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', onClick);

    const ring = 3;
    const ghost = this.add
      .rectangle(cx, cy, w + ring * 2, chipH + ring * 2, 0x000000, 0.0001)
      .setStrokeStyle(0)
      .setDepth(2);
    ghost.setScale(this.uiScale);
    this.t407Entries.push({ rect: ghost, activate: onClick });
  }

  private beginCapture(action: ActionKey, slot: RebindSlot, kind: CaptureKind): void {
    if (this.capture) return;
    audio.playClick();
    this.capture = { action, slot, kind };
    if (kind === 'gamepad') {
      const pad = this.input.gamepad?.pad1;
      this.captureGamepadBaseline = pad?.buttons.map((b) => b.pressed) ?? [];
    }
    this.statusText?.setText(t('ui.inputRebind.rebind_hint'));
    this.mountT407FocusStack();
  }

  private renderResetChip(y: number, palette: ReturnType<typeof resolveSettingsPalette>): void {
    void palette;
    const { width } = this.scale;
    const cx = width - 150;
    // P3.6 — drop the custom fill / text-colour overrides so the RESET
    // chip inherits the standard 'secondary' tier styling (matches BACK
    // pill). Pre-fix the chip looked borderless / tacked on next to the
    // framed BACK button.
    const { rect, label } = createGameButton(this, {
      x: cx,
      y,
      width: 130,
      height: 34,
      label: t('ui.inputRebind.reset_defaults'),
      tier: 'secondary',
      fontSize: '12px',
      uiScale: this.uiScale,
    });
    rect.setScale(this.uiScale);
    label.setScale(this.uiScale);
    rect.on('pointerdown', () => this.activateReset());

    const ring = 3;
    const ghost = this.add
      .rectangle(rect.x, rect.y, rect.displayWidth + ring * 2, rect.displayHeight + ring * 2, 0x000000, 0.0001)
      .setStrokeStyle(0)
      .setDepth(rect.depth + 3);
    this.t407Entries.push({ rect: ghost, activate: () => this.activateReset() });
  }

  private renderBackButton(y: number, uiScale: number): void {
    const { width } = this.scale;
    const { rect: back, label: backLabel } = createGameButton(this, {
      x: width / 2,
      y,
      width: 220,
      height: 42,
      label: t('ui.settings.back'),
      tier: 'tertiary',
      fontSize: '16px',
      uiScale,
    });
    back.setScale(uiScale);
    backLabel.setScale(uiScale);
    back.on('pointerdown', () => this.activateBack());

    const ring = 3;
    const ghost = this.add
      .rectangle(back.x, back.y, back.displayWidth + ring * 2, back.displayHeight + ring * 2, 0x000000, 0.0001)
      .setStrokeStyle(0)
      .setDepth(back.depth + 3);
    this.t407Entries.push({ rect: ghost, activate: () => this.activateBack() });
  }

  /** Reset action shared by visible chip + DOM focus mirror. */
  private activateReset(): void {
    audio.playClick();
    this.resetToDefaults();
    this.scene.restart(returnTargetData(this.returnTo));
  }

  /** Back action shared by visible button + DOM focus mirror. */
  private activateBack(): void {
    audio.playClick();
    this.scene.start('Settings', returnTargetData(this.returnTo));
  }

  private onKeydown = (e: KeyboardEvent): void => {
    if (!this.capture) return;
    if (e.code === 'Escape') {
      this.capture = undefined;
      this.statusText?.setText('');
      this.scene.restart(returnTargetData(this.returnTo));
      return;
    }
    // ESC cancels all captures; keyboard events only drive keyboard captures.
    if (this.capture.kind !== 'keyboard') return;
    const { keyBindings } = this.settingsManager.load();
    const result = applyKeyRebind(keyBindings, this.capture.action, this.capture.slot, e.code);
    if (result.conflict) {
      const conflictAction = t(`ui.inputRebind.action.${result.conflict}`);
      this.statusText?.setText(`${t('ui.inputRebind.conflict_warning')} (${conflictAction})`);
      this.capture = undefined;
      return;
    }
    this.settingsManager.update((cur) => ({ ...cur, keyBindings: result.bindings }));
    audio.playClick();
    this.capture = undefined;
    this.statusText?.setText('');
    this.scene.restart(returnTargetData(this.returnTo));
  };

  update(): void {
    if (!this.capture || this.capture.kind !== 'gamepad') return;
    const pad = this.input.gamepad?.pad1;
    if (!pad?.connected) return;
    for (let i = 0; i < pad.buttons.length; i++) {
      const pressed = pad.buttons[i].pressed;
      const wasPressed = this.captureGamepadBaseline[i] === true;
      if (pressed && !wasPressed) {
        this.resolveGamepadCapture(i);
        return;
      }
    }
  }

  private resolveGamepadCapture(button: number): void {
    if (!this.capture) return;
    const { gamepadBindings } = this.settingsManager.load();
    const result = applyGamepadRebind(
      gamepadBindings,
      this.capture.action,
      this.capture.slot,
      button,
    );
    if (result.conflict) {
      const conflictAction = t(`ui.inputRebind.action.${result.conflict}`);
      this.statusText?.setText(`${t('ui.inputRebind.conflict_warning')} (${conflictAction})`);
      this.capture = undefined;
      return;
    }
    this.settingsManager.update((cur) => ({ ...cur, gamepadBindings: result.bindings }));
    audio.playClick();
    this.capture = undefined;
    this.statusText?.setText('');
    this.scene.restart(returnTargetData(this.returnTo));
  }

  /** Reset all bindings to defaults. Exposed for tests + UI chip. */
  resetToDefaults(): void {
    this.settingsManager.update((cur) => ({
      ...cur,
      keyBindings: structuredClone(DEFAULT_KEYBINDINGS),
      gamepadBindings: structuredClone(DEFAULT_GAMEPAD_BINDINGS),
    }));
  }

  /**
   * T407 adoption #5 — resolve the i18n chrome strings the helper needs
   * once per render. Kept private so the helper can stay Phaser-free.
   */
  private resolveChromeLabels(): SettingsInputActionLabels {
    return {
      action: t('ui.inputRebind.title'),
      primary: t('ui.inputRebind.a11y.slot_primary'),
      secondary: t('ui.inputRebind.a11y.slot_secondary'),
      keyboard: t('ui.inputRebind.a11y.kind_keyboard'),
      gamepad: t('ui.inputRebind.a11y.kind_gamepad'),
      unbound: t('ui.inputRebind.unbound_a11y'),
      gamepadPrefix: t('ui.inputRebind.gamepadPrefix'),
      reset: t('ui.inputRebind.reset_defaults'),
      back: t('ui.settings.back'),
      captureKeyboard: t('ui.inputRebind.a11y.capture_keyboard'),
      captureGamepad: t('ui.inputRebind.a11y.capture_gamepad'),
    };
  }

  private resolveActionLabels(): Record<ActionKey, string> {
    const out = {} as Record<ActionKey, string>;
    for (const action of ACTION_KEYS) {
      out[action] = t(`ui.inputRebind.action.${action}`);
    }
    return out;
  }

  /**
   * T407 — mount DOM focus mirror + `GamepadMenuNav` + hub keyboard nav.
   * Capture mode mounts DOM announcement only (no menu nav — pad resolves
   * binding capture in `update()`).
   */
  private mountT407FocusStack(): void {
    this.hubKeyboardUnbind?.();
    this.hubKeyboardUnbind = undefined;
    this.gamepadNav?.destroy();
    this.gamepadNav = null;
    this.domFocusLayer?.destroy();
    this.domFocusLayer = null;

    const chrome = this.resolveChromeLabels();
    const labels = this.resolveActionLabels();

    if (this.capture) {
      const cap = this.capture;
      if (typeof document !== 'undefined') {
        this.domFocusLayer = createDomFocusLayer({
          id: 'whs-settings-input-focus-layer',
          label: t('ui.inputRebind.title'),
          description: t('ui.inputRebind.subtitle'),
          role: 'group',
          actions: buildCaptureModeActions({
            action: cap.action,
            slot: cap.slot,
            kind: cap.kind,
            actionLabel: labels[cap.action],
            chrome,
          }),
        });
      }
      return;
    }

    const { keyBindings, gamepadBindings } = this.settingsManager.load();
    const actions = buildSettingsInputDomFocusActions({
      actions: ACTION_KEYS,
      keyBindings,
      gamepadBindings,
      labels,
      chrome,
      formatKeyCode,
      onActivateSlot: (action, slot, kind) => {
        this.beginCapture(action, slot, kind);
      },
      onActivateReset: () => this.activateReset(),
      onActivateBack: () => this.activateBack(),
    });

    if (typeof document !== 'undefined') {
      this.domFocusLayer = createDomFocusLayer({
        id: 'whs-settings-input-focus-layer',
        label: t('ui.inputRebind.title'),
        description: t('ui.inputRebind.subtitle'),
        role: 'group',
        actions,
        initialFocusIndex: 0,
        onFocusIndexChange: (index) => {
          this.gamepadNav?.syncExternalIndex(index);
        },
      });
    }

    const entries = this.t407Entries.filter((e) => e.rect.active);
    this.gamepadNav = new GamepadMenuNav(this, entries, {
      onHighlightChange: (i) => {
        this.domFocusLayer?.setFocusedIndex(i);
      },
    });
    this.domFocusLayer?.setFocusedIndex(this.gamepadNav.getIndex());

    this.hubKeyboardUnbind = bindHubMenuKeyboardNav(this, () => this.gamepadNav);
  }
}
