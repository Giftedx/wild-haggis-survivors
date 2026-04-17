import { describe, it, expect } from 'vitest';
import {
  toastStackY,
  toastWrapWidth,
  TOAST_TOP_OFFSET_PX,
  TOAST_STACK_GAP_PX,
  TOAST_MAX_STACK_INDEX,
  TOAST_MIN_WRAP_WIDTH,
  TOAST_MAX_WRAP_WIDTH,
  TOAST_HORIZONTAL_PADDING,
} from './toastLayout';

describe('toastStackY', () => {
  it('places the first toast at viewportY + top offset', () => {
    expect(toastStackY(100, 0)).toBe(100 + TOAST_TOP_OFFSET_PX);
  });

  it('stacks subsequent toasts one gap apart', () => {
    expect(toastStackY(0, 1)).toBe(TOAST_TOP_OFFSET_PX + TOAST_STACK_GAP_PX);
    expect(toastStackY(0, 2)).toBe(TOAST_TOP_OFFSET_PX + 2 * TOAST_STACK_GAP_PX);
  });

  it('clamps the stack index at MAX — overflow collapses onto last slot', () => {
    const lastSlotY = toastStackY(0, TOAST_MAX_STACK_INDEX);
    // 3rd, 4th, 5th active toasts all land on the same slot as the max-index one.
    expect(toastStackY(0, TOAST_MAX_STACK_INDEX + 1)).toBe(lastSlotY);
    expect(toastStackY(0, 100)).toBe(lastSlotY);
  });

  it('clamps negative activeToasts to 0 (defensive)', () => {
    expect(toastStackY(0, -1)).toBe(TOAST_TOP_OFFSET_PX);
    expect(toastStackY(0, -10)).toBe(TOAST_TOP_OFFSET_PX);
  });

  it('floors fractional activeToasts', () => {
    expect(toastStackY(0, 1.7)).toBe(toastStackY(0, 1));
  });
});

describe('toastWrapWidth', () => {
  it('uses (viewport - padding) in the clamp window', () => {
    // 500 - 24 = 476 → clamped down to MAX (420)
    // A viewport between MIN+pad (184) and MAX+pad (444) maps 1:1.
    expect(toastWrapWidth(300)).toBe(300 - TOAST_HORIZONTAL_PADDING);
    expect(toastWrapWidth(444)).toBe(TOAST_MAX_WRAP_WIDTH); // 444 - 24 = 420
  });

  it('clamps narrow viewports up to the MIN wrap width', () => {
    expect(toastWrapWidth(50)).toBe(TOAST_MIN_WRAP_WIDTH);
    expect(toastWrapWidth(0)).toBe(TOAST_MIN_WRAP_WIDTH);
  });

  it('clamps wide viewports down to the MAX wrap width', () => {
    expect(toastWrapWidth(1200)).toBe(TOAST_MAX_WRAP_WIDTH);
    expect(toastWrapWidth(10_000)).toBe(TOAST_MAX_WRAP_WIDTH);
  });

  it('is monotonic in the linear range', () => {
    // Every step in viewport width produces an equal or larger wrap width.
    const a = toastWrapWidth(200);
    const b = toastWrapWidth(300);
    const c = toastWrapWidth(400);
    expect(a).toBeLessThanOrEqual(b);
    expect(b).toBeLessThanOrEqual(c);
  });
});

describe('tuning constants', () => {
  it('max wrap ≥ min wrap', () => {
    expect(TOAST_MAX_WRAP_WIDTH).toBeGreaterThanOrEqual(TOAST_MIN_WRAP_WIDTH);
  });

  it('stack gap is positive — toasts don\'t overlap', () => {
    expect(TOAST_STACK_GAP_PX).toBeGreaterThan(0);
  });
});
