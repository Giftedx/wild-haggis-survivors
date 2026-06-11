import { t } from '../core/i18n';
import type { ColorblindMode } from '../core/SettingsManager';

/**
 * A1 M2 — cycle order for the Settings colorblind-mode chip. `off`
 * sits first so a forward press enters each simulation in a predictable
 * order (trichromatic deficiencies first, achromatic last).
 */
export const COLORBLIND_MODE_ORDER: ReadonlyArray<ColorblindMode> = [
  'off',
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'monochrome',
];

export function labelForColorblindMode(mode: ColorblindMode): string {
  switch (mode) {
    case 'off': return t('ui.settings.colorblind_off');
    case 'protanopia': return t('ui.settings.colorblind_protanopia');
    case 'deuteranopia': return t('ui.settings.colorblind_deuteranopia');
    case 'tritanopia': return t('ui.settings.colorblind_tritanopia');
    case 'monochrome': return t('ui.settings.colorblind_monochrome');
  }
}

export function cycleColorblindMode(current: ColorblindMode): ColorblindMode {
  const idx = COLORBLIND_MODE_ORDER.indexOf(current);
  const next = (idx + 1) % COLORBLIND_MODE_ORDER.length;
  return COLORBLIND_MODE_ORDER[next];
}
