import { useCallback, useMemo, useRef } from 'react';
import { useControllableState } from '../../../internal/use-controllable-state';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { sameLayout } from '../engine/layout';
import { sameKeys } from '../engine/selection';
import type {
  DataGridColumnLayout,
  DataGridKey,
  DataGridPage,
  DataGridSortItem,
  DataGridState,
} from '../types';

const NO_SORT: readonly DataGridSortItem[] = [];
const NO_KEYS: readonly DataGridKey[] = [];

export interface GridStateOptions {
  sort: readonly DataGridSortItem[] | undefined;
  defaultSort: readonly DataGridSortItem[] | undefined;
  onSortChange: ((sort: readonly DataGridSortItem[]) => void) | undefined;
  page: DataGridPage | undefined;
  /** What the page is until the user moves it: `defaultPage`, or the first page of the usual size. */
  defaultPage: DataGridPage;
  onPageChange: ((page: DataGridPage) => void) | undefined;
  selectedKeys: readonly DataGridKey[] | undefined;
  defaultSelectedKeys: readonly DataGridKey[] | undefined;
  onSelectedKeysChange: ((keys: readonly DataGridKey[]) => void) | undefined;
  columnLayout: DataGridColumnLayout | undefined;
  /** Where the layout is until the user changes it: the one `startLayout` made from the columns. */
  defaultColumnLayout: DataGridColumnLayout;
  onColumnLayoutChange: ((layout: DataGridColumnLayout) => void) | undefined;
  onStateChange: ((state: DataGridState, changed: keyof DataGridState) => void) | undefined;
  /**
   * The state the grid showed at its last commit, the page clamped as drawn, which `getState()`
   * returns: what `onStateChange` sends, with the part asked for on top.
   */
  shown: { readonly current: DataGridState };
}

export interface GridState {
  /** The state as the app holds it, or as the grid does while it is uncontrolled. */
  state: DataGridState;
  /** Asks for a sort: `onSortChange`, then `onStateChange`; an uncontrolled sort is kept. */
  setSort: (sort: readonly DataGridSortItem[]) => void;
  /** Asks for a page, the same way; the page that is already asked for is not reported. */
  setPage: (page: DataGridPage) => void;
  /**
   * Asks for the chosen keys the same way. `change` is given the keys now (the ones of the last
   * request, when two are made before a render) and gives the keys wanted, or `undefined` for no
   * change; keys that are the ones already chosen are not reported. It returns what was asked for.
   */
  setSelectedKeys: (
    change: (current: readonly DataGridKey[]) => readonly DataGridKey[] | undefined,
  ) => readonly DataGridKey[] | undefined;
  /**
   * Asks for a layout the same way. A layout that says what the grid shows already is not reported:
   * a press that changes nothing, or a layout the parent has just given back.
   */
  setColumnLayout: (layout: DataGridColumnLayout) => void;
}

/**
 * The state of the sort, the page, the chosen keys and the layout of the columns, each a controllable
 * triple (`value`, `defaultValue`, `onChange`), and `onStateChange` after each of them with the whole
 * state. A controlled value is reported too, since the parent may reject it: the state sent is the one the grid shows, the same as
 * `getState()` (a page past the end is the page drawn, not the one held), with what the press asks
 * for on top, and the grid goes on showing the parent's. Nothing is called from a render: only the
 * setters call, and event handlers call them, but for the one page that server mode asks for.
 */
export function useGridState({
  sort,
  defaultSort,
  onSortChange,
  page,
  defaultPage,
  onPageChange,
  selectedKeys,
  defaultSelectedKeys,
  onSelectedKeysChange,
  columnLayout,
  defaultColumnLayout,
  onColumnLayoutChange,
  onStateChange,
  shown,
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
  const [keysValue, setKeysValue] = useControllableState<readonly DataGridKey[]>({
    value: selectedKeys,
    defaultValue: defaultSelectedKeys ?? NO_KEYS,
    onChange: onSelectedKeysChange,
    name: 'DataGrid selectedKeys',
  });
  const [layoutValue, setLayoutValue] = useControllableState<DataGridColumnLayout>({
    value: columnLayout,
    defaultValue: defaultColumnLayout,
    onChange: onColumnLayoutChange,
    name: 'DataGrid columnLayout',
  });
  const state = useMemo(
    () => ({
      sort: sortValue,
      page: pageValue,
      selectedKeys: keysValue,
      columnLayout: layoutValue,
    }),
    [sortValue, pageValue, keysValue, layoutValue],
  );

  // What the setters read: the state of the last commit, and which parts the parent owns. An
  // uncontrolled part is also written by the setter, so two requests in one event see each other;
  // `asked` holds those parts for what is sent, over the state shown.
  const latest = useRef<{
    state: DataGridState;
    asked: Partial<DataGridState>;
    sortOwned: boolean;
    pageOwned: boolean;
    keysOwned: boolean;
    layoutOwned: boolean;
    onStateChange: GridStateOptions['onStateChange'];
  }>({
    state,
    asked: {},
    sortOwned: false,
    pageOwned: false,
    keysOwned: false,
    layoutOwned: false,
    onStateChange,
  });
  useWriteOnCommit(() => {
    latest.current = {
      state,
      asked: {},
      sortOwned: sort !== undefined,
      pageOwned: page !== undefined,
      keysOwned: selectedKeys !== undefined,
      layoutOwned: columnLayout !== undefined,
      onStateChange,
    };
  });

  const setSort = useCallback(
    (next: readonly DataGridSortItem[]) => {
      const before = latest.current;
      setSortValue(next);
      if (!before.sortOwned) {
        latest.current = {
          ...before,
          state: { ...before.state, sort: next },
          asked: { ...before.asked, sort: next },
        };
      }
      before.onStateChange?.({ ...shown.current, ...before.asked, sort: next }, 'sort');
    },
    [setSortValue, shown],
  );

  const setPage = useCallback(
    (next: DataGridPage) => {
      const before = latest.current;
      const now = before.state.page;
      if (now.index === next.index && now.size === next.size) return;
      setPageValue(next);
      if (!before.pageOwned) {
        latest.current = {
          ...before,
          state: { ...before.state, page: next },
          asked: { ...before.asked, page: next },
        };
      }
      before.onStateChange?.({ ...shown.current, ...before.asked, page: next }, 'page');
    },
    [setPageValue, shown],
  );

  const setSelectedKeys = useCallback(
    (change: (current: readonly DataGridKey[]) => readonly DataGridKey[] | undefined) => {
      const before = latest.current;
      const now = before.state.selectedKeys;
      const next = change(now);
      if (next === undefined || sameKeys(now, next)) return undefined;
      setKeysValue(next);
      if (!before.keysOwned) {
        latest.current = {
          ...before,
          state: { ...before.state, selectedKeys: next },
          asked: { ...before.asked, selectedKeys: next },
        };
      }
      before.onStateChange?.(
        { ...shown.current, ...before.asked, selectedKeys: next },
        'selectedKeys',
      );
      return next;
    },
    [setKeysValue, shown],
  );

  const setColumnLayout = useCallback(
    (next: DataGridColumnLayout) => {
      const before = latest.current;
      // Compared with what the grid shows, which is what the user acted on, or with what an earlier
      // request of the same event asked for: the held layout may hold ids the grid does not show.
      const now = before.asked.columnLayout ?? shown.current.columnLayout;
      if (sameLayout(now, next)) return;
      setLayoutValue(next);
      if (!before.layoutOwned) {
        latest.current = {
          ...before,
          state: { ...before.state, columnLayout: next },
          asked: { ...before.asked, columnLayout: next },
        };
      }
      before.onStateChange?.(
        { ...shown.current, ...before.asked, columnLayout: next },
        'columnLayout',
      );
    },
    [setLayoutValue, shown],
  );

  return { state, setSort, setPage, setSelectedKeys, setColumnLayout };
}
