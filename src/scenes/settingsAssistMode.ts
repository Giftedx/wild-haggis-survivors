import { t } from '../core/i18n';
import type { ISettingsData } from '../core/SettingsManager';

export type AssistModePreset = 'off' | 'timing' | 'invincible';

export const ASSIST_MODE_PRESET_ORDER: ReadonlyArray<AssistModePreset> = [
  'off',
  'timing',
  'invincible',
];

type AssistModeFields = Pick<
  ISettingsData,
  | 'assistMode'
  | 'assistModeGameSpeed'
  | 'assistModeExtendedIFrames'
  | 'assistModeExtendedComboWindow'
  | 'assistModeInvincibility'
>;

export function resolveAssistModePreset(settings: AssistModeFields): AssistModePreset {
  if (!settings.assistMode) return 'off';
  if (settings.assistModeInvincibility) return 'invincible';
  if (settings.assistModeExtendedIFrames || settings.assistModeExtendedComboWindow) return 'timing';
  return 'off';
}

export function applyAssistModePreset<T extends AssistModeFields>(
  settings: T,
  preset: AssistModePreset,
): T {
  switch (preset) {
    case 'timing':
      return {
        ...settings,
        assistMode: true,
        assistModeGameSpeed: 1,
        assistModeExtendedIFrames: true,
        assistModeExtendedComboWindow: true,
        assistModeInvincibility: false,
      };
    case 'invincible':
      return {
        ...settings,
        assistMode: true,
        assistModeGameSpeed: 1,
        assistModeExtendedIFrames: false,
        assistModeExtendedComboWindow: false,
        assistModeInvincibility: true,
      };
    case 'off':
      return {
        ...settings,
        assistMode: false,
        assistModeGameSpeed: 1,
        assistModeExtendedIFrames: false,
        assistModeExtendedComboWindow: false,
        assistModeInvincibility: false,
      };
  }
}

export function cycleAssistModePreset<T extends AssistModeFields>(settings: T): T {
  const current = resolveAssistModePreset(settings);
  const idx = ASSIST_MODE_PRESET_ORDER.indexOf(current);
  const next = ASSIST_MODE_PRESET_ORDER[(idx + 1) % ASSIST_MODE_PRESET_ORDER.length];
  return applyAssistModePreset(settings, next);
}

export function labelForAssistModePreset(preset: AssistModePreset): string {
  switch (preset) {
    case 'off': return t('ui.settings.assist_mode_preset_off');
    case 'timing': return t('ui.settings.assist_mode_preset_timing');
    case 'invincible': return t('ui.settings.assist_mode_preset_invincible');
  }
}
