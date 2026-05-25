import { getSettingsManager } from '../../core/SettingsManager';

/**
 * A1 M6 — Assist Mode readers.
 *
 * Single-purpose read API for the five Assist Mode settings. Sub-effects
 * are *gated by the master toggle*: when `assistMode` is off, all sub-
 * readers return their neutral value (false / 1) regardless of whether
 * the individual flag persists true. This keeps the contract simple for
 * call sites — one read per effect, no manual master-check.
 *
 * Runtime effects are wired in narrow, bounded call sites documented in
 * docs/A1_ASSIST_MODE_CALLSITES.md. The Settings panel keeps Assist Mode
 * rows hidden until the broader balance / replay-parity unhide pass.
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
