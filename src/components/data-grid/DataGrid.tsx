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
import { withDefaults } from '../../internal/with-defaults';
import { useHeadHeight } from '../table/use-head-height';
import { checkFields, resolveColumns, selectColumn } from './engine/columns';
import { createPipeline } from './engine/pipeline';
import { effectiveSort, nextSort } from './engine/sort';
import { createTextCache } from './engine/values';
import {
  ActiveContext,
  GridContext,
  RowsContext,
  SelectionViewContext,
  VirtualContext,
} from './grid-context';
import type { GridContextValue, RowsContextValue, VirtualWindow, WindowLink } from './grid-context';
import { useColumnWidths } from './hooks/use-column-widths';
import { sameLabels, useColumnsWarning, useRowPropsWarning } from './hooks/use-renewal-warning';
import { useGridKeyboard } from './hooks/use-grid-keyboard';
import { useGridState } from './hooks/use-grid-state';
import { usePaging } from './hooks/use-paging';
import { usePropWarnings } from './hooks/use-prop-warnings';
import { useScrollToRow } from './hooks/use-scroll-to-row';
import { useRowKey } from './hooks/use-row-key';
import { useSelection } from './hooks/use-selection';
import { useLoadingAnnounce } from './hooks/use-loading-announce';
import { useOverlayTop } from './hooks/use-overlay-top';
import { OVERSCAN } from './hooks/use-virtual-rows';
import { DEFAULT_LABELS } from './labels';
import { isWhole, normalizeProps } from './normalize';
import { Body } from './parts/Body';
import { GridTable } from './parts/GridTable';
import { HeaderRow } from './parts/HeaderRow';
import { Overlay } from './parts/Overlay';
import { Pager } from './parts/Pager';
import { Toolbar, resolveCaptionTag } from './parts/Toolbar';
import { ROW_HEIGHT, resolveDensity, resolveVariant, rowPitch } from './row-heights';
import { checkKeys, uniqueKeys } from './row-keys';
import type { DataGridHandle, DataGridProps, DataGridState } from './types';

const NO_SORT: readonly never[] = [];
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
    sortMode: sortModeProp,
    sort: sortProp,
    defaultSort: defaultSortProp,
    onSortChange,
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
        page: pageProp,
        defaultPage: defaultPageProp,
        selectedKeys: selectedKeysProp,
        defaultSelectedKeys: defaultSelectedKeysProp,
      }),
    [
      dataProp,
      columnsProp,
      pagingProp,
      sortProp,
      defaultSortProp,
      pageProp,
      defaultPageProp,
      selectedKeysProp,
      defaultSelectedKeysProp,
    ],
  );
  const { data, columns, paging, sort, defaultSort, page, defaultPage } = safe;
  const { selectedKeys, defaultSelectedKeys, pageSize: configuredSize, warnings } = safe;
  const variant = resolveVariant(variantProp);
  const density = resolveDensity(densityProp);
  // Labels written in the JSX are a new object on every render. The one of an earlier render is kept
  // while each of its values is the same, so labels of strings draw no row again and a press draws
  // only the rows it changes; new functions in them are new labels, which warn (spec phase 6 §5).
  const [keptLabels, keepLabels] = useState(labelsProp);
  let givenLabels = keptLabels;
  if (!sameLabels(keptLabels, labelsProp)) {
    givenLabels = labelsProp;
    keepLabels(labelsProp);
  }
  const labels = useMemo(() => withDefaults(DEFAULT_LABELS, givenLabels), [givenLabels]);
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
    page: { index: 0, size: 0 },
    selectedKeys: NO_SORT,
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
      }),
    [columns, locale, timeZone, labels.yes, labels.no, allowSorting],
  );
  useEffect(() => checkFields(resolved, data), [resolved, data]);

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
  const { state, setSort, setPage, setSelectedKeys } = useGridState({
    sort,
    defaultSort,
    onSortChange,
    page,
    defaultPage: defaultPage ?? { index: 0, size: configuredSize },
    onPageChange,
    selectedKeys,
    defaultSelectedKeys,
    onSelectedKeysChange,
    onStateChange,
    shown: shownState,
  });
  // A size that is no whole number above 0 may come from a state the user saved: the usual one.
  const size = isWhole(state.page.size) ? state.page.size : configuredSize;

  // Server mode knows the page and not the rows after it, so "select all" can only be about the page.
  const askedForAll = selectionMode === 'multiple' && selectAllModeProp === 'all';
  const selectAllMode = askedForAll && !remote ? 'all' : 'page';
  const allIsPage = askedForAll && remote;
  const virtualNeedsHeight = asksForVirtual && height === undefined;
  const virtualNotRemote = asksForVirtual && remote;
  const virtualHasNoPages = virtual && pagingConfig !== undefined;
  const missingCount = remote && totalCount === undefined;
  usePropWarnings({
    normalized: warnings,
    rowHeightIsValid,
    allIsPage,
    virtualNeedsHeight,
    virtualNotRemote,
    virtualHasNoPages,
    missingCount,
  });

  const getKey = useRowKey(rowKey);
  const pipeline = useMemo(() => createPipeline<TRow>(), []);
  const textCache = useMemo(() => createTextCache<TRow>(), []);
  const result = pipeline.run({
    data,
    columns: resolved,
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
  const sortItems = useMemo(() => effectiveSort(state.sort, resolved), [state.sort, resolved]);
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
  const onSortPress = useCallback(
    (columnId: string, additive: boolean) => {
      const next = nextSort(sortItems, columnId, additive, sortMode);
      setSort(next);
      announce(
        next.length === 0
          ? labels.announceSortCleared
          : labels.announceSort(
              next.map((item) => ({
                caption: resolved.find((column) => column.id === item.field)?.caption ?? item.field,
                direction: item.direction,
              })),
            ),
      );
    },
    [sortItems, sortMode, setSort, announce, labels, resolved],
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
    () => (selectionMode === 'multiple' ? [boxColumn, ...resolved] : resolved),
    [selectionMode, boxColumn, resolved],
  );
  const rowHeader = useMemo(() => resolved.find((column) => column.rowHeader), [resolved]);
  const rowClick =
    typeof selectOnRowClick === 'boolean' ? selectOnRowClick : selectionMode === 'single';

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
    reveal: virtual ? reveal : undefined,
    onSortPress,
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
    }),
    [keyboard.focusActive, scrollToRow],
  );

  const shown = useMemo<DataGridState>(
    () => ({
      sort: state.sort,
      // With paging off the page is not the grid's to say: it stays as it is held, unused.
      page: paged ? { index: result.pageIndex, size } : state.page,
      selectedKeys: state.selectedKeys,
    }),
    [state.sort, state.page, state.selectedKeys, result.pageIndex, paged, size],
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

  // The words of an empty grid span every column, and are as wide as the frame shows: the room is
  // written while they are drawn, though every column has a width.
  const { widths, fixed, filler } = useColumnWidths(frameRef, columnsShown, {
    fullRow: placeholder === 'empty',
    variant,
    density,
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
      labels,
      variant,
      virtual,
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
    }),
    [
      columnsShown,
      filler,
      labels,
      variant,
      virtual,
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
    ],
  );

  // Only a grid with a height scrolls its rows under a heading, so only then is the heading measured.
  useHeadHeight(frameRef, tableRef, height !== undefined);
  const overlayTop = useOverlayTop(frameRef, tableRef, reloading);

  const rootStyle = {
    ...style,
    ...(height === undefined ? null : { height }),
    '--flg-data-grid-row-height': `${dataRowHeight}px`,
  } as CSSProperties;

  return (
    <GridContext.Provider value={context as GridContextValue}>
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
          />
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
                columns={columnsShown}
                widths={widths}
                fixed={fixed}
                filler={filler}
                aria-multiselectable={selectionMode === 'multiple' ? true : undefined}
                aria-busy={loading ? true : undefined}
                // The rows that are not drawn are counted for a screen reader, which the rows that are
                // say the place of; with every row drawn the DOM is the count.
                aria-rowcount={virtual ? rows.length + 1 : undefined}
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
                      <Body />
                    </RowsContext.Provider>
                  </VirtualContext.Provider>
                </ActiveContext.Provider>
              </GridTable>
            </div>
            {reloading ? (
              <Overlay variant={variant} label={labels.loading} top={overlayTop} />
            ) : null}
          </div>
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
          {region}
        </div>
      </SelectionViewContext.Provider>
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
