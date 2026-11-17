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
} from 'react';
import type { CSSProperties, ReactElement, Ref } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { hasContent } from '../../internal/has-content';
import { joinIds } from '../../internal/join-ids';
import { useAnnounce } from '../../internal/use-announce';
import { useRequireName } from '../../internal/use-require-name';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';
import { useHeadHeight } from '../table/use-head-height';
import { checkFields, resolveColumns, selectColumn } from './engine/columns';
import { createPipeline } from './engine/pipeline';
import { effectiveSort, nextSort } from './engine/sort';
import { createTextCache } from './engine/values';
import { GridContext, SelectionViewContext } from './grid-context';
import type { GridContextValue } from './grid-context';
import { useColumnWidths } from './hooks/use-column-widths';
import { useColumnsWarning } from './hooks/use-columns-warning';
import { useGridKeyboard } from './hooks/use-grid-keyboard';
import { useGridState } from './hooks/use-grid-state';
import { useRowKey } from './hooks/use-row-key';
import { useSelection } from './hooks/use-selection';
import { DEFAULT_LABELS } from './labels';
import { Body } from './parts/Body';
import { HeaderRow } from './parts/HeaderRow';
import { Pager } from './parts/Pager';
import { Toolbar, resolveCaptionTag } from './parts/Toolbar';
import { ROW_HEIGHT, resolveDensity, resolveVariant } from './row-heights';
import { uniqueKeys } from './row-keys';
import type { DataGridHandle, DataGridProps, DataGridState } from './types';

const NO_SORT: readonly never[] = [];
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PAGE_SIZES: readonly number[] = [10, 20, 50, 100];

const isWhole = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1;

const isPositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

function DataGridImpl<TRow>(
  {
    data,
    rowKey,
    columns,
    caption,
    description,
    captionAs,
    variant: variantProp,
    density: densityProp,
    rowHeight,
    locale = 'en-US',
    timeZone = 'UTC',
    height,
    rowClassName,
    allowSorting = true,
    sortMode: sortModeProp,
    sort,
    defaultSort,
    onSortChange,
    paging,
    page,
    defaultPage,
    onPageChange,
    onStateChange,
    onRowActivate,
    selectionMode: selectionModeProp,
    selectAllMode: selectAllModeProp,
    selectOnRowClick,
    selectedKeys,
    defaultSelectedKeys,
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
  const variant = resolveVariant(variantProp);
  const density = resolveDensity(densityProp);
  const labels = useMemo(() => withDefaults(DEFAULT_LABELS, labelsProp), [labelsProp]);
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
  useEffect(() => {
    if (!rowHeightIsValid) {
      devWarn(
        '<DataGrid> rowHeight is not a finite number above 0; the height of the density and variant is used.',
      );
    }
  }, [rowHeightIsValid]);
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

  // The paging: `false` is one page of every row; anything but an object is the default.
  const pagingConfig = typeof paging === 'object' && paging !== null ? paging : undefined;
  const paged = paging !== false;
  const configuredSize = isWhole(pagingConfig?.pageSize)
    ? pagingConfig.pageSize
    : DEFAULT_PAGE_SIZE;
  const sortMode = sortModeProp === 'single' ? 'single' : 'multiple';
  const remote = remoteProp === true;
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
  });
  // A size that is no whole number above 0 may come from a state the user saved: the usual one.
  const size = isWhole(state.page.size) ? state.page.size : configuredSize;

  // Server mode knows the page and not the rows after it, so "select all" can only be about the page.
  const askedForAll = selectionMode === 'multiple' && selectAllModeProp === 'all';
  const selectAllMode = askedForAll && !remote ? 'all' : 'page';
  const allIsPage = askedForAll && remote;
  useEffect(() => {
    if (allIsPage) {
      devWarn(
        '<DataGrid> selectAllMode "all" needs every row, which server mode does not have; "page" is used.',
      );
    }
  }, [allIsPage]);

  const missingCount = remote && totalCount === undefined;
  useEffect(() => {
    if (missingCount) {
      devWarn(
        '<DataGrid> remote needs totalCount for the count and the pages; the rows of data are counted.',
      );
    }
  }, [missingCount]);

  const getKey = useRowKey(rowKey, data);
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
  const rows = result.visible;
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

  const keyboard = useGridKeyboard({
    tableRef,
    frameRef,
    columns: columnsShown,
    rows,
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
    }),
    [keyboard.focusActive],
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

  const sizes = useMemo(() => {
    const given = pagingConfig?.pageSizes ?? DEFAULT_PAGE_SIZES;
    if (given.length === 0) return [];
    return [...new Set([...given.filter(isWhole), size])].sort((a, b) => a - b);
  }, [pagingConfig?.pageSizes, size]);
  const goToPage = (index: number): void => setPage({ index, size });
  // Keeps the first row that is shown on the page of the new size.
  const changeSize = (next: number): void =>
    setPage({ index: Math.floor((result.pageIndex * size) / next), size: next });

  const context = useMemo<GridContextValue<TRow>>(
    () => ({
      columns: columnsShown,
      labels,
      variant,
      rows,
      rowReactKeys,
      textOf: (row, column) => textCache.text(row, column),
      rowClassName,
      sorting,
      sortMode,
      onSortPress,
      active: keyboard.active,
      selection: {
        mode: selectionMode,
        allMode: selectAllMode,
        onRowClick: rowClick,
        actions: selection.actions,
      },
      rowHeader,
    }),
    [
      columnsShown,
      labels,
      variant,
      rows,
      rowReactKeys,
      textCache,
      rowClassName,
      sorting,
      sortMode,
      onSortPress,
      keyboard.active,
      selectionMode,
      selectAllMode,
      rowClick,
      selection.actions,
      rowHeader,
    ],
  );

  // Only a grid with a height scrolls its rows under a heading, so only then is the heading measured.
  useHeadHeight(frameRef, tableRef, height !== undefined);
  const widths = useColumnWidths(frameRef, columnsShown);
  // With a flexible column the table is as wide as its frame, and at least as wide as its columns
  // need, past which the frame scrolls; before the frame is measured, and where it cannot be, a
  // flexible column has no width and the stylesheet shares the room out. Without one every column
  // is as wide as it says, and so is the table: spread over a wider frame, the widths would be
  // proportions and not the widths.
  const leastWidth = columnsShown.reduce(
    (sum, column) => sum + (column.width ?? column.minWidth),
    0,
  );
  const hasFlexible = columnsShown.some((column) => column.width === undefined);

  const rootStyle = {
    ...style,
    ...(height === undefined ? null : { height }),
    '--flg-data-grid-row-height': `${dataRowHeight}px`,
  } as CSSProperties;

  return (
    <GridContext.Provider value={context as GridContextValue}>
      <SelectionViewContext.Provider value={selection.view}>
        <div
          ref={rootRef}
          className={clsx('flg-data-grid', className)}
          style={rootStyle}
          data-variant={variant}
          data-density={density}
          {...rest}
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
              // A scroll frame is a stop of Tab in Firefox, though it holds a cell that is one, unless it has
              // a tabindex. The -1 keeps it out of the order, and it stays: it is never taken off a frame
              // that may have the focus (a press on its empty part gives it).
              tabIndex={-1}
            >
              <table
                ref={tableRef}
                className="flg-table flg-data-grid-table"
                role="grid"
                aria-multiselectable={selectionMode === 'multiple' ? true : undefined}
                aria-label={ariaLabel}
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                onKeyDown={keyboard.onKeyDown}
                onFocus={keyboard.onFocus}
                onBlur={keyboard.onBlur}
                onMouseDown={keyboard.onMouseDown}
                onDoubleClick={keyboard.onDoubleClick}
                style={{
                  minWidth: leastWidth,
                  width: hasFlexible || leastWidth === 0 ? undefined : leastWidth,
                }}
              >
                <colgroup>
                  {columnsShown.map((column, index) => (
                    <col key={column.id} style={{ width: widths ? widths[index] : column.width }} />
                  ))}
                </colgroup>
                <HeaderRow />
                <Body />
              </table>
            </div>
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
