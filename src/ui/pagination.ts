/**
 * Pure pagination state helper used by the Chronicle/Shop/MetaShop
 * scenes for their page-nav rows. Given total items, rows per page,
 * and a current page index, returns the derived render state:
 *
 *   pageCount         — total pages (clamped to ≥ 1)
 *   clampedPage       — requested page clamped into [0, pageCount - 1]
 *   startIndex/endIndex — slice bounds for the current page
 *   pageVisible       — true when there's more than one page
 *   prevEnabled       — can step back (clampedPage > 0)
 *   nextEnabled       — can step forward (clampedPage < pageCount - 1)
 *   pageLabel         — "{current}/{total}" display string
 *
 * Scenes previously each did these arithmetic bits inline; pinning
 * them once removes the off-by-one risk (especially around empty
 * lists and out-of-range stored page indices).
 */

export interface PaginationState {
  pageCount: number;
  clampedPage: number;
  startIndex: number;
  endIndex: number;
  pageVisible: boolean;
  prevEnabled: boolean;
  nextEnabled: boolean;
  pageLabel: string;
}

export function paginationState(
  totalItems: number,
  perPage: number,
  page: number,
): PaginationState {
  const safeTotal = Math.max(0, Math.floor(totalItems));
  const safePerPage = Math.max(1, Math.floor(perPage));
  const pageCount = Math.max(1, Math.ceil(safeTotal / safePerPage));
  const clampedPage = Math.max(0, Math.min(Math.floor(page), pageCount - 1));
  const startIndex = clampedPage * safePerPage;
  const endIndex = Math.min(safeTotal, startIndex + safePerPage);
  return {
    pageCount,
    clampedPage,
    startIndex,
    endIndex,
    pageVisible: pageCount > 1,
    prevEnabled: clampedPage > 0,
    nextEnabled: clampedPage < pageCount - 1,
    pageLabel: `${clampedPage + 1} / ${pageCount}`,
  };
}
