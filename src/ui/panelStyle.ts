import { COLORS } from '../config';

export interface PanelStrokePreset {
  width: number;
  color: number;
  alpha: number;
}

export const PANEL_STROKE = {
  /** Standard panel border — menus, overlays, card frames. */
  standard: { width: 2, color: 0x2a3450, alpha: 0.8 } as PanelStrokePreset,
  /** Gold accent border — curse tiles, highlighted cards. */
  accent: { width: 2, color: COLORS.WHISKY_GOLD, alpha: 0.6 } as PanelStrokePreset,
} as const;
