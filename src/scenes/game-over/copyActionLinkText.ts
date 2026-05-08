/**
 * Shared text style for the small italic action links under the big result
 * panel (seed copy, postcard download, save/copy frame, save clip, rerun ↻).
 * Each call site varies the colour from its own palette.idle on hover/press,
 * so the colour stays a per-call argument; everything else is fixed.
 *
 * Hoisted out of GameOverScene during the Phase 5 render*Link extraction so
 * each helper can import the same base style without duplicating the literal.
 */
import { textStyle } from '../../ui/typography';

export const COPY_ACTION_LINK_TEXT_BASE = textStyle('subtitle', {
  fontSize: '12px',
  align: 'center',
});
