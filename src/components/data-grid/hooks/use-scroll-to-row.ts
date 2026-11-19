import { useCallback, useRef } from 'react';
import type { RefObject } from 'react';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { FlatRow } from '../engine/flatten';
import { scrollRowIntoView } from '../grid-dom';
import type { WindowLink } from '../grid-context';
import type { DataGridKey, DataGridPage } from '../types';

interface ScrollToRowInput<TRow> {
  tableRef: RefObject<HTMLTableElement | null>;
  windowLink: RefObject<WindowLink>;
  /** Every row after sorting, before paging. */
  flat: readonly FlatRow<TRow>[];
  virtual: boolean;
  paged: boolean;
  remote: boolean;
  size: number;
  /** The index of the page shown. */
  pageIndex: number;
  /** The rows of the page shown, which are the ones drawn. */
  rows: readonly FlatRow<TRow>[];
  setPage: (page: DataGridPage) => void;
}

/**
 * `scrollToRow` of the handle: scrolls the row with a key into view, on its page, or in the window of
 * a virtual grid. It is one stable function for the life of the grid, so the handle is one object;
 * what it needs is as of the last commit.
 */
export function useScrollToRow<TRow>({
  tableRef,
  windowLink,
  flat,
  virtual,
  paged,
  remote,
  size,
  pageIndex,
  rows,
  setPage,
}: ScrollToRowInput<TRow>): (key: DataGridKey) => boolean {
  // A page that has to change first leaves the row to be scrolled to after it.
  const view = useRef({ flat, virtual, paged, remote, size, pageIndex, setPage });
  useWriteOnCommit(() => {
    view.current = { flat, virtual, paged, remote, size, pageIndex, setPage };
  });
  const pendingScroll = useRef<{ key: DataGridKey; page: number } | null>(null);
  useIsoLayoutEffect(() => {
    const pending = pendingScroll.current;
    if (pending === null) return;
    // It lives to the next commit and no longer: that commit does it, if the page asked for is the one
    // shown, or drops it. A parent that kept its own page, or chose another, is not waited for, so a
    // scroll cannot come from a later commit that has nothing to do with the request.
    pendingScroll.current = null;
    if (pageIndex !== pending.page) return;
    scrollRowIntoView(
      tableRef.current,
      rows.findIndex((row) => row.key === pending.key),
    );
  });
  return useCallback(
    (key: DataGridKey): boolean => {
      const now = view.current;
      const at = now.flat.findIndex((row) => row.key === key);
      if (at < 0) return false;
      if (now.virtual) {
        windowLink.current.scrollToIndex(at);
        return true;
      }
      // Server mode holds the page it was given, and a grid with no pages holds every row.
      const pages = now.paged && !now.remote;
      const page = pages ? Math.floor(at / now.size) : now.pageIndex;
      if (page === now.pageIndex) {
        scrollRowIntoView(tableRef.current, pages ? at - page * now.size : at);
      } else {
        pendingScroll.current = { key, page };
        now.setPage({ index: page, size: now.size });
      }
      return true;
    },
    [tableRef, windowLink],
  );
}
