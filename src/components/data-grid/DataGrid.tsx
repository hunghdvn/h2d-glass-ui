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
import { hasMenu } from './engine/column-menu';
import { isPlaceColumn } from './engine/columns';
import { EMPTY_FILTER } from './engine/filter';
import { createPipeline } from './engine/pipeline';
import { headRowCount } from './grid-dom';
import { createTextCache } from './engine/values';
import { FilterContext } from './filter-context';
import {
  ActiveContext,
  GridContext,
  RowsContext,
  SelectionViewContext,
  VirtualContext,
} from './grid-context';
import type { GridContextValue, RowsContextValue, VirtualWindow, WindowLink } from './grid-context';
import { useColumnDrag } from './hooks/use-column-drag';
import { useColumnActions } from './hooks/use-column-actions';
import { useColumnMenu } from './hooks/use-column-menu';
import { useColumnResize } from './hooks/use-column-resize';
import { useColumnWidths } from './hooks/use-column-widths';
import { sameLabels, useRowPropsWarning } from './hooks/use-renewal-warning';
import { useGridKeyboard } from './hooks/use-grid-keyboard';
import { useGridState } from './hooks/use-grid-state';
import { useKept } from './hooks/use-kept';
import { useResolvedColumns, useShownColumns } from './hooks/use-grid-columns';
import { useGridFilter } from './hooks/use-grid-filter';
import { useGridGrouping } from './hooks/use-grid-grouping';
import { useGridSort } from './hooks/use-grid-sort';
import { useShownState } from './hooks/use-shown-state';
import { createDragView } from './hooks/use-drag-view';
import { createLiveWidths } from './hooks/use-live-widths';
import { usePaging } from './hooks/use-paging';
import { usePinnedScroll } from './hooks/use-pinned-scroll';
import { usePropWarnings } from './hooks/use-prop-warnings';
import { useScrollToRow } from './hooks/use-scroll-to-row';
import { useRowKey } from './hooks/use-row-key';
import { useSelection } from './hooks/use-selection';
import { useLoadingAnnounce } from './hooks/use-loading-announce';
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
import {
  GROUP_ROW_HEIGHT_PROPERTY,
  ROW_HEIGHT,
  groupRowHeight,
  resolveDensity,
  resolveVariant,
  rowPitch,
} from './row-heights';
import { checkKeys, reactKeysOf } from './row-keys';
import { SearchContext } from './search-context';
import type {
  DataGridColumnLayout,
  DataGridExpandedGroups,
  DataGridHandle,
  DataGridProps,
  DataGridState,
} from './types';

const NO_SORT: readonly never[] = [];
// What the pipeline reads for the details, which the grid wires in a later task: until then it holds
// none, as one object each so no step runs again.
const NO_KEYS: readonly never[] = [];
// Where the groups of an uncontrolled grid start: every one open (`autoExpandAll`) or every one closed.
const ALL_OPEN: DataGridExpandedGroups = { allExpanded: true, except: [] };
const ALL_CLOSED: DataGridExpandedGroups = { allExpanded: false, except: [] };
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
    allowGrouping = true,
    sortMode: sortModeProp,
    sort: sortProp,
    defaultSort: defaultSortProp,
    onSortChange,
    filter: filterProp,
    defaultFilter: defaultFilterProp,
    onFilterChange,
    grouping: groupingProp,
    defaultGrouping: defaultGroupingProp,
    onGroupingChange,
    expandedGroups: expandedGroupsProp,
    defaultExpandedGroups: defaultExpandedGroupsProp,
    onExpandedGroupsChange,
    autoExpandAll,
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
        grouping: groupingProp,
        defaultGrouping: defaultGroupingProp,
        expandedGroups: expandedGroupsProp,
        defaultExpandedGroups: defaultExpandedGroupsProp,
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
      groupingProp,
      defaultGroupingProp,
      expandedGroupsProp,
      defaultExpandedGroupsProp,
    ],
  );
  const { data, columns, paging, sort, defaultSort, page, defaultPage } = safe;
  const { grouping, defaultGrouping, expandedGroups, defaultExpandedGroups } = safe;
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
    grouping: NO_SORT,
    expandedGroups: ALL_OPEN,
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

  const { resolved, startedWith } = useResolvedColumns({
    columns,
    data,
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
    allowGrouping,
    defaultColumnLayout,
  });

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
  const { announce, region } = useAnnounce();
  const {
    state,
    setSort,
    setFilter,
    setPage,
    setSelectedKeys,
    setColumnLayout,
    setGrouping,
    setExpandedGroups,
    expandedNow,
  } = useGridState({
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
    grouping,
    defaultGrouping,
    onGroupingChange,
    expandedGroups,
    // The groups start open unless `defaultExpandedGroups` or `autoExpandAll={false}` says not.
    defaultExpandedGroups:
      defaultExpandedGroups ?? (autoExpandAll === false ? ALL_CLOSED : ALL_OPEN),
    onExpandedGroupsChange,
    onStateChange,
    shown: shownState,
  });
  // A size that is no whole number above 0 may come from a state the user saved: the usual one.
  const size = isWhole(state.page.size) ? state.page.size : configuredSize;
  // The grouping: the items that group, and the ways the user changes it and the open groups.
  const groupingView = useGridGrouping({
    grouping: state.grouping,
    resolved,
    remote,
    setGrouping,
    setExpandedGroups,
    expandedNow,
    setPage,
    pageIndex: state.page.index,
    size,
    paged,
    announce,
  });
  const {
    applied,
    shownLayout,
    dataColumns,
    groupedColumns,
    sortColumns,
    columnsShown,
    layoutColumns,
    pinsShown,
    layoutPins,
    pins,
    fillerAt,
    pinned,
    widthSpecs,
    rowHeader,
    hideable,
  } = useShownColumns({
    resolved,
    layout: state.columnLayout,
    selectionMode,
    grouped: groupingView.fields,
  });

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
    remoteGrouping: remote && state.grouping.length > 0,
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
    grouping: state.grouping,
    groupColumns: resolved,
    summary: null,
    expanded: state.expandedGroups,
    expandedRows: NO_KEYS,
    hasDetail: undefined,
    page: paged ? { index: state.page.index, size } : null,
    remote,
    totalCount,
    locale,
  });
  // The keys are checked as the grid reads them, on the list: the place of a row with no key, which
  // is its key, depends on the sort, and may be the key of another row.
  useEffect(() => {
    if (typeof rowKey === 'string' || typeof rowKey === 'function') {
      checkKeys(data, rowKey, result.keyed);
    }
  }, [data, rowKey, result.keyed]);
  const rows = result.visible;
  // Loading is only a true `loading`. With no row to show, a grid that loads draws skeleton rows and
  // one that does not says it is empty; with rows, the rows stay and a layer goes over them.
  const loading = loadingProp === true;
  const placeholder = rows.length > 0 ? null : loading ? 'skeleton' : 'empty';
  const reloading = loading && rows.length > 0;
  const skeletonRows = paged ? Math.min(size, MAX_SKELETON_ROWS) : MAX_SKELETON_ROWS;
  const rowReactKeys = useMemo(() => reactKeysOf(rows), [rows]);

  useLoadingAnnounce(loading, labels.loading, announce);
  // The sort as it is shown, and the one way a press or a menu asks for a change.
  const { sortItems, sorting, applySort, onSortPress } = useGridSort({
    sort: state.sort,
    sortColumns,
    sortMode,
    setSort,
    resolved,
    labels,
    announce,
  });

  const {
    filtering,
    clearFilter,
    filterView,
    panelColumns,
    panelSource,
    panelShown,
    marked,
    homeSources,
  } = useGridFilter({
    filter: state.filter,
    setFilter,
    setPage,
    pageIndex: state.page.index,
    size,
    paged,
    data,
    total: result.total,
    loading,
    remote,
    searched: result.searched,
    resolved,
    applied,
    shown: dataColumns,
    grouped: groupedColumns,
    textCache,
    locale,
    filterPanel,
    headerFilter,
    tableRef,
    say: labels.announceRowsFound,
    announce,
  });

  // Choosing rows. The column of boxes is a column of the grid like the others to the layout and the
  // keyboard; the sort, the pipeline and the captions know only the caller's.
  const selection = useSelection({
    mode: selectionMode,
    allMode: selectAllMode,
    keys: state.selectedKeys,
    setKeys: setSelectedKeys,
    pageRows: rows,
    orderedRows: result.keyed,
    listRows: result.flat,
    labels,
    announce,
  });
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
  // The resize reads the columns of the keyboard, which the indents are not: their widths are left out.
  const columnSizes = useMemo(
    () =>
      layoutColumns.flatMap((column, index) =>
        isPlaceColumn(column) ? [widths?.[index] ?? widthSpecs[index]!.width] : [],
      ),
    [layoutColumns, widthSpecs, widths],
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

  // The chooser lists the columns the grouping has not taken out: a grouped column is on its group rows.
  const chooserColumns = useMemo(
    () => resolved.filter((column) => !groupedColumns.includes(column)),
    [resolved, groupedColumns],
  );
  const toolbarNode = toolbarContent({
    toolbar,
    searchPanel,
    columnChooser,
    resolved: chooserColumns,
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
    onToggleGroup: groupingView.toggleGroup,
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

  useWriteOnCommit(() => {
    homeSources.current = { columns: columnsShown, active: keyboard.activeHome };
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
      expandAllGroups: groupingView.expandAll,
      collapseAllGroups: groupingView.collapseAll,
    }),
    [
      keyboard.focusActive,
      scrollToRow,
      clearFilter,
      groupingView.expandAll,
      groupingView.collapseAll,
    ],
  );

  useShownState(shownState, {
    state,
    shownLayout,
    paged,
    pageIndex: result.pageIndex,
    size,
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
  const groupsView = useMemo(
    () => ({ toggle: groupingView.toggleGroup }),
    [groupingView.toggleGroup],
  );
  const context = useMemo<GridContextValue<TRow>>(
    () => ({
      columns: columnsShown,
      layoutColumns,
      resolved,
      groups: groupsView,
      filler,
      fillerAt,
      pins,
      layoutPins,
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
      layoutColumns,
      resolved,
      groupsView,
      filler,
      fillerAt,
      pins,
      layoutPins,
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
    // A group row has the height of its density and variant, not the caller's `rowHeight`.
    ...(groupingView.levels.length > 0
      ? { [GROUP_ROW_HEIGHT_PROPERTY]: `${groupRowHeight(density, variant)}px` }
      : null),
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
                  role={groupingView.levels.length > 0 ? 'treegrid' : 'grid'}
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
                source={panelSource}
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
