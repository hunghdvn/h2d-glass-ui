import { useCallback, useId, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { ResolvedColumn } from '../engine/columns';
import { foldedSearch, hasConditions, isFiltering, sameRows } from '../engine/filter';
import type { TextCache } from '../engine/values';
import type { FilterView } from '../filter-context';
import { popupHome as popupHomeOf } from '../grid-dom';
import type { PopupOpener } from '../grid-dom';
import type { DataGridFilter, DataGridPage } from '../types';
import { useFilterPopover } from './use-filter-popover';
import { useHeaderValues } from './use-header-values';
import { sameList, useKept } from './use-kept';
import { useOperatorMenu } from './use-operator-menu';
import { useRowsFound } from './use-rows-found';
import type { ShownColumns } from './use-grid-columns';

const NO_COLUMNS: readonly never[] = [];

export interface GridFilterOptions<TRow> {
  filter: DataGridFilter;
  /** Asks for a filter: the callbacks, and whether it differs from what is held. */
  setFilter: (filter: DataGridFilter) => boolean;
  setPage: (page: DataGridPage) => void;
  /** The page the state holds, and its size as the grid reads it. */
  pageIndex: number;
  size: number;
  paged: boolean;
  data: readonly TRow[];
  /**
   * How many data rows the search and the filter keep: every page of them and every group, not the
   * group rows the pager also counts; `totalCount` in server mode.
   */
  total: number;
  loading: boolean;
  remote: boolean;
  /** The rows after the search, which the header filter lists from. */
  searched: readonly TRow[];
  resolved: readonly ResolvedColumn<TRow>[];
  /** The layout applied: the filter panel says its conditions in its order. */
  applied: ShownColumns<TRow>['applied'];
  /** The columns the rows and the titles show, and the ones the grouping took out of them, in its order. */
  shown: readonly ResolvedColumn<TRow>[];
  grouped: readonly ResolvedColumn<TRow>[];
  textCache: TextCache<TRow>;
  locale: string;
  filterPanel: boolean;
  headerFilter: boolean;
  tableRef: RefObject<HTMLTableElement | null>;
  /** The sentence of a count of rows found. */
  say: (count: number) => string;
  announce: (text: string) => void;
}

export interface GridFilter<TRow> {
  /** Whether the filter keeps back any row of this grid's columns. */
  filtering: boolean;
  applyFilter: (next: DataGridFilter) => void;
  clearFilter: () => void;
  /** What the parts that filter read, through `FilterContext`. */
  filterView: FilterView;
  /** The columns the filter panel names, in its order, kept by their members. */
  panelColumns: readonly ResolvedColumn<TRow>[];
  /** The rows the panel reads to write a header value as the cells do. */
  panelSource: { rows: readonly TRow[]; read: TextCache<TRow> };
  panelShown: boolean;
  /** What the cells mark: the search as the engine reads it. */
  marked: string;
  /**
   * What the popups of the filter need to find where their focus goes, as of the last commit: the shown
   * columns and the grid's active place. The grid writes it once its keyboard exists.
   */
  homeSources: {
    current: { columns: readonly ResolvedColumn<TRow>[]; active: () => HTMLElement | null };
  };
}

/**
 * The filter. Every change the user makes goes through `applyFilter`, so the callbacks, the page and
 * what is said cannot differ between a search, a condition and a clear: `onFilterChange` and
 * `onStateChange`, then the first page (a second change, with its own pair of callbacks, when the
 * page was not the first), then the count of rows found. A filter that says what is held already
 * does nothing at all. Server mode filters nothing here: the callbacks are how the app learns.
 */
export function useGridFilter<TRow>({
  filter,
  setFilter,
  setPage,
  pageIndex,
  size,
  paged,
  data,
  total,
  loading,
  remote,
  searched,
  resolved,
  applied,
  shown,
  grouped,
  textCache,
  locale,
  filterPanel,
  headerFilter,
  tableRef,
  say,
  announce,
}: GridFilterOptions<TRow>): GridFilter<TRow> {
  const filtering = isFiltering(filter, resolved);
  const askRowsFound = useRowsFound({ filter, total, remote, loading, data, say, announce });
  const pageNow = useRef({ index: pageIndex, size, paged, data, filter });
  useWriteOnCommit(() => {
    pageNow.current = { index: pageIndex, size, paged, data, filter };
  });
  // A change that keeps the same rows (the spaces around a search) is stored and reported as typed, but it
  // is no new filter for the user: it stays on its page and says nothing. The filter it is compared with
  // is the one last asked, so two requests of one event see each other.
  const applyFilter = useCallback(
    (next: DataGridFilter) => {
      if (!setFilter(next)) return;
      const {
        index,
        size: pageSize,
        paged: hasPages,
        data: rowsNow,
        filter: before,
      } = pageNow.current;
      pageNow.current = { ...pageNow.current, filter: next };
      if (sameRows(before, next)) return;
      askRowsFound(next, rowsNow);
      if (hasPages && index !== 0) setPage({ index: 0, size: pageSize });
    },
    [setFilter, setPage, askRowsFound],
  );
  // A clear is told to the boxes that hold text they have not sent (the search field, the text cells): it
  // would otherwise be sent after it, though the clear says there is no search and no condition.
  const clearListeners = useRef(new Set<() => void>());
  const onClear = useCallback((listener: () => void) => {
    clearListeners.current.add(listener);
    return () => {
      clearListeners.current.delete(listener);
    };
  }, []);
  const clearFilter = useCallback(() => {
    for (const listener of clearListeners.current) listener();
    applyFilter({});
  }, [applyFilter]);
  // The filter panel says the conditions in the order of the columns: the shown ones by their zones, then the
  // grouped ones in the order of the grouping, then the hidden ones, which still filter. The list is kept by
  // its members, so a width or a sort draws no panel.
  const panelOrder = useMemo(() => {
    if (!filterPanel) return NO_COLUMNS;
    const byId = new Map(resolved.map((column) => [column.id, column]));
    return [...shown, ...grouped, ...applied.layout.hidden.flatMap((id) => byId.get(id) ?? [])];
  }, [filterPanel, resolved, applied, shown, grouped]);
  const panelColumns = useKept(panelOrder, sameList);
  // The rows the panel reads to write a header value as the cells do: the data and its text cache, so a
  // search, which changes neither, does not draw the panel (in server mode the data is the page).
  const panelSource = useMemo(() => ({ rows: data, read: textCache }), [data, textCache]);
  const panelShown = filterPanel && hasConditions(filter, resolved);
  // What the cells mark: the search as the engine reads it, in server mode too, where the page the
  // server sent is marked and not filtered.
  const marked = foldedSearch(filter.search);
  const operatorMenuId = useId();
  const operatorMenu = useOperatorMenu(operatorMenuId);
  const filterPopoverId = useId();
  const filterPopover = useFilterPopover(filterPopoverId);
  const listValues = useHeaderValues({
    enabled: headerFilter,
    rows: searched,
    filter,
    resolved,
    remote,
    read: textCache,
    locale,
  });
  // What the popups of the filter need to find where their focus goes, as of the last commit: the shown
  // columns and the grid's active place (the keyboard is made after this hook).
  const homeSources = useRef<GridFilter<TRow>['homeSources']['current']>({
    columns: [],
    active: () => null,
  });
  const popupHome = useCallback(
    (opener: PopupOpener, columnId: string, from: HTMLElement) => {
      const { columns: shown, active } = homeSources.current;
      const place = shown.findIndex((column) => column.id === columnId);
      return popupHomeOf(tableRef.current, place, opener, from, active);
    },
    [tableRef],
  );
  const filterView = useMemo<FilterView>(
    () => ({
      filter,
      filtering,
      apply: applyFilter,
      clear: clearFilter,
      onClear,
      operatorMenu,
      popover: filterPopover,
      listValues,
      popupHome,
    }),
    [
      filter,
      filtering,
      applyFilter,
      clearFilter,
      onClear,
      operatorMenu,
      filterPopover,
      listValues,
      popupHome,
    ],
  );
  return {
    filtering,
    applyFilter,
    clearFilter,
    filterView,
    panelColumns,
    panelSource,
    panelShown,
    marked,
    homeSources,
  };
}
