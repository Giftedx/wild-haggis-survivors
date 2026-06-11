import { COLORS_CSS } from '../config';

/**
 * Pure style helpers for the MenuScene variant carousel panel.
 *
 * Three small 2-state style resolvers that were inlined as ternaries:
 *   - panel stroke: brighter slate-blue when the variant is
 *     unlocked, muted charcoal when locked
 *   - variant name text colour: white when unlocked, dimmed grey
 *     when locked
 *   - lifetime tally colour: mint green when the variant has at
 *     least one win, quiet slate when all recorded runs are losses
 *
 * Extracting keeps the loadout panel's visual hierarchy pinned to
 * one file and lets tests enforce "unlocked reads stronger than
 * locked" for each pair.
 */

export const VARIANT_PANEL_STROKE_UNLOCKED = 0x4f77b7;
export const VARIANT_PANEL_STROKE_LOCKED = 0x3f4657;

export const VARIANT_NAME_COLOR_UNLOCKED = COLORS_CSS.WHITE;
export const VARIANT_NAME_COLOR_LOCKED = '#d1d6e0';

export const VARIANT_TALLY_COLOR_HAS_WINS = '#9de6a8';
export const VARIANT_TALLY_COLOR_NO_WINS = '#a4a9b4';

export function resolveVariantPanelStroke(unlocked: boolean): number {
  return unlocked ? VARIANT_PANEL_STROKE_UNLOCKED : VARIANT_PANEL_STROKE_LOCKED;
}

export function resolveVariantNameColor(unlocked: boolean): string {
  return unlocked ? VARIANT_NAME_COLOR_UNLOCKED : VARIANT_NAME_COLOR_LOCKED;
}

export function resolveVariantTallyColor(wins: number): string {
  return wins > 0 ? VARIANT_TALLY_COLOR_HAS_WINS : VARIANT_TALLY_COLOR_NO_WINS;
}
