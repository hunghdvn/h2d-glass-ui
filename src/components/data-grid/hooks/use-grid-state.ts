import { useCallback, useMemo, useRef } from 'react';
import { useControllableState } from '../../../internal/use-controllable-state';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { EMPTY_FILTER, sameFilter } from '../engine/filter';
import { sameExpanded, sameGrouping } from '../engine/group';
import { sameLayout } from '../engine/layout';
import { sameKeys } from '../engine/selection';
import type {
  DataGridColumnLayout,
  DataGridExpandedGroups,
  DataGridFilter,
  DataGridGroupItem,
  DataGridKey,
  DataGridPage,
  DataGridSortItem,
  DataGridState,
} from '../types';

const NO_SORT: readonly DataGridSortItem[] = [];
const NO_KEYS: readonly DataGridKey[] = [];
const NO_GROUPING: readonly DataGridGroupItem[] = [];
/** Every group open, the state of a grid that has no say on it. */
export const ALL_OPEN: DataGridExpandedGroups = { allExpanded: true, except: [] };

export interface GridStateOptions {
  sort: readonly DataGridSortItem[] | undefined;
  defaultSort: readonly DataGridSortItem[] | undefined;
  onSortChange: ((sort: readonly DataGridSortItem[]) => void) | undefined;
  filter: DataGridFilter | undefined;
  defaultFilter: DataGridFilter | undefined;
  onFilterChange: ((filter: DataGridFilter) => void) | undefined;
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
  grouping: readonly DataGridGroupItem[] | undefined;
  defaultGrouping: readonly DataGridGroupItem[] | undefined;
  onGroupingChange: ((grouping: readonly DataGridGroupItem[]) => void) | undefined;
  expandedGroups: DataGridExpandedGroups | undefined;
  /** What the groups are until the user opens or closes one: `defaultExpandedGroups`, else the grid's `autoExpandAll`. */
  defaultExpandedGroups: DataGridExpandedGroups;
  onExpandedGroupsChange: ((expanded: DataGridExpandedGroups) => void) | undefined;
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
  /**
   * Asks for a filter the same way: `onFilterChange`, then `onStateChange`. A filter that says what
   * the grid holds already, or that an earlier request of the same event asked (`sameFilter`), is not
   * reported. It returns whether it asked for a change.
   */
  setFilter: (filter: DataGridFilter) => boolean;
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
  /**
   * Asks for a grouping the same way, against what the same event asked already (`asked ?? state`): a
   * grouping that says what is held is not reported. It returns whether it asked for a change.
   */
  setGrouping: (grouping: readonly DataGridGroupItem[]) => boolean;
  /** Asks for the open groups the same way; the same keys in another order are no change. */
  setExpandedGroups: (expanded: DataGridExpandedGroups) => boolean;
  /** The open groups as the next request sees them: what the same event asked, else what is held. */
  expandedNow: () => DataGridExpandedGroups;
}

/**
 * The state of the sort, the filter, the page, the chosen keys and the layout of the columns, each a controllable
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
  filter,
  defaultFilter,
  onFilterChange,
  page,
  defaultPage,
  onPageChange,
  selectedKeys,
  defaultSelectedKeys,
  onSelectedKeysChange,
  columnLayout,
  defaultColumnLayout,
  onColumnLayoutChange,
  grouping,
  defaultGrouping,
  onGroupingChange,
  expandedGroups,
  defaultExpandedGroups,
  onExpandedGroupsChange,
  onStateChange,
  shown,
}: GridStateOptions): GridState {
  const [sortValue, setSortValue] = useControllableState<readonly DataGridSortItem[]>({
    value: sort,
    defaultValue: defaultSort ?? NO_SORT,
    onChange: onSortChange,
    name: 'DataGrid sort',
  });
  const [filterValue, setFilterValue] = useControllableState<DataGridFilter>({
    value: filter,
    defaultValue: defaultFilter ?? EMPTY_FILTER,
    onChange: onFilterChange,
    name: 'DataGrid filter',
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
  const [groupingValue, setGroupingValue] = useControllableState<readonly DataGridGroupItem[]>({
    value: grouping,
    defaultValue: defaultGrouping ?? NO_GROUPING,
    onChange: onGroupingChange,
    name: 'DataGrid grouping',
  });
  const [expandedValue, setExpandedValue] = useControllableState<DataGridExpandedGroups>({
    value: expandedGroups,
    defaultValue: defaultExpandedGroups,
    onChange: onExpandedGroupsChange,
    name: 'DataGrid expandedGroups',
  });
  const state = useMemo(
    () => ({
      sort: sortValue,
      filter: filterValue,
      page: pageValue,
      selectedKeys: keysValue,
      columnLayout: layoutValue,
      grouping: groupingValue,
      expandedGroups: expandedValue,
    }),
    [sortValue, filterValue, pageValue, keysValue, layoutValue, groupingValue, expandedValue],
  );

  // What the setters read: the state of the last commit, and which parts the parent owns. An
  // uncontrolled part is also written by the setter, so two requests in one event see each other.
  // `asked` holds every part a request named, a controlled one too (the parent may not take it), for
  // what is sent over the state shown: the page reset of a filter change carries the filter that was
  // asked. It is cleared at the next commit, a controlled one at the end of the event.
  const latest = useRef<{
    state: DataGridState;
    asked: Partial<DataGridState>;
    sortOwned: boolean;
    filterOwned: boolean;
    pageOwned: boolean;
    keysOwned: boolean;
    layoutOwned: boolean;
    groupingOwned: boolean;
    expandedOwned: boolean;
    onStateChange: GridStateOptions['onStateChange'];
  }>({
    state,
    asked: {},
    sortOwned: false,
    filterOwned: false,
    pageOwned: false,
    keysOwned: false,
    layoutOwned: false,
    groupingOwned: false,
    expandedOwned: false,
    onStateChange,
  });
  useWriteOnCommit(() => {
    latest.current = {
      state,
      asked: {},
      sortOwned: sort !== undefined,
      filterOwned: filter !== undefined,
      pageOwned: page !== undefined,
      keysOwned: selectedKeys !== undefined,
      layoutOwned: columnLayout !== undefined,
      groupingOwned: grouping !== undefined,
      expandedOwned: expandedGroups !== undefined,
      onStateChange,
    };
  });

  // A part the parent owns is asked for until the end of the event: a request of the same event sees it,
  // and a parent that keeps its value does not leave it behind, to be sent as shown by a later one.
  const forgetAsked = useCallback(
    <Part extends keyof DataGridState>(part: Part, value: DataGridState[Part]) => {
      queueMicrotask(() => {
        const current = latest.current;
        if (current.asked[part] !== value) return;
        const asked = { ...current.asked };
        delete asked[part];
        latest.current = { ...current, asked };
      });
    },
    [],
  );

  const setSort = useCallback(
    (next: readonly DataGridSortItem[]) => {
      const before = latest.current;
      setSortValue(next);
      latest.current = {
        ...before,
        state: before.sortOwned ? before.state : { ...before.state, sort: next },
        asked: { ...before.asked, sort: next },
      };
      if (before.sortOwned) forgetAsked('sort', next);
      before.onStateChange?.({ ...shown.current, ...before.asked, sort: next }, 'sort');
    },
    [setSortValue, forgetAsked, shown],
  );

  const setFilter = useCallback(
    (next: DataGridFilter) => {
      const before = latest.current;
      // Against what the same event asked already, as `setPage` does: the state shown is not yet it.
      if (sameFilter(before.asked.filter ?? before.state.filter, next)) return false;
      setFilterValue(next);
      latest.current = {
        ...before,
        state: before.filterOwned ? before.state : { ...before.state, filter: next },
        asked: { ...before.asked, filter: next },
      };
      if (before.filterOwned) forgetAsked('filter', next);
      before.onStateChange?.({ ...shown.current, ...before.asked, filter: next }, 'filter');
      return true;
    },
    [setFilterValue, forgetAsked, shown],
  );

  const setPage = useCallback(
    (next: DataGridPage) => {
      const before = latest.current;
      const now = before.asked.page ?? before.state.page;
      if (now.index === next.index && now.size === next.size) return;
      setPageValue(next);
      latest.current = {
        ...before,
        state: before.pageOwned ? before.state : { ...before.state, page: next },
        asked: { ...before.asked, page: next },
      };
      if (before.pageOwned) forgetAsked('page', next);
      before.onStateChange?.({ ...shown.current, ...before.asked, page: next }, 'page');
    },
    [setPageValue, forgetAsked, shown],
  );

  const setSelectedKeys = useCallback(
    (change: (current: readonly DataGridKey[]) => readonly DataGridKey[] | undefined) => {
      const before = latest.current;
      const now = before.state.selectedKeys;
      const next = change(now);
      if (next === undefined || sameKeys(now, next)) return undefined;
      setKeysValue(next);
      latest.current = {
        ...before,
        state: before.keysOwned ? before.state : { ...before.state, selectedKeys: next },
        asked: { ...before.asked, selectedKeys: next },
      };
      if (before.keysOwned) forgetAsked('selectedKeys', next);
      before.onStateChange?.(
        { ...shown.current, ...before.asked, selectedKeys: next },
        'selectedKeys',
      );
      return next;
    },
    [setKeysValue, forgetAsked, shown],
  );

  const setColumnLayout = useCallback(
    (next: DataGridColumnLayout) => {
      const before = latest.current;
      // Compared with what the grid shows, which is what the user acted on, or with what an earlier
      // request of the same event asked for: the held layout may hold ids the grid does not show.
      const now =
        (before.layoutOwned ? undefined : before.asked.columnLayout) ?? shown.current.columnLayout;
      if (sameLayout(now, next)) return;
      setLayoutValue(next);
      latest.current = {
        ...before,
        state: before.layoutOwned ? before.state : { ...before.state, columnLayout: next },
        asked: { ...before.asked, columnLayout: next },
      };
      if (before.layoutOwned) forgetAsked('columnLayout', next);
      before.onStateChange?.(
        { ...shown.current, ...before.asked, columnLayout: next },
        'columnLayout',
      );
    },
    [setLayoutValue, forgetAsked, shown],
  );

  const setGrouping = useCallback(
    (next: readonly DataGridGroupItem[]) => {
      const before = latest.current;
      if (sameGrouping(before.asked.grouping ?? before.state.grouping, next)) return false;
      setGroupingValue(next);
      latest.current = {
        ...before,
        state: before.groupingOwned ? before.state : { ...before.state, grouping: next },
        asked: { ...before.asked, grouping: next },
      };
      if (before.groupingOwned) forgetAsked('grouping', next);
      before.onStateChange?.({ ...shown.current, ...before.asked, grouping: next }, 'grouping');
      return true;
    },
    [setGroupingValue, forgetAsked, shown],
  );

  const setExpandedGroups = useCallback(
    (next: DataGridExpandedGroups) => {
      const before = latest.current;
      if (sameExpanded(before.asked.expandedGroups ?? before.state.expandedGroups, next)) {
        return false;
      }
      setExpandedValue(next);
      latest.current = {
        ...before,
        state: before.expandedOwned ? before.state : { ...before.state, expandedGroups: next },
        asked: { ...before.asked, expandedGroups: next },
      };
      if (before.expandedOwned) forgetAsked('expandedGroups', next);
      before.onStateChange?.(
        { ...shown.current, ...before.asked, expandedGroups: next },
        'expandedGroups',
      );
      return true;
    },
    [setExpandedValue, forgetAsked, shown],
  );

  const expandedNow = useCallback(
    () => latest.current.asked.expandedGroups ?? latest.current.state.expandedGroups,
    [],
  );

  return {
    state,
    setSort,
    setFilter,
    setPage,
    setSelectedKeys,
    setColumnLayout,
    setGrouping,
    setExpandedGroups,
    expandedNow,
  };
}
