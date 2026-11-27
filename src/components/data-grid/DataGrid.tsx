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
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { useHeadHeight } from '../table/use-head-height';
import { hasMenu } from './engine/column-menu';
import { isPlaceColumn } from './engine/columns';
import type { ResolvedColumn } from './engine/columns';
import { drawsActions, formColumns, hasFormFields, readOfRow } from './engine/edit';
import { EMPTY_FILTER } from './engine/filter';
import { fallbackPage } from './engine/page';
import { createPipeline } from './engine/pipeline';
import { headRowCount } from './grid-dom';
import { createTextCache } from './engine/values';
import { EditContext, EditMarksContext, EditViewContext } from './edit-context';
import { FilterContext } from './filter-context';
import {
  ActiveContext,
  GridContext,
  RowsContext,
  SelectionViewContext,
  VirtualContext,
} from './grid-context';
import type { GridContextValue, RowsContextValue, VirtualWindow, WindowLink } from './grid-context';
import type { EditContextValue } from './edit-context';
import { useColumnDrag } from './hooks/use-column-drag';
import { useColumnActions } from './hooks/use-column-actions';
import { useColumnMenu } from './hooks/use-column-menu';
import { useColumnResize } from './hooks/use-column-resize';
import { useColumnWidths } from './hooks/use-column-widths';
import { useRowReordering } from './hooks/use-row-reordering';
import { sameEditing, useEditing } from './hooks/use-editing';
import { sameLabels, useDetailPropsWarning, useRowPropsWarning } from './hooks/use-renewal-warning';
import { useFootHeight } from './hooks/use-foot-height';
import { useGridKeyboard } from './hooks/use-grid-keyboard';
import { ALL_OPEN, useGridState } from './hooks/use-grid-state';
import { useKept } from './hooks/use-kept';
import { useResolvedColumns, useShownColumns } from './hooks/use-grid-columns';
import { useGridFilter } from './hooks/use-grid-filter';
import { useGridGrouping } from './hooks/use-grid-grouping';
import { useGroupingUi } from './hooks/use-grouping-ui';
import { useGridContextValue } from './hooks/use-grid-context-value';
import { useGridSummary } from './hooks/use-grid-summary';
import { useNormalizedProps } from './hooks/use-normalized-props';
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
import { controlLabelsOf, mergeLabels } from './labels';
import { isWhole } from './normalize';
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
import { ConfirmDelete } from './parts/ConfirmDelete';
import { EditPopup } from './parts/EditPopup';
import { ModeFocusProbe } from './parts/ModeFocusProbe';
import { SaveBar } from './parts/SaveBar';
import { SaveError } from './parts/SaveError';
import { Toolbar, resolveCaptionTag } from './parts/Toolbar';
import { toolbarContent } from './parts/toolbar-content';
import {
  ACTION_ROW_EXTRA,
  GROUP_ROW_HEIGHT_PROPERTY,
  ROW_HEIGHT,
  groupRowHeight,
  resolveDensity,
  resolveVariant,
  rowPitch,
} from './row-heights';
import { checkKeys, reactKeysOf } from './row-keys';
import type { FlatDataRow } from './engine/flatten';
import { SearchContext } from './search-context';
import type {
  DataGridColumn,
  DataGridColumnLayout,
  DataGridExpandedGroups,
  DataGridHandle,
  DataGridKey,
  DataGridProps,
  DataGridState,
} from './types';

const NO_SORT: readonly never[] = [];
/** The fields of a form that is not open: none. */
const NO_FIELDS: readonly never[] = [];
// A column that computes its value and says it can be edited, which only a `setValue` makes true.
const asksToBeEdited = <TRow,>(column: DataGridColumn<TRow>): boolean =>
  typeof column.value === 'function' &&
  (column.allowEditing === true || typeof column.allowEditing === 'function');
// Whether a row has a detail when the grid has details and `rowHasDetail` is no function (not given, or a
// value such as `false` that `cond && fn` gives): every row does.
const ALWAYS = (): boolean => true;
// Where the groups of an uncontrolled grid start with `autoExpandAll={false}`: every one closed (every
// one open is `ALL_OPEN` of the grid state).
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
    editing: editingProp,
    onSaving,
    initNewRow,
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
  // `editing` is kept by value, so an object written in the JSX draws no row.
  const editingKept = useKept(editingProp, sameEditing);
  const safe = useNormalizedProps({
    editing: editingKept,
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
  });
  const { data, columns, paging, sort, defaultSort, page, defaultPage } = safe;
  const { grouping, defaultGrouping, expandedGroups, defaultExpandedGroups } = safe;
  const { expandedRows, defaultExpandedRows } = safe;
  const { filter, defaultFilter } = safe;
  const { summary: summaryGiven, totalSummary } = safe;
  const { selectedKeys, defaultSelectedKeys, pageSize: configuredSize, warnings } = safe;
  const { columnLayout, defaultColumnLayout } = safe;
  const { editing: editingConfig } = safe;
  // The column of buttons is drawn when a button can stand in it: a grid that cannot update a row has none.
  const hasActions = editingConfig !== undefined && drawsActions(editingConfig);
  // The dialog that asks before a delete is there when the grid can delete and asks.
  const deleteAsks =
    editingConfig !== undefined &&
    editingConfig.allowDeleting !== undefined &&
    editingConfig.allowDeleting !== false &&
    editingConfig.confirmDelete !== false;
  const variant = resolveVariant(variantProp);
  const density = resolveDensity(densityProp);
  // Labels written in the JSX are a new object on every render. The one of an earlier render is kept
  // while each of its values is the same, so labels of strings draw no row again and a press draws
  // only the rows it changes; new functions in them are new labels, which warn (spec phase 6 §5).
  const givenLabels = useKept(labelsProp, sameLabels);
  const labels = useMemo(() => mergeLabels(givenLabels), [givenLabels]);
  // The words of the controls in the shape each control takes: made once per labels, not per cell.
  const controlLabels = useMemo(() => controlLabelsOf(labels.controls), [labels]);
  useRowPropsWarning(rowClassName, labelsProp);
  useDetailPropsWarning(renderDetail, rowHasDetail);
  // The grid has details when `renderDetail` is a function: any other value is none, and no column is added.
  const hasDetails = typeof renderDetail === 'function';
  // The handles are there for `true` and no other value.
  const reorderRows = rowReorderProp === true;
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
  // A row that holds a button of 28px is 4px taller than one that holds an Avatar; a caller's height is used as given.
  const dataRowHeight = isPositive(rowHeight)
    ? rowHeight
    : ROW_HEIGHT[density][variant] + (hasActions ? ACTION_ROW_EXTRA : 0);

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

  const { summaryResolved, pipelineSummary } = useGridSummary({ summary: summaryGiven, resolved });

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
    actions: hasActions,
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
    summaryNoColumn: summaryResolved.noColumn,
    summaryNoType: summaryResolved.noType,
    summaryRepeated: summaryResolved.repeated,
    remoteGroupTotals: remote && summaryResolved.group.length > 0,
    reorderWithoutHandler: reorderRows && typeof onRowReorder !== 'function',
    renderDetailShape: renderDetail !== undefined && typeof renderDetail !== 'function',
    rowHasDetailShape: rowHasDetail !== undefined && typeof rowHasDetail !== 'function',
    editingWithoutSaving: editingConfig !== undefined && typeof onSaving !== 'function',
    editableWithoutSetValue:
      editingConfig !== undefined &&
      resolved.some(
        ({ column }) => asksToBeEdited(column) && !('setValue' in column && column.setValue),
      ),
    multilineNotString:
      editingConfig !== undefined &&
      resolved.some(({ column, dataType }) => column.multiline === true && dataType !== 'string'),
  });

  const getKey = useRowKey(rowKey);
  // The list of the last commit, which the edit state looks a row up in by its key.
  const keyedRows = useRef<readonly FlatDataRow<TRow>[]>([]);
  // The fields of the form and of the popup: every data column in the layout's order, the hidden and the grouped ones too.
  const formOrder = shownLayout.order;
  const hasFields = editingConfig !== undefined && hasFormFields(editingConfig.mode);
  const fields = useMemo(
    () => (hasFields ? formColumns(resolved, formOrder) : NO_FIELDS),
    [hasFields, resolved, formOrder],
  );
  const editing = useEditing({
    editing: editingConfig,
    onSaving,
    initNewRow,
    resolved,
    layoutColumns,
    fields,
    keyed: keyedRows,
    data,
    getKey,
    labels,
    announce,
    tableRef,
    size: density === 'compact' ? 'sm' : 'md',
  });
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
    // The rows over the saved ones: a pending or failed save of the row being edited.
    changes: editing.shown,
    newRowPosition: editingConfig?.newRowPosition === 'last' ? 'last' : 'first',
    form: editing.form,
  });
  // The keys are checked as the grid reads them, on the list: the place of a row with no key, which
  // is its key, depends on the sort, and may be the key of another row.
  useEffect(() => {
    if (typeof rowKey === 'string' || typeof rowKey === 'function') {
      checkKeys(data, rowKey, result.keyed);
    }
  }, [data, rowKey, result.keyed]);
  useWriteOnCommit(() => {
    keyedRows.current = result.keyed;
  });
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
  // A form row spans the columns as a detail does, and is as wide as the frame shows too.
  const formShown = editing.form !== null;
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
    // The data rows the search and the filter keep, never the group rows the pager also counts.
    total: remote ? result.total : result.keyed.length,
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
    fullRow: placeholder === 'empty' || detailShown || formShown,
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
  // The group panel: its tray, and what the chips and the column menu do to the grouping.
  const { wantsPanel, panel, groupable, panelRef, setTrayMounted, groupControl, tray, chipDrag } =
    useGroupingUi({
      groupPanel: groupPanelProp,
      remote,
      held: state.grouping,
      groupingView,
      resolved,
      hideable,
      labels,
      frameRef,
      tableRef,
      dragView,
    });
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
    group: groupControl.group,
    fit: resize.fit,
    labels,
    announce,
  });

  // The window of a virtual grid is the body's (VirtualContext): a scroll draws the body alone. The
  // keyboard and the handle ask it for a row through the link, which the body writes as it commits,
  // and the body says through it that its window moved, for the focus a key is waiting to give.
  const windowLink = useRef<WindowLink>({ scrollToIndex: unlinked, drawn: unlinked });
  const reveal = useCallback((index: number) => windowLink.current.scrollToIndex(index), []);
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

  const textOf = useCallback(
    (row: TRow, column: ResolvedColumn<TRow>) =>
      readOfRow(row, () => textCache.text(row, column), ''),
    [textCache],
  );
  const { reordering, rowMenu, focusRowLink, contextPart } = useRowReordering({
    reorderRows,
    sorted: sorting.count > 0,
    grouped: groupingView.levels.length > 0,
    keyed: result.keyed,
    data,
    rowHeader,
    textOf,
    onRowReorder: typeof onRowReorder === 'function' ? onRowReorder : undefined,
    labels,
    announce,
    scrollToRow,
    rows,
    frameRef,
    tableRef,
    scrolls: height !== undefined,
    view: dragView,
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
    editing: editing.keys,
    selection:
      selectionMode === 'none'
        ? null
        : {
            mode: selectionMode,
            press: selection.actions.press,
            chooseAll: selection.actions.chooseAll,
          },
  });
  // A new row that goes (given up, or saved and brought in `data`) takes the focus with it: the place has it.
  useIsoLayoutEffect(() => {
    if (editing.restore > 0) keyboard.focusActive();
  }, [editing.restore, keyboard.focusActive]);
  // The new rows of `cell` mode are sent when the place of the keyboard leaves them.
  const placeRow = keyboard.active === null ? undefined : rows[keyboard.active.row];
  const placeKey = placeRow?.kind === 'data' ? placeRow.key : null;
  useIsoLayoutEffect(() => {
    editing.keys?.placeAt(placeKey);
  }, [placeKey, editing.keys]);
  // A new row is brought into the window of a virtual grid, as the keyboard brings a row, once. Not in `popup` mode:
  // the row is edited in the Dialog, so the grid stays as it was and a Cancel leaves its scroll where it was.
  const revealed = useRef<DataGridKey | null>(null);
  // Only the key of a new row is of interest: an edit of a saved row brings nothing into the window, and its rows are not
  // searched.
  const targetKey = editing.target?.key;
  const addedKey =
    targetKey !== undefined && editing.shown?.added.some((one) => Object.is(one.key, targetKey))
      ? targetKey
      : null;
  const inPopup = editingConfig?.mode === 'popup';
  useIsoLayoutEffect(() => {
    if (addedKey === null || !virtual || inPopup || Object.is(revealed.current, addedKey)) return;
    const at = rows.findIndex(
      (row) => row.kind === 'data' && row.added === true && Object.is(row.key, addedKey),
    );
    if (at < 0) return;
    revealed.current = addedKey;
    reveal(at);
  }, [addedKey, rows, virtual, inPopup, reveal]);
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

  // The chooser lists the columns the grouping has not taken out: a grouped column is on its group rows,
  // hidden or not, so a box that shows a hidden one never leaves the list under the focus. The grouped
  // column that stays shown because it is the last one is listed (`showWhenGrouped`, or still shown).
  const chooserColumns = useMemo(
    () =>
      resolved.filter(
        (column) =>
          column.showWhenGrouped ||
          !groupingView.fields.includes(column.id) ||
          columnsShown.includes(column),
      ),
    [resolved, groupingView.fields, columnsShown],
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
    controlLabels,
    showColumn,
    addRow: editingConfig?.allowAdding === true ? editing.add : null,
    addVariant: editing.changeCount > 0 ? 'secondary' : 'primary',
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
      addRow: editing.add,
      saveChanges: editing.saveAll,
      cancelChanges: editing.cancelAll,
    }),
    [
      keyboard.focusActive,
      scrollToRow,
      clearFilter,
      groupingView.expandAll,
      groupingView.collapseAll,
      editing.add,
      editing.saveAll,
      editing.cancelAll,
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
  const context = useGridContextValue({
    columns: columnsShown,
    layoutColumns,
    resolved,
    toggleGroup: groupingView.toggleGroup,
    hasDetail,
    renderDetail,
    toggleDetail,
    groupTotals: summaryResolved.byColumn,
    summaryReader: textCache,
    filler,
    fillerAt,
    pins,
    layoutPins,
    labels,
    controlLabels,
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
    selectionMode,
    selectAllMode,
    rowClick,
    activates,
    selectionActions: selection.actions,
    grouped: groupingView.fields,
    panel,
    rowHeader,
    rowReorder: contextPart,
    resize,
    reorder,
    columnMenu,
    menuId,
    hideable,
    groupable,
  });

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
        <EditContext.Provider value={editing.context as EditContextValue | null}>
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
              {editing.saveError === null ? null : (
                <SaveError
                  message={editing.saveError}
                  onDismiss={editing.dismissError}
                  dismissLabel={labels.dismissError}
                  restoreFocus={keyboard.focusActive}
                />
              )}
              <div className="flg-data-grid-main">
                {editing.changeCount > 0 ? (
                  <SaveBar
                    count={editing.changeCount}
                    saving={editing.saving}
                    labels={labels}
                    onSave={() => void editing.saveAll()}
                    onDiscard={editing.cancelAll}
                    restoreFocus={keyboard.focusActive}
                  />
                ) : null}
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
                    aria-busy={loading || editing.saving ? true : undefined}
                    // The rows that are not drawn are counted for a screen reader, which the rows that are
                    // say the place of; with every row drawn the DOM is the count.
                    aria-rowcount={
                      virtual ? rows.length + headRows + (hasFooter ? 1 : 0) : undefined
                    }
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
                            <EditViewContext.Provider value={editing.target}>
                              <EditMarksContext.Provider value={editing.marks}>
                                <Body />
                              </EditMarksContext.Provider>
                            </EditViewContext.Provider>
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
              {editing.context !== null && deleteAsks ? (
                <ConfirmDelete
                  ask={editing.confirm}
                  present={
                    editing.confirm !== null &&
                    rows.some(
                      (row) => row.kind === 'data' && Object.is(row.key, editing.confirm!.key),
                    )
                  }
                  onClose={editing.closeConfirm}
                  onDelete={editing.acceptDelete}
                  restoreFocus={keyboard.focusActive}
                />
              ) : null}
              {editing.context !== null && editingConfig?.mode === 'popup' ? (
                <EditPopup
                  editing={editing.target}
                  flat={
                    // Looked for only while a popup is open (a row is being edited): nothing walks the rows otherwise.
                    editing.target === null
                      ? undefined
                      : rows.find(
                          (row): row is FlatDataRow<TRow> =>
                            row.kind === 'data' && Object.is(row.key, editing.target!.key),
                        )
                  }
                  restoreFocus={keyboard.focusActive}
                />
              ) : null}
              {region}
              <ModeFocusProbe
                mode={editingConfig?.mode ?? null}
                tableRef={tableRef}
                onModeChange={editing.noteFocus}
              />
              <DragLayer view={dragView} />
            </div>
          </SelectionViewContext.Provider>
        </EditContext.Provider>
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
