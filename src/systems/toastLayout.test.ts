import { describe, it, expect } from 'vitest';
import {
  decideEnqueue,
  toastStackY,
  toastWrapWidth,
  MAX_PENDING_TOASTS,
  MAX_VISIBLE_TOASTS,
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

  it('stacks the second toast one gap apart from the first', () => {
    expect(toastStackY(0, 1)).toBe(TOAST_TOP_OFFSET_PX + TOAST_STACK_GAP_PX);
  });

  it('clamps the stack index at MAX — overflow defensively collapses onto last slot', () => {
    // Under the P2.6 queue, activeToasts is capped at MAX_VISIBLE_TOASTS,
    // so toastStackY only ever sees 0..MAX_VISIBLE_TOASTS-1. The clamp
    // is now a defensive safety net for any path that bypasses the
    // queue (e.g. an old test fixture passing a large index).
    const lastSlotY = toastStackY(0, TOAST_MAX_STACK_INDEX);
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

  it('visible cap is at least 1 and stack-index ceiling matches it', () => {
    expect(MAX_VISIBLE_TOASTS).toBeGreaterThanOrEqual(1);
    // Stack indices run 0..MAX_VISIBLE-1, so MAX_STACK_INDEX must be
    // exactly MAX_VISIBLE-1 — drift between the two would either waste
    // a slot or land toasts off-grid.
    expect(TOAST_MAX_STACK_INDEX).toBe(MAX_VISIBLE_TOASTS - 1);
  });
});

describe('decideEnqueue (P2.6 toast queue policy)', () => {
  it('spawns immediately when the visible lane has room', () => {
    expect(decideEnqueue(0, 0).kind).toBe('spawn-now');
    expect(decideEnqueue(MAX_VISIBLE_TOASTS - 1, 0).kind).toBe('spawn-now');
  });

  it('queues when the visible lane is full and the pending lane has room', () => {
    expect(decideEnqueue(MAX_VISIBLE_TOASTS, 0).kind).toBe('queue');
    expect(decideEnqueue(MAX_VISIBLE_TOASTS, MAX_PENDING_TOASTS - 1).kind).toBe('queue');
  });

  it('drops the oldest pending entry when both lanes are full', () => {
    const decision = decideEnqueue(MAX_VISIBLE_TOASTS, MAX_PENDING_TOASTS);
    expect(decision.kind).toBe('queue-with-drop');
    if (decision.kind === 'queue-with-drop') {
      expect(decision.droppedIndex).toBe(0);
    }
  });

  it('honours custom caps (zero visible forces queueing)', () => {
    expect(decideEnqueue(0, 0, 0, 5).kind).toBe('queue');
  });

  it('honours custom caps (zero pending forces drop on second arrival)', () => {
    expect(decideEnqueue(2, 0, 2, 0).kind).toBe('queue-with-drop');
  });
});
