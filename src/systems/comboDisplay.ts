import { t } from '../core/i18n';
import { comboDamageBonusPct } from './comboDamage';

/**
 * Pure view-state for the HUD combo chip.
 *
 * Visibility: combo hides below 5 or when the combo timer has
 * expired. When visible, a 3-tier palette reflects intensity:
 *
 *   count >= 50  → whisky gold (#d4a017) — "you're on fire"
 *   count >= 20  → warm amber  (#e8a830)
 *   else         → orange-brown (#cc8822)
 *
 * Bonus text appears when the current combo's damage bonus > 0%.
 */

export const COMBO_VISIBLE_THRESHOLD = 5;
export const COMBO_FIRE_TIER = 50;
export const COMBO_AMBER_TIER = 20;

export const COMBO_COLOR_FIRE = '#d4a017';
export const COMBO_COLOR_AMBER = '#e8a830';
export const COMBO_COLOR_ORANGE = '#cc8822';
/** Colour held while the combo chip is hidden (resets between visible bursts). */
export const COMBO_COLOR_HIDDEN = '#ff8800';

export interface ComboDisplayState {
  visible: boolean;
  color: string;
  /** Fully-i18n'd text for `comboText.setText(...)` when visible. */
  text: string;
}

export function resolveComboDisplay(
  comboCount: number,
  comboTimerMs: number,
): ComboDisplayState {
  if (comboCount < COMBO_VISIBLE_THRESHOLD || comboTimerMs <= 0) {
    return { visible: false, color: COMBO_COLOR_HIDDEN, text: '' };
  }
  const bonusPct = comboDamageBonusPct(comboCount);
  const bonusText = bonusPct > 0 ? t('ui.hud.combo_bonus', { pct: bonusPct }) : '';
  const text = t('ui.hud.combo', { count: comboCount, bonus: bonusText });
  let color: string;
  if (comboCount >= COMBO_FIRE_TIER) color = COMBO_COLOR_FIRE;
  else if (comboCount >= COMBO_AMBER_TIER) color = COMBO_COLOR_AMBER;
  else color = COMBO_COLOR_ORANGE;
  return { visible: true, color, text };
}
