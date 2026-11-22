import { useCallback, useRef } from 'react';
import type { RefObject } from 'react';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { FlatDataRow, FlatRow } from '../engine/flatten';
import { clampPageIndex, countRows } from '../engine/page';
import { scrollRowIntoView } from '../grid-dom';
import type { WindowLink } from '../grid-context';
import type { DataGridKey, DataGridPage } from '../types';

interface ScrollToRowInput<TRow> {
  tableRef: RefObject<HTMLTableElement | null>;
  windowLink: RefObject<WindowLink>;
  /** Every data row after the filter, in the order shown, the ones a closed group hides too. */
  keyed: readonly FlatDataRow<TRow>[];
  /** Every row of the list after sorting, before paging. */
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
  /** Opens the groups with these keys in one request; `false` when they are all open (`openGroups`). */
  openGroups: (keys: readonly string[]) => boolean;
}

/** What a step needs of the grid: the values of one commit. */
type View<TRow> = Omit<ScrollToRowInput<TRow>, 'tableRef' | 'windowLink' | 'openGroups' | 'keyed'>;

/**
 * A request that waits for a commit: `page` is the page it asked for, or `null` while it waits for
 * the groups it asked to open.
 */
interface Pending {
  key: DataGridKey;
  page: number | null;
}

/**
 * `scrollToRow` of the handle: scrolls the row with a key into view. A row inside closed groups asks
 * for them open, in one request; a row on a page that is not shown asks for that page; then the row is
 * scrolled into view, in the window of a virtual grid or on its page. Each step that has to wait for
 * the grid to draw lives to the next commit and no longer (PR #44 12): a parent that kept its groups
 * closed or its page, or chose others, drops the request. It is one stable function for the life of
 * the grid, so the handle is one object; what it needs is as of the last commit.
 */
export function useScrollToRow<TRow>({
  tableRef,
  windowLink,
  keyed,
  openGroups,
  ...input
}: ScrollToRowInput<TRow>): (key: DataGridKey) => boolean {
  const view: View<TRow> = input;
  const latest = useRef({ keyed, openGroups, view });
  useWriteOnCommit(() => {
    latest.current = { keyed, openGroups, view };
  });
  const pending = useRef<Pending | null>(null);

  // Asks for what the row still needs, or scrolls to it. `page` is the page a request has asked for
  // already: it must be on that page now, or it ends there.
  const settle = useCallback(
    (now: View<TRow>, key: DataGridKey, page: number | null): void => {
      const at = now.flat.findIndex((row) => row.kind === 'data' && row.key === key);
      // The row left the list (a parent kept its groups closed, or its filter changed): nothing to do.
      if (at < 0) return;
      // Server mode holds the page it was given, and a grid with no pages holds every row.
      const pages = now.paged && !now.remote;
      const wanted = pages
        ? clampPageIndex(
            Math.floor(countRows(now.flat.slice(0, at)) / now.size),
            countRows(now.flat),
            now.size,
          )
        : now.pageIndex;
      if (wanted !== now.pageIndex) {
        // The page was asked for already and is not the one shown: the request ends here.
        if (page !== null) return;
        pending.current = { key, page: wanted };
        now.setPage({ index: wanted, size: now.size });
        return;
      }
      const index = now.rows.findIndex((row) => row.kind === 'data' && row.key === key);
      if (now.virtual) windowLink.current.scrollToIndex(index);
      else scrollRowIntoView(tableRef.current, index);
    },
    [tableRef, windowLink],
  );

  useIsoLayoutEffect(() => {
    const request = pending.current;
    if (request === null) return;
    // It lives to the next commit and no longer: that commit does the next step, if what was asked
    // for is there, or drops it. A parent that kept its own groups or page, or chose another, is not
    // waited for, so a scroll cannot come from a later commit that has nothing to do with the request.
    pending.current = null;
    if (request.page !== null && view.pageIndex !== request.page) return;
    settle(view, request.key, request.page);
  });

  return useCallback(
    (key: DataGridKey): boolean => {
      const now = latest.current;
      const row = now.keyed.find((one) => one.key === key);
      if (!row) return false;
      if (now.openGroups(row.groups)) {
        pending.current = { key, page: null };
        return true;
      }
      settle(now.view, key, null);
      return true;
    },
    [settle],
  );
}
