import { useEffect, useMemo, useRef } from 'react';
import { isWhole } from '../normalize';
import type { DataGridPage } from '../types';

const DEFAULT_PAGE_SIZES: readonly number[] = [10, 20, 50, 100];

interface PagingInput {
  /** The `paging` prop when it is an object; `undefined` for the default and for `false`. */
  pagingConfig: { pageSizes?: readonly number[] } | undefined;
  /** Whether the grid shows a page of its rows (not virtual, and `paging` is not `false`). */
  paged: boolean;
  remote: boolean;
  loading: boolean;
  totalCount: number | undefined;
  /** The page as it is held, which may be one past the last: the page asked for. */
  held: DataGridPage;
  /** The page size in use, a whole number above 0. */
  size: number;
  /** The index of the page shown, clamped to the pages there are. */
  pageIndex: number;
  /** The count of rows the pager counts. */
  total: number;
  setPage: (page: DataGridPage) => void;
}

interface Paging {
  /** The sizes the pager offers: the ones given and the one in use, once each, ascending. */
  sizes: number[];
  goToPage: (index: number) => void;
  changeSize: (next: number) => void;
}

/**
 * What the pager of a grid needs: the sizes it offers, the two things a press on it does, and, in
 * server mode, the request for the page that is shown when the one asked for is past the last.
 */
export function usePaging({
  pagingConfig,
  paged,
  remote,
  loading,
  totalCount,
  held,
  size,
  pageIndex,
  total,
  setPage,
}: PagingInput): Paging {
  const sizes = useMemo(() => {
    const given = pagingConfig?.pageSizes ?? DEFAULT_PAGE_SIZES;
    if (given.length === 0) return [];
    return [...new Set([...given.filter(isWhole), size])].sort((a, b) => a - b);
  }, [pagingConfig?.pageSizes, size]);
  const goToPage = (index: number): void => setPage({ index, size });
  // Keeps the first row that is shown on the page of the new size.
  const changeSize = (next: number): void =>
    setPage({ index: Math.floor((pageIndex * size) / next), size: next });

  // In server mode `data` is the page the app loaded, and `totalCount` says how many pages there
  // are. A page asked for past the last of them (the total shrank) is shown as the last, and the app
  // is asked for that page, which it has not loaded: otherwise the pager says one page and the rows
  // are another's, and a press on the page shown does nothing. It is the one callback that no
  // handler fires, so it is asked once for an asked page, size and total: a parent that keeps its
  // page is not asked again in a loop, and a new total that clamps it anew is asked again. Only a
  // total that is settled counts: while the grid loads, or without `totalCount`, the page may be one
  // restored from the address or a saved state before the server has said how many rows there are,
  // and asking for the first page then would lose it. With the rows in hand the grid shows the last
  // page and calls nothing (spec phase 6 §6.3).
  const asked = held.index;
  const pastTheLast =
    remote &&
    paged &&
    !loading &&
    totalCount !== undefined &&
    Number.isFinite(asked) &&
    Math.trunc(asked) > pageIndex;
  const askedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!pastTheLast) {
      askedFor.current = null;
      return;
    }
    const request = `${asked}\u0001${size}\u0001${total}`;
    if (askedFor.current === request) return;
    askedFor.current = request;
    setPage({ index: pageIndex, size });
  }, [pastTheLast, asked, size, total, pageIndex, setPage]);

  return { sizes, goToPage, changeSize };
}
