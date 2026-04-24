import { getSettingsManager } from '../../core/SettingsManager';

/**
 * A1 M6 — Assist Mode readers.
 *
 * Single-purpose read API for the five Assist Mode settings. Sub-effects
 * are *gated by the master toggle*: when `assistMode` is off, all sub-
 * readers return their neutral value (false / 1) regardless of whether
 * the individual flag persists true. This keeps the contract simple for
 * call sites in Phase 2 — one read per effect, no manual master-check.
 *
 * Effects themselves aren't wired in M6 (scaffold milestone). Phase 2
 * threads these readers into JuiceSystem / Player iFrames / combo grace
 * window / GameScene timeScale.
 */

export function isAssistModeEnabled(): boolean {
  return getSettingsManager().load().assistMode === true;
}

export function getAssistModeGameSpeed(): number {
  const s = getSettingsManager().load();
  return s.assistMode ? s.assistModeGameSpeed : 1;
}

export function isExtendedIFramesEnabled(): boolean {
  const s = getSettingsManager().load();
  return s.assistMode === true && s.assistModeExtendedIFrames === true;
}

export function isExtendedComboWindowEnabled(): boolean {
  const s = getSettingsManager().load();
  return s.assistMode === true && s.assistModeExtendedComboWindow === true;
}

export function isInvincibilityEnabled(): boolean {
  const s = getSettingsManager().load();
  return s.assistMode === true && s.assistModeInvincibility === true;
}
