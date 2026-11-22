import { useEffect, useMemo, useState } from 'react';
import { SELECT_COLUMN_WIDTH, checkFields, resolveColumns, selectColumn } from '../engine/columns';
import type { ResolvedColumn } from '../engine/columns';
import { applyLayout, fillerIndex, pinPlaces, sameLayout, startLayout } from '../engine/layout';
import type { WidthSpec } from '../engine/layout';
import type { DataGridColumn, DataGridColumnLayout, DataGridPin } from '../types';
import { useColumnStartWarning } from './use-column-start-warning';
import { sameList, sameMembers, useKept } from './use-kept';
import { useColumnsWarning } from './use-renewal-warning';

export interface ResolvedColumnsOptions<TRow> {
  /** The caller's columns, made safe by `normalizeProps`. */
  columns: readonly DataGridColumn<TRow>[];
  /** The rows the field names of the columns are checked against. */
  data: readonly TRow[];
  locale: string;
  timeZone: string;
  /** The words of a boolean, which `resolveColumns` writes into the columns' texts. */
  yes: string;
  no: string;
  /** The grid's `allow…` props: each one is the default of the same field of every column. */
  allowSorting: boolean;
  allowResizing: boolean;
  allowReordering: boolean;
  allowPinning: boolean;
  allowHiding: boolean;
  allowFiltering: boolean;
  allowHeaderFiltering: boolean;
  /** `defaultColumnLayout`, which an uncontrolled layout starts from. */
  defaultColumnLayout: Partial<DataGridColumnLayout> | undefined;
}

export interface ResolvedColumns<TRow> {
  /** Every column of the caller's, each with the grid's defaults laid in. */
  resolved: readonly ResolvedColumn<TRow>[];
  /** Where an uncontrolled layout starts: the columns of the first render, and `defaultColumnLayout`. */
  startedWith: DataGridColumnLayout;
}

/**
 * The caller's columns as the grid reads them (spec phase 6 §3.1), and the layout the grid starts
 * from. The columns are made again only when what they are made from changes, and a field that names
 * nothing in the data warns once after the commit.
 */
export function useResolvedColumns<TRow>({
  columns,
  data,
  locale,
  timeZone,
  yes,
  no,
  allowSorting,
  allowResizing,
  allowReordering,
  allowPinning,
  allowHiding,
  allowFiltering,
  allowHeaderFiltering,
  defaultColumnLayout,
}: ResolvedColumnsOptions<TRow>): ResolvedColumns<TRow> {
  useColumnsWarning(columns);
  const resolved = useMemo(
    () =>
      resolveColumns(columns, {
        locale,
        timeZone,
        yes,
        no,
        allowSorting,
        allowResizing,
        allowReordering,
        allowPinning,
        allowHiding,
        allowFiltering,
        allowHeaderFiltering,
        // The grid's own `allowGrouping` prop arrives with the grouping state; until then every
        // column allows it, and nothing reads it.
        allowGrouping: true,
      }),
    [
      columns,
      locale,
      timeZone,
      yes,
      no,
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
  return { resolved, startedWith };
}

export interface ShownColumnsOptions<TRow> {
  resolved: readonly ResolvedColumn<TRow>[];
  /** The layout the state holds, as the caller gave it. */
  layout: DataGridColumnLayout;
  selectionMode: 'none' | 'single' | 'multiple';
}

export interface ShownColumns<TRow> {
  /** The layout applied to the columns: the shown ones, their widths and zones, and the layout as shown. */
  applied: ReturnType<typeof applyLayout<TRow>>;
  /** The layout as it is shown (unknown ids dropped, new columns appended, widths held to their limits). */
  shownLayout: DataGridColumnLayout;
  /** The shown columns in order, without the column of boxes (the title and the rows read them). */
  dataColumns: readonly ResolvedColumn<TRow>[];
  /** The same columns in any order: the sort reads them, which an order does not change. */
  sortColumns: readonly ResolvedColumn<TRow>[];
  columnWidths: ReturnType<typeof applyLayout<TRow>>['widths'];
  dataPins: ReturnType<typeof applyLayout<TRow>>['pins'];
  boxColumn: ResolvedColumn<TRow>;
  /** Every column of the keyboard and of the layout: the column of boxes first when there is one. */
  columnsShown: readonly ResolvedColumn<TRow>[];
  /** The zone of each shown column, the column of boxes first. */
  pinsShown: readonly (DataGridPin | undefined)[];
  pins: ReturnType<typeof pinPlaces>;
  fillerAt: number;
  pinned: boolean;
  widthSpecs: (WidthSpec & { id: string })[];
  rowHeader: ResolvedColumn<TRow> | undefined;
  /** The last data column shown cannot be hidden. */
  hideable: boolean;
}

/**
 * The columns the grid shows: the layout applied to the resolved columns, each part of it kept apart so
 * a change of one draws only what reads it, and the column of boxes put in front of them. The layout
 * the columns are laid out by is the one of an earlier render while the new one says the same, so a
 * layout written in the JSX draws no row.
 */
export function useShownColumns<TRow>({
  resolved,
  layout: layoutHeld,
  selectionMode,
}: ShownColumnsOptions<TRow>): ShownColumns<TRow> {
  const layout = useKept(layoutHeld, sameLayout);
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

  // Choosing rows. The column of boxes is a column of the grid like the others to the layout and the
  // keyboard; the sort, the pipeline and the captions know only the caller's.
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
  // The last data column shown cannot be hidden, so its menu has no "Hide column" and, if that was all
  // it had, no button.
  const hideable = dataColumns.length > 1;
  return {
    applied,
    shownLayout,
    dataColumns,
    sortColumns,
    columnWidths,
    dataPins,
    boxColumn,
    columnsShown,
    pinsShown,
    pins,
    fillerAt,
    pinned,
    widthSpecs,
    rowHeader,
    hideable,
  };
}
