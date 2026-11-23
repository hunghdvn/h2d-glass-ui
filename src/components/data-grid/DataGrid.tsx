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
import type { ResolvedColumn } from './engine/columns';
import { EMPTY_FILTER } from './engine/filter';
import { fallbackPage } from './engine/page';
import { createPipeline } from './engine/pipeline';
import { resolveSummaryItems, sameSummary } from './engine/summary';
import type { ResolvedSummaryItem } from './engine/summary';
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
import type {
  DetailsView,
  GridContextValue,
  RowsContextValue,
  VirtualWindow,
  WindowLink,
} from './grid-context';
import { useChipDrag } from './hooks/use-chip-drag';
import { useColumnDrag } from './hooks/use-column-drag';
import type { TrayTarget } from './hooks/use-column-drag';
import { useColumnActions } from './hooks/use-column-actions';
import { useColumnMenu } from './hooks/use-column-menu';
import { useColumnResize } from './hooks/use-column-resize';
import { useColumnWidths } from './hooks/use-column-widths';
import { useRowDrag } from './hooks/use-row-drag';
import { useRowMenu } from './hooks/use-row-menu';
import { useRowReorder } from './hooks/use-row-reorder';
import {
  sameLabels,
  useDetailPropsWarning,
  useRowPropsWarning,
  useSummaryWarning,
} from './hooks/use-renewal-warning';
import { useFootHeight } from './hooks/use-foot-height';
import { useGridKeyboard } from './hooks/use-grid-keyboard';
import { useGridState } from './hooks/use-grid-state';
import { useKept } from './hooks/use-kept';
import { useResolvedColumns, useShownColumns } from './hooks/use-grid-columns';
import { useGridFilter } from './hooks/use-grid-filter';
import { useGridGrouping } from './hooks/use-grid-grouping';
import { useGroupPanel } from './hooks/use-group-panel';
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
import { GroupPanel } from './parts/GroupPanel';
import { FilterPopover } from './parts/FilterPopover';
import { OperatorMenu } from './parts/OperatorMenu';
import { ColumnMenu } from './parts/ColumnMenu';
import { RowMenu } from './parts/RowMenu';
import { DragLayer, DropLine } from './parts/DragLayer';
import { GridTable } from './parts/GridTable';
import { HeaderRow } from './parts/HeaderRow';
import { Overlay } from './parts/Overlay';
import { Pager } from './parts/Pager';
import { ResizeGuide } from './parts/ResizeGuide';
import { SummaryFooter } from './parts/SummaryFooter';
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
  DataGridKey,
  DataGridProps,
  DataGridState,
} from './types';

const NO_SORT: readonly never[] = [];
// Whether a row has a detail when the grid has details and `rowHasDetail` is no function (not given, or a
// value such as `false` that `cond && fn` gives): every row does.
const ALWAYS = (): boolean => true;
// Where the groups of an uncontrolled grid start: every one open (`autoExpandAll`) or every one closed.
const ALL_OPEN: DataGridExpandedGroups = { allExpanded: true, except: [] };
const ALL_CLOSED: DataGridExpandedGroups = { allExpanded: false, except: [] };
// A server grid with no `totalSummary`: every total is blank.
const EMPTY_TOTALS: Readonly<Record<string, unknown>> = {};
const NO_LAYOUT: DataGridColumnLayout = { order: [], widths: {}, hidden: [], pinned: {} };
// The rows of the first window of a virtual grid whose height is a length, which has no pixels to
// divide before it is measured (the server draws the same).
const FIRST_ROWS_OF_A_LENGTH = 20;
// The most skeleton rows a grid that loads draws: a page, and never more than a screen of them.
const MAX_SKELETON_ROWS = 20;
// What the window link does until the body and the keyboard have written their members into it.
const unlinked = (): void => {};
const unlinkedRow = (): void => {};
const noFallback = (): number | null => null;

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
    renderDetail,
    rowHasDetail,
    expandedRows: expandedRowsProp,
    defaultExpandedRows: defaultExpandedRowsProp,
    onExpandedRowsChange,
    paging: pagingProp,
    page: pageProp,
    defaultPage: defaultPageProp,
    onPageChange,
    onStateChange,
    onRowActivate,
    rowReorder: rowReorderProp,
    onRowReorder,
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
    groupPanel: groupPanelProp,
    summary: summaryProp,
    totalSummary: totalSummaryProp,
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
        expandedRows: expandedRowsProp,
        defaultExpandedRows: defaultExpandedRowsProp,
        summary: summaryProp,
        totalSummary: totalSummaryProp,
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
      expandedRowsProp,
      defaultExpandedRowsProp,
      summaryProp,
      totalSummaryProp,
    ],
  );
  const { data, columns, paging, sort, defaultSort, page, defaultPage } = safe;
  const { grouping, defaultGrouping, expandedGroups, defaultExpandedGroups } = safe;
  const { expandedRows, defaultExpandedRows } = safe;
  const { filter, defaultFilter } = safe;
  const { summary: summaryGiven, totalSummary } = safe;
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
  useDetailPropsWarning(renderDetail, rowHasDetail);
  // The grid has details when `renderDetail` is a function: any other value is none, and no column is added.
  const hasDetails = typeof renderDetail === 'function';
  // The handles are there for `true` and no other value.
  const reorderRows = rowReorderProp === true;
  // The totals asked for, kept while the prop says the same (an object written in the JSX is new on every
  // render, and functions count by identity), and resolved against the columns: each list drops the item
  // that names no column and the later of two with one id, and says so once, from an effect.
  const summaryKept = useKept(summaryGiven, sameSummary);
  useSummaryWarning(summaryGiven);
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
    expandedRows: NO_SORT,
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

  const summaryResolved = useMemo(() => {
    const total = resolveSummaryItems(summaryKept?.total ?? [], resolved);
    const group = resolveSummaryItems(summaryKept?.group ?? [], resolved);
    // The group totals by the column they stand under, for the group rows to find theirs.
    const byColumn = new Map<string, ResolvedSummaryItem<TRow>[]>();
    for (const item of group.items) {
      const list = byColumn.get(item.column);
      if (list) list.push(item);
      else byColumn.set(item.column, [item]);
    }
    return {
      total: total.items,
      group: group.items,
      byColumn,
      leftOut: total.leftOut.length + group.leftOut.length > 0,
      repeated: total.repeated.length + group.repeated.length > 0,
    };
  }, [summaryKept, resolved]);
  const pipelineSummary = useMemo(
    () =>
      summaryResolved.total.length + summaryResolved.group.length > 0
        ? { total: summaryResolved.total, group: summaryResolved.group }
        : null,
    [summaryResolved],
  );

  // The paging: `false` is one page of every row, an object says the sizes, and none is the default.
  const pagingConfig = paging === false ? undefined : paging;
  const remote = remoteProp === true;
  // Virtual needs the `height` that is a prop, and rows to draw a window of: not server mode. A detail has
  // no fixed height, which a window of rows needs: with `renderDetail` the grid scrolls as usual.
  const asksForVirtual = scrolling === 'virtual';
  const virtualWithDetail = asksForVirtual && hasDetails && height !== undefined && !remote;
  const virtual = asksForVirtual && height !== undefined && !remote && !hasDetails;
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
    setExpandedRows,
    expandedRowsNow,
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
    expandedRows,
    defaultExpandedRows,
    onExpandedRowsChange,
    onStateChange,
    shown: shownState,
  });
  // Opens the detail of a row, or closes it: the keys held, or asked for by the same event, with this one
  // put in or taken out. The same function for as long as the grid lives.
  const toggleDetail = useCallback(
    (key: DataGridKey) => {
      const now = expandedRowsNow();
      setExpandedRows(
        now.includes(key) ? now.filter((open) => !Object.is(open, key)) : [...now, key],
      );
    },
    [expandedRowsNow, setExpandedRows],
  );
  // Whether a row has a detail, for the pipeline and the rows: `rowHasDetail`, else every row.
  const hasDetail = useMemo(
    () => (hasDetails ? (typeof rowHasDetail === 'function' ? rowHasDetail : ALWAYS) : undefined),
    [hasDetails, rowHasDetail],
  );
  // A size that is no whole number above 0 may come from a state the user saved: the usual one.
  const size = isWhole(state.page.size) ? state.page.size : configuredSize;
  // Where the place falls back to when a group closes: the keyboard, which holds the place, is made after
  // the grouping, and the list is made after it too, so what a closing group asks comes through a link
  // that is written as they commit.
  const fallbackLink = useRef<(closing: string | null) => number | null>(noFallback);
  const pageOfFallback = useCallback((closing: string | null) => fallbackLink.current(closing), []);
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
    pageOfFallback,
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
    detail: hasDetails,
    reorder: reorderRows,
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
    virtualWithDetail,
    virtualHasNoPages,
    missingCount,
    missingHeaderValues,
    remoteGrouping: remote && state.grouping.length > 0,
    remoteGroupPanel: remote && groupPanelProp === true,
    summaryLeftOut: summaryResolved.leftOut,
    summaryRepeated: summaryResolved.repeated,
    remoteGroupTotals: remote && summaryResolved.group.length > 0,
    reorderWithoutHandler: reorderRows && typeof onRowReorder !== 'function',
    renderDetailShape: renderDetail !== undefined && typeof renderDetail !== 'function',
    rowHasDetailShape: rowHasDetail !== undefined && typeof rowHasDetail !== 'function',
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
    summary: pipelineSummary,
    expanded: state.expandedGroups,
    expandedRows: state.expandedRows,
    hasDetail,
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
  // A detail row spans the columns from the button's on, as wide as what the frame shows: the frame is
  // measured while one is drawn.
  const detailShown = useMemo(
    () => hasDetails && rows.some((row) => row.kind === 'detail'),
    [hasDetails, rows],
  );
  // The footer is drawn while it has totals, and the rows are not the first ones still loading (the
  // skeleton): with no row it stays, so a sticky part never comes and goes with a filter. It is a place
  // of the keyboard only with a row to stand under.
  const hasFooter = summaryResolved.total.length > 0 && placeholder !== 'skeleton';

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
    fullRow: placeholder === 'empty' || detailShown,
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

  // The group panel: what the chips and the column menu do to the grouping, and the tray as a place
  // where a title or a chip can be dropped. The tray is asked for by `groupPanel` and not in server
  // mode, which groups nothing, and it is drawn unless the toolbar leaves it out (`toolbar={false}`, or
  // a function that does not place `items.groupPanel`): only the tray's own mount tells, so it reports
  // it from a layout effect, before the first paint. A grid with no tray offers no grouping from the
  // menu or a title, since a user who grouped there could not ungroup: grouping is then the app's
  // (`grouping`, `defaultGrouping`).
  const wantsPanel = groupPanelProp === true && !remote;
  const [trayMounted, setTrayMounted] = useState(false);
  const panel = wantsPanel && trayMounted;
  const groupable = panel;
  const panelRef = useRef<HTMLDivElement>(null);
  const groupControl = useGroupPanel({
    panel,
    held: state.grouping,
    levels: groupingView.levels,
    applyGrouping: groupingView.applyGrouping,
    resolved,
    hideable,
    labels,
  });

  // Reordering the columns: the chip and the drop line of a drag are read from a store of their own,
  // and the rows read only which column is dragged, which changes at the start and at the end.
  const dragView = useState(createDragView)[0];
  const { accepts, group, moveTo, ungroup } = groupControl;
  const tray = useMemo<TrayTarget | null>(
    () => (panel ? { panelRef, accepts, drop: group } : null),
    [panel, accepts, group],
  );
  const reorder = useColumnDrag({
    frameRef,
    tableRef,
    columns: columnsShown,
    pins,
    layout: shownLayout,
    setColumnLayout,
    view: dragView,
    tray,
    labels,
    announce,
  });
  const chipDrag = useChipDrag({
    enabled: panel,
    frameRef,
    tableRef,
    panelRef,
    chips: groupControl.chips,
    view: dragView,
    moveTo,
    ungroup,
  });

  // The menu of the columns: one for the grid, opened by the button of a title, a right press and the keys.
  const columnMenu = useColumnMenu({ tableRef, columns: columnsShown, hideable, groupable });
  const menuId = useId();
  const hasColumnMenu = dataColumns.some((column) => hasMenu(column, hideable, groupable));
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
    group,
    fit: resize.fit,
    labels,
    announce,
  });

  // The window of a virtual grid is the body's (VirtualContext): a scroll draws the body alone. The
  // keyboard and the handle ask it for a row through the link, which the body writes as it commits,
  // and the body says through it that its window moved, for the focus a key is waiting to give.
  const windowLink = useRef<WindowLink>({ scrollToIndex: unlinked, drawn: unlinked });
  const reveal = useCallback((index: number) => windowLink.current.scrollToIndex(index), []);
  // The keyboard is made after the moving of rows, which it takes the keys of: what the moving of rows asks
  // of it comes through a link the keyboard writes when it commits.
  const focusRowLink = useRef<(key: DataGridKey) => void>(unlinkedRow);
  const focusRow = useCallback((key: DataGridKey) => focusRowLink.current(key), []);

  const scrollToRow = useScrollToRow({
    tableRef,
    windowLink,
    keyed: result.keyed,
    openGroups: groupingView.openGroups,
    flat: result.flat,
    virtual,
    paged,
    remote,
    size,
    pageIndex: result.pageIndex,
    rows,
    setPage,
  });

  // Moving rows: the handles do nothing while the grid sorts or groups, where the order is not the rows'
  // own. The three ways to ask for a move (the menu, the keys, a drop) are one function, which tells the
  // app; the menu and the drag are kept apart from what the rows read, as the column menu and the drag of a
  // column are.
  const rowsMovable = reorderRows && sorting.count === 0 && groupingView.levels.length === 0;
  const textOf = useCallback(
    (row: TRow, column: ResolvedColumn<TRow>) => textCache.text(row, column),
    [textCache],
  );
  const reordering = useRowReorder({
    enabled: reorderRows,
    off: !rowsMovable,
    keyed: result.keyed,
    data,
    rowHeader,
    textOf,
    onRowReorder: typeof onRowReorder === 'function' ? onRowReorder : undefined,
    labels,
    announce,
    scrollToRow,
    rows,
    focusRow,
  });
  const rowMenu = useRowMenu({ enabled: rowsMovable, rows });
  const rowMenuId = useId();
  const rowDrag = useRowDrag({
    enabled: rowsMovable,
    frameRef,
    tableRef,
    rows,
    scrolls: height !== undefined,
    view: dragView,
    nameOf: reordering.nameOf,
    drop: reordering.drop,
  });
  const keyboard = useGridKeyboard({
    tableRef,
    frameRef,
    columns: columnsShown,
    rows,
    emptyCell: placeholder === 'empty' && filtering,
    filterRow,
    details: hasDetails,
    footer: hasFooter,
    reveal: virtual ? reveal : undefined,
    onSortPress,
    onResizeBy: resize.resizeBy,
    onMoveBy: reorder.moveBy,
    onMoveRow: reorderRows ? reordering.moveByKey : undefined,
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
    focusRowLink.current = keyboard.focusRow;
    fallbackLink.current = (closing) => {
      const cell = keyboard.placeCell();
      // Server mode holds the page it was given, and a grid with no pages has one page of every row.
      if (cell?.area !== 'body' || !paged || remote) return null;
      return fallbackPage(result.flat, cell, closing, size);
    };
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
    groupPanel: wantsPanel ? (
      <GroupPanel
        key="groupPanel"
        panelRef={panelRef}
        onMounted={setTrayMounted}
        chips={groupControl.chips}
        labels={labels}
        actions={groupControl}
        onChipPointerDown={chipDrag.onPointerDown}
        view={dragView}
        focusGrid={keyboard.focusActive}
      />
    ) : null,
    resolved: chooserColumns,
    layout: shownLayout,
    labels,
    showColumn,
  });
  // What the body needs for its window. The row that has the keyboard is drawn wherever the frame is
  // scrolled: the focus stays, and the grid keeps its one Tab stop.
  const estimate = rowPitch(dataRowHeight, variant);
  const groupedRowHeight =
    groupingView.levels.length > 0 ? groupRowHeight(density, variant) : dataRowHeight;
  const firstRows =
    typeof height === 'number'
      ? Math.ceil(height / dataRowHeight) + OVERSCAN
      : FIRST_ROWS_OF_A_LENGTH;
  const virtualWindow = useMemo<VirtualWindow | null>(
    () =>
      virtual
        ? {
            rowHeight: dataRowHeight,
            groupRowHeight: groupedRowHeight,
            estimate,
            firstRows,
            held: keyboard.held,
            link: windowLink,
          }
        : null,
    [virtual, dataRowHeight, groupedRowHeight, estimate, firstRows, keyboard.held],
  );

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
  const detailsView = useMemo<DetailsView<TRow> | null>(
    () =>
      hasDetail && typeof renderDetail === 'function'
        ? { has: hasDetail, render: renderDetail, toggle: toggleDetail }
        : null,
    [hasDetail, renderDetail, toggleDetail],
  );
  const context = useMemo<GridContextValue<TRow>>(
    () => ({
      columns: columnsShown,
      layoutColumns,
      resolved,
      groups: groupsView,
      groupTotals: summaryResolved.byColumn,
      summaryReader: textCache,
      details: detailsView,
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
      textOf,
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
      grouped: groupingView.fields,
      groupPanel: panel,
      rowHeader,
      rowReorder: reorderRows
        ? {
            off: !rowsMovable,
            onPointerDown: rowDrag.onPointerDown,
            menu: rowMenu,
            contentId: rowMenuId,
            view: dragView,
          }
        : null,
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
        groupable,
      },
      dragSource: reorder.source,
    }),
    [
      columnsShown,
      layoutColumns,
      resolved,
      groupsView,
      summaryResolved.byColumn,
      textCache,
      detailsView,
      filler,
      fillerAt,
      pins,
      layoutPins,
      textOf,
      reorderRows,
      rowsMovable,
      rowDrag.onPointerDown,
      rowMenu,
      rowMenuId,
      dragView,
      labels,
      locale,
      variant,
      virtual,
      filterRow,
      headerFilter,
      skeletonRows,
      rowClassName,
      sorting,
      onSortPress,
      selectionMode,
      selectAllMode,
      rowClick,
      activates,
      selection.actions,
      groupingView.fields,
      panel,
      rowHeader,
      resize,
      reorder.onPointerDown,
      columnMenu,
      menuId,
      hideable,
      groupable,
      reorder.source,
    ],
  );

  // Only a grid with a height scrolls its rows under a heading, so only then is the heading measured.
  useHeadHeight(frameRef, tableRef, height !== undefined);
  // And the footer that sticks under them, so the rows keep clear of it as they do of the heading.
  useFootHeight(frameRef, tableRef, height !== undefined && hasFooter);
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
                  aria-rowcount={virtual ? rows.length + headRows + (hasFooter ? 1 : 0) : undefined}
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
                      {hasFooter ? (
                        <SummaryFooter
                          items={summaryResolved.total}
                          totals={result.totals}
                          remoteValues={remote ? (totalSummary ?? EMPTY_TOTALS) : undefined}
                          activeColumn={
                            keyboard.active?.row === rows.length && rows.length > 0
                              ? keyboard.active.column
                              : -1
                          }
                          ariaRowIndex={virtual ? rows.length + headRows + 1 : undefined}
                        />
                      ) : null}
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
            {reorderRows ? (
              <RowMenu
                menu={rowMenu}
                keys={reordering.keys}
                move={reordering.move}
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
