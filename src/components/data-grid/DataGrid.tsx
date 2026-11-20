'use client';

import { clsx } from 'clsx';
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, ReactElement, Ref } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { hasContent } from '../../internal/has-content';
import { joinIds } from '../../internal/join-ids';
import { isPositive } from '../../internal/number';
import { useAnnounce } from '../../internal/use-announce';
import { useRequireName } from '../../internal/use-require-name';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { useHeadHeight } from '../table/use-head-height';
import { SELECT_COLUMN_WIDTH, checkFields, resolveColumns, selectColumn } from './engine/columns';
import { hasMenu } from './engine/column-menu';
import { applyLayout, fillerIndex, pinPlaces, sameLayout, startLayout } from './engine/layout';
import type { WidthSpec } from './engine/layout';
import {
  EMPTY_FILTER,
  conditionOf,
  distinctValues,
  filterRows,
  foldedSearch,
  hasConditions,
  isFiltering,
} from './engine/filter';
import { createPipeline } from './engine/pipeline';
import { headRowCount } from './grid-dom';
import { effectiveSort, nextSort } from './engine/sort';
import { createTextCache } from './engine/values';
import { FilterContext } from './filter-context';
import type { FilterView } from './filter-context';
import {
  ActiveContext,
  GridContext,
  RowsContext,
  SelectionViewContext,
  VirtualContext,
} from './grid-context';
import type { GridContextValue, RowsContextValue, VirtualWindow, WindowLink } from './grid-context';
import { useColumnDrag } from './hooks/use-column-drag';
import { captionOf, useColumnActions } from './hooks/use-column-actions';
import { useColumnMenu } from './hooks/use-column-menu';
import { useColumnResize } from './hooks/use-column-resize';
import { useColumnWidths } from './hooks/use-column-widths';
import { sameLabels, useColumnsWarning, useRowPropsWarning } from './hooks/use-renewal-warning';
import { useGridKeyboard } from './hooks/use-grid-keyboard';
import { useGridState } from './hooks/use-grid-state';
import { useColumnStartWarning } from './hooks/use-column-start-warning';
import { useKept, sameList, sameMembers } from './hooks/use-kept';
import { createDragView } from './hooks/use-drag-view';
import { createLiveWidths } from './hooks/use-live-widths';
import { usePaging } from './hooks/use-paging';
import { usePinnedScroll } from './hooks/use-pinned-scroll';
import { usePropWarnings } from './hooks/use-prop-warnings';
import { useScrollToRow } from './hooks/use-scroll-to-row';
import { useRowKey } from './hooks/use-row-key';
import { useSelection } from './hooks/use-selection';
import { useLoadingAnnounce } from './hooks/use-loading-announce';
import { useRowsFound } from './hooks/use-rows-found';
import { useFilterPopover } from './hooks/use-filter-popover';
import { useOperatorMenu } from './hooks/use-operator-menu';
import { useOverlayTop } from './hooks/use-overlay-top';
import { OVERSCAN } from './hooks/use-virtual-rows';
import { mergeLabels } from './labels';
import { isWhole, normalizeProps } from './normalize';
import { Body } from './parts/Body';
import { FilterPanel } from './parts/FilterPanel';
import { FilterPopover } from './parts/FilterPopover';
import { OperatorMenu } from './parts/OperatorMenu';
import { ColumnMenu } from './parts/ColumnMenu';
import { DragLayer, DropLine } from './parts/DragLayer';
import { GridTable } from './parts/GridTable';
import { HeaderRow } from './parts/HeaderRow';
import { Overlay } from './parts/Overlay';
import { Pager } from './parts/Pager';
import { ResizeGuide } from './parts/ResizeGuide';
import { Toolbar, resolveCaptionTag } from './parts/Toolbar';
import { toolbarContent } from './parts/toolbar-content';
import { ROW_HEIGHT, resolveDensity, resolveVariant, rowPitch } from './row-heights';
import { checkKeys, uniqueKeys } from './row-keys';
import { SearchContext } from './search-context';
import type {
  DataGridColumnLayout,
  DataGridFilter,
  DataGridHandle,
  DataGridPin,
  DataGridProps,
  DataGridSortItem,
  DataGridState,
} from './types';

const NO_SORT: readonly never[] = [];
const NO_COLUMNS: readonly never[] = [];
const NO_LAYOUT: DataGridColumnLayout = { order: [], widths: {}, hidden: [], pinned: {} };
// The rows of the first window of a virtual grid whose height is a length, which has no pixels to
// divide before it is measured (the server draws the same).
const FIRST_ROWS_OF_A_LENGTH = 20;
// The most skeleton rows a grid that loads draws: a page, and never more than a screen of them.
const MAX_SKELETON_ROWS = 20;
// What the window link does until the body and the keyboard have written their members into it.
const unlinked = (): void => {};

function DataGridImpl<TRow>(
  {
    data: dataProp,
    rowKey,
    columns: columnsProp,
    caption,
    description,
    captionAs,
    toolbar,
    variant: variantProp,
    density: densityProp,
    rowHeight,
    locale = 'en-US',
    timeZone = 'UTC',
    height,
    scrolling,
    loading: loadingProp,
    rowClassName,
    allowSorting = true,
    allowResizing = true,
    allowReordering = true,
    allowPinning = true,
    allowHiding = true,
    allowFiltering = true,
    allowHeaderFiltering = true,
    sortMode: sortModeProp,
    sort: sortProp,
    defaultSort: defaultSortProp,
    onSortChange,
    filter: filterProp,
    defaultFilter: defaultFilterProp,
    onFilterChange,
    paging: pagingProp,
    page: pageProp,
    defaultPage: defaultPageProp,
    onPageChange,
    onStateChange,
    onRowActivate,
    selectionMode: selectionModeProp,
    selectAllMode: selectAllModeProp,
    selectOnRowClick,
    selectedKeys: selectedKeysProp,
    defaultSelectedKeys: defaultSelectedKeysProp,
    onSelectedKeysChange,
    columnLayout: columnLayoutProp,
    defaultColumnLayout: defaultColumnLayoutProp,
    onColumnLayoutChange,
    columnChooser,
    searchPanel,
    filterRow: filterRowProp,
    headerFilter: headerFilterProp,
    filterPanel: filterPanelProp,
    remote: remoteProp,
    totalCount,
    labels: labelsProp,
    className,
    style,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    ...rest
  }: DataGridProps<TRow>,
  ref: Ref<DataGridHandle>,
) {
  // One step makes the props that hold data and state safe to use: from here on they are of their
  // shape, and one that was not says so once, after the commit (spec phase 6 §5).
  const safe = useMemo(
    () =>
      normalizeProps({
        data: dataProp,
        columns: columnsProp,
        paging: pagingProp,
        sort: sortProp,
        defaultSort: defaultSortProp,
        filter: filterProp,
        defaultFilter: defaultFilterProp,
        page: pageProp,
        defaultPage: defaultPageProp,
        selectedKeys: selectedKeysProp,
        defaultSelectedKeys: defaultSelectedKeysProp,
        columnLayout: columnLayoutProp,
        defaultColumnLayout: defaultColumnLayoutProp,
      }),
    [
      dataProp,
      columnsProp,
      pagingProp,
      sortProp,
      defaultSortProp,
      filterProp,
      defaultFilterProp,
      pageProp,
      defaultPageProp,
      selectedKeysProp,
      defaultSelectedKeysProp,
      columnLayoutProp,
      defaultColumnLayoutProp,
    ],
  );
  const { data, columns, paging, sort, defaultSort, page, defaultPage } = safe;
  const { filter, defaultFilter } = safe;
  const { selectedKeys, defaultSelectedKeys, pageSize: configuredSize, warnings } = safe;
  const { columnLayout, defaultColumnLayout } = safe;
  const variant = resolveVariant(variantProp);
  const density = resolveDensity(densityProp);
  // Labels written in the JSX are a new object on every render. The one of an earlier render is kept
  // while each of its values is the same, so labels of strings draw no row again and a press draws
  // only the rows it changes; new functions in them are new labels, which warn (spec phase 6 §5).
  const givenLabels = useKept(labelsProp, sameLabels);
  const labels = useMemo(() => mergeLabels(givenLabels), [givenLabels]);
  useRowPropsWarning(rowClassName, labelsProp);
  const captionId = useId();
  const descriptionId = useId();
  const hasCaption = hasContent(caption);
  const hasDescription = hasContent(description);

  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  // What `getState` of the handle reads: what the last commit showed, written when the commit starts
  // and not in a render.
  const shownState = useRef<DataGridState>({
    sort: NO_SORT,
    filter: EMPTY_FILTER,
    page: { index: 0, size: 0 },
    selectedKeys: NO_SORT,
    columnLayout: NO_LAYOUT,
  });
  // The name. The caption is the name unless the caller points at another, whose id wins; an
  // `aria-label` is passed as given, and the description joins the caller's own describedby.
  const labelledBy = ariaLabelledby || (hasCaption ? captionId : undefined);
  const describedBy = joinIds(ariaDescribedby, hasDescription && descriptionId);
  useRequireName({ 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby }, 'DataGrid', {
    otherName: { description: 'pass caption', given: () => hasCaption, watch: hasCaption },
  });

  const rowHeightIsValid = rowHeight === undefined || isPositive(rowHeight);
  const dataRowHeight = isPositive(rowHeight) ? rowHeight : ROW_HEIGHT[density][variant];

  useColumnsWarning(columns);
  const resolved = useMemo(
    () =>
      resolveColumns(columns, {
        locale,
        timeZone,
        yes: labels.yes,
        no: labels.no,
        allowSorting,
        allowResizing,
        allowReordering,
        allowPinning,
        allowHiding,
        allowFiltering,
        allowHeaderFiltering,
      }),
    [
      columns,
      locale,
      timeZone,
      labels.yes,
      labels.no,
      allowSorting,
      allowResizing,
      allowReordering,
      allowPinning,
      allowHiding,
      allowFiltering,
      allowHeaderFiltering,
    ],
  );
  useEffect(() => checkFields(resolved, data), [resolved, data]);
  // Where an uncontrolled layout starts: the columns of the first render, and `defaultColumnLayout`.
  const [startedWith] = useState(() => startLayout(resolved, defaultColumnLayout));

  // The paging: `false` is one page of every row, an object says the sizes, and none is the default.
  const pagingConfig = paging === false ? undefined : paging;
  const remote = remoteProp === true;
  // Virtual needs the `height` that is a prop, and rows to draw a window of: not server mode.
  const asksForVirtual = scrolling === 'virtual';
  const virtual = asksForVirtual && height !== undefined && !remote;
  const paged = !virtual && paging !== false;
  const sortMode = sortModeProp === 'single' ? 'single' : 'multiple';
  const selectionMode =
    selectionModeProp === 'single' || selectionModeProp === 'multiple' ? selectionModeProp : 'none';
  const { state, setSort, setFilter, setPage, setSelectedKeys, setColumnLayout } = useGridState({
    sort,
    defaultSort,
    onSortChange,
    filter,
    defaultFilter,
    onFilterChange,
    page,
    defaultPage: defaultPage ?? { index: 0, size: configuredSize },
    onPageChange,
    selectedKeys,
    defaultSelectedKeys,
    onSelectedKeysChange,
    columnLayout,
    defaultColumnLayout: startedWith,
    onColumnLayoutChange,
    onStateChange,
    shown: shownState,
  });
  // The layout the columns are laid out by. A layout written in the JSX is a new object in every
  // render: the one of an earlier render is kept while the new one says the same, so it draws no row.
  const layout = useKept(state.columnLayout, sameLayout);
  const applied = useMemo(() => applyLayout(resolved, layout), [resolved, layout]);
  // What reads each part of it is kept apart, so a change of one part draws only what reads it: the
  // shown columns in order (the title and the rows), the same columns in any order (the sort, which
  // an order does not change) and the widths (the table alone).
  const dataColumns = useKept(applied.columns, sameList);
  const sortColumns = useKept(applied.columns, sameMembers);
  const columnWidths = useKept(applied.widths, sameList);
  const dataPins = useKept(applied.pins, sameList);
  // The layout as it is shown (unknown ids dropped, new columns appended, widths held to their limits):
  // the one every change the user makes is built from, and the one the callbacks and `getState()` send.
  // `layout` above is the caller's value as it came, kept by value; it is only for `applyLayout`.
  const shownLayout = useKept(applied.layout, sameLayout);
  useColumnStartWarning(resolved, shownLayout);
  // A size that is no whole number above 0 may come from a state the user saved: the usual one.
  const size = isWhole(state.page.size) ? state.page.size : configuredSize;

  // Server mode knows the page and not the rows after it, so "select all" can only be about the page.
  const askedForAll = selectionMode === 'multiple' && selectAllModeProp === 'all';
  const selectAllMode = askedForAll && !remote ? 'all' : 'page';
  const allIsPage = askedForAll && remote;
  // The filter row is there for `true` and no other value.
  const filterRow = filterRowProp === true;
  // The funnels are there for `true` and no other value.
  const headerFilter = headerFilterProp === true;
  // The panel is there for `true` and no other value.
  const filterPanel = filterPanelProp === true;
  const headRows = headRowCount(filterRow);
  const virtualNeedsHeight = asksForVirtual && height === undefined;
  const virtualNotRemote = asksForVirtual && remote;
  const virtualHasNoPages = virtual && pagingConfig !== undefined;
  const missingCount = remote && totalCount === undefined;
  // Server mode lists a column's own values; a funnel of a column that has none lists the page's.
  const missingHeaderValues =
    remote &&
    headerFilter &&
    resolved.some((column) => column.allowHeaderFiltering && !column.headerValues);
  usePropWarnings({
    normalized: warnings,
    rowHeightIsValid,
    allIsPage,
    virtualNeedsHeight,
    virtualNotRemote,
    virtualHasNoPages,
    missingCount,
    missingHeaderValues,
  });

  const getKey = useRowKey(rowKey);
  const pipeline = useMemo(() => createPipeline<TRow>(), []);
  const textCache = useMemo(() => createTextCache<TRow>(), []);
  const result = pipeline.run({
    data,
    columns: sortColumns,
    filter: state.filter,
    filterColumns: resolved,
    read: textCache,
    getKey,
    sort: state.sort,
    page: paged ? { index: state.page.index, size } : null,
    remote,
    totalCount,
    locale,
  });
  // The keys are checked as the grid reads them, on the list: the place of a row with no key, which
  // is its key, depends on the sort, and may be the key of another row.
  useEffect(() => {
    if (typeof rowKey === 'string' || typeof rowKey === 'function') {
      checkKeys(data, rowKey, result.flat);
    }
  }, [data, rowKey, result.flat]);
  const rows = result.visible;
  // Loading is only a true `loading`. With no row to show, a grid that loads draws skeleton rows and
  // one that does not says it is empty; with rows, the rows stay and a layer goes over them.
  const loading = loadingProp === true;
  const placeholder = rows.length > 0 ? null : loading ? 'skeleton' : 'empty';
  const reloading = loading && rows.length > 0;
  const skeletonRows = paged ? Math.min(size, MAX_SKELETON_ROWS) : MAX_SKELETON_ROWS;
  const rowReactKeys = useMemo(() => uniqueKeys(rows.map((row) => row.key)), [rows]);

  // The sort as it is shown: the items that sort something, in order. A press builds on them.
  // A hidden column is no column of the grid, so it sorts nothing: its item stays in `sort`.
  const sortItems = useMemo(
    () => effectiveSort(state.sort, sortColumns),
    [state.sort, sortColumns],
  );
  const sorting = useMemo(
    () => ({
      levels: new Map(
        sortItems.map((item, index) => [
          item.field,
          { direction: item.direction, level: index + 1 },
        ]),
      ),
      count: sortItems.length,
    }),
    [sortItems],
  );
  const { announce, region } = useAnnounce();
  useLoadingAnnounce(loading, labels.loading, announce);

  // The filter. Every change the user makes goes through `applyFilter`, so the callbacks, the page and
  // what is said cannot differ between a search, a condition and a clear: `onFilterChange` and
  // `onStateChange`, then the first page (a second change, with its own pair of callbacks, when the
  // page was not the first), then the count of rows found. A filter that says what is held already
  // does nothing at all. Server mode filters nothing here: the callbacks are how the app learns.
  const filtering = isFiltering(state.filter, resolved);
  const askRowsFound = useRowsFound({
    filter: state.filter,
    total: result.total,
    remote,
    loading,
    data,
    say: labels.announceRowsFound,
    announce,
  });
  const pageNow = useRef({ index: state.page.index, size, paged, data });
  useWriteOnCommit(() => {
    pageNow.current = { index: state.page.index, size, paged, data };
  });
  const applyFilter = useCallback(
    (next: DataGridFilter) => {
      if (!setFilter(next)) return;
      const { index, size: pageSize, paged: hasPages, data: rowsNow } = pageNow.current;
      askRowsFound(next, rowsNow);
      if (hasPages && index !== 0) setPage({ index: 0, size: pageSize });
    },
    [setFilter, setPage, askRowsFound],
  );
  const clearFilter = useCallback(() => applyFilter({}), [applyFilter]);
  // The filter panel says the conditions in the order of the columns: the shown ones by their zones, then the
  // hidden ones, which still filter. The list is kept by its members, so a width or a sort draws no panel.
  const panelOrder = useMemo(() => {
    if (!filterPanel) return NO_COLUMNS;
    const byId = new Map(resolved.map((column) => [column.id, column]));
    return [...applied.columns, ...applied.layout.hidden.map((id) => byId.get(id)!)];
  }, [filterPanel, resolved, applied]);
  const panelColumns = useKept(panelOrder, sameList);
  const panelShown = filterPanel && hasConditions(state.filter, resolved);
  // What the cells mark: the search as the engine reads it, in server mode too, where the page the
  // server sent is marked and not filtered.
  const marked = foldedSearch(state.filter.search);
  const operatorMenuId = useId();
  const operatorMenu = useOperatorMenu(operatorMenuId);
  const filterPopoverId = useId();
  const filterPopover = useFilterPopover(filterPopoverId);
  // What the header filter lists, read when its popover opens: the rows after the search and the conditions
  // of the other columns (server mode lists the column's own values, or the page), as of the last commit.
  const listing = useRef({ rows: result.searched, filter: state.filter, resolved, remote });
  useWriteOnCommit(() => {
    listing.current = { rows: result.searched, filter: state.filter, resolved, remote };
  });
  const listValues = useCallback(
    (columnId: string) => {
      const { rows: searchedRows, filter: held, resolved: every, remote: server } = listing.current;
      const column = every.find((candidate) => candidate.id === columnId);
      if (!column) return [];
      const others = server
        ? searchedRows
        : filterRows(searchedRows, every, held, textCache, columnId);
      const { values } = conditionOf(held, columnId) ?? {};
      return distinctValues(
        others,
        column,
        { named: Array.isArray(values) ? values : [], limit: Infinity, locale },
        textCache,
      ).items;
    },
    [textCache, locale],
  );
  const filterView = useMemo<FilterView>(
    () => ({
      filter: state.filter,
      filtering,
      apply: applyFilter,
      clear: clearFilter,
      operatorMenu,
      popover: filterPopover,
      listValues,
    }),
    [state.filter, filtering, applyFilter, clearFilter, operatorMenu, filterPopover, listValues],
  );
  // A sort the user asks for: the state, its callbacks and what is said, whether by a press on a title or
  // by the menu of a column.
  const applySort = useCallback(
    (next: readonly DataGridSortItem[]) => {
      setSort(next);
      announce(
        next.length === 0
          ? labels.announceSortCleared
          : labels.announceSort(
              next.map((item) => ({
                caption: captionOf(resolved, item.field),
                direction: item.direction,
              })),
            ),
      );
    },
    [setSort, announce, labels, resolved],
  );
  const onSortPress = useCallback(
    (columnId: string, additive: boolean) =>
      applySort(nextSort(sortItems, columnId, additive, sortMode)),
    [sortItems, sortMode, applySort],
  );

  // Choosing rows. The column of boxes is a column of the grid like the others to the layout and the
  // keyboard; the sort, the pipeline and the captions know only the caller's.
  const selection = useSelection({
    mode: selectionMode,
    allMode: selectAllMode,
    keys: state.selectedKeys,
    setKeys: setSelectedKeys,
    pageRows: rows,
    orderedRows: result.flat,
    labels,
    announce,
  });
  const boxColumn = useMemo(() => selectColumn<TRow>(), []);
  const columnsShown = useMemo(
    () => (selectionMode === 'multiple' ? [boxColumn, ...dataColumns] : dataColumns),
    [selectionMode, boxColumn, dataColumns],
  );
  // The zone of each shown column, the column of boxes first. It is in the left zone when a data
  // column is, so the boxes stay beside the first column that sticks (spec phase 6 §3.7).
  const pinsShown = useMemo<(DataGridPin | undefined)[]>(
    () =>
      selectionMode === 'multiple'
        ? [dataPins.includes('left') ? 'left' : undefined, ...dataPins]
        : [...dataPins],
    [selectionMode, dataPins],
  );
  const pins = useMemo(() => pinPlaces(pinsShown), [pinsShown]);
  const fillerAt = fillerIndex(pinsShown);
  const pinned = dataPins.some((pin) => pin !== undefined);
  // The widths are the layout's, so they are given to the table alone and not to the parts that draw
  // the cells: the columns of the context are the same objects when only a width changes.
  const widthSpecs = useMemo<(WidthSpec & { id: string })[]>(
    () => [
      ...(selectionMode === 'multiple'
        ? [{ id: boxColumn.id, width: SELECT_COLUMN_WIDTH, minWidth: SELECT_COLUMN_WIDTH }]
        : []),
      ...dataColumns.map((column, index) => ({
        id: column.id,
        width: columnWidths[index],
        minWidth: column.minWidth,
      })),
    ],
    [selectionMode, boxColumn, dataColumns, columnWidths],
  );
  const rowHeader = useMemo(() => dataColumns.find((column) => column.rowHeader), [dataColumns]);
  const rowClick =
    typeof selectOnRowClick === 'boolean' ? selectOnRowClick : selectionMode === 'single';

  // The words of an empty grid span every column, and are as wide as the frame shows: the room is
  // written while they are drawn, though every column has a width.
  const { widths, fixed, filler } = useColumnWidths(frameRef, widthSpecs, {
    fullRow: placeholder === 'empty',
    variant,
    density,
  });
  // Resizing a column: the width each column has now (the measured one, or its own), and where a drag
  // writes the widths it is in flight with, which only the table and the guide read.
  const columnSizes = useMemo(
    () => widthSpecs.map((spec, index) => widths?.[index] ?? spec.width),
    [widthSpecs, widths],
  );
  const liveWidths = useState(createLiveWidths)[0];
  const resize = useColumnResize({
    frameRef,
    tableRef,
    columns: columnsShown,
    pins,
    sizes: columnSizes,
    layout: shownLayout,
    setColumnLayout,
    store: liveWidths,
    labels,
    announce,
  });

  // Reordering the columns: the chip and the drop line of a drag are read from a store of their own,
  // and the rows read only which column is dragged, which changes at the start and at the end.
  const dragView = useState(createDragView)[0];
  const reorder = useColumnDrag({
    frameRef,
    tableRef,
    columns: columnsShown,
    pins,
    layout: shownLayout,
    setColumnLayout,
    view: dragView,
    labels,
    announce,
  });

  // The menu of the columns: one for the grid, opened by the button of a title, a right press and the keys.
  // The last data column shown cannot be hidden, so its menu has no "Hide column" and, if that was all
  // it had, no button.
  const hideable = dataColumns.length > 1;
  const columnMenu = useColumnMenu({ tableRef, columns: columnsShown, hideable });
  const menuId = useId();
  const hasColumnMenu = dataColumns.some((column) => hasMenu(column, hideable));
  // Once mounted, the menu stays: a hide that leaves no menu would unmount it with the focus still in
  // it (the item that was chosen), and nothing would be left to give the focus back to the title. The
  // flag starts as `hasColumnMenu` and an effect keeps it, never an update in the render: React 18 gives
  // a component that updates itself in its render other `useId`s on the server and on the client.
  const [menuMounted, setMenuMounted] = useState(hasColumnMenu);
  useEffect(() => {
    if (hasColumnMenu) setMenuMounted(true);
  }, [hasColumnMenu]);
  // What the user does to the columns from their menu or from the chooser.
  const { showColumn, menuActions } = useColumnActions({
    resolved,
    layout: shownLayout,
    setColumnLayout,
    sortItems,
    applySort,
    moveBy: reorder.moveBy,
    fit: resize.fit,
    labels,
    announce,
  });

  const toolbarNode = toolbarContent({
    toolbar,
    searchPanel,
    columnChooser,
    resolved,
    layout: shownLayout,
    labels,
    showColumn,
  });

  // The window of a virtual grid is the body's (VirtualContext): a scroll draws the body alone. The
  // keyboard and the handle ask it for a row through the link, which the body writes as it commits,
  // and the body says through it that its window moved, for the focus a key is waiting to give.
  const windowLink = useRef<WindowLink>({ scrollToIndex: unlinked, drawn: unlinked });
  const reveal = useCallback((index: number) => windowLink.current.scrollToIndex(index), []);
  const keyboard = useGridKeyboard({
    tableRef,
    frameRef,
    columns: columnsShown,
    rows,
    emptyCell: placeholder === 'empty' && filtering,
    filterRow,
    reveal: virtual ? reveal : undefined,
    onSortPress,
    onResizeBy: resize.resizeBy,
    onMoveBy: reorder.moveBy,
    onOpenMenu: columnMenu.openFromKey,
    onRowActivate,
    selection:
      selectionMode === 'none'
        ? null
        : {
            mode: selectionMode,
            press: selection.actions.press,
            chooseAll: selection.actions.chooseAll,
          },
  });
  useWriteOnCommit(() => {
    windowLink.current.drawn = keyboard.windowDrawn;
  });
  // What the body needs for its window. The row that has the keyboard is drawn wherever the frame is
  // scrolled: the focus stays, and the grid keeps its one Tab stop.
  const estimate = rowPitch(dataRowHeight, variant);
  const firstRows =
    typeof height === 'number'
      ? Math.ceil(height / dataRowHeight) + OVERSCAN
      : FIRST_ROWS_OF_A_LENGTH;
  const virtualWindow = useMemo<VirtualWindow | null>(
    () =>
      virtual
        ? {
            rowHeight: dataRowHeight,
            estimate,
            firstRows,
            held: keyboard.held,
            link: windowLink,
          }
        : null,
    [virtual, dataRowHeight, estimate, firstRows, keyboard.held],
  );

  const scrollToRow = useScrollToRow({
    tableRef,
    windowLink,
    flat: result.flat,
    virtual,
    paged,
    remote,
    size,
    pageIndex: result.pageIndex,
    rows,
    setPage,
  });

  // The ref is the handle, not the element (spec 6.1): what a caller does with the grid are
  // commands. The element is read when asked, and the commands are stable, so the handle is the same
  // object for as long as the grid lives.
  useImperativeHandle(
    ref,
    () => ({
      get element() {
        return rootRef.current;
      },
      getState: () => shownState.current,
      focus: keyboard.focusActive,
      scrollToRow,
      clearFilter,
    }),
    [keyboard.focusActive, scrollToRow, clearFilter],
  );

  const shown = useMemo<DataGridState>(
    () => ({
      sort: state.sort,
      filter: state.filter,
      // With paging off the page is not the grid's to say: it stays as it is held, unused.
      page: paged ? { index: result.pageIndex, size } : state.page,
      selectedKeys: state.selectedKeys,
      columnLayout: shownLayout,
    }),
    [
      state.sort,
      state.filter,
      state.page,
      state.selectedKeys,
      shownLayout,
      result.pageIndex,
      paged,
      size,
    ],
  );
  useWriteOnCommit(() => {
    shownState.current = shown;
  });

  const { sizes, goToPage, changeSize } = usePaging({
    pagingConfig,
    paged,
    remote,
    loading,
    totalCount,
    held: state.page,
    size,
    pageIndex: result.pageIndex,
    total: result.total,
    setPage,
  });

  const activates = onRowActivate !== undefined;
  const rowsShown = useMemo<RowsContextValue<TRow>>(
    () => ({ rows, rowReactKeys, placeholder }),
    [rows, rowReactKeys, placeholder],
  );
  const context = useMemo<GridContextValue<TRow>>(
    () => ({
      columns: columnsShown,
      filler,
      fillerAt,
      pins,
      labels,
      variant,
      locale,
      virtual,
      filterRow,
      headerFilter,
      skeletonRows,
      textOf: (row, column) => textCache.text(row, column),
      rowClassName,
      sorting,
      onSortPress,
      selection: {
        mode: selectionMode,
        allMode: selectAllMode,
        onRowClick: rowClick,
        activates,
        actions: selection.actions,
      },
      rowHeader,
      resize,
      reorder: { onPointerDown: reorder.onPointerDown },
      menu: {
        store: columnMenu.store,
        open: columnMenu.open,
        close: columnMenu.close,
        onPointerDown: columnMenu.onPointerDown,
        onContextMenu: columnMenu.onContextMenu,
        contentId: menuId,
        hideable,
      },
      dragSource: reorder.source,
    }),
    [
      columnsShown,
      filler,
      fillerAt,
      pins,
      labels,
      locale,
      variant,
      virtual,
      filterRow,
      headerFilter,
      skeletonRows,
      textCache,
      rowClassName,
      sorting,
      onSortPress,
      selectionMode,
      selectAllMode,
      rowClick,
      activates,
      selection.actions,
      rowHeader,
      resize,
      reorder.onPointerDown,
      columnMenu,
      menuId,
      hideable,
      reorder.source,
    ],
  );

  // Only a grid with a height scrolls its rows under a heading, so only then is the heading measured.
  useHeadHeight(frameRef, tableRef, height !== undefined);
  const overlayTop = useOverlayTop(frameRef, tableRef, reloading);
  usePinnedScroll(frameRef, tableRef, pinned);

  const rootStyle = {
    ...style,
    ...(height === undefined ? null : { height }),
    '--flg-data-grid-row-height': `${dataRowHeight}px`,
  } as CSSProperties;

  return (
    <GridContext.Provider value={context as GridContextValue}>
      <FilterContext.Provider value={filterView}>
        <SelectionViewContext.Provider value={selection.view}>
          <div
            // The caller's attributes first: the root's own selectors read `data-variant` and
            // `data-density`, so the grid's values are the ones that stay.
            {...rest}
            ref={rootRef}
            className={clsx('flg-data-grid', className)}
            style={rootStyle}
            data-variant={variant}
            data-density={density}
          >
            <Toolbar
              caption={caption}
              description={description}
              captionAs={resolveCaptionTag(captionAs)}
              captionId={captionId}
              descriptionId={descriptionId}
            >
              {toolbarNode}
            </Toolbar>
            <div className="flg-data-grid-main">
              <div
                ref={frameRef}
                className="flg-table-frame flg-data-grid-frame"
                data-variant={variant}
                data-size={density === 'compact' ? 'sm' : 'md'}
                data-sticky-header={dataAttr(true)}
                // With a height the frame scrolls its rows under the sticky heading, which they keep
                // clear above them when they are scrolled into view; without one the page scrolls.
                data-height={dataAttr(height !== undefined)}
                data-virtual={dataAttr(virtual)}
                // A scroll frame is a stop of Tab in Firefox, though it holds a cell that is one, unless it has
                // a tabindex. The -1 keeps it out of the order, and it stays: it is never taken off a frame
                // that may have the focus (a press on its empty part gives it).
                tabIndex={-1}
              >
                <GridTable
                  tableRef={tableRef}
                  columns={widthSpecs}
                  widths={widths}
                  fixed={fixed}
                  filler={filler}
                  pins={pinsShown}
                  fillerAt={fillerAt}
                  live={liveWidths}
                  aria-multiselectable={selectionMode === 'multiple' ? true : undefined}
                  aria-busy={loading ? true : undefined}
                  // The rows that are not drawn are counted for a screen reader, which the rows that are
                  // say the place of; with every row drawn the DOM is the count.
                  aria-rowcount={virtual ? rows.length + headRows : undefined}
                  aria-label={ariaLabel}
                  aria-labelledby={labelledBy}
                  aria-describedby={describedBy}
                  onKeyDown={keyboard.onKeyDown}
                  onFocus={keyboard.onFocus}
                  onBlur={keyboard.onBlur}
                  onMouseDown={keyboard.onMouseDown}
                  onDoubleClick={keyboard.onDoubleClick}
                >
                  <ActiveContext.Provider value={keyboard.active}>
                    <VirtualContext.Provider value={virtualWindow}>
                      <HeaderRow />
                      <RowsContext.Provider value={rowsShown as RowsContextValue}>
                        <SearchContext.Provider value={marked}>
                          <Body />
                        </SearchContext.Provider>
                      </RowsContext.Provider>
                    </VirtualContext.Provider>
                  </ActiveContext.Provider>
                </GridTable>
              </div>
              <ResizeGuide live={liveWidths} frameRef={frameRef} />
              <DropLine view={dragView} frameRef={frameRef} tableRef={tableRef} />
              {reloading ? (
                <Overlay variant={variant} label={labels.loading} top={overlayTop} />
              ) : null}
            </div>
            {panelShown ? (
              <FilterPanel
                columns={panelColumns}
                labels={labels}
                restoreFocus={keyboard.focusActive}
              />
            ) : null}
            {paged && result.total > 0 ? (
              <Pager
                labels={labels}
                captionId={hasCaption ? captionId : undefined}
                pageIndex={result.pageIndex}
                pageCount={result.pageCount}
                size={size}
                total={result.total}
                sizes={sizes}
                onPage={goToPage}
                onSize={changeSize}
              />
            ) : null}
            {filterRow ? <OperatorMenu /> : null}
            {filterRow || headerFilter ? <FilterPopover /> : null}
            {hasColumnMenu || menuMounted ? (
              <ColumnMenu
                layout={shownLayout}
                actions={menuActions}
                restoreFocusTo={keyboard.activeHome}
              />
            ) : null}
            {region}
            <DragLayer view={dragView} />
          </div>
        </SelectionViewContext.Provider>
      </FilterContext.Provider>
    </GridContext.Provider>
  );
}

/**
 * A data grid: rows of data in columns, in the look of a Table. It is a generic component, so
 * `TRow` is read from `data`; the `forwardRef` is cast to say so (React 18.3 and 19 both). Its ref
 * is a handle (`DataGridHandle`), not the element.
 */
export const DataGrid = forwardRef(DataGridImpl) as (<TRow>(
  props: DataGridProps<TRow> & { ref?: Ref<DataGridHandle> },
) => ReactElement) & { displayName?: string };
DataGrid.displayName = 'DataGrid';
