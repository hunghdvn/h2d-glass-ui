'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef } from 'react';
import type { CSSProperties, ReactElement, Ref } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { hasContent } from '../../internal/has-content';
import { joinIds } from '../../internal/join-ids';
import { useAnnounce } from '../../internal/use-announce';
import { useRequireName } from '../../internal/use-require-name';
import { devWarn } from '../../internal/warn';
import { withDefaults } from '../../internal/with-defaults';
import { useHeadHeight } from '../table/use-head-height';
import { checkFields, resolveColumns } from './engine/columns';
import { createPipeline } from './engine/pipeline';
import { createTextCache } from './engine/values';
import { GridContext } from './grid-context';
import type { GridContextValue } from './grid-context';
import { useColumnWidths } from './hooks/use-column-widths';
import { useColumnsWarning } from './hooks/use-columns-warning';
import { useRowKey } from './hooks/use-row-key';
import { DEFAULT_LABELS } from './labels';
import { Body } from './parts/Body';
import { HeaderRow } from './parts/HeaderRow';
import { Toolbar, resolveCaptionTag } from './parts/Toolbar';
import { ROW_HEIGHT, resolveDensity, resolveVariant } from './row-heights';
import { uniqueKeys } from './row-keys';
import type { DataGridHandle, DataGridProps } from './types';

const NO_SORT: readonly never[] = [];

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
  // The ref is the handle, not the element (spec 6.1): what a caller does with the grid are
  // commands. The element is read when asked, so the handle itself never changes.
  useImperativeHandle(
    ref,
    () => ({
      get element() {
        return rootRef.current;
      },
    }),
    [],
  );

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
        // The grid's own `allowSorting` comes with sorting; until then it is the default.
        allowSorting: true,
      }),
    [columns, locale, timeZone, labels.yes, labels.no],
  );
  useEffect(() => checkFields(resolved, data), [resolved, data]);

  const getKey = useRowKey(rowKey, data);
  const pipeline = useMemo(() => createPipeline<TRow>(), []);
  const textCache = useMemo(() => createTextCache<TRow>(), []);
  const result = pipeline.run({
    data,
    columns: resolved,
    getKey,
    sort: NO_SORT,
    page: null,
    remote: false,
    totalCount: undefined,
    locale,
  });
  const rows = result.visible;
  const rowReactKeys = useMemo(() => uniqueKeys(rows.map((row) => row.key)), [rows]);

  const context = useMemo<GridContextValue<TRow>>(
    () => ({
      columns: resolved,
      labels,
      variant,
      rows,
      rowReactKeys,
      textOf: (row, column) => textCache.text(row, column),
      rowClassName,
    }),
    [resolved, labels, variant, rows, rowReactKeys, textCache, rowClassName],
  );

  // Only a grid with a height scrolls its rows under a heading, so only then is the heading measured.
  useHeadHeight(frameRef, tableRef, height !== undefined);
  const widths = useColumnWidths(frameRef, resolved);
  // With a flexible column the table is as wide as its frame, and at least as wide as its columns
  // need, past which the frame scrolls; before the frame is measured, and where it cannot be, a
  // flexible column has no width and the stylesheet shares the room out. Without one every column
  // is as wide as it says, and so is the table: spread over a wider frame, the widths would be
  // proportions and not the widths.
  const leastWidth = resolved.reduce((sum, column) => sum + (column.width ?? column.minWidth), 0);
  const hasFlexible = resolved.some((column) => column.width === undefined);

  const { region } = useAnnounce();
  const rootStyle = {
    ...style,
    ...(height === undefined ? null : { height }),
    '--flg-data-grid-row-height': `${dataRowHeight}px`,
  } as CSSProperties;

  return (
    <GridContext.Provider value={context as GridContextValue}>
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
          >
            <table
              ref={tableRef}
              className="flg-table flg-data-grid-table"
              role="grid"
              aria-label={ariaLabel}
              aria-labelledby={labelledBy}
              aria-describedby={describedBy}
              style={{
                minWidth: leastWidth,
                width: hasFlexible || leastWidth === 0 ? undefined : leastWidth,
              }}
            >
              <colgroup>
                {resolved.map((column, index) => (
                  <col key={column.id} style={{ width: widths ? widths[index] : column.width }} />
                ))}
              </colgroup>
              <HeaderRow />
              <Body />
            </table>
          </div>
        </div>
        {region}
      </div>
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
