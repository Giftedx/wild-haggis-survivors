import { describe, it, expect } from 'vitest';
import { buildPaginationLayout } from './gamePagination';

describe('buildPaginationLayout', () => {
  it('returns prev/next enabled state from paginationState', () => {
    const layout = buildPaginationLayout(30, 10, 0);
    expect(layout.prevEnabled).toBe(false);
    expect(layout.nextEnabled).toBe(true);
    expect(layout.pageLabel).toBe('1 / 3');
  });

  it('page 2 of 3 enables both', () => {
    const layout = buildPaginationLayout(30, 10, 1);
    expect(layout.prevEnabled).toBe(true);
    expect(layout.nextEnabled).toBe(true);
  });

  it('single page hides pagination', () => {
    const layout = buildPaginationLayout(5, 10, 0);
    expect(layout.pageVisible).toBe(false);
  });
});
