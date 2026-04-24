import * as Phaser from 'phaser';
import { ACTION_KEYS, type ActionKey, DEFAULT_KEYBINDINGS, DEFAULT_GAMEPAD_BINDINGS } from '../core/actions';
import { getSettingsManager } from '../core/SettingsManager';
import { audio } from '../systems/AudioSystem';
import { t } from '../core/i18n';
import { addSceneBackdrop } from './sceneFade';
import { createGameButton } from '../ui/gameButton';
import { resolveSettingsPalette } from './settingsPalette';
import { formatKeyCode } from '../input/keyCodeDisplay';

/**
 * A1 M3 — keyboard + gamepad remapping scene.
 *
 * Scaffold (T20): renders one row per `ActionKey` listing the current
 * primary + (optional) secondary binding with a "Rebind" placeholder
 * per slot. Rebind capture + conflict detection land in T21; gamepad
 * rebind lands in T22. The scene is launched from SettingsScene's
 * "Input" row and returns there via BACK.
 */
export class SettingsInputScene extends Phaser.Scene {
  private settingsManager = getSettingsManager();
  private uiScale = 1;

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

    let y = 130;
    for (const action of ACTION_KEYS) {
      this.renderActionRow(action, y, palette);
      y += 48;
    }

    const backY = Math.min(y + 32, height - 40);
    const { rect: back, label: backLabel } = createGameButton(this, {
      x: width / 2,
      y: backY,
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
    this.input.keyboard?.on('keydown-ESC', goBack);
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

    const primaryLabel = formatKeyCode(key.primary);
    const secondaryLabel = key.secondary ? formatKeyCode(key.secondary) : t('ui.inputRebind.unbound');
    const gamepadLabel = pad ? `${pad.primary}${pad.secondary != null ? ` / ${pad.secondary}` : ''}` : '—';

    const body = `${primaryLabel}  |  ${secondaryLabel}  |  ${t('ui.inputRebind.gamepadPrefix')} ${gamepadLabel}`;
    this.add
      .text(Math.round(width * 0.46), y, body, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: palette.valueColor,
      })
      .setScale(this.uiScale);
  }

  /** Reset all bindings to defaults (T23). Exposed for tests + UI chip. */
  resetToDefaults(): void {
    this.settingsManager.update((cur) => ({
      ...cur,
      keyBindings: structuredClone(DEFAULT_KEYBINDINGS),
      gamepadBindings: structuredClone(DEFAULT_GAMEPAD_BINDINGS),
    }));
  }
}
