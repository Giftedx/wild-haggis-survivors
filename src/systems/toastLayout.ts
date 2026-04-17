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
/** Max visible stack index — index 0, 1, and 2 are distinct; 3+ collapse onto 2. */
export const TOAST_MAX_STACK_INDEX = 2;
/** Lower bound on the word-wrap width — don't render a pencil-thin column. */
export const TOAST_MIN_WRAP_WIDTH = 160;
/** Upper bound — don't let toasts stretch across the whole viewport. */
export const TOAST_MAX_WRAP_WIDTH = 420;
/** Horizontal padding subtracted from viewport width before the wrap clamp. */
export const TOAST_HORIZONTAL_PADDING = 24;

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
