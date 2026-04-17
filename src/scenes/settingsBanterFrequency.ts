import { t } from '../core/i18n';
import type { ISettingsData } from '../core/SettingsManager';

export type BanterFrequency = ISettingsData['banterFrequency'];

/**
 * Cycle order for the Settings banter-frequency chip. Ordered from
 * least-to-most chatty so a forward cycle crescendos.
 */
export const BANTER_FREQUENCY_ORDER: ReadonlyArray<BanterFrequency> = [
  'off', 'sparing', 'normal', 'chatty',
];

/** i18n label for each frequency value. Exhaustive switch. */
export function labelForBanterFrequency(freq: BanterFrequency): string {
  switch (freq) {
    case 'off': return t('ui.settings.banter_off');
    case 'sparing': return t('ui.settings.banter_sparing');
    case 'normal': return t('ui.settings.banter_normal');
    case 'chatty': return t('ui.settings.banter_chatty');
  }
}

/** Step to the next frequency in the cycle; wraps around. */
export function cycleBanterFrequency(current: BanterFrequency): BanterFrequency {
  const idx = BANTER_FREQUENCY_ORDER.indexOf(current);
  const next = (idx + 1) % BANTER_FREQUENCY_ORDER.length;
  return BANTER_FREQUENCY_ORDER[next];
}

/**
 * Chip palette for the banter-frequency row. "off" renders in a
 * muted grey; any active frequency uses the same "on" palette as
 * the toggle rows (visual consistency).
 */
export interface BanterChipStyle {
  /** 0xRRGGBB fill for the chip background. */
  fillColor: number;
  /** 0xRRGGBB stroke colour. */
  strokeColor: number;
  /** Hex colour string for the chip label text. */
  textColor: string;
}

export const BANTER_CHIP_OFF: BanterChipStyle = {
  fillColor: 0x2a2244,
  strokeColor: 0x4a3a5a,
  textColor: '#8a7a8a',
};

export const BANTER_CHIP_ON: BanterChipStyle = {
  fillColor: 0x2d6a3e,
  strokeColor: 0x4a9a5e,
  textColor: '#d4c2e8',
};

export function banterChipStyle(freq: BanterFrequency): BanterChipStyle {
  return freq === 'off' ? BANTER_CHIP_OFF : BANTER_CHIP_ON;
}
