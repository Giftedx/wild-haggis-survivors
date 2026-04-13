/**
 * Typography helpers that respect the user's a11y text-scale and
 * high-contrast settings. Consumers use these in place of inline
 * fontSize/strokeThickness literals so readability settings flow
 * through uniformly.
 *
 * All helpers re-read settings each call — runtime toggling from the
 * Comfort panel must take effect without recreating objects.
 */
import { getSettingsManager } from '../core/SettingsManager';

/**
 * Returns a Phaser-formatted fontSize string (e.g. `"18px"`) scaled by
 * the user's uiScale setting. Rounds to int for crispness on pixel-art
 * rendering.
 */
export function scaledFontSize(basePx: number): string {
  const ui = getSettingsManager().load().uiScale;
  return `${Math.max(8, Math.round(basePx * ui))}px`;
}

/**
 * Stroke thickness for outlined text. In high-contrast mode, doubles the
 * base thickness (capped at 6) so text stands off busy backgrounds like
 * the Highland terrain.
 */
export function scaledStrokeThickness(baseThickness: number): number {
  const s = getSettingsManager().load();
  const thick = s.highContrastUi ? Math.min(6, baseThickness * 2) : baseThickness;
  return Math.round(thick * s.uiScale);
}

/**
 * Preferred overlay backdrop alpha. High-contrast mode lifts it toward 1
 * so foreground text doesn't compete with gameplay visuals behind.
 */
export function scaledBackdropAlpha(baseAlpha: number): number {
  const hc = getSettingsManager().load().highContrastUi;
  if (!hc) return baseAlpha;
  return Math.min(0.95, baseAlpha + 0.25);
}

/**
 * Helper for combining a normal font color with a high-contrast override.
 * Callers pass their default + an optional HC override; if HC is on and
 * override provided, returns override; otherwise the default. Keeps
 * ternaries tidy at call sites.
 */
export function contrastColor(defaultColor: string, hcOverride?: string): string {
  if (!hcOverride) return defaultColor;
  return getSettingsManager().load().highContrastUi ? hcOverride : defaultColor;
}
