import { t } from '../core/i18n';
import { COLORS } from '../config';
import type { VariantUnlockProgress } from '../data/variants';

/**
 * Pure 3-state resolver for the MenuScene loadout badge (the pill
 * below a variant card saying "Selected" / "Select" / "Locked"). The
 * three states form a mutually exclusive progression:
 *
 *   selected  → ui.loadout.selected + green fill
 *   unlocked  → ui.loadout.select   + blue fill (hover/click to pick)
 *   locked    → ui.loadout.locked   + slate fill (not yet earned)
 *
 * Plus a supporting status line below the pill
 * (ui.loadout.status_current / status_switch / status_locked).
 */

export interface LoadoutBadgeStyle {
  fillColor: number;
  strokeColor: number;
  labelText: string;
  labelColor: string;
  statusText: string;
}

/**
 * Requirement line shown under the variant carousel — tells the
 * player either "ready to play" (unlocked, green) or "X / Y on the
 * progress bar" (locked, warm amber).
 */
export interface VariantRequirementLine {
  text: string;
  color: string;
}

export const VARIANT_REQUIREMENT_COLOR_READY = '#77c977';
export const VARIANT_REQUIREMENT_COLOR_LOCKED = '#d6aa55';

export function formatVariantRequirementLine(
  unlocked: boolean,
  progress: VariantUnlockProgress | null | undefined,
): VariantRequirementLine {
  if (unlocked) {
    return {
      text: t('ui.loadout.requirement_ready'),
      color: VARIANT_REQUIREMENT_COLOR_READY,
    };
  }
  return {
    text: t('ui.loadout.requirement_progress', {
      label: progress?.label ?? t('ui.loadout.requirement_locked'),
      current: progress?.currentText ?? '0',
      required: progress?.requiredText ?? '0',
    }),
    color: VARIANT_REQUIREMENT_COLOR_LOCKED,
  };
}

export function resolveLoadoutBadgeStyle(
  selected: boolean,
  unlocked: boolean,
): LoadoutBadgeStyle {
  if (selected) {
    return {
      fillColor: 0x2c7d45,
      strokeColor: unlocked ? 0x8bb4ff : 0x5a6070,
      labelText: t('ui.loadout.selected'),
      labelColor: '#ffffff',
      statusText: t('ui.loadout.status_current'),
    };
  }
  if (unlocked) {
    return {
      fillColor: COLORS.SCOTTISH_BLUE,
      strokeColor: 0x8bb4ff,
      labelText: t('ui.loadout.select'),
      labelColor: '#ffffff',
      statusText: t('ui.loadout.status_switch'),
    };
  }
  return {
    fillColor: 0x3a3f4d,
    strokeColor: 0x5a6070,
    labelText: t('ui.loadout.locked'),
    labelColor: '#a4a9b4',
    statusText: t('ui.loadout.status_locked'),
  };
}
