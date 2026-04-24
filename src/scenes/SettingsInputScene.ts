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

interface CaptureTarget {
  action: ActionKey;
  slot: RebindSlot;
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
 */
export class SettingsInputScene extends Phaser.Scene {
  private settingsManager = getSettingsManager();
  private uiScale = 1;
  private capture?: CaptureTarget;
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsInput' });
  }

  create(): void {
    const { width, height } = this.scale;
    const { uiScale, highContrastUi } = this.settingsManager.load();
    this.uiScale = uiScale;
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
  }

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

    const slotX = Math.round(width * 0.46);
    this.renderSlotChip(action, 'primary', key.primary, slotX, y);
    this.renderSlotChip(action, 'secondary', key.secondary ?? '', slotX + 90, y);

    const gamepadLabel = pad
      ? `${t('ui.inputRebind.gamepadPrefix')} ${pad.primary}${pad.secondary != null ? ` / ${pad.secondary}` : ''}`
      : '';
    if (gamepadLabel) {
      this.add
        .text(slotX + 200, y, gamepadLabel, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: palette.valueColor,
        })
        .setScale(this.uiScale);
    }
  }

  private renderSlotChip(
    action: ActionKey,
    slot: RebindSlot,
    code: string,
    x: number,
    y: number,
  ): void {
    const capturing =
      this.capture && this.capture.action === action && this.capture.slot === slot;
    const label = capturing
      ? '…'
      : code
        ? formatKeyCode(code)
        : t('ui.inputRebind.unbound');
    const chipW = 82;
    const chipH = 26;
    const cx = x;
    const cy = y + 10;
    const chip = this.add
      .rectangle(cx, cy, chipW, chipH, capturing ? 0x6a4a2a : 0x2d3e5a, 1)
      .setStrokeStyle(1.5, capturing ? 0xffaa55 : 0x4a6a8a, 0.9)
      .setInteractive({ useHandCursor: true });
    chip.setScale(this.uiScale);

    const txt = this.add
      .text(cx, cy, label, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: capturing ? '#ffd08a' : '#c8d4ea',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(this.uiScale);

    const beginCapture = () => {
      if (this.capture) return;
      audio.playClick();
      this.capture = { action, slot };
      this.statusText?.setText(t('ui.inputRebind.rebind_hint'));
      this.scene.restart();
    };
    chip.on('pointerdown', beginCapture);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', beginCapture);
  }

  private renderResetChip(y: number, palette: ReturnType<typeof resolveSettingsPalette>): void {
    void palette;
    const { width } = this.scale;
    const cx = width - 150;
    const { rect, label } = createGameButton(this, {
      x: cx,
      y,
      width: 130,
      height: 34,
      label: t('ui.inputRebind.reset_defaults'),
      tier: 'secondary',
      fontSize: '12px',
      uiScale: this.uiScale,
      fillOverride: 0x2a2430,
      hoverOverride: 0x3a3040,
      textColorOverride: '#c8b8d4',
    });
    rect.setScale(this.uiScale);
    label.setScale(this.uiScale);
    rect.on('pointerdown', () => {
      audio.playClick();
      this.resetToDefaults();
      this.scene.restart();
    });
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
    const goBack = () => {
      audio.playClick();
      this.scene.start('Settings');
    };
    back.on('pointerdown', goBack);
  }

  private onKeydown = (e: KeyboardEvent): void => {
    if (!this.capture) return;
    if (e.code === 'Escape') {
      this.capture = undefined;
      this.statusText?.setText('');
      this.scene.restart();
      return;
    }
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
    this.scene.restart();
  };

  /** Reset all bindings to defaults. Exposed for tests + UI chip. */
  resetToDefaults(): void {
    this.settingsManager.update((cur) => ({
      ...cur,
      keyBindings: structuredClone(DEFAULT_KEYBINDINGS),
      gamepadBindings: structuredClone(DEFAULT_GAMEPAD_BINDINGS),
    }));
  }
}
