/**
 * Pure layout + palette helpers for the Moor Road node-map HUD widget.
 *
 * Split from `NodeMapUI.ts` (Phaser adapter) so vitest can cover the
 * geometry math without mocking the whole scene graph. The adapter does
 * nothing but feed these results into Phaser draw calls.
 */
import type { NodeMapState } from '../systems/NodeMapSystem';
import type { NodeType } from '../data/nodeTypes';

/**
 * Per-type icon fill colour. Palettes map to the five tonal registers in
 * `docs/ART_STYLE_BIBLE.md §Tonal palette map`:
 *   - encounter → Wild (steel)
 *   - shrine    → Fey (pale violet)
 *   - wee_trader→ Wild Comedy (sodium amber)
 *   - hidden    → Hearth-Fey mix (shimmer gold)
 *   - bargain   → Fey/Grave blend (cold blue)
 *   - rest      → Hearth (warm gold)
 *   - elite     → Grave (deep red)
 */
export const NODE_ICON_FILL: Readonly<Record<NodeType, number>> = {
  encounter: 0x8a8aa0,
  shrine: 0xc5a7ff,
  wee_trader: 0xffc56b,
  hidden: 0xfff0a8,
  bargain: 0x5b6b8a,
  rest: 0xffd47a,
  elite: 0xff5a5a,
};

/** Stroke colour rendered behind the current-node icon (brighter). */
export const NODE_ICON_CURRENT_STROKE = 0xfff0a8;
/** Stroke colour for un-visited, non-current nodes (faint). */
export const NODE_ICON_DEFAULT_STROKE = 0x2a2a32;
/** Alpha multiplier for visited icons (dimmed). */
export const NODE_ICON_VISITED_ALPHA = 0.35;

export interface NodeMapUiLayoutOpts {
  /** Anchor point for the top-right corner of the widget. */
  readonly anchorX: number;
  readonly anchorY: number;
  /** UI scale multiplier (settings.uiScale). */
  readonly uiScale: number;
  /** Expanded state — full bar vs compact pill. Default false. */
  readonly expanded?: boolean;
}

export interface IconRect {
  readonly index: number;
  readonly type: NodeType;
  /** Centre position of the icon in screen space. */
  readonly cx: number;
  readonly cy: number;
  readonly size: number;
  readonly visited: boolean;
  readonly current: boolean;
}

export interface BarLayout {
  /** Background rectangle top-left corner + dimensions. */
  readonly bgX: number;
  readonly bgY: number;
  readonly bgW: number;
  readonly bgH: number;
  /** Centre of the label text (e.g. "Act 1 · 2/4"). */
  readonly labelCx: number;
  readonly labelCy: number;
  readonly icons: readonly IconRect[];
}

// Base geometry (pre-uiScale).
const ICON_SIZE_BASE = 16;
const ICON_GAP_BASE = 6;
const BAR_PAD_X_BASE = 12;
const LABEL_WIDTH_BASE = 88; // "Act 1 · 2/4" style
const COMPACT_WIDTH_BASE = 96;
const BAR_HEIGHT_BASE = 28;

/** Screen geometry for the HUD widget given the current map + UI scale. */
export function computeNodeMapBarLayout(
  state: NodeMapState,
  currentIndex: number,
  opts: NodeMapUiLayoutOpts,
): BarLayout {
  const scale = Math.max(0.5, opts.uiScale);
  const iconSize = ICON_SIZE_BASE * scale;
  const iconGap = ICON_GAP_BASE * scale;
  const padX = BAR_PAD_X_BASE * scale;
  const barH = BAR_HEIGHT_BASE * scale;
  const labelW = LABEL_WIDTH_BASE * scale;

  const n = state.nodes.length;
  const iconsW = n > 0 ? n * iconSize + (n - 1) * iconGap : 0;

  const expanded = opts.expanded !== false; // default true
  const bgW = expanded ? padX + labelW + iconGap + iconsW + padX : COMPACT_WIDTH_BASE * scale;
  const bgH = barH;
  const bgX = opts.anchorX - bgW;
  const bgY = opts.anchorY;

  const labelCx = bgX + padX + labelW / 2;
  const labelCy = bgY + bgH / 2;

  const icons: IconRect[] = [];
  if (expanded) {
    const iconsStartX = bgX + padX + labelW + iconGap;
    const iconCy = bgY + bgH / 2;
    for (let i = 0; i < n; i++) {
      const iconCx = iconsStartX + iconSize / 2 + i * (iconSize + iconGap);
      icons.push({
        index: i,
        type: state.nodes[i].type,
        cx: iconCx,
        cy: iconCy,
        size: iconSize,
        visited: state.visited[i],
        current: i === currentIndex,
      });
    }
  }

  return { bgX, bgY, bgW, bgH, labelCx, labelCy, icons };
}

/**
 * Compute the 1-based progress pair for the HUD label.
 * Rendering (locale-aware "Act N · x/y") is done by the NodeMapUI
 * adapter via `t('nodes.ui.progress', …)`.
 */
export function nodeMapProgressPosition(
  currentIndex: number,
  total: number,
): { current: number; total: number } {
  if (total === 0) return { current: 0, total: 0 };
  const current = Math.min(total, Math.max(1, currentIndex + 1));
  return { current, total };
}
