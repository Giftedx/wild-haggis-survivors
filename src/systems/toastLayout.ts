/**
 * Pure layout helpers for the JuiceSystem toast stack.
 *
 * Toasts slide in from the right edge and stack vertically; a fresh
 * toast reads the current active count, claims the next slot (capped
 * at MAX + 1 so overflow collapses onto the last slot rather than
 * flying off-screen), and computes its wrap width based on the
 * viewport.
 *
 * Extracted so the three magic numbers (130px top pad, 36px gap,
 * 2-slot cap) and the wrap clamp (160..420) have a single source of
 * truth with tests.
 */

/** Distance from the UI viewport top to the first toast's baseline. */
export const TOAST_TOP_OFFSET_PX = 130;
/** Vertical gap between stacked toasts. */
export const TOAST_STACK_GAP_PX = 36;
/**
 * Max visible stack index. With the P2.6 single-lane queue, no more
 * than `MAX + 1` toasts ever appear at once — overflow waits in the
 * pending queue (see toastQueue helpers), so this index is the slot
 * ceiling, not the overflow-collapse target it used to be.
 */
export const TOAST_MAX_STACK_INDEX = 1;
/** Lower bound on the word-wrap width — don't render a pencil-thin column. */
export const TOAST_MIN_WRAP_WIDTH = 160;
/** Upper bound — don't let toasts stretch across the whole viewport. */
export const TOAST_MAX_WRAP_WIDTH = 420;
/** Horizontal padding subtracted from viewport width before the wrap clamp. */
export const TOAST_HORIZONTAL_PADDING = 24;

/**
 * P2.6 toast lane consolidation — at most this many toasts are
 * SIMULTANEOUSLY visible. Excess goes through the pending queue.
 * Two slots cover the "level-up + heal" or "biome change + kill
 * combo" double-beat without producing the 4-stack mid-combat
 * cluster the audit flagged.
 */
export const MAX_VISIBLE_TOASTS = 2;
/**
 * Hard cap on pending (not-yet-visible) toasts. Flurry overflows
 * past this drop the OLDEST pending entry — late-arriving signals
 * tend to be the more relevant "now" beats; preserving the front of
 * a backed-up queue would just show stale events to the player.
 */
export const MAX_PENDING_TOASTS = 3;

/**
 * Compute the y-baseline for a new toast given the viewport's top y
 * and how many toasts are currently active. `activeToasts` is the
 * pre-increment value — this returns the y of the next toast.
 * Stack index is clamped to TOAST_MAX_STACK_INDEX so an overflowing
 * stack collapses onto the last slot instead of scrolling off.
 */
export function toastStackY(viewportY: number, activeToasts: number): number {
  const stackIndex = Math.min(Math.max(0, Math.floor(activeToasts)), TOAST_MAX_STACK_INDEX);
  return viewportY + TOAST_TOP_OFFSET_PX + stackIndex * TOAST_STACK_GAP_PX;
}

/**
 * Wrap width for toast text. Viewport width minus padding, clamped
 * between the min/max so toasts are legible on both narrow (mobile)
 * and ultra-wide screens.
 */
export function toastWrapWidth(viewportWidth: number): number {
  const inset = viewportWidth - TOAST_HORIZONTAL_PADDING;
  return Math.max(TOAST_MIN_WRAP_WIDTH, Math.min(TOAST_MAX_WRAP_WIDTH, inset));
}

// ── Toast queue policy ──────────────────────────────────────────────
//
// Pure helpers so the JuiceSystem queue logic has a unit-testable
// surface independent of Phaser. The system tracks two collections:
//
//   - `liveCount`    — toasts currently rendered (≤ MAX_VISIBLE).
//   - `pendingQueue` — toasts waiting their turn (FIFO, capped).
//
// `decideEnqueue` answers "should this new arrival render now, queue,
// or be discarded?" `applyOverflow` enforces the pending cap by
// dropping the OLDEST entry — late signals matter more than stale
// ones once a backlog forms.

export type ToastEnqueueDecision =
  | { kind: 'spawn-now' }
  | { kind: 'queue' }
  | { kind: 'queue-with-drop'; droppedIndex: number };

export function decideEnqueue(
  liveCount: number,
  pendingLength: number,
  maxVisible: number = MAX_VISIBLE_TOASTS,
  maxPending: number = MAX_PENDING_TOASTS,
): ToastEnqueueDecision {
  if (liveCount < maxVisible) return { kind: 'spawn-now' };
  if (pendingLength < maxPending) return { kind: 'queue' };
  return { kind: 'queue-with-drop', droppedIndex: 0 };
}
