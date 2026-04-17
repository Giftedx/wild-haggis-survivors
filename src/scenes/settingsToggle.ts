import { t } from '../core/i18n';

/**
 * Pure helpers for SettingsScene toggle rows — the side-label copy
 * and colour shown next to the thumb track. Pinned here so a future
 * change to the "on" / "off" wording (or palette) is a single edit.
 */

export interface ToggleStateDisplay {
  /** Localised "on" / "off" string shown to the right of the track. */
  text: string;
  /** Hex colour string for the side label. */
  color: string;
}

/** Muted green (matches the track's ON tint). */
export const TOGGLE_ON_LABEL_COLOR = '#99cc88';
/** Soft lilac grey (matches the track's OFF tint). */
export const TOGGLE_OFF_LABEL_COLOR = '#8a7a8a';

export function toggleStateDisplay(isOn: boolean): ToggleStateDisplay {
  return isOn
    ? { text: t('ui.settings.on'), color: TOGGLE_ON_LABEL_COLOR }
    : { text: t('ui.settings.off'), color: TOGGLE_OFF_LABEL_COLOR };
}
