import { describe, it, expect } from 'vitest';
import { paginationState } from './pagination';

describe('paginationState — empty list', () => {
  it('produces a single page with no items', () => {
    const s = paginationState(0, 5, 0);
    expect(s.pageCount).toBe(1);
    expect(s.clampedPage).toBe(0);
    expect(s.startIndex).toBe(0);
    expect(s.endIndex).toBe(0);
    expect(s.pageVisible).toBe(false);
    expect(s.prevEnabled).toBe(false);
    expect(s.nextEnabled).toBe(false);
    expect(s.pageLabel).toBe('1 / 1');
  });
});

describe('paginationState — exact multiples', () => {
  it('10 items / 5 per page = 2 pages', () => {
    const s = paginationState(10, 5, 0);
    expect(s.pageCount).toBe(2);
    expect(s.startIndex).toBe(0);
    expect(s.endIndex).toBe(5);
    expect(s.pageVisible).toBe(true);
    expect(s.prevEnabled).toBe(false);
    expect(s.nextEnabled).toBe(true);
  });

  it('page 1 of 2 — slice 5..10, nextEnabled = false', () => {
    const s = paginationState(10, 5, 1);
    expect(s.clampedPage).toBe(1);
    expect(s.startIndex).toBe(5);
    expect(s.endIndex).toBe(10);
    expect(s.prevEnabled).toBe(true);
    expect(s.nextEnabled).toBe(false);
    expect(s.pageLabel).toBe('2 / 2');
  });
});

describe('paginationState — non-exact page counts', () => {
  it('11 items / 5 per page = 3 pages (last page holds 1 item)', () => {
    const s = paginationState(11, 5, 2);
    expect(s.pageCount).toBe(3);
    expect(s.startIndex).toBe(10);
    expect(s.endIndex).toBe(11);
  });

  it('endIndex clamps to totalItems on the last page', () => {
    const s = paginationState(7, 5, 1);
    expect(s.startIndex).toBe(5);
    expect(s.endIndex).toBe(7); // not 10
  });
});

describe('paginationState — defensive clamps', () => {
  it('clamps negative page to 0', () => {
    const s = paginationState(10, 5, -3);
    expect(s.clampedPage).toBe(0);
  });

  it('clamps out-of-range page to the last page', () => {
    const s = paginationState(10, 5, 99);
    expect(s.clampedPage).toBe(1);
    expect(s.nextEnabled).toBe(false);
  });

  it('floors fractional page', () => {
    const s = paginationState(10, 5, 1.8);
    expect(s.clampedPage).toBe(1);
  });

  it('clamps totalItems < 0 to 0', () => {
    const s = paginationState(-5, 5, 0);
    expect(s.startIndex).toBe(0);
    expect(s.endIndex).toBe(0);
  });

  it('clamps perPage < 1 to 1 (can\'t divide by zero)', () => {
    const s = paginationState(10, 0, 0);
    expect(s.pageCount).toBe(10);
    expect(s.startIndex).toBe(0);
    expect(s.endIndex).toBe(1);
  });
});

describe('paginationState — pageVisible gate', () => {
  it('hides nav when there\'s only one page', () => {
    expect(paginationState(5, 5, 0).pageVisible).toBe(false);
    expect(paginationState(1, 5, 0).pageVisible).toBe(false);
  });

  it('shows nav when there\'s more than one page', () => {
    expect(paginationState(6, 5, 0).pageVisible).toBe(true);
  });
});
