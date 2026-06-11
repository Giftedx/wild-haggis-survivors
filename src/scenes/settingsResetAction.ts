import type { SettingsManager, ISettingsData } from '../core/SettingsManager';

/**
 * Pure action composition for the "Reset to defaults" row on SettingsScene.
 *
 * Wiping the persisted settings and restarting the scene are both
 * side-effects on external systems — we compose them here so the row
 * handler stays one line at the call site and the sequence is testable
 * with plain spies.
 */
export interface SettingsResetDeps {
  settingsManager: Pick<SettingsManager, 'reset' | 'load'>;
  restartScene: () => void;
}

export interface SettingsResetResult {
  /** The defaults that will be loaded after reset — handy for UI preview tests. */
  defaults: ISettingsData;
}

export function performSettingsReset(deps: SettingsResetDeps): SettingsResetResult {
  deps.settingsManager.reset();
  const defaults = deps.settingsManager.load();
  deps.restartScene();
  return { defaults };
}
