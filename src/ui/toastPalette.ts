import { COLORS_CSS } from '../config';

/**
 * Semantic toast color categories. Every showToast() call should
 * reference one of these instead of inline hex strings.
 */
export const TOAST_COLORS = {
  /** Gold pickups, milestone rewards, elite chain bonuses. */
  reward: COLORS_CSS.REWARD_GOLD,
  /** Evolution, legendary card selection. */
  legendary: COLORS_CSS.LEGENDARY,
  /** Weapon acquire, heal, positive state change. */
  positive: COLORS_CSS.POSITIVE_GREEN,
  /** Neutral status info, non-critical notifications. */
  info: COLORS_CSS.COOL_GREY,
  /** Curse, danger, caution. */
  warning: '#ff8844',
} as const;
