import { useCallback, useMemo, useRef } from 'react';
import { useControllableState } from '../../../internal/use-controllable-state';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { DataGridPage, DataGridSortItem, DataGridState } from '../types';

const NO_SORT: readonly DataGridSortItem[] = [];

export interface GridStateOptions {
  sort: readonly DataGridSortItem[] | undefined;
  defaultSort: readonly DataGridSortItem[] | undefined;
  onSortChange: ((sort: readonly DataGridSortItem[]) => void) | undefined;
  page: DataGridPage | undefined;
  /** What the page is until the user moves it: `defaultPage`, or the first page of the usual size. */
  defaultPage: DataGridPage;
  onPageChange: ((page: DataGridPage) => void) | undefined;
  onStateChange: ((state: DataGridState, changed: keyof DataGridState) => void) | undefined;
}

export interface GridState {
  /** The state as the app holds it, or as the grid does while it is uncontrolled. */
  state: DataGridState;
  /** Asks for a sort: `onSortChange`, then `onStateChange`; an uncontrolled sort is kept. */
  setSort: (sort: readonly DataGridSortItem[]) => void;
  /** Asks for a page, the same way; the page that is already asked for is not reported. */
  setPage: (page: DataGridPage) => void;
}

/**
 * The state of the sort and of the page, each a controllable triple (`value`, `defaultValue`,
 * `onChange`), and `onStateChange` after each of them with the whole state. A controlled value is
 * reported too, since the parent may reject it: the state sent is what the press asks for, and the
 * grid goes on showing the parent's. Nothing is called from a render or an effect: only the setters
 * call, and only event handlers call the setters.
 */
export function useGridState({
  sort,
  defaultSort,
  onSortChange,
  page,
  defaultPage,
  onPageChange,
  onStateChange,
}: GridStateOptions): GridState {
  const [sortValue, setSortValue] = useControllableState<readonly DataGridSortItem[]>({
    value: sort,
    defaultValue: defaultSort ?? NO_SORT,
    onChange: onSortChange,
    name: 'DataGrid sort',
  });
  const [pageValue, setPageValue] = useControllableState<DataGridPage>({
    value: page,
    defaultValue: defaultPage,
    onChange: onPageChange,
    name: 'DataGrid page',
  });
  const state = useMemo(() => ({ sort: sortValue, page: pageValue }), [sortValue, pageValue]);

  // What the setters read: the state of the last commit, and which parts the parent owns. An
  // uncontrolled part is also written by the setter, so two requests in one event see each other.
  const latest = useRef({ state, sortOwned: false, pageOwned: false, onStateChange });
  useWriteOnCommit(() => {
    latest.current = {
      state,
      sortOwned: sort !== undefined,
      pageOwned: page !== undefined,
      onStateChange,
    };
  });

  const setSort = useCallback(
    (next: readonly DataGridSortItem[]) => {
      const before = latest.current;
      setSortValue(next);
      const asked = { ...before.state, sort: next };
      if (!before.sortOwned) latest.current = { ...before, state: asked };
      before.onStateChange?.(asked, 'sort');
    },
    [setSortValue],
  );

  const setPage = useCallback(
    (next: DataGridPage) => {
      const before = latest.current;
      const now = before.state.page;
      if (now.index === next.index && now.size === next.size) return;
      setPageValue(next);
      const asked = { ...before.state, page: next };
      if (!before.pageOwned) latest.current = { ...before, state: asked };
      before.onStateChange?.(asked, 'page');
    },
    [setPageValue],
  );

  return { state, setSort, setPage };
}
