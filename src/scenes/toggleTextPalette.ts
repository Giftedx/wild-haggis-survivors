/**
 * Shared on/off text colour pair for inline toggle buttons that
 * look like ordinary text (not the track-and-thumb sliders on
 * SettingsScene, which have their own palette in settingsToggle.ts).
 *
 * Used by:
 *  - MenuScene's loadout "on/off" labels
 *  - PauseMenu's SFX / Music toggles
 *
 * The warm green says "active", the muted rust says "quiet". Pulled
 * into a single palette so the two scenes can't drift apart.
 */

export interface ToggleTextPalette {
  on: string;
  off: string;
}

export const TOGGLE_TEXT_ON_COLOR = '#88cc88';
export const TOGGLE_TEXT_OFF_COLOR = '#886666';

export function resolveToggleTextColor(isOn: boolean): string {
  return isOn ? TOGGLE_TEXT_ON_COLOR : TOGGLE_TEXT_OFF_COLOR;
}
